package pl.freeedu.backend.user.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.achievement.event.AvatarChangedEvent;
import pl.freeedu.backend.auth.exception.AuthErrorCode;
import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.user.dto.ChangePasswordRequest;
import pl.freeedu.backend.user.dto.RegisterUserRequest;
import pl.freeedu.backend.user.dto.UpdateUserRequest;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

	@Mock
	private UserRepository userRepository;
	@Mock
	private UserMapper userMapper;
	@Mock
	private PasswordEncoder passwordEncoder;
	@Mock
	private SecurityService securityService;
	@Mock
	private TransactionTemplate transactionTemplate;
	@Mock
	private ApplicationEventPublisher applicationEventPublisher;

	@InjectMocks
	private UserService userService;

	@org.junit.jupiter.api.BeforeEach
	void setUp() {
		lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});
	}

	@Test
	void shouldCreateAdminSucceed() {
		// given
		RegisterUserRequest req = RegisterUserRequest.builder().email("a@e.com").username("a").password("p").build();
		when(userRepository.existsByEmail(any())).thenReturn(false);
		when(userRepository.existsByUsername(any())).thenReturn(false);
		when(passwordEncoder.encode("p")).thenReturn("enc");
		when(userMapper.toAdminUser(any(), eq("enc"))).thenReturn(User.builder().build());

		// when
		Mono<Void> result = userService.createAdmin(Mono.just(req));

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userRepository).save(any());
	}

	@Test
	void shouldThrowWhenEmailTakenInCreateAdmin() {
		// given
		RegisterUserRequest req = RegisterUserRequest.builder().email("a@e.com").build();
		when(userRepository.existsByEmail(any())).thenReturn(true);

		// when
		Mono<Void> result = userService.createAdmin(Mono.just(req));

		// then
		StepVerifier.create(result).expectError(UserException.class).verify();
	}

	@Test
	void shouldRegisterStudentSucceed() {
		// given
		RegisterUserRequest req = RegisterUserRequest.builder().email("s@e.com").username("s").password("p").build();
		when(securityService.getCurrentUser()).thenReturn(Mono.just(new CustomUserDetails(1, "t", "p", Role.TEACHER)));
		when(userRepository.existsByEmail(any())).thenReturn(false);
		when(userRepository.existsByUsername(any())).thenReturn(false);
		when(passwordEncoder.encode("p")).thenReturn("enc");
		when(userMapper.toStudentUser(any(), eq("enc"))).thenReturn(User.builder().build());

		// when
		Mono<Void> result = userService.registerStudent(Mono.just(req));

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userRepository).save(any());
	}

	@Test
	void shouldGetUserById() {
		// given
		User user = User.builder().publicId("user-pub-1").build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(userMapper.toUserResponse(user)).thenReturn(UserResponse.builder().publicId("user-pub-1").build());

		// when
		Mono<UserResponse> result = userService.getUser(1);

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("user-pub-1", r.getPublicId())).verifyComplete();
	}

	@Test
	void shouldThrowWhenUserNotFound() {
		// given
		when(userRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<UserResponse> result = userService.getUser(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof UserException);
			assertEquals(UserErrorCode.USER_NOT_FOUND, ((UserException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldUpdateUserSucceed() {
		// given
		UpdateUserRequest req = UpdateUserRequest.builder().email("new@e.com").username("new").build();
		User user = User.builder().publicId("user-pub-1").email("old@e.com").username("old").build();

		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(userRepository.save(any())).thenReturn(user);
		when(userMapper.toUserResponse(user)).thenReturn(UserResponse.builder().username("new").build());

		// when
		Mono<UserResponse> result = userService.updateUser(1, Mono.just(req));

		// then
		StepVerifier.create(result).assertNext(r -> {
			assertEquals("new", r.getUsername());
			verify(userMapper).updateUserFromRequest(eq(req), eq(user));
		}).verifyComplete();
	}

	@Test
	void shouldChangePasswordSucceed() {
		// given
		ChangePasswordRequest req = ChangePasswordRequest.builder().oldPassword("o").newPassword("n").build();
		User user = User.builder().publicId("user-pub-1").password("ho").tokenVersion(2).build();

		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("o", "ho")).thenReturn(true);
		when(passwordEncoder.encode("n")).thenReturn("hn");

		// when
		Mono<Void> result = userService.changePassword(1, Mono.just(req));

		// then
		StepVerifier.create(result).verifyComplete();
		assertEquals("hn", user.getPassword());
		assertEquals(3, user.getTokenVersion());
		verify(userRepository).save(user);
	}

	@Test
	void shouldThrowWhenOldPasswordIncorrectInChangePassword() {
		// given
		ChangePasswordRequest req = ChangePasswordRequest.builder().oldPassword("o").build();
		User user = User.builder().publicId("user-pub-1").password("ho").build();

		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("o", "ho")).thenReturn(false);

		// when
		Mono<Void> result = userService.changePassword(1, Mono.just(req));

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertEquals(AuthErrorCode.INVALID_OLD_PASSWORD, ((AuthException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldDeleteUser() {
		// given
		User user = User.builder().publicId("user-pub-1").build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		// when
		Mono<Void> result = userService.deleteUser(1);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userRepository).delete(user);
	}

	@Test
	void shouldUsePublicIdInUploadedAvatarUrl() {
		// given
		Integer internalUserId = 42;
		String userPublicId = "user-public-avatar";
		User user = User.builder().id(internalUserId).publicId(userPublicId).build();
		FilePart filePart = mock(FilePart.class);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.IMAGE_PNG);

		when(filePart.headers()).thenReturn(headers);
		when(userRepository.findById(internalUserId)).thenReturn(Optional.of(user));
		when(userRepository.save(user)).thenReturn(user);
		when(userMapper.toUserResponse(user)).thenAnswer(
				invocation -> UserResponse.builder().publicId(userPublicId).avatarUrl(user.getAvatarUrl()).build());
		when(filePart.transferTo(any(Path.class))).thenAnswer(invocation -> {
			Path path = invocation.getArgument(0);
			Files.writeString(path, "avatar");
			return Mono.empty();
		});

		// when
		Mono<UserResponse> result = userService.uploadAvatar(internalUserId, filePart);

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertTrue(response.getAvatarUrl().startsWith("/uploads/avatars/" + userPublicId + "-"));
			assertFalse(response.getAvatarUrl().startsWith("/uploads/avatars/" + internalUserId + "-"));
			deleteTestAvatars(userPublicId);
		}).verifyComplete();
		ArgumentCaptor<AvatarChangedEvent> eventCaptor = ArgumentCaptor.forClass(AvatarChangedEvent.class);
		verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
		assertEquals(internalUserId, eventCaptor.getValue().userId());
	}

	@Test
	void shouldPublishAvatarChangedEventWhenPresetAvatarIsSet() {
		// given
		Integer internalUserId = 42;
		User user = User.builder().id(internalUserId).publicId("user-public-avatar").build();
		when(userRepository.findById(internalUserId)).thenReturn(Optional.of(user));
		when(userRepository.save(user)).thenReturn(user);
		when(userMapper.toUserResponse(user))
				.thenReturn(UserResponse.builder().publicId("user-public-avatar").avatarUrl("preset:avatar_1").build());

		// when
		Mono<UserResponse> result = userService.setPresetAvatar(internalUserId, "avatar_1");

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertEquals("user-public-avatar", response.getPublicId());
			assertEquals("preset:avatar_1", user.getAvatarUrl());
		}).verifyComplete();
		ArgumentCaptor<AvatarChangedEvent> eventCaptor = ArgumentCaptor.forClass(AvatarChangedEvent.class);
		verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
		assertEquals(internalUserId, eventCaptor.getValue().userId());
	}

	@Test
	void shouldThrowWhenUserNotFoundInDelete() {
		// given
		when(userRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = userService.deleteUser(1);

		// then
		StepVerifier.create(result).expectError(UserException.class).verify();
	}

	@Test
	void shouldThrowWhenUserNotFoundInUpdate() {
		// given
		when(userRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<UserResponse> result = userService.updateUser(1, Mono.just(UpdateUserRequest.builder().build()));

		// then
		StepVerifier.create(result).expectError(UserException.class).verify();
	}

	private static void deleteTestAvatars(String userPublicId) {
		Path avatarDir = Path.of("uploads", "avatars");
		if (!Files.isDirectory(avatarDir)) {
			return;
		}
		try (Stream<Path> files = Files.list(avatarDir)) {
			files.filter(path -> path.getFileName().toString().startsWith(userPublicId + "-")).forEach(path -> {
				try {
					Files.deleteIfExists(path);
				} catch (Exception ignored) {
					// Test cleanup must not mask the contract assertion.
				}
			});
		} catch (Exception ignored) {
			// Test cleanup must not mask the contract assertion.
		}
	}
}
