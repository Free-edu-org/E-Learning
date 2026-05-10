package pl.freeedu.backend.admin.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.accountinvitation.service.AccountActivationService;
import pl.freeedu.backend.admin.dto.AdminInviteTeacherRequest;
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
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.service.UserGroupPublicIdLookupService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AdminService {

	private final UserRepository userRepository;
	private final UserGroupRepository userGroupRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final TransactionTemplate transactionTemplate;
	private final UserGroupPublicIdLookupService userGroupPublicIdLookupService;

	private final AccountActivationService accountActivationService;

	public AdminService(UserRepository userRepository, UserGroupRepository userGroupRepository,
			UserInGroupRepository userInGroupRepository, UserMapper userMapper, PasswordEncoder passwordEncoder,
			TransactionTemplate transactionTemplate, UserGroupPublicIdLookupService userGroupPublicIdLookupService,
			AccountActivationService accountActivationService) {
		this.userRepository = userRepository;
		this.userGroupRepository = userGroupRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.transactionTemplate = transactionTemplate;
		this.userGroupPublicIdLookupService = userGroupPublicIdLookupService;
		this.accountActivationService = accountActivationService;
	}

	public Mono<AdminStatsResponse> getStats() {
		return Mono.fromCallable(() -> AdminStatsResponse.builder().totalUsers(userRepository.count())
				.totalAdmins(userRepository.countByRole(Role.ADMIN))
				.totalTeachers(userRepository.countByRole(Role.TEACHER))
				.totalStudents(userRepository.countByRole(Role.STUDENT)).totalGroups(userGroupRepository.count())
				.build()).subscribeOn(Schedulers.boundedElastic());
	}

	public Flux<pl.freeedu.backend.user.dto.UserResponse> getTeachers() {
		return getUsersByRole(Role.TEACHER);
	}

	public Mono<UserResponse> inviteTeacher(AdminInviteTeacherRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			log.info("Admin inviting new teacher account via email: '{}'", request.getEmail());
			if (userRepository.existsByEmail(request.getEmail())) {
				log.warn("Teacher invitation failed: Email already taken");
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}

			String plainToken = accountActivationService.createInvitedUser(request.getEmail(), Role.TEACHER);
			User savedTeacher = userRepository.findByEmail(request.getEmail())
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

			accountActivationService.sendInvitationEmail(savedTeacher.getEmail(), plainToken);
			log.info("Teacher invitation sent by admin. Teacher ID: {}", savedTeacher.getId());
			return userMapper.toUserResponse(savedTeacher);
		})).subscribeOn(Schedulers.boundedElastic());
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

	public Mono<AdminStudentResponse> createStudent(AdminCreateStudentRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			log.info("Admin inviting new student account via email: '{}'", request.getEmail());
			if (userRepository.existsByEmail(request.getEmail())) {
				log.warn("Student creation failed: Email already taken");
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}

			UserGroup group = null;
			if (request.getGroupPublicId() != null) {
				group = userGroupPublicIdLookupService.getRequiredGroup(request.getGroupPublicId());
			}

			String plainToken = accountActivationService.createInvitedUser(request.getEmail());
			User savedStudent = userRepository.findByEmail(request.getEmail())
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

			if (group != null) {
				log.debug("Linking invited student ID: {} to group ID: {}", savedStudent.getId(), group.getId());
				userInGroupRepository
						.save(UserInGroup.builder().userId(savedStudent.getId()).groupId(group.getId()).build());
			}

			accountActivationService.sendInvitationEmail(savedStudent.getEmail(), plainToken);
			log.info("Student invitation sent by admin. Student ID: {}", savedStudent.getId());

			final UserGroup finalGroup = group;
			return AdminStudentResponse.builder().publicId(savedStudent.getPublicId()).email(savedStudent.getEmail())
					.username(savedStudent.getUsername()).role(savedStudent.getRole()).status(savedStudent.getStatus())
					.groupPublicId(finalGroup != null ? finalGroup.getPublicId() : null)
					.groupName(finalGroup != null ? finalGroup.getName() : null).createdAt(savedStudent.getCreatedAt())
					.avatarUrl(savedStudent.getAvatarUrl()).build();
		})).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Void> resendInvite(Integer studentId) {
		return accountActivationService.resendInvite(studentId);
	}

	public Mono<AdminStudentResponse> updateStudent(Integer id, AdminUpdateStudentRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			log.info("Admin updating student ID: {}", id);
			User student = userRepository.findById(id).orElseThrow(() -> {
				log.warn("Student update failed: User with ID: {} not found", id);
				return new UserException(UserErrorCode.USER_NOT_FOUND);
			});
			if (student.getRole() != Role.STUDENT) {
				log.warn("Student update failed: User ID: {} is not a student (Role: {})", id, student.getRole());
				throw new UserException(UserErrorCode.INVALID_STUDENT_ASSIGNMENT);
			}

			if (!student.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
				log.warn("Student update failed: New email already taken");
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			if (!java.util.Objects.equals(student.getUsername(), request.getUsername()) && request.getUsername() != null
					&& userRepository.existsByUsername(request.getUsername())) {
				log.warn("Student update failed: New username already taken");
				throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
			}

			UserGroup group = null;
			if (request.getGroupPublicId() != null) {
				group = userGroupPublicIdLookupService.getRequiredGroup(request.getGroupPublicId());
			}

			student.setUsername(request.getUsername());
			student.setEmail(request.getEmail());
			User savedStudent = userRepository.save(student);

			UserInGroup existingMembership = userInGroupRepository.findByUserId(savedStudent.getId()).orElse(null);

			String finalGroupName = null;

			if (group == null) {
				if (existingMembership != null) {
					log.debug("Removing student ID: {} from group ID: {}", id, existingMembership.getGroupId());
					userInGroupRepository.delete(existingMembership);
				}
			} else {
				if (existingMembership == null) {
					log.debug("Adding student ID: {} to group ID: {}", id, group.getId());
					userInGroupRepository
							.save(UserInGroup.builder().userId(savedStudent.getId()).groupId(group.getId()).build());
				} else if (!group.getId().equals(existingMembership.getGroupId())) {
					log.debug("Changing student ID: {} group from {} to {}", id, existingMembership.getGroupId(),
							group.getId());
					existingMembership.setGroupId(group.getId());
					userInGroupRepository.save(existingMembership);
				}
				finalGroupName = group.getName();
			}

			log.info("Student ID: {} updated successfully by admin", id);
			return AdminStudentResponse.builder().publicId(savedStudent.getPublicId()).email(savedStudent.getEmail())
					.username(savedStudent.getUsername()).role(savedStudent.getRole())
					.groupPublicId(group != null ? group.getPublicId() : null).groupName(finalGroupName)
					.createdAt(savedStudent.getCreatedAt()).avatarUrl(savedStudent.getAvatarUrl()).build();
		})).subscribeOn(Schedulers.boundedElastic());
	}

	private Flux<pl.freeedu.backend.user.dto.UserResponse> getUsersByRole(Role role) {
		return Mono
				.fromCallable(() -> userRepository.findByRoleOrderByCreatedAtDesc(role).stream()
						.map(userMapper::toUserResponse).toList())
				.subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}

	private AdminStudentResponse toAdminStudentResponse(User student, Map<Integer, UserGroup> groupMap,
			Map<Integer, Integer> membershipMap) {
		Integer groupId = membershipMap.get(student.getId());
		UserGroup group = groupId != null ? groupMap.get(groupId) : null;

		return AdminStudentResponse.builder().publicId(student.getPublicId()).email(student.getEmail())
				.username(student.getUsername()).role(student.getRole()).status(student.getStatus())
				.groupPublicId(group != null ? group.getPublicId() : null)
				.groupName(group != null ? group.getName() : null).createdAt(student.getCreatedAt())
				.avatarUrl(student.getAvatarUrl()).build();
	}
}
