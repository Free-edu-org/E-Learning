package pl.freeedu.backend.student.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.lesson.dto.GroupDto;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.lesson.service.LessonAttachmentService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.dto.StudentLessonResponse;
import pl.freeedu.backend.student.dto.StudentProgressResponse;
import pl.freeedu.backend.student.dto.StudentStatsResponse;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.UserLesson;
import pl.freeedu.backend.task.model.UserLessonStatus;
import pl.freeedu.backend.task.repository.UserLessonRepository;
import pl.freeedu.backend.task.service.LessonResultDetailsService;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

	@Mock
	private SecurityService securityService;
	@Mock
	private UserInGroupRepository userInGroupRepository;
	@Mock
	private GroupHasLessonRepository groupHasLessonRepository;
	@Mock
	private LessonRepository lessonRepository;
	@Mock
	private UserLessonRepository userLessonRepository;
	@Mock
	private LessonMapper lessonMapper;
	@Mock
	private LessonResultDetailsService lessonResultDetailsService;

	@Mock
	private LessonAttachmentService lessonAttachmentService;

	@Mock
	private UserGroupRepository userGroupRepository;

	@InjectMocks
	private StudentService studentService;

	@Test
	void shouldReturnEmptyProgressWhenNoGroup() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(userInGroupRepository.findByUserId(10)).thenReturn(Optional.empty());

		// when
		Mono<StudentProgressResponse> result = studentService.getProgress();

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertTrue(resp.getSummary().contains("Nie masz jeszcze przypisanej grupy"));
			assertEquals(0, resp.getTotalLessons());
		}).verifyComplete();
	}

	@Test
	void shouldGetLessonsSuccessfully() {
		// given
		Integer userId = 10;
		Integer groupId = 5;
		Lesson lesson = Lesson.builder().id(1).title("L1").createdAt(LocalDateTime.now()).build();
		UserInGroup membership = UserInGroup.builder().userId(userId).groupId(groupId).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(userInGroupRepository.findByUserId(userId)).thenReturn(Optional.of(membership));
		when(userGroupRepository.findById(groupId))
				.thenReturn(Optional.of(UserGroup.builder().id(groupId).publicId("group-public-id").build()));
		when(groupHasLessonRepository.findLessonIdsByGroupId(groupId)).thenReturn(List.of(1));
		when(lessonRepository.findByIdIn(List.of(1))).thenReturn(List.of(lesson));
		when(userLessonRepository.findByUserIdAndLessonIdIn(eq(userId), any())).thenReturn(List.of());
		when(lessonMapper.toResponse(lesson))
				.thenReturn(LessonResponse.builder().publicId("lesson-1").title("L1").build());
		when(groupHasLessonRepository.findGroupsForLesson(1))
				.thenReturn(List.of(new GroupDto("group-public-id", "G1")));

		// when
		Flux<StudentLessonResponse> result = studentService.getLessons();

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("lesson-1", resp.getPublicId());
			assertEquals("NOT_STARTED", resp.getStatus());
		}).verifyComplete();
	}

	@Test
	void shouldCalculateStatsCorrectly() {
		// given
		Integer userId = 10;
		Integer groupId = 5;
		Lesson l1 = Lesson.builder().id(1).createdAt(LocalDateTime.now().minusDays(1)).build();
		Lesson l2 = Lesson.builder().id(2).createdAt(LocalDateTime.now()).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(userInGroupRepository.findByUserId(userId))
				.thenReturn(Optional.of(UserInGroup.builder().groupId(groupId).build()));
		when(userGroupRepository.findById(groupId))
				.thenReturn(Optional.of(UserGroup.builder().id(groupId).publicId("group-public-id").build()));
		when(groupHasLessonRepository.findLessonIdsByGroupId(groupId)).thenReturn(List.of(1, 2));
		when(lessonRepository.findByIdIn(any())).thenReturn(List.of(l1, l2));

		when(userLessonRepository.findByUserIdAndLessonIdIn(eq(userId), any())).thenReturn(List.of(
				UserLesson.builder().lessonId(1).status(UserLessonStatus.COMPLETED).score(10).maxScore(10).build(),
				UserLesson.builder().lessonId(2).status(UserLessonStatus.IN_PROGRESS).build()));

		when(lessonMapper.toResponse(l1)).thenReturn(LessonResponse.builder().publicId("lesson-1").build());
		when(lessonMapper.toResponse(l2)).thenReturn(LessonResponse.builder().publicId("lesson-2").build());

		// when
		Mono<StudentStatsResponse> result = studentService.getStats();

		// then
		StepVerifier.create(result).assertNext(stats -> {
			assertEquals(2, stats.getTotalLessons());
			assertEquals(1, stats.getCompletedLessons());
			assertEquals(1, stats.getInProgressLessons());
			assertEquals(100.0, stats.getAverageScore());
		}).verifyComplete();
	}

	@Test
	void shouldHandleMultipleSummaryScenarios() {
		// given
		// Case 1: No lessons
		String res1 = invokeBuildSummary(0, 0, 0);

		// Case 2: Assigned lessons but none started
		String res2 = invokeBuildSummary(2, 0, 0);

		// Case 3: In progress, none completed
		String res3 = invokeBuildSummary(2, 0, 1);

		// Case 4: Some completed
		String res4 = invokeBuildSummary(2, 1, 0);

		// when
		// (Aggregation of results above for various scenarios)

		// then
		assertEquals("Nie masz jeszcze przypisanych lekcji.", res1);
		assertEquals("Masz przypisane 2 lekcje. Rozpocznij pierwsza, aby zaczac budowac historie wynikow.", res2);
		assertEquals("Masz 1 rozpoczete lekcje. Dokoncz je, aby zobaczyc pierwszy wynik procentowy.", res3);
		assertTrue(res4.contains("Ukonczono 1 z 2 lekcji"));
	}

	@Test
	void shouldHandlePercentEdgeCases() {
		// given
		// Private method toPercent via dashboard builder logic
		// We'll test this via getStats with specific scores
		Integer userId = 10;
		Integer groupId = 5;
		Lesson l1 = Lesson.builder().id(1).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(userInGroupRepository.findByUserId(userId))
				.thenReturn(Optional.of(UserInGroup.builder().groupId(groupId).build()));
		when(userGroupRepository.findById(groupId))
				.thenReturn(Optional.of(UserGroup.builder().id(groupId).publicId("group-public-id").build()));
		when(groupHasLessonRepository.findLessonIdsByGroupId(groupId)).thenReturn(List.of(1));
		when(lessonRepository.findByIdIn(any())).thenReturn(List.of(l1));
		when(lessonMapper.toResponse(any())).thenReturn(LessonResponse.builder().publicId("lesson-1").build());

		// Score 0/0 -> null percent
		when(userLessonRepository.findByUserIdAndLessonIdIn(anyInt(), any())).thenReturn(List
				.of(UserLesson.builder().lessonId(1).status(UserLessonStatus.COMPLETED).score(10).maxScore(0).build()));

		// when
		Mono<StudentStatsResponse> result = studentService.getStats();

		// then
		StepVerifier.create(result).assertNext(stats -> {
			assertEquals(0.0, stats.getAverageScore());
		}).verifyComplete();
	}

	private String invokeBuildSummary(int total, int completed, int inProgress) {
		// Accessing private method via reflection or just testing it indirectly
		// Since buildSummary is private, we'll use a trick or just trust the branching
		// logic coverage
		// Actually, I'll just rely on stats test if I can reach all branches.
		// But let's use ReflectionTestUtils for precise branch testing
		return (String) org.springframework.test.util.ReflectionTestUtils.invokeMethod(studentService, "buildSummary",
				total, completed, inProgress, 80.0);
	}

	@Test
	void shouldGetDetailedLessonResultForCurrentStudent() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findById(5)).thenReturn(Optional.of(Lesson.builder().id(5).build()));
		when(userInGroupRepository.hasAccessToLesson(10, 5)).thenReturn(true);
		when(lessonResultDetailsService.getCompletedLessonResult(5, 10)).thenReturn(Mono.just(
				LessonResultDetailsResponse.builder().lessonPublicId("lesson-5").userPublicId("student-10").build()));

		// when
		Mono<LessonResultDetailsResponse> result = studentService.getLessonResultDetails(5);

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertEquals("lesson-5", response.getLessonPublicId());
			assertEquals("student-10", response.getUserPublicId());
		}).verifyComplete();
	}

	@Test
	void shouldRejectDetailedLessonResultWhenStudentHasNoAccess() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.findById(5)).thenReturn(Optional.of(Lesson.builder().id(5).build()));
		when(userInGroupRepository.hasAccessToLesson(10, 5)).thenReturn(false);

		// when
		Mono<LessonResultDetailsResponse> result = studentService.getLessonResultDetails(5);

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
		when(lessonRepository.findById(5)).thenReturn(Optional.empty());

		// when
		Mono<LessonResultDetailsResponse> result = studentService.getLessonResultDetails(5);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
		verify(userInGroupRepository, never()).hasAccessToLesson(anyInt(), anyInt());
		verify(lessonResultDetailsService, never()).getCompletedLessonResult(anyInt(), anyInt());
	}
}
