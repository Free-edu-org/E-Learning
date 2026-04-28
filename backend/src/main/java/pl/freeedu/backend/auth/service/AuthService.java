package pl.freeedu.backend.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.security.jwt.JwtService;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.auth.exception.AuthErrorCode;

@Slf4j
@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthMapper authMapper;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
			AuthMapper authMapper) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authMapper = authMapper;
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

			if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
				log.warn("Login failed: Invalid password for user ID: {}", user.getId());
				throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
			}

			String token = jwtService.generateToken(user.getId());
			log.info("User logged in successfully. User ID: {}, Role: {}", user.getId(), user.getRole());
			return authMapper.toAuthResponse(token, user.getRole());
		}).subscribeOn(Schedulers.boundedElastic()));
	}
}
