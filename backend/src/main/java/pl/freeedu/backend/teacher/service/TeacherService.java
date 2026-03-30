package pl.freeedu.backend.teacher.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.repository.TeacherStatsRepository;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.user.service.UserMapper;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.service.UserGroupService;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import pl.freeedu.backend.teacher.dto.TeacherCreateStudentRequest;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import org.springframework.dao.DataIntegrityViolationException;
@Service
public class TeacherService {

	private final TeacherStatsRepository teacherStatsRepository;
	private final LessonRepository lessonRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final LessonMapper lessonMapper;
	private final SecurityService securityService;
	private final UserGroupService userGroupService;
	private final UserRepository userRepository;
	private final UserMapper userMapper;
	private final PasswordEncoder passwordEncoder;
	private final UserGroupRepository userGroupRepository;
	private final UserInGroupRepository userInGroupRepository;

	public TeacherService(TeacherStatsRepository teacherStatsRepository, LessonRepository lessonRepository,
			GroupHasLessonRepository groupHasLessonRepository, LessonMapper lessonMapper,
			SecurityService securityService, UserGroupService userGroupService, UserRepository userRepository,
			UserMapper userMapper, PasswordEncoder passwordEncoder, UserGroupRepository userGroupRepository,
			UserInGroupRepository userInGroupRepository) {
		this.teacherStatsRepository = teacherStatsRepository;
		this.lessonRepository = lessonRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.lessonMapper = lessonMapper;
		this.securityService = securityService;
		this.userGroupService = userGroupService;
		this.userRepository = userRepository;
		this.userMapper = userMapper;
		this.passwordEncoder = passwordEncoder;
		this.userGroupRepository = userGroupRepository;
		this.userInGroupRepository = userInGroupRepository;
	}

	public Mono<TeacherStatsResponse> getStats() {
		return securityService.getCurrentUserId()
				.flatMap(teacherId -> Mono
						.fromCallable(() -> TeacherStatsResponse.builder()
								.totalLessons(teacherStatsRepository.countTotalLessons(teacherId))
								.activeLessons(teacherStatsRepository.countActiveLessons(teacherId))
								.activeStudents(teacherStatsRepository.countActiveStudents(teacherId))
								.avgScore(teacherStatsRepository.calcAvgScore(teacherId)).build())
						.subscribeOn(Schedulers.boundedElastic()));
	}

	public Flux<LessonResponse> getLessons() {
		return securityService.getCurrentUserId().subscribeOn(Schedulers.boundedElastic())
				.flatMapMany(teacherId -> Flux.fromIterable(lessonRepository.findByTeacher_Id(teacherId)))
				.flatMap(lesson -> Mono.fromCallable(() -> {
					LessonResponse resp = lessonMapper.toResponse(lesson);
					resp.setGroups(groupHasLessonRepository.findGroupsForLesson(lesson.getId()));
					return resp;
				}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Flux<UserGroupResponse> getMyGroups() {
		return securityService.getCurrentUserId().subscribeOn(Schedulers.boundedElastic())
				.flatMapMany(userGroupService::getGroupsByTeacherId);
	}

	public Flux<UserResponse> getMyStudents() {
		return securityService.getCurrentUserId().flatMapMany(teacherId -> Mono.fromCallable(() -> {
			return userRepository.findByGroupsTeacherIdAndRole(teacherId, Role.STUDENT).stream()
					.map(userMapper::toUserResponse).toList();
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable));
	}

	public Mono<UserResponse> createStudent(Mono<TeacherCreateStudentRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
					if (userRepository.existsByEmail(request.getEmail())) {
						throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
					}
					if (userRepository.existsByUsername(request.getUsername())) {
						throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
					}

					UserGroup group = userGroupRepository.findById(request.getGroupId())
							.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));

					if (!teacherId.equals(group.getTeacherId())) {
						throw new UserGroupException(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP);
					}

					User student = User.builder().email(request.getEmail()).username(request.getUsername())
							.password(passwordEncoder.encode(request.getPassword())).role(Role.STUDENT).build();

					try {
						User savedStudent = userRepository.save(student);
						userInGroupRepository.save(
								UserInGroup.builder().userId(savedStudent.getId()).groupId(group.getId()).build());
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
				}).subscribeOn(Schedulers.boundedElastic())));
	}
}
