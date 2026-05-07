package pl.freeedu.backend.user.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;
import java.util.Set;
import java.util.function.BiFunction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.achievement.event.AvatarChangedEvent;
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

@Slf4j
@Service
public class UserService {

	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final SecurityService securityService;
	private final TransactionTemplate transactionTemplate;
	private final ApplicationEventPublisher applicationEventPublisher;

	public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder,
			SecurityService securityService, TransactionTemplate transactionTemplate,
			ApplicationEventPublisher applicationEventPublisher) {
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.securityService = securityService;
		this.transactionTemplate = transactionTemplate;
		this.applicationEventPublisher = applicationEventPublisher;
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
					log.info("Registering new student. Requested by user ID: {}", currentUser.getId());
					if (userRepository.existsByEmail(request.getEmail())) {
						log.warn("Student registration failed: Email already taken");
						throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
					}
					if (userRepository.existsByUsername(request.getUsername())) {
						log.warn("Student registration failed: Username already taken");
						throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
					}
					User user = userMapper.toStudentUser(request, passwordEncoder.encode(request.getPassword()));
					userRepository.save(user);
					log.info("Student registered successfully. New user ID: {}", user.getId());
					return (Void) null;
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	private Mono<Void> registerUser(Mono<RegisterUserRequest> requestMono,
			BiFunction<RegisterUserRequest, String, User> mapperFunction) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Registering new administrative user (Admin/Teacher)");
			if (userRepository.existsByEmail(request.getEmail())) {
				log.warn("User registration failed: Email already taken");
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			if (userRepository.existsByUsername(request.getUsername())) {
				log.warn("User registration failed: Username already taken");
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}
			User user = mapperFunction.apply(request, passwordEncoder.encode(request.getPassword()));
			userRepository.save(user);
			log.info("User registered successfully. New user ID: {}, Role: {}", user.getId(), user.getRole());
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
			log.info("Updating user profile for user ID: {}", id);
			User user = userRepository.findById(id).orElseThrow(() -> {
				log.warn("Update failed: User with ID: {} not found", id);
				return new UserException(UserErrorCode.USER_NOT_FOUND);
			});

			if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
				log.warn("Update failed: New email already taken for user ID: {}", id);
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}

			if (!user.getUsername().equals(request.getUsername())
					&& userRepository.existsByUsername(request.getUsername())) {
				log.warn("Update failed: New username already taken for user ID: {}", id);
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}

			userMapper.updateUserFromRequest(request, user);
			User updatedUser = userRepository.save(user);
			log.info("User profile updated successfully for user ID: {}", id);
			return updatedUser;
		}).subscribeOn(Schedulers.boundedElastic()).map(userMapper::toUserResponse));
	}

	public Mono<Void> changePassword(Integer id, Mono<ChangePasswordRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Changing password for user ID: {}", id);
			User user = userRepository.findById(id).orElseThrow(() -> {
				log.warn("Password change failed: User with ID: {} not found", id);
				return new UserException(UserErrorCode.USER_NOT_FOUND);
			});

			if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
				log.warn("Password change failed: Invalid old password for user ID: {}", id);
				throw new AuthException(AuthErrorCode.INVALID_OLD_PASSWORD);
			}

			user.setPassword(passwordEncoder.encode(request.getNewPassword()));
			user.setTokenVersion(user.getTokenVersion() == null ? 1 : user.getTokenVersion() + 1);
			userRepository.save(user);
			log.info("Password changed successfully for user ID: {}", id);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteUser(Integer id) {
		return Mono.fromCallable(() -> {
			log.info("Deleting user with ID: {}", id);
			User user = userRepository.findById(id).orElseThrow(() -> {
				log.warn("Delete failed: User with ID: {} not found", id);
				return new UserException(UserErrorCode.USER_NOT_FOUND);
			});
			userRepository.delete(user);
			log.info("User with ID: {} deleted successfully", id);
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
			log.info("Avatar upload started for user ID: {}", id);
			String contentType = filePart.headers().getContentType() != null
					? filePart.headers().getContentType().toString()
					: "";
			String baseType = contentType.contains(";")
					? contentType.substring(0, contentType.indexOf(';')).trim()
					: contentType.trim();
			if (!ALLOWED_CONTENT_TYPES.contains(baseType)) {
				log.warn("Avatar upload failed for user ID: {}: invalid content type: {}", id, baseType);
				throw new UserException(UserErrorCode.AVATAR_INVALID_FILE_TYPE);
			}
			return baseType;
		}).subscribeOn(Schedulers.boundedElastic())
				.flatMap(baseType -> Mono.fromCallable(() -> userRepository.findById(id).orElseThrow(() -> {
					log.warn("Avatar processing failed: User with ID: {} not found", id);
					return new UserException(UserErrorCode.USER_NOT_FOUND);
				})).subscribeOn(Schedulers.boundedElastic()).flatMap(user -> {
					String extension = switch (baseType) {
						case "image/jpeg" -> "jpg";
						case "image/png" -> "png";
						default -> "bin";
					};
					String publicIdPrefix = user.getPublicId();
					String legacyInternalIdPrefix = String.valueOf(id);
					String fileName = publicIdPrefix + "-" + System.currentTimeMillis() + "." + extension;
					Path dir = Paths.get(AVATAR_DIR);
					Path filePath = dir.resolve(fileName);

					return Mono.fromCallable(() -> {
						try {
							log.debug("Preparing avatar directory and deleting old files for user ID: {}", id);
							Files.createDirectories(dir);
							try (Stream<Path> files = Files.list(dir)) {
								files.filter(path -> {
									String name = path.getFileName().toString();
									return name.startsWith(publicIdPrefix + ".")
											|| name.startsWith(publicIdPrefix + "-")
											|| name.startsWith(legacyInternalIdPrefix + ".")
											|| name.startsWith(legacyInternalIdPrefix + "-");
								}).forEach(path -> {
									try {
										Files.deleteIfExists(path);
									} catch (IOException e) {
										log.error("Failed to delete previous avatar file: {}", path, e);
										throw new RuntimeException("Failed to delete previous avatar file", e);
									}
								});
							}
							return filePath;
						} catch (IOException e) {
							log.error("Failed to prepare avatar directory for user ID: {}", id, e);
							throw new RuntimeException("Failed to prepare avatar directory", e);
						}
					}).subscribeOn(Schedulers.boundedElastic())
							.flatMap(path -> filePart.transferTo(path).thenReturn(path))
							.flatMap(path -> Mono.fromCallable(() -> {
								try {
									long fileSize = Files.size(path);
									if (fileSize > MAX_AVATAR_SIZE_BYTES) {
										log.warn("Avatar upload failed for user ID: {}: file too large ({} bytes)", id,
												fileSize);
										Files.deleteIfExists(path);
										throw new UserException(UserErrorCode.AVATAR_FILE_TOO_LARGE);
									}
									String avatarUrl = "/uploads/avatars/" + path.getFileName().toString();
									User updatedUser = updateAvatarInTransaction(user, avatarUrl);
									log.info("Avatar uploaded successfully for user ID: {}", id);
									return userMapper.toUserResponse(updatedUser);
								} catch (IOException e) {
									log.error("Failed to process avatar file for user ID: {}", id, e);
									throw new RuntimeException("Failed to process avatar file", e);
								}
							}).subscribeOn(Schedulers.boundedElastic()));
				}));
	}

	public Mono<UserResponse> setPresetAvatar(Integer id, String presetName) {
		return Mono.fromCallable(() -> {
			log.info("Setting preset avatar '{}' for user ID: {}", presetName, id);
			if (!ALLOWED_PRESETS.contains(presetName)) {
				log.warn("Failed to set preset avatar: Invalid preset name '{}' for user ID: {}", presetName, id);
				throw new UserException(UserErrorCode.AVATAR_INVALID_PRESET);
			}
			User user = userRepository.findById(id).orElseThrow(() -> {
				log.warn("Failed to set preset avatar: User with ID: {} not found", id);
				return new UserException(UserErrorCode.USER_NOT_FOUND);
			});
			User updatedUser = updateAvatarInTransaction(user, "preset:" + presetName);
			log.info("Preset avatar set successfully for user ID: {}", id);
			return userMapper.toUserResponse(updatedUser);
		}).subscribeOn(Schedulers.boundedElastic());
	}

	private User updateAvatarInTransaction(User user, String avatarUrl) {
		return transactionTemplate.execute(status -> {
			user.setAvatarUrl(avatarUrl);
			User updatedUser = userRepository.save(user);
			applicationEventPublisher.publishEvent(new AvatarChangedEvent(updatedUser.getId()));
			return updatedUser;
		});
	}
}
