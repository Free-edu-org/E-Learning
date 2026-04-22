package pl.freeedu.backend.teacher.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.dto.TeacherStudentResponse;
import pl.freeedu.backend.teacher.repository.TeacherStatsRepository;
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
import pl.freeedu.backend.teacher.dto.LessonStatsResponse;
import pl.freeedu.backend.teacher.dto.LessonStatsStudentResult;
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
	private final TransactionTemplate transactionTemplate;

	public TeacherService(TeacherStatsRepository teacherStatsRepository, LessonRepository lessonRepository,
			GroupHasLessonRepository groupHasLessonRepository, LessonMapper lessonMapper,
			SecurityService securityService, UserGroupService userGroupService, UserRepository userRepository,
			UserMapper userMapper, PasswordEncoder passwordEncoder, UserGroupRepository userGroupRepository,
			UserInGroupRepository userInGroupRepository, TransactionTemplate transactionTemplate) {
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
		this.transactionTemplate = transactionTemplate;
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

	public Flux<TeacherStudentResponse> getMyStudents() {
		return securityService.getCurrentUserId().flatMapMany(teacherId -> Mono.fromCallable(() -> {
			return userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT).stream()
					.map(proj -> TeacherStudentResponse.builder().id(proj.getId()).username(proj.getUsername())
							.email(proj.getEmail()).role(proj.getRole().name()).createdAt(proj.getCreatedAt())
							.groupId(proj.getGroupId()).build())
					.toList();
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable));
	}

	public Mono<LessonStatsResponse> getLessonStats(Integer lessonId) {
		return Mono.fromCallable(() -> {
			java.util.List<LessonStatsStudentResult> results = teacherStatsRepository.getLessonStudentResults(lessonId);
			double avgScore = results.stream().mapToDouble(LessonStatsStudentResult::getResultPercent).average()
					.orElse(0.0);
			double bestScore = results.stream().mapToDouble(LessonStatsStudentResult::getResultPercent).max()
					.orElse(0.0);
			return LessonStatsResponse.builder().avgScore(avgScore).studentsCompleted(results.size())
					.bestScore(bestScore).studentResults(results).build();
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<TeacherStudentResponse> createStudent(Mono<TeacherCreateStudentRequest> requestMono) {
		return requestMono.flatMap(request -> securityService.getCurrentUserId()
				.flatMap(teacherId -> Mono.fromCallable(() -> transactionTemplate.execute(status -> {
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
						return TeacherStudentResponse.builder().id(savedStudent.getId())
								.username(savedStudent.getUsername()).email(savedStudent.getEmail())
								.role(savedStudent.getRole().name()).createdAt(savedStudent.getCreatedAt())
								.groupId(group.getId()).build();
					} catch (DataIntegrityViolationException ex) {
						if (userRepository.existsByEmail(request.getEmail())) {
							throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
						}
						if (userRepository.existsByUsername(request.getUsername())) {
							throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
						}
						throw ex;
					}
				})).subscribeOn(Schedulers.boundedElastic())));
	}
	public Mono<TeacherStudentResponse> updateStudent(Integer studentId,
			Mono<pl.freeedu.backend.teacher.dto.TeacherUpdateStudentRequest> requestMono) {
		return requestMono.flatMap(request -> securityService.getCurrentUserId()
				.flatMap(teacherId -> Mono.fromCallable(() -> transactionTemplate.execute(status -> {
					User student = userRepository.findById(studentId)
							.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

					// Teacher ownership check
					boolean isStudentsTeacher = userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT)
							.stream().anyMatch(u -> u.getId().equals(studentId));
					if (!isStudentsTeacher) {
						throw new org.springframework.security.access.AccessDeniedException(
								"Missing ownership over student");
					}

					UserGroup group = userGroupRepository.findById(request.getGroupId())
							.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));

					if (!teacherId.equals(group.getTeacherId())) {
						throw new UserGroupException(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP);
					}

					if (!student.getEmail().equals(request.getEmail())
							&& userRepository.existsByEmail(request.getEmail())) {
						throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
					}
					if (!student.getUsername().equals(request.getUsername())
							&& userRepository.existsByUsername(request.getUsername())) {
						throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
					}

					String originalEmail = student.getEmail();
					String originalUsername = student.getUsername();
					student.setEmail(request.getEmail());
					student.setUsername(request.getUsername());

					try {
						User savedStudent = userRepository.save(student);

						UserInGroup membership = userInGroupRepository.findByUserId(savedStudent.getId())
								.orElseGet(() -> UserInGroup.builder().userId(savedStudent.getId()).build());
						membership.setGroupId(group.getId());
						userInGroupRepository.save(membership);

						return TeacherStudentResponse.builder().id(savedStudent.getId())
								.username(savedStudent.getUsername()).email(savedStudent.getEmail())
								.role(savedStudent.getRole().name()).createdAt(savedStudent.getCreatedAt())
								.groupId(group.getId()).build();
					} catch (DataIntegrityViolationException ex) {
						if (!originalEmail.equals(request.getEmail())
								&& userRepository.existsByEmail(request.getEmail())) {
							throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
						}
						if (!originalUsername.equals(request.getUsername())
								&& userRepository.existsByUsername(request.getUsername())) {
							throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
						}
						throw ex;
					}
				})).subscribeOn(Schedulers.boundedElastic())));
	}
}
