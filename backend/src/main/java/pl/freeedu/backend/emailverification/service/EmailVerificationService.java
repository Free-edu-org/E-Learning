package pl.freeedu.backend.emailverification.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.emailverification.dto.ConfirmEmailVerificationRequest;
import pl.freeedu.backend.emailverification.dto.EmailVerificationTokenInfoResponse;
import pl.freeedu.backend.emailverification.dto.EmailVerificationTokenState;
import pl.freeedu.backend.emailverification.dto.ResendEmailVerificationRequest;
import pl.freeedu.backend.emailverification.exception.EmailVerificationErrorCode;
import pl.freeedu.backend.emailverification.exception.EmailVerificationException;
import pl.freeedu.backend.emailverification.model.EmailVerificationToken;
import pl.freeedu.backend.emailverification.repository.EmailVerificationTokenRepository;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
public class EmailVerificationService {

	private static final String RESEND_MESSAGE = "If the account is awaiting email verification, a verification link has been sent.";
	private static final int TOKEN_BYTES = 32;
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final EmailVerificationTokenRepository emailVerificationTokenRepository;
	private final UserRepository userRepository;
	private final EmailVerificationMailService emailVerificationMailService;
	private final TransactionTemplate transactionTemplate;

	@Value("${application.email-verification.expiration-hours:24}")
	private long emailVerificationExpirationHours;

	public EmailVerificationService(EmailVerificationTokenRepository emailVerificationTokenRepository,
			UserRepository userRepository, EmailVerificationMailService emailVerificationMailService,
			TransactionTemplate transactionTemplate) {
		this.emailVerificationTokenRepository = emailVerificationTokenRepository;
		this.userRepository = userRepository;
		this.emailVerificationMailService = emailVerificationMailService;
		this.transactionTemplate = transactionTemplate;
	}

	public String createVerificationForUser(User user) {
		if (user.getStatus() != UserStatus.EMAIL_VERIFICATION_PENDING) {
			throw new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_NOT_PENDING);
		}
		LocalDateTime now = LocalDateTime.now();
		emailVerificationTokenRepository.invalidateActiveTokensForUser(user.getId(), now, now);

		String plainToken = generateSecureToken();
		EmailVerificationToken token = EmailVerificationToken.builder().userId(user.getId())
				.tokenHash(hashToken(plainToken)).expiresAt(now.plusHours(emailVerificationExpirationHours)).build();
		emailVerificationTokenRepository.save(token);
		return plainToken;
	}

	public void sendVerificationEmail(User user, String plainToken) {
		try {
			emailVerificationMailService.sendEmailVerification(user, plainToken);
		} catch (Exception ex) {
			log.error("Failed to send email verification to user ID: {}", user.getId(), ex);
		}
	}

	public Mono<EmailVerificationTokenInfoResponse> getTokenInfo(String plainToken) {
		return Mono.fromCallable(() -> {
			EmailVerificationToken token = resolveTokenRecord(plainToken);
			User user = userRepository.findById(token.getUserId()).orElseThrow(
					() -> new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

			EmailVerificationTokenState tokenState = resolveTokenState(user, token);
			return EmailVerificationTokenInfoResponse.builder().email(user.getEmail()).status(tokenState).build();
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Void> confirmEmailVerification(Mono<ConfirmEmailVerificationRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			transactionTemplate.execute(status -> {
				confirmEmailVerificationTransactional(request.getToken());
				return null;
			});
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<MessageResponse> resendVerification(Mono<ResendEmailVerificationRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			userRepository.findByEmail(request.getEmail()).ifPresent(this::resendVerificationForPendingUser);
			return MessageResponse.builder().message(RESEND_MESSAGE).build();
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	private void resendVerificationForPendingUser(User user) {
		if (user.getStatus() != UserStatus.EMAIL_VERIFICATION_PENDING) {
			log.info("Skipping verification resend for user ID: {} due to status {}", user.getId(), user.getStatus());
			return;
		}
		String plainToken = createVerificationForUser(user);
		sendVerificationEmail(user, plainToken);
		log.info("Email verification resent for user ID: {}", user.getId());
	}

	private void confirmEmailVerificationTransactional(String plainToken) {
		EmailVerificationToken token = resolveActiveToken(plainToken);
		User user = userRepository.findById(token.getUserId()).orElseThrow(
				() -> new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

		if (user.getStatus() == UserStatus.ACTIVE) {
			throw new EmailVerificationException(EmailVerificationErrorCode.EMAIL_ALREADY_VERIFIED);
		}
		if (user.getStatus() != UserStatus.EMAIL_VERIFICATION_PENDING) {
			throw new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_NOT_PENDING);
		}

		user.setStatus(UserStatus.ACTIVE);
		userRepository.save(user);

		token.setUsedAt(LocalDateTime.now());
		emailVerificationTokenRepository.save(token);
		log.info("Email verified for user ID: {}", user.getId());
	}

	private EmailVerificationToken resolveActiveToken(String plainToken) {
		EmailVerificationToken token = resolveTokenRecord(plainToken);
		User user = userRepository.findById(token.getUserId()).orElseThrow(
				() -> new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

		if (user.getStatus() == UserStatus.ACTIVE) {
			throw new EmailVerificationException(EmailVerificationErrorCode.EMAIL_ALREADY_VERIFIED);
		}
		if (token.getUsedAt() != null) {
			throw new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_USED);
		}
		if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
		}
		return token;
	}

	private EmailVerificationToken resolveTokenRecord(String plainToken) {
		return emailVerificationTokenRepository.findByTokenHash(hashToken(plainToken)).orElseThrow(
				() -> new EmailVerificationException(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));
	}

	private EmailVerificationTokenState resolveTokenState(User user, EmailVerificationToken token) {
		if (user.getStatus() == UserStatus.ACTIVE) {
			return EmailVerificationTokenState.ALREADY_VERIFIED;
		}
		if (token.getUsedAt() != null) {
			return EmailVerificationTokenState.USED;
		}
		if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
			return EmailVerificationTokenState.EXPIRED;
		}
		return EmailVerificationTokenState.VALID;
	}

	private String generateSecureToken() {
		byte[] bytes = new byte[TOKEN_BYTES];
		SECURE_RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hashToken(String token) {
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
			byte[] digest = messageDigest.digest(token.getBytes(StandardCharsets.UTF_8));
			StringBuilder hexBuilder = new StringBuilder();
			for (byte b : digest) {
				hexBuilder.append(String.format("%02x", b));
			}
			return hexBuilder.toString();
		} catch (NoSuchAlgorithmException ex) {
			log.error("Failed to hash email verification token", ex);
			throw new IllegalStateException("Failed to hash email verification token", ex);
		}
	}
}
