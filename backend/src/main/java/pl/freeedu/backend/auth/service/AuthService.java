package pl.freeedu.backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationErrorCode;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationException;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.ForgotPasswordRequest;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.auth.dto.ResetPasswordRequest;
import pl.freeedu.backend.auth.exception.AuthErrorCode;
import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.auth.model.PasswordResetToken;
import pl.freeedu.backend.auth.repository.PasswordResetTokenRepository;
import pl.freeedu.backend.security.jwt.JwtService;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
public class AuthService {

	private static final String FORGOT_PASSWORD_MESSAGE = "If the account exists, a reset link has been sent.";
	private static final int RESET_TOKEN_BYTES = 32;
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final UserRepository userRepository;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthMapper authMapper;
	private final PasswordResetMailService passwordResetMailService;
	private final TransactionTemplate transactionTemplate;

	@Value("${application.password-reset.expiration-minutes:30}")
	private long passwordResetExpirationMinutes;

	public AuthService(UserRepository userRepository, PasswordResetTokenRepository passwordResetTokenRepository,
			PasswordEncoder passwordEncoder, JwtService jwtService, AuthMapper authMapper,
			PasswordResetMailService passwordResetMailService, TransactionTemplate transactionTemplate) {
		this.userRepository = userRepository;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authMapper = authMapper;
		this.passwordResetMailService = passwordResetMailService;
		this.transactionTemplate = transactionTemplate;
	}

	public Mono<AuthResponse> login(Mono<LoginRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.debug("Login attempt started");
			String identifier = request.getIdentifier();
			User user = userRepository.findByEmail(identifier)
					.orElseGet(() -> userRepository.findByUsername(identifier).orElseThrow(() -> {
						log.warn("Login failed: User not found for provided identifier");
						return new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
					}));

			if (user.getStatus() == UserStatus.INVITED) {
				log.warn("Login blocked: account not yet activated. User ID: {}", user.getId());
				throw new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_NOT_ACTIVE);
			}

			if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
				log.warn("Login failed: Invalid password for user ID: {}", user.getId());
				throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
			}

			String token = jwtService.generateToken(user.getPublicId(),
					Optional.ofNullable(user.getTokenVersion()).orElse(0));
			log.info("User logged in successfully. User ID: {}, Role: {}", user.getId(), user.getRole());
			return authMapper.toAuthResponse(token, user.getRole());
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<MessageResponse> forgotPassword(Mono<ForgotPasswordRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Password reset requested.");
			userRepository.findByEmail(request.getEmail()).ifPresentOrElse(this::createAndSendResetTokenSafely,
					() -> log.info("Password reset email not sent because no user exists for email: {}",
							request.getEmail()));
			return MessageResponse.builder().message(FORGOT_PASSWORD_MESSAGE).build();
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> resetPassword(Mono<ResetPasswordRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			transactionTemplate.execute(status -> {
				resetPasswordTransactional(request);
				return null;
			});
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	private void resetPasswordTransactional(ResetPasswordRequest request) {
		if (!request.getNewPassword().equals(request.getConfirmPassword())) {
			throw new AuthException(AuthErrorCode.PASSWORD_CONFIRMATION_MISMATCH);
		}

		String tokenHash = hashToken(request.getToken());
		PasswordResetToken passwordResetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
				.orElseThrow(() -> new AuthException(AuthErrorCode.PASSWORD_RESET_TOKEN_INVALID));

		if (passwordResetToken.getUsedAt() != null) {
			throw new AuthException(AuthErrorCode.PASSWORD_RESET_TOKEN_USED);
		}

		LocalDateTime now = LocalDateTime.now();
		if (passwordResetToken.getExpiresAt().isBefore(now)) {
			throw new AuthException(AuthErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
		}

		User user = userRepository.findById(passwordResetToken.getUserId())
				.orElseThrow(() -> new AuthException(AuthErrorCode.PASSWORD_RESET_TOKEN_INVALID));

		user.setPassword(passwordEncoder.encode(request.getNewPassword()));
		user.setTokenVersion(Optional.ofNullable(user.getTokenVersion()).orElse(0) + 1);
		userRepository.save(user);

		passwordResetToken.setUsedAt(now);
		passwordResetTokenRepository.save(passwordResetToken);
		log.info("Password reset completed for user ID: {}", user.getId());
	}

	private void createAndSendResetTokenSafely(User user) {
		try {
			createAndSendResetToken(user);
		} catch (Exception ex) {
			log.error("Failed to process password reset email for user ID: {}", user.getId(), ex);
		}
	}

	private void createAndSendResetToken(User user) {
		LocalDateTime now = LocalDateTime.now();
		passwordResetTokenRepository.invalidateActiveTokensForUser(user.getId(), now, now);

		String plainToken = generateSecureToken();
		PasswordResetToken passwordResetToken = PasswordResetToken.builder().userId(user.getId())
				.tokenHash(hashToken(plainToken)).expiresAt(now.plusMinutes(passwordResetExpirationMinutes)).build();
		passwordResetTokenRepository.save(passwordResetToken);
		passwordResetMailService.sendPasswordResetEmail(user, plainToken);
		log.info("Password reset token generated for user ID: {}", user.getId());
	}

	private String generateSecureToken() {
		byte[] bytes = new byte[RESET_TOKEN_BYTES];
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
			log.error("Failed to hash password reset token", ex);
			throw new IllegalStateException("Failed to hash password reset token", ex);
		}
	}
}
