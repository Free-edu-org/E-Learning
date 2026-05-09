package pl.freeedu.backend.teacher.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import lombok.extern.slf4j.Slf4j;
import pl.freeedu.backend.lesson.dto.LessonAttachmentResponse;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.service.UserGroupService;
import org.springframework.security.crypto.password.PasswordEncoder;
import pl.freeedu.backend.lesson.service.LessonAttachmentService;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import pl.freeedu.backend.teacher.dto.TeacherCreateStudentRequest;
import pl.freeedu.backend.teacher.dto.LessonStatsResponse;
import pl.freeedu.backend.teacher.dto.LessonStatsStudentResult;
import pl.freeedu.backend.teacher.dto.TeacherStudentStatsResponse;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.student.repository.StudentProgressHistoryRepository;
import pl.freeedu.backend.task.repository.UserAnswerRepository;
import java.util.LinkedHashMap;
import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.service.LessonResultDetailsService;
import pl.freeedu.backend.accountinvitation.service.AccountActivationService;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationException;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.service.UserGroupPublicIdLookupService;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@Slf4j
@Service
public class TeacherService {

	private final TeacherStatsRepository teacherStatsRepository;
	private final LessonRepository lessonRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final LessonMapper lessonMapper;
	private final SecurityService securityService;
	private final UserGroupService userGroupService;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserInGroupRepository userInGroupRepository;
	private final TransactionTemplate transactionTemplate;
	private final LessonResultDetailsService lessonResultDetailsService;
	private final LessonAttachmentService lessonAttachmentService;
	private final UserGroupPublicIdLookupService userGroupPublicIdLookupService;
	private final StudentProgressHistoryRepository studentProgressHistoryRepository;
	private final UserAnswerRepository userAnswerRepository;

	private final AccountActivationService accountActivationService;

	public TeacherService(TeacherStatsRepository teacherStatsRepository, LessonRepository lessonRepository,
			GroupHasLessonRepository groupHasLessonRepository, LessonMapper lessonMapper,
			SecurityService securityService, UserGroupService userGroupService, UserRepository userRepository,
			PasswordEncoder passwordEncoder, UserInGroupRepository userInGroupRepository,
			TransactionTemplate transactionTemplate, LessonResultDetailsService lessonResultDetailsService,
			LessonAttachmentService lessonAttachmentService,
			UserGroupPublicIdLookupService userGroupPublicIdLookupService,
			StudentProgressHistoryRepository studentProgressHistoryRepository,
			UserAnswerRepository userAnswerRepository, AccountActivationService accountActivationService) {
		this.teacherStatsRepository = teacherStatsRepository;
		this.lessonRepository = lessonRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.lessonMapper = lessonMapper;
		this.securityService = securityService;
		this.userGroupService = userGroupService;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.userInGroupRepository = userInGroupRepository;
		this.transactionTemplate = transactionTemplate;
		this.lessonResultDetailsService = lessonResultDetailsService;
		this.lessonAttachmentService = lessonAttachmentService;
		this.userGroupPublicIdLookupService = userGroupPublicIdLookupService;
		this.studentProgressHistoryRepository = studentProgressHistoryRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.accountActivationService = accountActivationService;
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
				.flatMapMany(teacherId -> Mono.fromCallable(() -> {
					List<pl.freeedu.backend.lesson.model.Lesson> lessons = lessonRepository.findByTeacher_Id(teacherId);
					List<Integer> lessonIds = lessons.stream().map(pl.freeedu.backend.lesson.model.Lesson::getId)
							.collect(Collectors.toList());
					Map<Integer, List<LessonAttachmentResponse>> attachments = lessonAttachmentService
							.findByLessonIds(lessonIds);
					return lessons.stream().map(lesson -> {
						LessonResponse resp = lessonMapper.toResponse(lesson);
						resp.setGroups(groupHasLessonRepository.findGroupsForLesson(lesson.getId()));
						resp.setAttachments(attachments.getOrDefault(lesson.getId(), List.of()));
						return resp;
					}).collect(Collectors.toList());
				}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable));
	}

	public Flux<UserGroupResponse> getMyGroups() {
		return securityService.getCurrentUserId().subscribeOn(Schedulers.boundedElastic())
				.flatMapMany(userGroupService::getGroupsByTeacherId);
	}

	public Flux<TeacherStudentResponse> getMyStudents() {
		return securityService.getCurrentUserId().flatMapMany(teacherId -> Mono.fromCallable(() -> {
			return userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT).stream()
					.map(proj -> TeacherStudentResponse.builder().publicId(proj.getPublicId())
							.username(proj.getUsername()).email(proj.getEmail()).role(proj.getRole().name())
							.status(proj.getStatus()).createdAt(proj.getCreatedAt())
							.groupPublicId(proj.getGroupPublicId()).avatarUrl(proj.getAvatarUrl()).build())
					.toList();
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable));
	}

	public Mono<LessonStatsResponse> getLessonStats(Integer lessonId) {
		return securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
			pl.freeedu.backend.lesson.model.Lesson lesson = lessonRepository.findById(lessonId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
			if (!lesson.getTeacher().getId().equals(teacherId)) {
				throw new LessonException(LessonErrorCode.NOT_LESSON_OWNER);
			}
			java.util.List<LessonStatsStudentResult> results = teacherStatsRepository.getLessonStudentResults(lessonId,
					teacherId);
			double avgScore = results.stream().mapToDouble(LessonStatsStudentResult::getResultPercent).average()
					.orElse(0.0);
			double bestScore = results.stream().mapToDouble(LessonStatsStudentResult::getResultPercent).max()
					.orElse(0.0);
			return LessonStatsResponse.builder().avgScore(avgScore).studentsCompleted(results.size())
					.bestScore(bestScore).studentResults(results).build();
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<LessonResultDetailsResponse> getLessonResultDetails(Integer lessonId, Integer studentId) {
		return securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
			pl.freeedu.backend.lesson.model.Lesson lesson = lessonRepository.findById(lessonId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
			if (!lesson.getTeacher().getId().equals(teacherId)) {
				throw new LessonException(LessonErrorCode.NOT_LESSON_OWNER);
			}
			if (!userInGroupRepository.hasAccessToLesson(studentId, lessonId)) {
				throw new TaskException(TaskErrorCode.STUDENT_NO_ACCESS);
			}
			return studentId;
		}).subscribeOn(Schedulers.boundedElastic())).flatMap(
				validStudentId -> lessonResultDetailsService.getCompletedLessonResult(lessonId, validStudentId));
	}

	public Mono<TeacherStudentResponse> createStudent(Mono<TeacherCreateStudentRequest> requestMono) {
		return requestMono.flatMap(request -> securityService.getCurrentUserId()
				.flatMap(teacherId -> Mono.fromCallable(() -> transactionTemplate.execute(status -> {
					if (userRepository.existsByEmail(request.getEmail())) {
						throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
					}

					UserGroup group = userGroupPublicIdLookupService.getRequiredGroup(request.getGroupPublicId());

					if (!teacherId.equals(group.getTeacherId())) {
						throw new UserGroupException(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP);
					}

					String plainToken = accountActivationService.createInvitedUser(request.getEmail(), Role.STUDENT);
					User savedStudent = userRepository.findByEmail(request.getEmail())
							.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

					userInGroupRepository
							.save(UserInGroup.builder().userId(savedStudent.getId()).groupId(group.getId()).build());

					accountActivationService.sendInvitationEmail(savedStudent.getEmail(), plainToken);
					log.info("Student invited by teacher: student ID={}, group ID={}", savedStudent.getId(),
							group.getId());

					return TeacherStudentResponse.builder().publicId(savedStudent.getPublicId())
							.username(savedStudent.getUsername()).email(savedStudent.getEmail())
							.role(savedStudent.getRole().name()).status(savedStudent.getStatus())
							.createdAt(savedStudent.getCreatedAt()).groupPublicId(group.getPublicId())
							.avatarUrl(savedStudent.getAvatarUrl()).build();
				})).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<Void> resendInvite(Integer studentId) {
		return securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
			User student = userRepository.findById(studentId)
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			boolean isStudentsTeacher = userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT)
					.stream().anyMatch(u -> u.getPublicId().equals(student.getPublicId()));
			if (!isStudentsTeacher) {
				throw new org.springframework.security.access.AccessDeniedException("Missing ownership over student");
			}
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic())).then(accountActivationService.resendInvite(studentId));
	}

	public Mono<Void> cancelStudentInvitation(Integer studentId) {
		return securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
			User student = userRepository.findById(studentId)
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			boolean isStudentsTeacher = userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT)
					.stream().anyMatch(u -> u.getPublicId().equals(student.getPublicId()));
			if (!isStudentsTeacher) {
				throw new org.springframework.security.access.AccessDeniedException("Missing ownership over student");
			}
			if (student.getStatus() != UserStatus.INVITED) {
				throw new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_NOT_INVITED);
			}
			userRepository.delete(student);
			log.info("Teacher ID: {} cancelled invitation for student ID: {}", teacherId, studentId);
			return null;
		}).subscribeOn(Schedulers.boundedElastic()).then());
	}
	public Mono<TeacherStudentStatsResponse> getStudentStats(Integer studentId) {
		return securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
			log.info("Fetching student stats: studentId={}, teacherId={}", studentId, teacherId);
			User student = userRepository.findById(studentId)
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			String groupPublicId = userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT).stream()
					.filter(p -> p.getPublicId().equals(student.getPublicId()))
					.map(pl.freeedu.backend.teacher.dto.TeacherStudentProjection::getGroupPublicId).findFirst()
					.orElse(null);
			TeacherStudentResponse studentResponse = TeacherStudentResponse.builder().publicId(student.getPublicId())
					.username(student.getUsername()).email(student.getEmail()).role(student.getRole().name())
					.createdAt(student.getCreatedAt()).groupPublicId(groupPublicId).avatarUrl(student.getAvatarUrl())
					.build();
			long totalLessons = teacherStatsRepository.countStudentTotalLessons(studentId, teacherId);
			List<TeacherStudentStatsResponse.StudentLessonResult> lessonResults = teacherStatsRepository
					.getStudentLessonResults(studentId, teacherId);
			double avgScore = lessonResults.stream()
					.mapToDouble(TeacherStudentStatsResponse.StudentLessonResult::getResultPercent).average()
					.orElse(0.0);

			List<TeacherStudentStatsResponse.ProgressPoint> progressHistory = studentProgressHistoryRepository
					.findByUserIdOrderByProgressDateAsc(studentId).stream()
					.map(e -> TeacherStudentStatsResponse.ProgressPoint.builder().date(e.getProgressDate().toString())
							.progress(Math.round(e.getAvgScore())).build())
					.toList();

			java.util.Map<String, TeacherStudentStatsResponse.SkillStat> skillMap = new LinkedHashMap<>();
			skillMap.put("choose_tasks",
					TeacherStudentStatsResponse.SkillStat.builder().category("Wybór").correct(0).wrong(0).build());
			skillMap.put("write_tasks",
					TeacherStudentStatsResponse.SkillStat.builder().category("Pisanie").correct(0).wrong(0).build());
			skillMap.put("scatter_tasks",
					TeacherStudentStatsResponse.SkillStat.builder().category("Rozsypanka").correct(0).wrong(0).build());
			skillMap.put("speak_tasks",
					TeacherStudentStatsResponse.SkillStat.builder().category("Mówienie").correct(0).wrong(0).build());
			for (Object[] row : userAnswerRepository.getSkillBreakdownByUserId(studentId)) {
				TeacherStudentStatsResponse.SkillStat stat = skillMap.get((String) row[0]);
				if (stat != null) {
					stat.setCorrect(((Number) row[1]).intValue());
					stat.setWrong(((Number) row[2]).intValue());
				}
			}
			List<TeacherStudentStatsResponse.SkillStat> skillStats = List.copyOf(skillMap.values());

			log.info("Student stats ready: studentId={}, totalLessons={}, completedLessons={}", studentId, totalLessons,
					lessonResults.size());
			return TeacherStudentStatsResponse.builder().student(studentResponse).totalLessons((int) totalLessons)
					.completedLessons(lessonResults.size()).avgScore(avgScore).lessonResults(lessonResults)
					.progressHistory(progressHistory).skillStats(skillStats).build();
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<TeacherStudentResponse> updateStudent(Integer studentId,
			Mono<pl.freeedu.backend.teacher.dto.TeacherUpdateStudentRequest> requestMono) {
		return requestMono.flatMap(request -> securityService.getCurrentUserId()
				.flatMap(teacherId -> Mono.fromCallable(() -> transactionTemplate.execute(status -> {
					User student = userRepository.findById(studentId)
							.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

					// Teacher ownership check
					boolean isStudentsTeacher = userRepository.findStudentsWithGroupByTeacherId(teacherId, Role.STUDENT)
							.stream().anyMatch(u -> u.getPublicId().equals(student.getPublicId()));
					if (!isStudentsTeacher) {
						throw new org.springframework.security.access.AccessDeniedException(
								"Missing ownership over student");
					}

					UserGroup group = userGroupPublicIdLookupService.getRequiredGroup(request.getGroupPublicId());

					if (!teacherId.equals(group.getTeacherId())) {
						throw new UserGroupException(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP);
					}

					if (!student.getEmail().equals(request.getEmail())
							&& userRepository.existsByEmail(request.getEmail())) {
						throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
					}
					if (!java.util.Objects.equals(student.getUsername(), request.getUsername())
							&& request.getUsername() != null
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

						return TeacherStudentResponse.builder().publicId(savedStudent.getPublicId())
								.username(savedStudent.getUsername()).email(savedStudent.getEmail())
								.role(savedStudent.getRole().name()).createdAt(savedStudent.getCreatedAt())
								.groupPublicId(group.getPublicId()).avatarUrl(savedStudent.getAvatarUrl()).build();
					} catch (DataIntegrityViolationException ex) {
						if (!originalEmail.equals(request.getEmail())
								&& userRepository.existsByEmail(request.getEmail())) {
							throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
						}
						if (!java.util.Objects.equals(originalUsername, request.getUsername())
								&& request.getUsername() != null
								&& userRepository.existsByUsername(request.getUsername())) {
							throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
						}
						throw ex;
					}
				})).subscribeOn(Schedulers.boundedElastic())));
	}
}
