package pl.freeedu.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.auth.dto.RegisterRequest;
import pl.freeedu.backend.security.JwtService;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.exception.ErrorCode;

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

    public Mono<AuthResponse> register(Mono<RegisterRequest> requestMono) {
        return requestMono.flatMap(request -> Mono.fromCallable(() -> {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new AuthException(ErrorCode.EMAIL_ALREADY_TAKEN);
            }
            User user = authMapper.toUser(request, passwordEncoder.encode(request.getPassword()));
            return userRepository.save(user);
        })
                .subscribeOn(Schedulers.boundedElastic())
                .map(savedUser -> {
                    String token = jwtService.generateToken(savedUser.getEmail());
                    return authMapper.toAuthResponse(token, savedUser.getRole());
                }));
    }

    public Mono<AuthResponse> login(Mono<LoginRequest> requestMono) {
        return requestMono.flatMap(request -> Mono.fromCallable(() -> userRepository.findByEmail(request.getEmail()))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(optionalUser -> optionalUser.map(Mono::just).orElseGet(Mono::empty))
                .switchIfEmpty(Mono.error(new AuthException(ErrorCode.INVALID_CREDENTIALS)))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        return Mono.error(new AuthException(ErrorCode.INVALID_CREDENTIALS));
                    }
                    String token = jwtService.generateToken(user.getEmail());
                    return Mono.just(authMapper.toAuthResponse(token, user.getRole()));
                }));
    }
}
