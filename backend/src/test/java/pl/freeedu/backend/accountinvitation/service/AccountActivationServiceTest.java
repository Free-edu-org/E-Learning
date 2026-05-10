package pl.freeedu.backend.accountinvitation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.accountinvitation.dto.ActivateAccountRequest;
import pl.freeedu.backend.accountinvitation.dto.InviteTokenInfoResponse;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationErrorCode;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationException;
import pl.freeedu.backend.accountinvitation.model.InvitationToken;
import pl.freeedu.backend.accountinvitation.repository.InvitationTokenRepository;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class AccountActivationServiceTest {

	@Mock
	private UserRepository userRepository;
	@Mock
	private InvitationTokenRepository invitationTokenRepository;
	@Mock
	private AccountInvitationMailService mailService;
	@Mock
	private PasswordEncoder passwordEncoder;
	@Mock
	private TransactionTemplate transactionTemplate;

	@InjectMocks
	private AccountActivationService accountActivationService;

	@Test
	void shouldCreateInvitedTeacherWithTeacherRole() {
		// given
		User savedTeacher = User.builder().id(7).email("teacher@e.com").role(Role.TEACHER).status(UserStatus.INVITED)
				.build();
		InvitationToken token = InvitationToken.builder().userId(7).expiresAt(LocalDateTime.now().plusHours(72))
				.build();
		when(userRepository.findByEmail("teacher@e.com")).thenReturn(Optional.empty());
		when(userRepository.save(any())).thenReturn(savedTeacher);
		when(invitationTokenRepository.save(any())).thenReturn(token);

		// when
		String plainToken = accountActivationService.createInvitedUser("teacher@e.com", Role.TEACHER);

		// then
		verify(userRepository).save(argThat(user -> user.getRole() == Role.TEACHER
				&& user.getStatus() == UserStatus.INVITED && "teacher@e.com".equals(user.getEmail())));
		assertFalse(plainToken.isBlank());
	}

	// --- validateToken ---

	@Test
	void shouldValidateTokenAndReturnEmail() {
		// given
		InvitationToken token = InvitationToken.builder().userId(1).expiresAt(LocalDateTime.now().plusHours(24))
				.build();
		User user = User.builder().id(1).email("s@e.com").status(UserStatus.INVITED).build();
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		// when
		Mono<InviteTokenInfoResponse> result = accountActivationService.validateToken("valid-token");

		// then
		StepVerifier.create(result).assertNext(resp -> assertEquals("s@e.com", resp.getEmail())).verifyComplete();
	}

	@Test
	void shouldRejectValidationWhenTokenNotFound() {
		// given
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

		// when
		Mono<InviteTokenInfoResponse> result = accountActivationService.validateToken("bad-token");

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(AccountInvitationException.class, err);
			assertEquals(AccountInvitationErrorCode.INVITATION_TOKEN_INVALID,
					((AccountInvitationException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectValidationWhenTokenUsed() {
		// given
		InvitationToken token = InvitationToken.builder().userId(1).usedAt(LocalDateTime.now().minusHours(1))
				.expiresAt(LocalDateTime.now().plusHours(24)).build();
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

		// when
		Mono<InviteTokenInfoResponse> result = accountActivationService.validateToken("used-token");

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(AccountInvitationException.class, err);
			assertEquals(AccountInvitationErrorCode.INVITATION_TOKEN_USED,
					((AccountInvitationException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectValidationWhenTokenExpired() {
		// given
		InvitationToken token = InvitationToken.builder().userId(1).expiresAt(LocalDateTime.now().minusHours(1))
				.build();
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

		// when
		Mono<InviteTokenInfoResponse> result = accountActivationService.validateToken("expired-token");

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(AccountInvitationException.class, err);
			assertEquals(AccountInvitationErrorCode.INVITATION_TOKEN_EXPIRED,
					((AccountInvitationException) err).getErrorCode());
		}).verify();
	}

	// --- activateAccount ---

	@Test
	void shouldActivateAccountSuccessfully() {
		// given
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
		InvitationToken token = InvitationToken.builder().userId(1).expiresAt(LocalDateTime.now().plusHours(24))
				.build();
		User user = User.builder().id(1).email("s@e.com").status(UserStatus.INVITED).build();
		when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(passwordEncoder.encode("pass123")).thenReturn("encoded");
		when(userRepository.save(any())).thenReturn(user);
		when(invitationTokenRepository.save(any())).thenReturn(token);

		ActivateAccountRequest request = ActivateAccountRequest.builder().token("valid-token").username("newuser")
				.password("pass123").build();

		// when
		Mono<Void> result = accountActivationService.activateAccount(Mono.just(request));

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userRepository).save(argThat(u -> u.getStatus() == UserStatus.ACTIVE && "newuser".equals(u.getUsername())
				&& "encoded".equals(u.getPassword())));
	}

	@Test
	void shouldRejectActivationWhenUsernameAlreadyTakenByActiveAccount() {
		// given
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
		User activeUser = User.builder().id(2).username("taken").status(UserStatus.ACTIVE).build();
		when(userRepository.findByUsername("taken")).thenReturn(Optional.of(activeUser));

		ActivateAccountRequest request = ActivateAccountRequest.builder().token("valid-token").username("taken")
				.password("pass123").build();

		// when
		Mono<Void> result = accountActivationService.activateAccount(Mono.just(request));

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(UserException.class, err);
			assertEquals(UserErrorCode.USERNAME_ALREADY_TAKEN, ((UserException) err).getErrorCode());
		}).verify();
		verify(invitationTokenRepository, never()).findByTokenHash(anyString());
	}

	@Test
	void shouldRejectActivationWhenTokenInvalid() {
		// given
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
		when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

		ActivateAccountRequest request = ActivateAccountRequest.builder().token("bad-token").username("newuser")
				.password("pass123").build();

		// when
		Mono<Void> result = accountActivationService.activateAccount(Mono.just(request));

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(AccountInvitationException.class, err);
			assertEquals(AccountInvitationErrorCode.INVITATION_TOKEN_INVALID,
					((AccountInvitationException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectActivationWhenAccountAlreadyActive() {
		// given
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
		InvitationToken token = InvitationToken.builder().userId(1).expiresAt(LocalDateTime.now().plusHours(24))
				.build();
		User user = User.builder().id(1).email("s@e.com").status(UserStatus.ACTIVE).build();
		when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
		when(invitationTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		ActivateAccountRequest request = ActivateAccountRequest.builder().token("valid-token").username("newuser")
				.password("pass123").build();

		// when
		Mono<Void> result = accountActivationService.activateAccount(Mono.just(request));

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(AccountInvitationException.class, err);
			assertEquals(AccountInvitationErrorCode.ACCOUNT_ALREADY_ACTIVE,
					((AccountInvitationException) err).getErrorCode());
		}).verify();
	}

	// --- resendInvite ---

	@Test
	void shouldResendInviteSuccessfully() {
		// given
		User user = User.builder().id(1).email("s@e.com").status(UserStatus.INVITED).build();
		InvitationToken newToken = InvitationToken.builder().userId(1).expiresAt(LocalDateTime.now().plusHours(72))
				.build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(invitationTokenRepository.save(any())).thenReturn(newToken);

		// when
		Mono<Void> result = accountActivationService.resendInvite(1);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(mailService).sendInvitationEmail(eq("s@e.com"), anyString());
	}

	@Test
	void shouldRejectResendWhenUserNotFound() {
		// given
		when(userRepository.findById(99)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = accountActivationService.resendInvite(99);

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(UserException.class, err);
			assertEquals(UserErrorCode.USER_NOT_FOUND, ((UserException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectResendWhenAccountAlreadyActive() {
		// given
		User user = User.builder().id(1).email("s@e.com").status(UserStatus.ACTIVE).build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		// when
		Mono<Void> result = accountActivationService.resendInvite(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertInstanceOf(AccountInvitationException.class, err);
			assertEquals(AccountInvitationErrorCode.ACCOUNT_ALREADY_ACTIVE,
					((AccountInvitationException) err).getErrorCode());
		}).verify();
	}
}
