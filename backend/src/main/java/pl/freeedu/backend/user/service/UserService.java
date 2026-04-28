package pl.freeedu.backend.user.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;
import java.util.Set;
import java.util.function.BiFunction;
import org.springframework.http.codec.multipart.FilePart;
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
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.security.service.SecurityService;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

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
		return requestMono
				.flatMap(request -> securityService.getCurrentUser().flatMap(currentUser -> Mono.fromCallable(() -> {
					if (userRepository.existsByEmail(request.getEmail())) {
						throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
					}
					if (userRepository.existsByUsername(request.getUsername())) {
						throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
					}
					User user = userMapper.toStudentUser(request, passwordEncoder.encode(request.getPassword()));
					userRepository.save(user);
					return (Void) null;
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	private Mono<Void> registerUser(Mono<RegisterUserRequest> requestMono,
			BiFunction<RegisterUserRequest, String, User> mapperFunction) {
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
				throw new AuthException(AuthErrorCode.INVALID_OLD_PASSWORD);
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

	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");
	private static final long MAX_AVATAR_SIZE_BYTES = 2L * 1024 * 1024; // 2 MB
	private static final String AVATAR_DIR = "uploads/avatars";
	private static final Set<String> ALLOWED_PRESETS = Set.of("avatar_1", "avatar_2", "avatar_3", "avatar_4",
			"avatar_5", "avatar_6", "avatar_7", "avatar_8", "avatar_9", "avatar_10", "avatar_11", "avatar_12");

	public Mono<UserResponse> uploadAvatar(Integer id, FilePart filePart) {
		return Mono.fromCallable(() -> {
			String contentType = filePart.headers().getContentType() != null
					? filePart.headers().getContentType().toString()
					: "";
			String baseType = contentType.contains(";")
					? contentType.substring(0, contentType.indexOf(';')).trim()
					: contentType.trim();
			if (!ALLOWED_CONTENT_TYPES.contains(baseType)) {
				throw new UserException(UserErrorCode.AVATAR_INVALID_FILE_TYPE);
			}
			return baseType;
		}).subscribeOn(Schedulers.boundedElastic()).flatMap(baseType -> {
			String extension = switch (baseType) {
				case "image/jpeg" -> "jpg";
				case "image/png" -> "png";
				default -> "bin";
			};
			String fileName = id + "-" + System.currentTimeMillis() + "." + extension;
			Path dir = Paths.get(AVATAR_DIR);
			Path filePath = dir.resolve(fileName);

			return Mono.fromCallable(() -> {
				try {
					Files.createDirectories(dir);
					try (Stream<Path> files = Files.list(dir)) {
						files.filter(path -> {
							String name = path.getFileName().toString();
							return name.startsWith(id + ".") || name.startsWith(id + "-");
						}).forEach(path -> {
							try {
								Files.deleteIfExists(path);
							} catch (IOException e) {
								throw new RuntimeException("Failed to delete previous avatar file", e);
							}
						});
					}
					return filePath;
				} catch (IOException e) {
					throw new RuntimeException("Failed to prepare avatar directory", e);
				}
			}).subscribeOn(Schedulers.boundedElastic()).flatMap(path -> filePart.transferTo(path).thenReturn(path))
					.flatMap(path -> Mono.fromCallable(() -> {
						try {
							long fileSize = Files.size(path);
							if (fileSize > MAX_AVATAR_SIZE_BYTES) {
								Files.deleteIfExists(path);
								throw new UserException(UserErrorCode.AVATAR_FILE_TOO_LARGE);
							}
							String avatarUrl = "/uploads/avatars/" + path.getFileName().toString();
							User user = userRepository.findById(id)
									.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
							user.setAvatarUrl(avatarUrl);
							return userMapper.toUserResponse(userRepository.save(user));
						} catch (IOException e) {
							throw new RuntimeException("Failed to process avatar file", e);
						}
					}).subscribeOn(Schedulers.boundedElastic()));
		});
	}

	public Mono<UserResponse> setPresetAvatar(Integer id, String presetName) {
		return Mono.fromCallable(() -> {
			if (!ALLOWED_PRESETS.contains(presetName)) {
				throw new UserException(UserErrorCode.AVATAR_INVALID_PRESET);
			}
			User user = userRepository.findById(id).orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			user.setAvatarUrl("preset:" + presetName);
			return userMapper.toUserResponse(userRepository.save(user));
		}).subscribeOn(Schedulers.boundedElastic());
	}
}
