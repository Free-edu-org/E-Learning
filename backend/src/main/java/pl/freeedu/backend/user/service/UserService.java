package pl.freeedu.backend.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.auth.exception.AuthErrorCode;
import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.dto.RegisterUserRequest;
import pl.freeedu.backend.user.dto.ChangePasswordRequest;
import pl.freeedu.backend.user.dto.UpdateUserRequest;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.security.service.SecurityService;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final SecurityService securityService;

	public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder,
			SecurityService securityService) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.securityService = securityService;
	}

	public Mono<Void> createAdmin(Mono<RegisterUserRequest> requestMono) {
		return registerUser(requestMono, (request, password) -> userMapper.toAdminUser(request, password));
	}

	public Mono<Void> createTeacher(Mono<RegisterUserRequest> requestMono) {
		return registerUser(requestMono, (request, password) -> userMapper.toTeacherUser(request, password));
	}

	public Mono<Void> registerStudent(Mono<RegisterUserRequest> requestMono) {
		return registerUser(requestMono, (request, password) -> userMapper.toStudentUser(request, password));
	}

	private Mono<Void> registerUser(Mono<RegisterUserRequest> requestMono,
			java.util.function.BiFunction<RegisterUserRequest, String, User> mapperFunction) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			if (userRepository.existsByEmail(request.getEmail())) {
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			if (userRepository.existsByUsername(request.getUsername())) {
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}
			User user = mapperFunction.apply(request, passwordEncoder.encode(request.getPassword()));
			userRepository.save(user);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<UserResponse> getUser(Integer id) {
		return Mono.fromCallable(
				() -> userRepository.findById(id).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND)))
				.subscribeOn(Schedulers.boundedElastic()).map(userMapper::toUserResponse);
	}

	public Mono<UserResponse> getCurrentUser() {
		return securityService.getCurrentUserId().flatMap(this::getUser)
				.switchIfEmpty(Mono.error(new UserException(UserErrorCode.USER_NOT_FOUND)));
	}

	public Mono<UserResponse> updateUser(Integer id, Mono<UpdateUserRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			User user = userRepository.findById(id).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

			if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}

			if (!user.getUsername().equals(request.getUsername())
					&& userRepository.existsByUsername(request.getUsername())) {
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}

			userMapper.updateUserFromRequest(request, user);
			return userRepository.save(user);
		}).subscribeOn(Schedulers.boundedElastic()).map(userMapper::toUserResponse));
	}

	public Mono<Void> changePassword(Integer id, Mono<ChangePasswordRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			User user = userRepository.findById(id).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

			if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
				throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
			}

			user.setPassword(passwordEncoder.encode(request.getNewPassword()));
			userRepository.save(user);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteUser(Integer id) {
		return Mono.fromCallable(() -> {
			User user = userRepository.findById(id).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			userRepository.delete(user);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	public Mono<List<UserResponse>> getStudents() {
		return Mono.fromCallable(() -> userRepository.findByRole(Role.STUDENT).stream().map(userMapper::toUserResponse)
				.collect(java.util.stream.Collectors.toList())).subscribeOn(Schedulers.boundedElastic());
	}
}
