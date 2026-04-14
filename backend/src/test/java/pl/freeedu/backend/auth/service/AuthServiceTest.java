package pl.freeedu.backend.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.auth.exception.AuthErrorCode;
import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.security.jwt.JwtService;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtService jwtService;

	@Mock
	private AuthMapper authMapper;

	@InjectMocks
	private AuthService authService;

	@Test
	void shouldLoginByEmailWhenCredentialsAreCorrect() {
		// given
		LoginRequest request = LoginRequest.builder().identifier("teacher@freeedu.pl").password("secret").build();
		User user = User.builder().id(10).email("teacher@freeedu.pl").username("teacher").password("hashed")
				.role(Role.TEACHER).build();
		AuthResponse response = AuthResponse.builder().token("jwt").role(Role.TEACHER).build();

		when(userRepository.findByEmail("teacher@freeedu.pl")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
		when(jwtService.generateToken(10)).thenReturn("jwt");
		when(authMapper.toAuthResponse("jwt", Role.TEACHER)).thenReturn(response);

		// when
		Mono<AuthResponse> result = authService.login(Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(r -> {
			assertEquals("jwt", r.getToken());
			assertEquals(Role.TEACHER, r.getRole());
		}).verifyComplete();
	}

	@Test
	void shouldLoginByUsernameWhenEmailNotFound() {
		// given
		LoginRequest request = LoginRequest.builder().identifier("teacher").password("secret").build();
		User user = User.builder().id(11).email("x@x.pl").username("teacher").password("hashed").role(Role.ADMIN)
				.build();
		AuthResponse response = AuthResponse.builder().token("jwt2").role(Role.ADMIN).build();

		when(userRepository.findByEmail("teacher")).thenReturn(Optional.empty());
		when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
		when(jwtService.generateToken(11)).thenReturn("jwt2");
		when(authMapper.toAuthResponse("jwt2", Role.ADMIN)).thenReturn(response);

		// when
		Mono<AuthResponse> result = authService.login(Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(r -> {
			assertEquals("jwt2", r.getToken());
			assertEquals(Role.ADMIN, r.getRole());
		}).verifyComplete();
	}

	@Test
	void shouldReturnInvalidCredentialsWhenPasswordDoesNotMatch() {
		// given
		LoginRequest request = LoginRequest.builder().identifier("teacher").password("wrong").build();
		User user = User.builder().id(12).username("teacher").password("hashed").role(Role.TEACHER).build();

		when(userRepository.findByEmail("teacher")).thenReturn(Optional.empty());
		when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

		// when
		Mono<AuthResponse> result = authService.login(Mono.just(request));

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
		}).verify();

		verify(jwtService, org.mockito.Mockito.never()).generateToken(any());
	}

	@Test
	void shouldReturnInvalidCredentialsWhenUserNotFound() {
		// given
		LoginRequest request = LoginRequest.builder().identifier("unknown").password("secret").build();

		when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());
		when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

		// when
		Mono<AuthResponse> result = authService.login(Mono.just(request));

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			AuthException exception = assertInstanceOf(AuthException.class, error);
			assertEquals(AuthErrorCode.INVALID_CREDENTIALS, exception.getErrorCode());
		}).verify();
	}
}