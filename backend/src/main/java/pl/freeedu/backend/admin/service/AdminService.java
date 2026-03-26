package pl.freeedu.backend.admin.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.admin.dto.AdminCreateStudentRequest;
import pl.freeedu.backend.admin.dto.AdminStatsResponse;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.user.service.UserMapper;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class AdminService {

	private final UserRepository userRepository;
	private final UserGroupRepository userGroupRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;

	public AdminService(UserRepository userRepository, UserGroupRepository userGroupRepository,
			UserInGroupRepository userInGroupRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.userGroupRepository = userGroupRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
	}

	public Mono<AdminStatsResponse> getStats() {
		return Mono.fromCallable(() -> AdminStatsResponse.builder().totalUsers(userRepository.count())
				.totalAdmins(userRepository.countByRole(Role.ADMIN))
				.totalTeachers(userRepository.countByRole(Role.TEACHER))
				.totalStudents(userRepository.countByRole(Role.STUDENT)).totalGroups(userGroupRepository.count())
				.build()).subscribeOn(Schedulers.boundedElastic());
	}

	public Flux<UserResponse> getTeachers() {
		return getUsersByRole(Role.TEACHER);
	}

	public Flux<UserResponse> getStudents() {
		return getUsersByRole(Role.STUDENT);
	}

	public Mono<UserResponse> createStudent(AdminCreateStudentRequest request) {
		return Mono.fromCallable(() -> {
			if (userRepository.existsByEmail(request.getEmail())) {
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			if (userRepository.existsByUsername(request.getUsername())) {
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}

			User teacher = userRepository.findById(request.getTeacherId())
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			if (teacher.getRole() != Role.TEACHER) {
				throw new UserException(UserErrorCode.INVALID_TEACHER_ASSIGNMENT);
			}

			UserGroup group = null;
			if (request.getGroupId() != null) {
				group = userGroupRepository.findById(request.getGroupId())
						.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
				if (!teacher.getId().equals(group.getTeacherId())) {
					throw new UserGroupException(UserGroupErrorCode.GROUP_TEACHER_MISMATCH);
				}
			}

			User student = User.builder().email(request.getEmail()).username(request.getUsername())
					.password(passwordEncoder.encode(request.getPassword())).role(Role.STUDENT)
					.teacherId(teacher.getId()).build();

			try {
				User savedStudent = userRepository.save(student);
				if (group != null) {
					userInGroupRepository
							.save(UserInGroup.builder().userId(savedStudent.getId()).groupId(group.getId()).build());
				}
				return userMapper.toUserResponse(savedStudent);
			} catch (DataIntegrityViolationException ex) {
				if (userRepository.existsByEmail(request.getEmail())) {
					throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
				}
				if (userRepository.existsByUsername(request.getUsername())) {
					throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
				}
				throw ex;
			}
		}).subscribeOn(Schedulers.boundedElastic());
	}

	private Flux<UserResponse> getUsersByRole(Role role) {
		return Mono
				.fromCallable(() -> userRepository.findByRoleOrderByCreatedAtDesc(role).stream()
						.map(userMapper::toUserResponse).toList())
				.subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}
}
