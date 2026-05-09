package pl.freeedu.backend.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.ForgotPasswordRequest;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.auth.dto.ResetPasswordRequest;
import pl.freeedu.backend.auth.exception.AuthErrorCode;
import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.auth.model.PasswordResetToken;
import pl.freeedu.backend.auth.repository.PasswordResetTokenRepository;
import pl.freeedu.backend.emailverification.exception.EmailVerificationErrorCode;
import pl.freeedu.backend.emailverification.exception.EmailVerificationException;
import pl.freeedu.backend.security.jwt.JwtService;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordResetTokenRepository passwordResetTokenRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtService jwtService;

	@Mock
	private AuthMapper authMapper;

	@Mock
	private PasswordResetMailService passwordResetMailService;

	@Mock
	private TransactionTemplate transactionTemplate;

	@InjectMocks
	private AuthService authService;

	@Test
	void shouldLoginByEmailWhenCredentialsAreCorrect() {
		LoginRequest request = LoginRequest.builder().identifier("teacher@freeedu.pl").password("secret").build();
		User user = User.builder().id(10).publicId("teacher-public-id").email("teacher@freeedu.pl").username("teacher")
				.password("hashed").role(Role.TEACHER).tokenVersion(2).build();
		AuthResponse response = AuthResponse.builder().token("jwt").role(Role.TEACHER).build();

		when(userRepository.findByEmail("teacher@freeedu.pl")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
		when(jwtService.generateToken("teacher-public-id", 2)).thenReturn("jwt");
		when(authMapper.toAuthResponse("jwt", Role.TEACHER)).thenReturn(response);

		Mono<AuthResponse> result = authService.login(Mono.just(request));

		StepVerifier.create(result).assertNext(r -> {
			assertEquals("jwt", r.getToken());
			assertEquals(Role.TEACHER, r.getRole());
		}).verifyComplete();
	}

	@Test
	void shouldLoginByUsernameWhenEmailNotFound() {
		LoginRequest request = LoginRequest.builder().identifier("teacher").password("secret").build();
		User user = User.builder().id(11).publicId("admin-public-id").email("x@x.pl").username("teacher")
				.password("hashed").role(Role.ADMIN).tokenVersion(0).build();
		AuthResponse response = AuthResponse.builder().token("jwt2").role(Role.ADMIN).build();

		when(userRepository.findByEmail("teacher")).thenReturn(Optional.empty());
		when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
		when(jwtService.generateToken("admin-public-id", 0)).thenReturn("jwt2");
		when(authMapper.toAuthResponse("jwt2", Role.ADMIN)).thenReturn(response);

		Mono<AuthResponse> result = authService.login(Mono.just(request));

		StepVerifier.create(result).assertNext(r -> {
			assertEquals("jwt2", r.getToken());
			assertEquals(Role.ADMIN, r.getRole());
		}).verifyComplete();
	}

	@Test
	void shouldReturnInvalidCredentialsWhenPasswordDoesNotMatch() {
		LoginRequest request = LoginRequest.builder().identifier("teacher").password("wrong").build();
		User user = User.builder().id(12).username("teacher").password("hashed").role(Role.TEACHER).build();

		when(userRepository.findByEmail("teacher")).thenReturn(Optional.empty());
		when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

		Mono<AuthResponse> result = authService.login(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
		}).verify();

		verify(jwtService, never()).generateToken(any(String.class), any(Integer.class));
	}

	@Test
	void shouldReturnInvalidCredentialsWhenUserNotFound() {
		LoginRequest request = LoginRequest.builder().identifier("unknown").password("secret").build();

		when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());
		when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

		Mono<AuthResponse> result = authService.login(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
		}).verify();
	}

	@Test
	void shouldBlockLoginWhenEmailVerificationIsPending() {
		LoginRequest request = LoginRequest.builder().identifier("student@edu.pl").password("secret").build();
		User user = User.builder().id(13).email("student@edu.pl").password("hashed").role(Role.STUDENT)
				.status(UserStatus.EMAIL_VERIFICATION_PENDING).build();

		when(userRepository.findByEmail("student@edu.pl")).thenReturn(Optional.of(user));

		Mono<AuthResponse> result = authService.login(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			EmailVerificationException exception = assertInstanceOf(EmailVerificationException.class, error);
			assertEquals(EmailVerificationErrorCode.EMAIL_VERIFICATION_REQUIRED, exception.getErrorCode());
		}).verify();
		verify(passwordEncoder, never()).matches(any(), any());
	}

	@Test
	void shouldReturnAcceptedMessageForForgotPasswordWhenEmailExists() {
		User user = User.builder().id(7).email("student@edu.pl").username("student").build();
		ForgotPasswordRequest request = ForgotPasswordRequest.builder().email("student@edu.pl").build();
		ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
		ArgumentCaptor<String> plainTokenCaptor = ArgumentCaptor.forClass(String.class);

		ReflectionTestUtils.setField(authService, "passwordResetExpirationMinutes", 30L);
		when(userRepository.findByEmail("student@edu.pl")).thenReturn(Optional.of(user));
		when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		Mono<MessageResponse> result = authService.forgotPassword(Mono.just(request));

		StepVerifier.create(result).assertNext(
				response -> assertEquals("If the account exists, a reset link has been sent.", response.getMessage()))
				.verifyComplete();

		verify(passwordResetTokenRepository).invalidateActiveTokensForUser(eq(7), any(LocalDateTime.class),
				any(LocalDateTime.class));
		verify(passwordResetTokenRepository).save(tokenCaptor.capture());
		verify(passwordResetMailService).sendPasswordResetEmail(eq(user), plainTokenCaptor.capture());

		PasswordResetToken storedToken = tokenCaptor.getValue();
		assertNotNull(storedToken.getExpiresAt());
		assertNull(storedToken.getUsedAt());
		assertEquals(hashToken(plainTokenCaptor.getValue()), storedToken.getTokenHash());
	}

	@Test
	void shouldReturnAcceptedMessageForForgotPasswordWhenMailDeliveryFails() {
		User user = User.builder().id(8).email("student2@edu.pl").username("student2").build();
		ForgotPasswordRequest request = ForgotPasswordRequest.builder().email("student2@edu.pl").build();

		ReflectionTestUtils.setField(authService, "passwordResetExpirationMinutes", 30L);
		when(userRepository.findByEmail("student2@edu.pl")).thenReturn(Optional.of(user));
		when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));
		doThrow(new RuntimeException("smtp failure")).when(passwordResetMailService).sendPasswordResetEmail(eq(user),
				any(String.class));

		Mono<MessageResponse> result = authService.forgotPassword(Mono.just(request));

		StepVerifier.create(result).assertNext(
				response -> assertEquals("If the account exists, a reset link has been sent.", response.getMessage()))
				.verifyComplete();

		verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
		verify(passwordResetMailService).sendPasswordResetEmail(eq(user), any(String.class));
	}

	@Test
	void shouldReturnAcceptedMessageForForgotPasswordWhenEmailDoesNotExist() {
		ForgotPasswordRequest request = ForgotPasswordRequest.builder().email("missing@edu.pl").build();

		when(userRepository.findByEmail("missing@edu.pl")).thenReturn(Optional.empty());

		Mono<MessageResponse> result = authService.forgotPassword(Mono.just(request));

		StepVerifier.create(result).assertNext(
				response -> assertEquals("If the account exists, a reset link has been sent.", response.getMessage()))
				.verifyComplete();

		verify(passwordResetTokenRepository, never()).save(any());
		verify(passwordResetMailService, never()).sendPasswordResetEmail(any(), any());
	}

	@Test
	void shouldResetPasswordWhenTokenIsValid() {
		ResetPasswordRequest request = ResetPasswordRequest.builder().token("plain-token").newPassword("new-secret")
				.confirmPassword("new-secret").build();
		PasswordResetToken passwordResetToken = PasswordResetToken.builder().id(1L).userId(5)
				.tokenHash(hashToken("plain-token")).expiresAt(LocalDateTime.now().plusMinutes(10)).build();
		User user = User.builder().id(5).password("old-hash").tokenVersion(3).build();

		when(passwordResetTokenRepository.findByTokenHash(hashToken("plain-token")))
				.thenReturn(Optional.of(passwordResetToken));
		when(userRepository.findById(5)).thenReturn(Optional.of(user));
		when(passwordEncoder.encode("new-secret")).thenReturn("new-hash");
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		Mono<Void> result = authService.resetPassword(Mono.just(request));

		StepVerifier.create(result).verifyComplete();
		assertEquals("new-hash", user.getPassword());
		assertEquals(4, user.getTokenVersion());
		assertNotNull(passwordResetToken.getUsedAt());
		verify(userRepository).save(user);
		verify(passwordResetTokenRepository).save(passwordResetToken);
	}

	@Test
	void shouldRejectResetWhenConfirmationDoesNotMatch() {
		ResetPasswordRequest request = ResetPasswordRequest.builder().token("plain-token").newPassword("a")
				.confirmPassword("b").build();
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		Mono<Void> result = authService.resetPassword(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.PASSWORD_CONFIRMATION_MISMATCH, exception.getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectResetWhenTokenDoesNotExist() {
		ResetPasswordRequest request = ResetPasswordRequest.builder().token("missing").newPassword("new")
				.confirmPassword("new").build();

		when(passwordResetTokenRepository.findByTokenHash(hashToken("missing"))).thenReturn(Optional.empty());
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		Mono<Void> result = authService.resetPassword(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.PASSWORD_RESET_TOKEN_INVALID, exception.getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectResetWhenTokenIsExpired() {
		ResetPasswordRequest request = ResetPasswordRequest.builder().token("expired-token").newPassword("new")
				.confirmPassword("new").build();
		PasswordResetToken passwordResetToken = PasswordResetToken.builder().userId(5)
				.tokenHash(hashToken("expired-token")).expiresAt(LocalDateTime.now().minusMinutes(1)).build();

		when(passwordResetTokenRepository.findByTokenHash(hashToken("expired-token")))
				.thenReturn(Optional.of(passwordResetToken));
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		Mono<Void> result = authService.resetPassword(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.PASSWORD_RESET_TOKEN_EXPIRED, exception.getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectResetWhenTokenWasAlreadyUsed() {
		ResetPasswordRequest request = ResetPasswordRequest.builder().token("used-token").newPassword("new")
				.confirmPassword("new").build();
		PasswordResetToken passwordResetToken = PasswordResetToken.builder().userId(5)
				.tokenHash(hashToken("used-token")).expiresAt(LocalDateTime.now().plusMinutes(10))
				.usedAt(LocalDateTime.now().minusMinutes(1)).build();

		when(passwordResetTokenRepository.findByTokenHash(hashToken("used-token")))
				.thenReturn(Optional.of(passwordResetToken));
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		Mono<Void> result = authService.resetPassword(Mono.just(request));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.PASSWORD_RESET_TOKEN_USED, exception.getErrorCode());
		}).verify();
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
		} catch (Exception ex) {
			throw new IllegalStateException(ex);
		}
	}
}
