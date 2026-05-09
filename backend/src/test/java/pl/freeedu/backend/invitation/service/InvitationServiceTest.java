package pl.freeedu.backend.invitation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.emailverification.service.EmailVerificationService;
import pl.freeedu.backend.invitation.dto.RegisterWithInvitationRequest;
import pl.freeedu.backend.invitation.exception.InvitationErrorCode;
import pl.freeedu.backend.invitation.exception.InvitationException;
import pl.freeedu.backend.invitation.model.GroupInvitation;
import pl.freeedu.backend.invitation.repository.GroupInvitationRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

	@Mock
	private GroupInvitationRepository invitationRepository;

	@Mock
	private UserGroupRepository userGroupRepository;

	@Mock
	private UserRepository userRepository;

	@Mock
	private UserInGroupRepository userInGroupRepository;

	@Mock
	private SecurityService securityService;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private EmailVerificationService emailVerificationService;

	@Mock
	private TransactionTemplate transactionTemplate;

	@InjectMocks
	private InvitationService invitationService;

	@BeforeEach
	void setUp() {
		when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
	}

	@Test
	void shouldRegisterWithInvitationCreatePendingStudentAndSendVerification() {
		GroupInvitation invitation = GroupInvitation.builder().id(3).groupId(8).token("invite-token").maxUses(5)
				.usedCount(1).expiresAt(LocalDateTime.now().plusDays(1)).isActive(true).build();
		when(invitationRepository.findByToken("invite-token")).thenReturn(Optional.of(invitation));
		when(userRepository.existsByEmail("student@edu.pl")).thenReturn(false);
		when(userRepository.existsByUsername("student1")).thenReturn(false);
		when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
			User user = invocation.getArgument(0);
			user.setId(12);
			return user;
		});
		when(emailVerificationService.createVerificationForUser(any(User.class))).thenReturn("verify-token");

		Mono<MessageResponse> result = invitationService
				.registerWithInvitation(Mono.just(RegisterWithInvitationRequest.builder().token("invite-token")
						.email("student@edu.pl").username("student1").password("secret123").build()));

		StepVerifier.create(result)
				.assertNext(response -> assertEquals("Email verification required.", response.getMessage()))
				.verifyComplete();

		verify(userInGroupRepository).save(any());
		verify(invitationRepository).incrementUsedCount(3);
		verify(emailVerificationService).createVerificationForUser(any(User.class));
		verify(emailVerificationService).sendVerificationEmail(any(User.class), any());
		verify(userRepository).save(any(User.class));
	}

	@Test
	void shouldRejectInvitationRegistrationWhenInvitationExpired() {
		GroupInvitation invitation = GroupInvitation.builder().id(3).groupId(8).token("invite-token").maxUses(5)
				.usedCount(1).expiresAt(LocalDateTime.now().minusMinutes(1)).isActive(true).build();
		when(invitationRepository.findByToken("invite-token")).thenReturn(Optional.of(invitation));

		Mono<MessageResponse> result = invitationService
				.registerWithInvitation(Mono.just(RegisterWithInvitationRequest.builder().token("invite-token")
						.email("student@edu.pl").username("student1").password("secret123").build()));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			InvitationException exception = assertInstanceOf(InvitationException.class, error);
			assertEquals(InvitationErrorCode.INVITATION_EXPIRED, exception.getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectInvitationRegistrationWhenEmailTaken() {
		GroupInvitation invitation = GroupInvitation.builder().id(3).groupId(8).token("invite-token").maxUses(5)
				.usedCount(1).expiresAt(LocalDateTime.now().plusDays(1)).isActive(true).build();
		when(invitationRepository.findByToken("invite-token")).thenReturn(Optional.of(invitation));
		when(userRepository.existsByEmail("student@edu.pl")).thenReturn(true);

		Mono<MessageResponse> result = invitationService
				.registerWithInvitation(Mono.just(RegisterWithInvitationRequest.builder().token("invite-token")
						.email("student@edu.pl").username("student1").password("secret123").build()));

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			UserException exception = assertInstanceOf(UserException.class, error);
			assertEquals(UserErrorCode.EMAIL_ALREADY_TAKEN, exception.getErrorCode());
		}).verify();
	}
}
