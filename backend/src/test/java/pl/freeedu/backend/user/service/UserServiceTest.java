package pl.freeedu.backend.user.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
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

import java.util.Optional;

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

	@InjectMocks
	private UserService userService;

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
		User user = User.builder().id(1).build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(userMapper.toUserResponse(user)).thenReturn(UserResponse.builder().id(1).build());

		// when
		Mono<UserResponse> result = userService.getUser(1);

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals(1, r.getId())).verifyComplete();
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
		User user = User.builder().id(1).email("old@e.com").username("old").build();

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
		User user = User.builder().id(1).password("ho").build();

		when(userRepository.findById(1)).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("o", "ho")).thenReturn(true);
		when(passwordEncoder.encode("n")).thenReturn("hn");

		// when
		Mono<Void> result = userService.changePassword(1, Mono.just(req));

		// then
		StepVerifier.create(result).verifyComplete();
		assertEquals("hn", user.getPassword());
		verify(userRepository).save(user);
	}

	@Test
	void shouldThrowWhenOldPasswordIncorrectInChangePassword() {
		// given
		ChangePasswordRequest req = ChangePasswordRequest.builder().oldPassword("o").build();
		User user = User.builder().id(1).password("ho").build();

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
		User user = User.builder().id(1).build();
		when(userRepository.findById(1)).thenReturn(Optional.of(user));

		// when
		Mono<Void> result = userService.deleteUser(1);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userRepository).delete(user);
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
}