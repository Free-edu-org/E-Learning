package pl.freeedu.backend.emailverification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionCallback;
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
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

	@Mock
	private EmailVerificationTokenRepository emailVerificationTokenRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private EmailVerificationMailService emailVerificationMailService;

	@Mock
	private TransactionTemplate transactionTemplate;

	@InjectMocks
	private EmailVerificationService emailVerificationService;

	@Test
	void shouldConfirmEmailVerificationAndActivateUser() {
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		String plainToken = "verify-token";
		EmailVerificationToken token = EmailVerificationToken.builder().id(1L).userId(5).tokenHash(hash(plainToken))
				.expiresAt(LocalDateTime.now().plusHours(2)).build();
		User user = User.builder().id(5).email("student@edu.pl").status(UserStatus.EMAIL_VERIFICATION_PENDING).build();

		when(emailVerificationTokenRepository.findByTokenHash(hash(plainToken))).thenReturn(Optional.of(token));
		when(userRepository.findById(5)).thenReturn(Optional.of(user));

		Mono<Void> result = emailVerificationService.confirmEmailVerification(
				Mono.just(ConfirmEmailVerificationRequest.builder().token(plainToken).build()));

		StepVerifier.create(result).verifyComplete();
		assertEquals(UserStatus.ACTIVE, user.getStatus());
		assertNotNull(token.getUsedAt());
		verify(userRepository).save(user);
		verify(emailVerificationTokenRepository).save(token);
	}

	@Test
	void shouldReturnExpiredTokenInfoWithEmail() {
		String plainToken = "expired-token";
		EmailVerificationToken token = EmailVerificationToken.builder().userId(7).tokenHash(hash(plainToken))
				.expiresAt(LocalDateTime.now().minusMinutes(5)).build();
		User user = User.builder().id(7).email("expired@edu.pl").status(UserStatus.EMAIL_VERIFICATION_PENDING).build();

		when(emailVerificationTokenRepository.findByTokenHash(hash(plainToken))).thenReturn(Optional.of(token));
		when(userRepository.findById(7)).thenReturn(Optional.of(user));

		Mono<EmailVerificationTokenInfoResponse> result = emailVerificationService.getTokenInfo(plainToken);

		StepVerifier.create(result).assertNext(info -> {
			assertEquals("expired@edu.pl", info.getEmail());
			assertEquals(EmailVerificationTokenState.EXPIRED, info.getStatus());
		}).verifyComplete();
	}

	@Test
	void shouldResendVerificationForPendingUser() {
		ReflectionTestUtils.setField(emailVerificationService, "emailVerificationExpirationHours", 24L);
		User user = User.builder().id(9).email("pending@edu.pl").status(UserStatus.EMAIL_VERIFICATION_PENDING).build();
		ArgumentCaptor<EmailVerificationToken> tokenCaptor = ArgumentCaptor.forClass(EmailVerificationToken.class);
		ArgumentCaptor<String> plainTokenCaptor = ArgumentCaptor.forClass(String.class);

		when(userRepository.findByEmail("pending@edu.pl")).thenReturn(Optional.of(user));
		when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		Mono<MessageResponse> result = emailVerificationService.resendVerification(
				Mono.just(ResendEmailVerificationRequest.builder().email("pending@edu.pl").build()));

		StepVerifier.create(result)
				.assertNext(response -> assertEquals(
						"If the account is awaiting email verification, a verification link has been sent.",
						response.getMessage()))
				.verifyComplete();

		verify(emailVerificationTokenRepository).invalidateActiveTokensForUser(any(), any(), any());
		verify(emailVerificationTokenRepository).save(tokenCaptor.capture());
		verify(emailVerificationMailService).sendEmailVerification(any(User.class), plainTokenCaptor.capture());
		assertEquals(hash(plainTokenCaptor.getValue()), tokenCaptor.getValue().getTokenHash());
	}

	@Test
	void shouldIgnoreResendWhenUserIsAlreadyActive() {
		User user = User.builder().id(10).email("active@edu.pl").status(UserStatus.ACTIVE).build();
		when(userRepository.findByEmail("active@edu.pl")).thenReturn(Optional.of(user));

		Mono<MessageResponse> result = emailVerificationService
				.resendVerification(Mono.just(ResendEmailVerificationRequest.builder().email("active@edu.pl").build()));

		StepVerifier.create(result)
				.assertNext(response -> assertEquals(
						"If the account is awaiting email verification, a verification link has been sent.",
						response.getMessage()))
				.verifyComplete();

		verify(emailVerificationMailService, never()).sendEmailVerification(any(), any());
		verify(emailVerificationTokenRepository, never()).save(any());
	}

	@Test
	void shouldRejectConfirmWhenTokenAlreadyUsed() {
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});

		String plainToken = "used-token";
		EmailVerificationToken token = EmailVerificationToken.builder().userId(5).tokenHash(hash(plainToken))
				.expiresAt(LocalDateTime.now().plusHours(2)).usedAt(LocalDateTime.now().minusMinutes(1)).build();
		User user = User.builder().id(5).email("student@edu.pl").status(UserStatus.EMAIL_VERIFICATION_PENDING).build();

		when(emailVerificationTokenRepository.findByTokenHash(hash(plainToken))).thenReturn(Optional.of(token));
		when(userRepository.findById(5)).thenReturn(Optional.of(user));

		Mono<Void> result = emailVerificationService.confirmEmailVerification(
				Mono.just(ConfirmEmailVerificationRequest.builder().token(plainToken).build()));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			EmailVerificationException exception = assertInstanceOf(EmailVerificationException.class, error);
			assertEquals(EmailVerificationErrorCode.EMAIL_VERIFICATION_TOKEN_USED, exception.getErrorCode());
		}).verify();
	}

	private String hash(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] raw = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			StringBuilder hex = new StringBuilder();
			for (byte b : raw) {
				hex.append(String.format("%02x", b));
			}
			return hex.toString();
		} catch (Exception ex) {
			throw new IllegalStateException(ex);
		}
	}
}
