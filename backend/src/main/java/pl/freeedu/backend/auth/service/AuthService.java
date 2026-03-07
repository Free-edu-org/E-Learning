package pl.freeedu.backend.auth.service;

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
			String identifier = request.getIdentifier();
			User user;
			if (identifier.contains("@")) {
				user = userRepository.findByEmail(identifier)
						.orElseThrow(() -> new AuthException(AuthErrorCode.INVALID_CREDENTIALS));
			} else {
				user = userRepository.findByUsername(identifier)
						.orElseThrow(() -> new AuthException(AuthErrorCode.INVALID_CREDENTIALS));
			}

			if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
				throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
			}

			String token = jwtService.generateToken(user.getId());
			return authMapper.toAuthResponse(token, user.getRole());
		}).subscribeOn(Schedulers.boundedElastic()));
	}
}
