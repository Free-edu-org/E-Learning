package pl.freeedu.backend.task.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.ChooseTask;
import pl.freeedu.backend.task.model.ScatterTask;
import pl.freeedu.backend.task.model.SpeakTask;
import pl.freeedu.backend.task.model.UserAnswer;
import pl.freeedu.backend.task.model.UserLesson;
import pl.freeedu.backend.task.model.UserLessonStatus;
import pl.freeedu.backend.task.model.UserTaskAttentionEvent;
import pl.freeedu.backend.task.model.WriteTask;
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.UserAnswerRepository;
import pl.freeedu.backend.task.repository.UserTaskAttentionEventRepository;
import pl.freeedu.backend.task.repository.UserLessonRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LessonResultDetailsServiceTest {

	@Mock
	private ChooseTaskRepository chooseTaskRepository;
	@Mock
	private WriteTaskRepository writeTaskRepository;
	@Mock
	private ScatterTaskRepository scatterTaskRepository;
	@Mock
	private SpeakTaskRepository speakTaskRepository;
	@Mock
	private UserAnswerRepository userAnswerRepository;
	@Mock
	private UserLessonRepository userLessonRepository;
	@Mock
	private UserTaskAttentionEventRepository userTaskAttentionEventRepository;
	@Mock
	private LessonRepository lessonRepository;
	@Mock
	private UserRepository userRepository;

	private LessonResultDetailsService lessonResultDetailsService;

	@BeforeEach
	void setUp() {
		lessonResultDetailsService = new LessonResultDetailsService(chooseTaskRepository, writeTaskRepository,
				scatterTaskRepository, speakTaskRepository, userAnswerRepository, userLessonRepository,
				userTaskAttentionEventRepository, lessonRepository, userRepository);
	}

	@Test
	void shouldBuildDetailedLessonResultForAllTaskTypes() {
		// given
		Integer lessonId = 7;
		Integer userId = 13;
		LocalDateTime finishedAt = LocalDateTime.of(2026, 4, 25, 18, 30);

		when(lessonRepository.findById(lessonId))
				.thenReturn(Optional.of(Lesson.builder().id(lessonId).title("Past Simple").build()));
		when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).username("ania")
				.email("ania@example.com").password("x").role(Role.STUDENT).build()));
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId))
				.thenReturn(Optional.of(UserLesson.builder().userId(userId).lessonId(lessonId)
						.status(UserLessonStatus.COMPLETED).score(3).maxScore(4).finishedAt(finishedAt).build()));

		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(
				List.of(ChooseTask.builder().id(1).publicId("tp1").lessonId(lessonId).section("A").task("Choose task")
						.hint("Hint choose").possibleAnswers("cat|dog|bird").correctAnswer(1).build()));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(WriteTask.builder().id(2).publicId("tp2")
				.lessonId(lessonId).section("A").task("Write task").hint("Hint write").correctAnswer("hello").build()));
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(
				List.of(ScatterTask.builder().id(3).publicId("tp3").lessonId(lessonId).section("B").task("Scatter task")
						.hint("Hint scatter").words("I|am|here").correctAnswer("I am here").build()));
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(SpeakTask.builder().id(4).publicId("tp4")
				.lessonId(lessonId).section("B").hint("Hint speak").expectedText("good morning").build()));

		when(userAnswerRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of(
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(1).taskType("choose_tasks").answer("0")
						.isCorrect(false).build(),
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(2).taskType("write_tasks").answer("hello")
						.isCorrect(true).build(),
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(3).taskType("scatter_tasks")
						.answer("I am here").isCorrect(true).build(),
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(4).taskType("speak_tasks")
						.answer("good mourning").isCorrect(true).build()));
		when(userTaskAttentionEventRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of(
				UserTaskAttentionEvent.builder().userId(userId).lessonId(lessonId).taskId(3).taskType("scatter_tasks")
						.switchCount(2).build(),
				UserTaskAttentionEvent.builder().userId(userId).lessonId(lessonId).taskId(4).taskType("speak_tasks")
						.switchCount(1).build()));

		// when
		Mono<LessonResultDetailsResponse> result = lessonResultDetailsService.getCompletedLessonResult(lessonId,
				userId);

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertEquals("Past Simple", response.getLessonTitle());
			assertEquals("ania", response.getUsername());
			assertEquals(75.0, response.getResultPercent());
			assertEquals(4, response.getTasks().size());
			assertEquals("tp1", response.getTasks().get(0).getTaskPublicId());
			assertEquals("cat", response.getTasks().get(0).getUserAnswer());
			assertEquals("dog", response.getTasks().get(0).getCorrectAnswer());
			assertEquals("tp3", response.getTasks().get(2).getTaskPublicId());
			assertEquals("I|am|here", response.getTasks().get(2).getWords());
			assertEquals(2, response.getTasks().get(2).getTabSwitchCount());
			assertEquals("good mourning", response.getTasks().get(3).getUserAnswer());
			assertEquals(1, response.getTasks().get(3).getTabSwitchCount());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenCompletedResultIsMissing() {
		// given
		Integer lessonId = 7;
		Integer userId = 13;

		when(lessonRepository.findById(lessonId))
				.thenReturn(Optional.of(Lesson.builder().id(lessonId).title("Past Simple").build()));
		when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).username("ania")
				.email("ania@example.com").password("x").role(Role.STUDENT).build()));
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId))
				.thenReturn(Optional.of(UserLesson.builder().status(UserLessonStatus.IN_PROGRESS).build()));

		// when
		Mono<LessonResultDetailsResponse> result = lessonResultDetailsService.getCompletedLessonResult(lessonId,
				userId);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_RESULT_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldPreferLatestAnswerPerTaskWhenDuplicateAnswersExist() {
		// given
		Integer lessonId = 9;
		Integer userId = 21;

		when(lessonRepository.findById(lessonId))
				.thenReturn(Optional.of(Lesson.builder().id(lessonId).title("Duplicate answers").build()));
		when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).username("ela")
				.email("ela@example.com").password("x").role(Role.STUDENT).build()));
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(UserLesson.builder()
				.userId(userId).lessonId(lessonId).status(UserLessonStatus.COMPLETED).score(1).maxScore(1).build()));
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(ChooseTask.builder().id(15)
				.lessonId(lessonId).task("Choose latest").possibleAnswers("red|green|blue").correctAnswer(2).build()));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(userAnswerRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of(
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(15).taskType("choose_tasks").answer("0")
						.isCorrect(false).build(),
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(15).taskType("choose_tasks").answer("2")
						.isCorrect(true).build()));
		when(userTaskAttentionEventRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of());

		// when
		Mono<LessonResultDetailsResponse> result = lessonResultDetailsService.getCompletedLessonResult(lessonId,
				userId);

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertEquals(1, response.getTasks().size());
			assertEquals("blue", response.getTasks().getFirst().getUserAnswer());
			assertTrue(response.getTasks().getFirst().getIsCorrect());
		}).verifyComplete();
	}

	@Test
	void shouldReturnLessonNotFoundWhenLessonDoesNotExist() {
		// given
		Integer lessonId = 404;
		Integer userId = 13;

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.empty());

		// when
		Mono<LessonResultDetailsResponse> result = lessonResultDetailsService.getCompletedLessonResult(lessonId,
				userId);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
		verify(userRepository, never()).findById(userId);
	}

	@Test
	void shouldReturnLessonResultNotFoundWhenUserDoesNotExist() {
		// given
		Integer lessonId = 7;
		Integer userId = 404;

		when(lessonRepository.findById(lessonId))
				.thenReturn(Optional.of(Lesson.builder().id(lessonId).title("Past Simple").build()));
		when(userRepository.findById(userId)).thenReturn(Optional.empty());

		// when
		Mono<LessonResultDetailsResponse> result = lessonResultDetailsService.getCompletedLessonResult(lessonId,
				userId);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_RESULT_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
		verify(userLessonRepository, never()).findByUserIdAndLessonId(userId, lessonId);
	}

	@Test
	void shouldKeepOriginalChooseAnswerWhenIndexIsInvalidAndReturnZeroPercentForMissingMaxScore() {
		// given
		Integer lessonId = 11;
		Integer userId = 22;

		when(lessonRepository.findById(lessonId))
				.thenReturn(Optional.of(Lesson.builder().id(lessonId).title("Choose edge cases").build()));
		when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).username("ola")
				.email("ola@example.com").password("x").role(Role.STUDENT).build()));
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(UserLesson.builder()
				.userId(userId).lessonId(lessonId).status(UserLessonStatus.COMPLETED).score(2).maxScore(0).build()));
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(
				ChooseTask.builder().id(31).lessonId(lessonId).task("Blank answer").possibleAnswers("red|green")
						.correctAnswer(1).build(),
				ChooseTask.builder().id(32).lessonId(lessonId).task("Out of range").possibleAnswers("cat|dog")
						.correctAnswer(1).build(),
				ChooseTask.builder().id(33).lessonId(lessonId).task("Non numeric").possibleAnswers("sun|moon")
						.correctAnswer(0).build()));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(userAnswerRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of(
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(31).taskType("choose_tasks").answer(" ")
						.isCorrect(false).build(),
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(32).taskType("choose_tasks").answer("8")
						.isCorrect(false).build(),
				UserAnswer.builder().lessonId(lessonId).userId(userId).taskId(33).taskType("choose_tasks")
						.answer("green").isCorrect(false).build()));
		when(userTaskAttentionEventRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of());

		// when
		Mono<LessonResultDetailsResponse> result = lessonResultDetailsService.getCompletedLessonResult(lessonId,
				userId);

		// then
		StepVerifier.create(result).assertNext(response -> {
			assertEquals(0.0, response.getResultPercent());
			assertEquals(" ", response.getTasks().get(0).getUserAnswer());
			assertEquals("8", response.getTasks().get(1).getUserAnswer());
			assertEquals("green", response.getTasks().get(2).getUserAnswer());
			assertEquals("green", response.getTasks().get(0).getCorrectAnswer());
			assertEquals("dog", response.getTasks().get(1).getCorrectAnswer());
			assertEquals("sun", response.getTasks().get(2).getCorrectAnswer());
		}).verifyComplete();
	}
}
