package pl.freeedu.backend.teacher.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.lesson.service.LessonAttachmentService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.service.LessonResultDetailsService;
import pl.freeedu.backend.teacher.dto.*;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.teacher.repository.TeacherStatsRepository;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.user.service.UserMapper;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import pl.freeedu.backend.usergroup.service.UserGroupService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherServiceTest {

	@Mock
	private TeacherStatsRepository teacherStatsRepository;
	@Mock
	private LessonRepository lessonRepository;
	@Mock
	private GroupHasLessonRepository groupHasLessonRepository;
	@Mock
	private LessonMapper lessonMapper;
	@Mock
	private SecurityService securityService;
	@Mock
	private UserGroupService userGroupService;
	@Mock
	private UserRepository userRepository;
	@Mock
	private UserMapper userMapper;
	@Mock
	private PasswordEncoder passwordEncoder;
	@Mock
	private UserGroupRepository userGroupRepository;
	@Mock
	private UserInGroupRepository userInGroupRepository;
	@Mock
	private TransactionTemplate transactionTemplate;
	@Mock
	private LessonResultDetailsService lessonResultDetailsService;

	@Mock
	private LessonAttachmentService lessonAttachmentService;

	@InjectMocks
	private TeacherService teacherService;

	@BeforeEach
	void setUp() {
		lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
	}

	@Test
	void shouldGetStats() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(teacherStatsRepository.countTotalLessons(10)).thenReturn(5L);
		when(teacherStatsRepository.countActiveLessons(10)).thenReturn(2L);
		when(teacherStatsRepository.countActiveStudents(10)).thenReturn(20L);
		when(teacherStatsRepository.calcAvgScore(10)).thenReturn(85.0);

		// when
		Mono<TeacherStatsResponse> result = teacherService.getStats();

		// then
		StepVerifier.create(result).assertNext(stats -> {
			assertEquals(5, stats.getTotalLessons());
			assertEquals(85.0, stats.getAvgScore());
		}).verifyComplete();
	}

	@Test
	void shouldGetLessons() {
		// given
		User teacher = User.builder().id(10).build();
		Lesson lesson = Lesson.builder().id(1).teacher(teacher).build();
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findByTeacher_Id(10)).thenReturn(List.of(lesson));
		when(lessonMapper.toResponse(lesson))
				.thenReturn(LessonResponse.builder().id(1).teacherAvatarUrl("preset:avatar_1").build());

		// when
		Flux<LessonResponse> result = teacherService.getLessons();

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(1, resp.getId());
			assertEquals("preset:avatar_1", resp.getTeacherAvatarUrl());
		}).verifyComplete();
	}

	@Test
	void shouldCreateStudentSucceed() {
		// given
		TeacherCreateStudentRequest req = TeacherCreateStudentRequest.builder().email("s@e.com").username("s")
				.password("p").groupId(5).build();
		UserGroup group = UserGroup.builder().id(5).teacherId(10).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(userRepository.existsByEmail(any())).thenReturn(false);
		when(userRepository.existsByUsername(any())).thenReturn(false);
		when(userGroupRepository.findById(5)).thenReturn(Optional.of(group));
		when(passwordEncoder.encode("p")).thenReturn("enc");
		when(userRepository.save(any())).thenAnswer(inv -> {
			User u = inv.getArgument(0);
			u.setId(1);
			return u;
		});

		// when
		Mono<TeacherStudentResponse> result = teacherService.createStudent(Mono.just(req));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(1, resp.getId());
			assertEquals("s", resp.getUsername());
			verify(userInGroupRepository).save(any());
		}).verifyComplete();
	}

	@Test
	void shouldHandleDataIntegrityViolationOnCreate() {
		// given
		TeacherCreateStudentRequest req = TeacherCreateStudentRequest.builder().email("s@e.com").username("s")
				.groupId(5).build();
		UserGroup group = UserGroup.builder().id(5).teacherId(10).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(userGroupRepository.findById(5)).thenReturn(Optional.of(group));
		when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("Duplicate"));

		// First call returns false (pass through), second call (in catch) returns true
		when(userRepository.existsByEmail("s@e.com")).thenReturn(false, true);
		when(userRepository.existsByUsername("s")).thenReturn(false);

		// when
		Mono<TeacherStudentResponse> result = teacherService.createStudent(Mono.just(req));

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertEquals(UserErrorCode.EMAIL_ALREADY_TAKEN, ((UserException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldUpdateStudentSucceed() {
		// given
		TeacherUpdateStudentRequest req = TeacherUpdateStudentRequest.builder().email("n@e.com").username("n")
				.groupId(5).build();
		User student = User.builder().id(1).email("o@e.com").username("o").role(Role.STUDENT).build();
		UserGroup group = UserGroup.builder().id(5).teacherId(10).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(userRepository.findById(1)).thenReturn(Optional.of(student));
		TeacherStudentProjection proj = mock(TeacherStudentProjection.class);
		when(proj.getId()).thenReturn(1);
		when(userRepository.findStudentsWithGroupByTeacherId(10, Role.STUDENT)).thenReturn(List.of(proj));

		when(userGroupRepository.findById(5)).thenReturn(Optional.of(group));
		when(userRepository.existsByEmail("n@e.com")).thenReturn(false);
		when(userRepository.existsByUsername("n")).thenReturn(false);
		when(userRepository.save(any())).thenReturn(student);
		when(userInGroupRepository.findByUserId(1)).thenReturn(Optional.empty());

		// when
		Mono<TeacherStudentResponse> result = teacherService.updateStudent(1, Mono.just(req));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("n", resp.getUsername());
		}).verifyComplete();
	}

	@Test
	void shouldRejectUpdateWhenNotStudentsTeacher() {
		// given
		TeacherUpdateStudentRequest req = TeacherUpdateStudentRequest.builder().build();
		User student = User.builder().id(1).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(userRepository.findById(1)).thenReturn(Optional.of(student));
		when(userRepository.findStudentsWithGroupByTeacherId(10, Role.STUDENT)).thenReturn(Collections.emptyList());

		// when
		Mono<TeacherStudentResponse> result = teacherService.updateStudent(1, Mono.just(req));

		// then
		StepVerifier.create(result).expectError(AccessDeniedException.class).verify();
	}

	@Test
	void shouldGetMyGroups() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		UserGroupResponse group = UserGroupResponse.builder().id(5).name("G1").build();
		when(userGroupService.getGroupsByTeacherId(10)).thenReturn(Flux.just(group));

		// when
		Flux<UserGroupResponse> groups = teacherService.getMyGroups();

		// then
		StepVerifier.create(groups).assertNext(g -> {
			assertEquals(5, g.getId());
			assertEquals("G1", g.getName());
		}).verifyComplete();
	}

	@Test
	void shouldGetMyStudents() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		TeacherStudentProjection proj = mock(TeacherStudentProjection.class);
		when(proj.getId()).thenReturn(1);
		when(proj.getUsername()).thenReturn("s1");
		when(proj.getEmail()).thenReturn("s1@e.com");
		when(proj.getRole()).thenReturn(Role.STUDENT);
		when(proj.getCreatedAt()).thenReturn(null);
		when(proj.getGroupId()).thenReturn(5);
		when(proj.getAvatarUrl()).thenReturn("preset:avatar_3");
		when(userRepository.findStudentsWithGroupByTeacherId(10, Role.STUDENT)).thenReturn(List.of(proj));

		// when
		Flux<TeacherStudentResponse> students = teacherService.getMyStudents();

		// then
		StepVerifier.create(students).assertNext(s -> {
			assertEquals(1, s.getId());
			assertEquals("s1", s.getUsername());
			assertEquals("preset:avatar_3", s.getAvatarUrl());
		}).verifyComplete();
	}

	@Test
	void shouldGetDetailedLessonResultForStudent() {
		// given
		User teacher = User.builder().id(10).build();
		Lesson lesson = Lesson.builder().id(3).teacher(teacher).build();
		LessonResultDetailsResponse details = LessonResultDetailsResponse.builder().lessonId(3).userId(21).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findById(3)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(21, 3)).thenReturn(true);
		when(lessonResultDetailsService.getCompletedLessonResult(3, 21)).thenReturn(Mono.just(details));

		// when
		Mono<LessonResultDetailsResponse> result = teacherService.getLessonResultDetails(3, 21);

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertEquals(3, response.getLessonId());
			assertEquals(21, response.getUserId());
		}).verifyComplete();
	}

	@Test
	void shouldRejectDetailedLessonResultWhenStudentHasNoLessonAccess() {
		// given
		User teacher = User.builder().id(10).build();
		Lesson lesson = Lesson.builder().id(3).teacher(teacher).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findById(3)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(21, 3)).thenReturn(false);

		// when
		Mono<LessonResultDetailsResponse> result = teacherService.getLessonResultDetails(3, 21);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.STUDENT_NO_ACCESS, ((TaskException) error).getErrorCode());
		}).verify();
		verify(lessonResultDetailsService, never()).getCompletedLessonResult(anyInt(), anyInt());
	}

	@Test
	void shouldRejectDetailedLessonResultWhenLessonDoesNotExist() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findById(3)).thenReturn(Optional.empty());

		// when
		Mono<LessonResultDetailsResponse> result = teacherService.getLessonResultDetails(3, 21);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof LessonException);
			assertEquals(LessonErrorCode.LESSON_NOT_FOUND, ((LessonException) error).getErrorCode());
		}).verify();
		verify(userInGroupRepository, never()).hasAccessToLesson(anyInt(), anyInt());
		verify(lessonResultDetailsService, never()).getCompletedLessonResult(anyInt(), anyInt());
	}

	@Test
	void shouldRejectDetailedLessonResultWhenTeacherIsNotLessonOwner() {
		// given
		User otherTeacher = User.builder().id(99).build();
		Lesson lesson = Lesson.builder().id(3).teacher(otherTeacher).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findById(3)).thenReturn(Optional.of(lesson));

		// when
		Mono<LessonResultDetailsResponse> result = teacherService.getLessonResultDetails(3, 21);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof LessonException);
			assertEquals(LessonErrorCode.NOT_LESSON_OWNER, ((LessonException) error).getErrorCode());
		}).verify();
		verify(userInGroupRepository, never()).hasAccessToLesson(anyInt(), anyInt());
		verify(lessonResultDetailsService, never()).getCompletedLessonResult(anyInt(), anyInt());
	}
}
