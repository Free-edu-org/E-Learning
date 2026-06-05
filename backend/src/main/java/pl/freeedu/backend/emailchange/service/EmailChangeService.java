package pl.freeedu.backend.emailchange.service;

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
import pl.freeedu.backend.emailchange.dto.ConfirmEmailChangeRequest;
import pl.freeedu.backend.emailchange.exception.EmailChangeErrorCode;
import pl.freeedu.backend.emailchange.exception.EmailChangeException;
import pl.freeedu.backend.emailchange.model.EmailChangeToken;
import pl.freeedu.backend.emailchange.repository.EmailChangeTokenRepository;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
public class EmailChangeService {

	private static final int TOKEN_BYTES = 32;
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final EmailChangeTokenRepository emailChangeTokenRepository;
	private final UserRepository userRepository;
	private final EmailChangeMailService emailChangeMailService;
	private final TransactionTemplate transactionTemplate;

	@Value("${application.email-change.expiration-hours:24}")
	private long emailChangeExpirationHours;

	public EmailChangeService(EmailChangeTokenRepository emailChangeTokenRepository, UserRepository userRepository,
			EmailChangeMailService emailChangeMailService, TransactionTemplate transactionTemplate) {
		this.emailChangeTokenRepository = emailChangeTokenRepository;
		this.userRepository = userRepository;
		this.emailChangeMailService = emailChangeMailService;
		this.transactionTemplate = transactionTemplate;
	}

	public void initiateEmailChange(User user, String newEmail) {
		LocalDateTime now = LocalDateTime.now();
		emailChangeTokenRepository.invalidateActiveTokensForUser(user.getId(), now, now);

		String plainToken = generateSecureToken();
		EmailChangeToken token = EmailChangeToken.builder().userId(user.getId()).tokenHash(hashToken(plainToken))
				.newEmail(newEmail).expiresAt(now.plusHours(emailChangeExpirationHours)).build();
		emailChangeTokenRepository.save(token);
		log.info("Email change token created for user ID: {}, new email: {}", user.getId(), newEmail);

		sendEmailChangeVerification(user, newEmail, plainToken);
	}

	private void sendEmailChangeVerification(User user, String newEmail, String plainToken) {
		try {
			emailChangeMailService.sendEmailChangeVerification(user, newEmail, plainToken);
		} catch (Exception ex) {
			log.error("Failed to send email change verification to new address for user ID: {}", user.getId(), ex);
		}
	}

	public Mono<Void> confirmEmailChange(Mono<ConfirmEmailChangeRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			transactionTemplate.execute(status -> {
				confirmEmailChangeTransactional(request.getToken());
				return null;
			});
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	private void confirmEmailChangeTransactional(String plainToken) {
		EmailChangeToken token = resolveActiveToken(plainToken);

		if (userRepository.existsByEmail(token.getNewEmail())) {
			log.warn("Email change confirmation failed: new email already taken. Token for user ID: {}",
					token.getUserId());
			throw new EmailChangeException(EmailChangeErrorCode.EMAIL_CHANGE_NEW_EMAIL_TAKEN);
		}

		User user = userRepository.findById(token.getUserId())
				.orElseThrow(() -> new EmailChangeException(EmailChangeErrorCode.EMAIL_CHANGE_TOKEN_INVALID));

		String oldEmail = user.getEmail();
		user.setEmail(token.getNewEmail());
		userRepository.save(user);

		token.setUsedAt(LocalDateTime.now());
		emailChangeTokenRepository.save(token);
		log.info("Email changed for user ID: {} from {} to {}", user.getId(), oldEmail, token.getNewEmail());
	}

	private EmailChangeToken resolveActiveToken(String plainToken) {
		EmailChangeToken token = emailChangeTokenRepository.findByTokenHash(hashToken(plainToken))
				.orElseThrow(() -> new EmailChangeException(EmailChangeErrorCode.EMAIL_CHANGE_TOKEN_INVALID));

		if (token.getUsedAt() != null) {
			throw new EmailChangeException(EmailChangeErrorCode.EMAIL_CHANGE_TOKEN_USED);
		}
		if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new EmailChangeException(EmailChangeErrorCode.EMAIL_CHANGE_TOKEN_EXPIRED);
		}
		return token;
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
			log.error("Failed to hash email change token", ex);
			throw new IllegalStateException("Failed to hash email change token", ex);
		}
	}
}
