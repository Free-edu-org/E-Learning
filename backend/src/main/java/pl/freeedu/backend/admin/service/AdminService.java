package pl.freeedu.backend.admin.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.admin.dto.AdminCreateStudentRequest;
import pl.freeedu.backend.admin.dto.AdminStudentResponse;
import pl.freeedu.backend.admin.dto.AdminStatsResponse;
import pl.freeedu.backend.admin.dto.AdminUpdateStudentRequest;
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

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminService {

	private final UserRepository userRepository;
	private final UserGroupRepository userGroupRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final TransactionTemplate transactionTemplate;

	public AdminService(UserRepository userRepository, UserGroupRepository userGroupRepository,
			UserInGroupRepository userInGroupRepository, UserMapper userMapper, PasswordEncoder passwordEncoder,
			TransactionTemplate transactionTemplate) {
		this.userRepository = userRepository;
		this.userGroupRepository = userGroupRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.transactionTemplate = transactionTemplate;
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

	public Flux<AdminStudentResponse> getStudents() {
		return Mono.fromCallable(() -> {
			Map<Integer, UserGroup> groupMap = userGroupRepository.findAll().stream()
					.collect(Collectors.toMap(UserGroup::getId, Function.identity()));
			Map<Integer, Integer> membershipMap = userInGroupRepository.findAllMemberships().stream()
					.collect(Collectors.toMap(UserInGroupRepository.UserMembershipProjection::getUserId,
							UserInGroupRepository.UserMembershipProjection::getGroupId));

			return userRepository.findByRoleOrderByCreatedAtDesc(Role.STUDENT).stream()
					.map(student -> toAdminStudentResponse(student, groupMap, membershipMap)).toList();
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}

	public Mono<UserResponse> createStudent(AdminCreateStudentRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			if (userRepository.existsByEmail(request.getEmail())) {
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			if (userRepository.existsByUsername(request.getUsername())) {
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}

			UserGroup group = null;
			if (request.getGroupId() != null) {
				group = userGroupRepository.findById(request.getGroupId())
						.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			}

			User student = User.builder().email(request.getEmail()).username(request.getUsername())
					.password(passwordEncoder.encode(request.getPassword())).role(Role.STUDENT).build();

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
		})).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<AdminStudentResponse> updateStudent(Integer id, AdminUpdateStudentRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			User student = userRepository.findById(id)
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			if (student.getRole() != Role.STUDENT) {
				throw new UserException(UserErrorCode.INVALID_STUDENT_ASSIGNMENT);
			}

			if (!student.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			if (!student.getUsername().equals(request.getUsername())
					&& userRepository.existsByUsername(request.getUsername())) {
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}

			UserGroup group = null;
			if (request.getGroupId() != null) {
				group = userGroupRepository.findById(request.getGroupId())
						.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			}

			student.setUsername(request.getUsername());
			student.setEmail(request.getEmail());
			User savedStudent = userRepository.save(student);

			userInGroupRepository.findByUserId(savedStudent.getId()).ifPresent(userInGroupRepository::delete);

			Integer finalGroupId = null;
			String finalGroupName = null;

			if (group != null) {
				userInGroupRepository
						.save(UserInGroup.builder().userId(savedStudent.getId()).groupId(group.getId()).build());
				finalGroupId = group.getId();
				finalGroupName = group.getName();
			}

			return AdminStudentResponse.builder().id(savedStudent.getId()).email(savedStudent.getEmail())
					.username(savedStudent.getUsername()).role(savedStudent.getRole()).groupId(finalGroupId)
					.groupName(finalGroupName).createdAt(savedStudent.getCreatedAt()).build();
		})).subscribeOn(Schedulers.boundedElastic());
	}

	private Flux<UserResponse> getUsersByRole(Role role) {
		return Mono
				.fromCallable(() -> userRepository.findByRoleOrderByCreatedAtDesc(role).stream()
						.map(userMapper::toUserResponse).toList())
				.subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}

	private AdminStudentResponse toAdminStudentResponse(User student, Map<Integer, UserGroup> groupMap,
			Map<Integer, Integer> membershipMap) {
		Integer groupId = membershipMap.get(student.getId());
		UserGroup group = groupId != null ? groupMap.get(groupId) : null;

		return AdminStudentResponse.builder().id(student.getId()).email(student.getEmail())
				.username(student.getUsername()).role(student.getRole()).groupId(groupId)
				.groupName(group != null ? group.getName() : null).createdAt(student.getCreatedAt()).build();
	}
}
