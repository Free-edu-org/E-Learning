package pl.freeedu.backend.task.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.achievement.event.StudentStatsChangedEvent;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.repository.StudentProgressHistoryRepository;
import pl.freeedu.backend.student.service.PointService;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.*;
import pl.freeedu.backend.task.repository.*;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

	@Mock
	private ChooseTaskRepository chooseTaskRepository;
	@Mock
	private WriteTaskRepository writeTaskRepository;
	@Mock
	private ScatterTaskRepository scatterTaskRepository;
	@Mock
	private SpeakTaskRepository speakTaskRepository;
	@Mock
	private SpeakAttemptRepository speakAttemptRepository;
	@Mock
	private UserAnswerRepository userAnswerRepository;
	@Mock
	private UserLessonRepository userLessonRepository;
	@Mock
	private LessonRepository lessonRepository;
	@Mock
	private SecurityService securityService;
	@Mock
	private UserInGroupRepository userInGroupRepository;
	@Mock
	private SttClient sttClient;
	@Mock
	private TaskPublicIdLookupService taskPublicIdLookupService;
	@Mock
	private TaskHintImageService taskHintImageService;
	@Mock
	private StudentProgressHistoryRepository studentProgressHistoryRepository;
	@Mock
	private UserTaskAttentionEventRepository userTaskAttentionEventRepository;
	@Mock
	private PointService pointsService;
	@Mock
	private TransactionTemplate transactionTemplate;
	@Mock
	private ApplicationEventPublisher applicationEventPublisher;

	private TaskService taskService;
	private SimpleMeterRegistry meterRegistry;

	@BeforeEach
	void setUp() {
		meterRegistry = new SimpleMeterRegistry();
		taskService = new TaskService(chooseTaskRepository, writeTaskRepository, scatterTaskRepository,
				speakTaskRepository, speakAttemptRepository, userAnswerRepository, userLessonRepository,
				lessonRepository, securityService, userInGroupRepository, sttClient, taskPublicIdLookupService,
				taskHintImageService, studentProgressHistoryRepository, userTaskAttentionEventRepository, pointsService,
				transactionTemplate, applicationEventPublisher, meterRegistry, 0.85);
		lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(null);
		});
	}

	@Test
	void shouldGetLessonTasksForStudentWithAccess() {
		// given
		Integer lessonId = 1;
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(lessonId).publicId("lesson-1").isActive(true).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(student.getId(), lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(student.getId(), lessonId)).thenReturn(Optional.empty());

		ChooseTask chooseTask = ChooseTask.builder().id(1).lessonId(lessonId).correctAnswers("[1]").build();
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(chooseTask));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("lesson-1", resp.getLessonPublicId());
			assertEquals("IN_PROGRESS", resp.getStatus());
			assertNull(resp.getSections().get(0).getChooseTasks().get(0).getCorrectAnswers()); // stripped for student
			verify(userLessonRepository).save(any());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenLessonNotFoundInGetLessonTasks() {
		// given
		when(securityService.getCurrentUser()).thenReturn(Mono.just(new CustomUserDetails(1, "u", "p", Role.ADMIN)));
		when(lessonRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldReturnErrorWhenStudentHasNoAccessInGetLessonTasks() {
		// given
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(1).isActive(true).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(10, 1)).thenReturn(false);

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.STUDENT_NO_ACCESS, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldReturnErrorWhenLessonAlreadyCompletedInGetLessonTasks() {
		// given
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(1).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().status(UserLessonStatus.COMPLETED).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(10, 1)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(10, 1)).thenReturn(Optional.of(userLesson));

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_ALREADY_COMPLETED, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldReturnErrorWhenLessonNotActiveInGetLessonTasks() {
		// given
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(1).isActive(false).build();
		UserLesson userLesson = UserLesson.builder().status(UserLessonStatus.IN_PROGRESS).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(10, 1)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(10, 1)).thenReturn(Optional.of(userLesson));

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_NOT_ACTIVE, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldReturnErrorWhenLessonNotActiveAndNoPreviousProgressInGetLessonTasks() {
		// given
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(1).isActive(false).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(10, 1)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(10, 1)).thenReturn(Optional.empty());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(1);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.LESSON_NOT_ACTIVE, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldShowAnswersForTeacher() {
		// given
		Integer lessonId = 1;
		CustomUserDetails teacher = new CustomUserDetails(10, "teacher", "pass", Role.TEACHER);
		Lesson lesson = Lesson.builder().id(lessonId).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(teacher));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

		ChooseTask chooseTask = ChooseTask.builder().id(1).publicId("task-1").lessonId(lessonId).correctAnswers("[1]")
				.build();
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(chooseTask));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(1, resp.getSections().get(0).getChooseTasks().get(0).getCorrectAnswers().get(0)); // visible
																											// for
			// teacher
		}).verifyComplete();
	}

	@Test
	void shouldCreateChooseTask() {
		// given
		Integer lessonId = 1;
		ChooseTaskRequest request = ChooseTaskRequest.builder().task("T").possibleAnswers("A|B")
				.correctAnswers(List.of(1)).build();
		Lesson lesson = Lesson.builder().id(1).publicId("lesson-1").build();

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> {
			ChooseTask t = inv.getArgument(0);
			t.setPublicId("task-1");
			return t;
		});

		// when
		Mono<ChooseTaskResponse> result = taskService.createChooseTask(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("T", resp.getTask());
			assertEquals("task-1", resp.getPublicId());
			verify(chooseTaskRepository).save(any());
		}).verifyComplete();
	}

	@Test
	void shouldUpdateChooseTask() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		ChooseTaskRequest request = ChooseTaskRequest.builder().task("New").possibleAnswers("A|B")
				.correctAnswers(List.of(0)).build();
		ChooseTask task = ChooseTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId).possibleAnswers("A|B")
				.correctAnswers("[1]").build();

		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(lessonRepository.findById(lessonId))
				.thenReturn(Optional.of(Lesson.builder().id(lessonId).publicId("lesson-1").build()));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<ChooseTaskResponse> result = taskService.updateChooseTask(lessonId, taskPublicId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("New", resp.getTask());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenTaskIdMismatchInUpdateChooseTask() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		ChooseTask task = ChooseTask.builder().id(10).publicId(taskPublicId).lessonId(2).build();

		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when
		Mono<ChooseTaskResponse> result = taskService.updateChooseTask(lessonId, taskPublicId,
				Mono.just(ChooseTaskRequest.builder().build()));

		// then
		StepVerifier.create(result).expectError(TaskException.class).verify();
	}

	@Test
	void shouldDeleteChooseTask() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		ChooseTask task = ChooseTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId).build();

		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when
		Mono<Void> result = taskService.deleteChooseTask(lessonId, taskPublicId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(taskHintImageService).deleteHintImageFileIfPresent(null); // task has no hint image
		verify(chooseTaskRepository).delete(task);
	}

	@Test
	void shouldDeleteHintImageFileWhenChooseTaskHasHintImageFileName() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		ChooseTask task = ChooseTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId)
				.hintImageFileName("hint_choose.jpg").build();

		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when
		Mono<Void> result = taskService.deleteChooseTask(lessonId, taskPublicId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(taskHintImageService).deleteHintImageFileIfPresent("hint_choose.jpg");
		verify(chooseTaskRepository).delete(task);
	}

	@Test
	void shouldDeleteHintImageFileWhenWriteTaskHasHintImageFileName() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-write-1";
		WriteTask task = WriteTask.builder().id(5).publicId(taskPublicId).lessonId(lessonId)
				.hintImageFileName("hint_write.png").build();

		when(writeTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when
		Mono<Void> result = taskService.deleteWriteTask(lessonId, taskPublicId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(taskHintImageService).deleteHintImageFileIfPresent("hint_write.png");
		verify(writeTaskRepository).delete(task);
	}

	@Test
	void shouldIncludeHintImageUrlInChooseTaskResponseWhenHintImageFileNameIsSet() {
		// given
		Integer lessonId = 1;
		CustomUserDetails teacher = new CustomUserDetails(10, "teacher", "pass", Role.TEACHER);
		Lesson lesson = Lesson.builder().id(lessonId).publicId("lesson-abc").build();
		ChooseTask task = ChooseTask.builder().id(1).publicId("task-xyz").lessonId(lessonId).correctAnswers("[2]")
				.hintImageFileName("hint.jpg").build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(teacher));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(task));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			ChooseTaskResponse chooseTask = resp.getSections().get(0).getChooseTasks().get(0);
			assertEquals("/api/v1/lessons/lesson-abc/tasks/choose/task-xyz/hint-image", chooseTask.getHintImageUrl());
		}).verifyComplete();
	}

	@Test
	void shouldSetHintImageUrlNullInChooseTaskResponseWhenNoHintImageFileName() {
		// given
		Integer lessonId = 1;
		CustomUserDetails teacher = new CustomUserDetails(10, "teacher", "pass", Role.TEACHER);
		Lesson lesson = Lesson.builder().id(lessonId).publicId("lesson-abc").build();
		ChooseTask task = ChooseTask.builder().id(1).publicId("task-xyz").lessonId(lessonId).correctAnswers("[2]")
				.build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(teacher));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(task));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			ChooseTaskResponse chooseTask = resp.getSections().get(0).getChooseTasks().get(0);
			assertNull(chooseTask.getHintImageUrl());
		}).verifyComplete();
	}

	// Tests for Write, Scatter, Speak types... (similar logic, covering branches)

	@Test
	void shouldCreateWriteTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).publicId("lesson-1").build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(writeTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<WriteTaskResponse> result = taskService.createWriteTask(1,
				Mono.just(WriteTaskRequest.builder().task("W").correctAnswers(List.of("Answer")).build()));

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("W", r.getTask())).verifyComplete();
	}

	@Test
	void shouldCreateScatterTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).publicId("lesson-1").build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(scatterTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<ScatterTaskResponse> result = taskService.createScatterTask(1,
				Mono.just(ScatterTaskRequest.builder().task("S").words("A|B").correctAnswers(List.of("A B")).build()));

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("S", r.getTask())).verifyComplete();
	}

	@Test
	void shouldCreateSpeakTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).publicId("lesson-1").build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(speakTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<SpeakTaskResponse> result = taskService.createSpeakTask(1,
				Mono.just(SpeakTaskRequest.builder().expectedText("Hello world").build()));

		// then
		StepVerifier.create(result).assertNext(r -> {
			assertEquals("Hello world", r.getExpectedText());
		}).verifyComplete();
	}

	@Test
	void shouldRejectBlankExpectedTextForSpeakTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).publicId("lesson-1").build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));

		// when
		Mono<SpeakTaskResponse> result = taskService.createSpeakTask(1,
				Mono.just(SpeakTaskRequest.builder().expectedText("   ").build()));

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertInstanceOf(TaskException.class, error);
			assertEquals(TaskErrorCode.INVALID_TASK_ANSWERS, ((TaskException) error).getErrorCode());
		}).verify();
	}

	// Transcribe Speak Task tests
	@Test
	void shouldTranscribeSpeakTaskAndSaveAttempt() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId)
				.expectedTexts("[\"Hello\"]").build();
		UserLesson userLesson = UserLesson.builder().id(77).userId(1).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		FilePart audio = mock(FilePart.class);
		SpeakAttempt savedAttempt = SpeakAttempt.builder().id(33).publicId("attempt-1").userId(1).lessonId(lessonId)
				.taskId(task.getId()).userLesson(userLesson).expectedText("Hello there")
				.rawTranscription("um Hello there").matchedTranscription("hello there")
				.normalizedExpected("hello there").normalizedActual("hello there").score(1.0).correct(true)
				.wordsJson("[]").language("en").duration(1.0).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(1, lessonId)).thenReturn(Optional.of(userLesson));
		when(speakTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(sttClient.evaluate(audio, "Hello", 0.85, null)).thenReturn(Mono.just(SttEvaluationResponse.builder()
				.rawTranscription("um Hello there").matchedTranscription("hello there")
				.normalizedExpected("hello there").normalizedActual("hello there").score(1.0).correct(true)
				.words(List.of(SttEvaluationWordDto.builder().expected("hello").actual("hello").correct(true).build(),
						SttEvaluationWordDto.builder().expected("there").actual("there").correct(true).build()))
				.language("en").duration(1.0).build()));
		when(speakAttemptRepository.save(any())).thenReturn(savedAttempt);

		// when
		Mono<SpeakTranscriptionResponse> result = taskService.transcribeSpeakTask(lessonId, taskPublicId,
				Mono.just(audio));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("attempt-1", resp.getAttemptId());
			assertTrue(resp.isCorrect());
			assertEquals("hello there", resp.getText());
			assertEquals("um Hello there", resp.getRawText());
			assertEquals(1.0, resp.getScore());
			assertEquals(2, resp.getWords().size());
			assertTrue(resp.getWords().get(0).isCorrect());
		}).verifyComplete();
		verify(speakAttemptRepository).save(any(SpeakAttempt.class));
		assertEquals(1.0, meterRegistry.get("freeedu.stt.evaluate.requests").counter().count());
		assertEquals(1.0, meterRegistry.get("freeedu.stt.evaluate.success").counter().count());
		assertEquals(1.0, meterRegistry.get("freeedu.stt.evaluate.correct").counter().count());
		assertEquals(1L, meterRegistry.get("freeedu.stt.evaluate.duration").timer().count());
	}

	@Test
	void shouldReturnMatchedAndRawTextFromEvaluationResponse() {
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId)
				.expectedTexts("[\"My name is Dominik\"]").build();
		UserLesson userLesson = UserLesson.builder().id(78).userId(1).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		FilePart audio = mock(FilePart.class);
		SpeakAttempt savedAttempt = SpeakAttempt.builder().id(33).publicId("attempt-2").userId(1).lessonId(lessonId)
				.taskId(task.getId()).userLesson(userLesson).expectedText("My name is Dominik")
				.rawTranscription("um My name is Dominic").matchedTranscription("my name is dominic")
				.normalizedExpected("my name is dominik").normalizedActual("my name is dominic").score(1.0)
				.correct(true).wordsJson("[]").language("en").duration(1.2).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(1, lessonId)).thenReturn(Optional.of(userLesson));
		when(speakTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(sttClient.evaluate(audio, "My name is Dominik", 0.85, null)).thenReturn(Mono.just(SttEvaluationResponse
				.builder().rawTranscription("um My name is Dominic").matchedTranscription("my name is dominic")
				.normalizedExpected("my name is dominik").normalizedActual("my name is dominic").score(1.0)
				.correct(true).words(List.of()).language("en").duration(1.2).build()));
		when(speakAttemptRepository.save(any())).thenReturn(savedAttempt);

		StepVerifier.create(taskService.transcribeSpeakTask(lessonId, taskPublicId, Mono.just(audio)))
				.assertNext(resp -> {
					assertEquals("my name is dominic", resp.getText());
					assertEquals("um My name is Dominic", resp.getRawText());
					assertEquals("attempt-2", resp.getAttemptId());
				}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenAudioMissingInTranscribe() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId).build();
		UserLesson userLesson = UserLesson.builder().id(79).userId(1).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(1, lessonId)).thenReturn(Optional.of(userLesson));
		when(speakTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when
		Mono<SpeakTranscriptionResponse> result = taskService.transcribeSpeakTask(lessonId, taskPublicId, Mono.empty());

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertEquals(TaskErrorCode.STT_AUDIO_REQUIRED, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldSubmitLessonWithGradingAllTypes() {
		// given
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();

		SubmitRequest request = SubmitRequest.builder()
				.answers(List.of(AnswerItemRequest.builder().taskPublicId("tp1").taskType("choose").answer("1").build(),
						AnswerItemRequest.builder().taskPublicId("tp2").taskType("write").answer("correct").build(),
						AnswerItemRequest.builder().taskPublicId("tp3").taskType("scatter").answer("word1 word2")
								.build(),
						AnswerItemRequest.builder().taskPublicId("tp4").taskType("speak").answer("")
								.attemptId("attempt-4").build()))
				.build();
		SpeakAttempt attempt = SpeakAttempt.builder().publicId("attempt-4").userId(userId).lessonId(lessonId).taskId(4)
				.userLesson(userLesson).matchedTranscription("matched expected").correct(true).score(1.0).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));

		when(taskPublicIdLookupService.getInternalId("tp1", "choose")).thenReturn(1);
		when(taskPublicIdLookupService.getInternalId("tp2", "write")).thenReturn(2);
		when(taskPublicIdLookupService.getInternalId("tp3", "scatter")).thenReturn(3);
		when(taskPublicIdLookupService.getInternalId("tp4", "speak")).thenReturn(4);

		when(chooseTaskRepository.findByPublicId("tp1"))
				.thenReturn(Optional.of(ChooseTask.builder().id(1).lessonId(lessonId).correctAnswers("[1]").build()));
		when(writeTaskRepository.findByPublicId("tp2")).thenReturn(
				Optional.of(WriteTask.builder().id(2).lessonId(lessonId).correctAnswers("[\"correct\"]").build()));
		when(scatterTaskRepository.findByPublicId("tp3")).thenReturn(Optional
				.of(ScatterTask.builder().id(3).lessonId(lessonId).correctAnswers("[\"word1 word2\"]").build()));
		when(speakTaskRepository.findByPublicId("tp4")).thenReturn(
				Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedTexts("[\"expected\"]").build()));
		when(speakAttemptRepository.findByPublicId("attempt-4")).thenReturn(Optional.of(attempt));

		// when
		Mono<SubmitResponse> result = taskService.submitLesson(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(4, resp.getScore());
			assertEquals(4, resp.getMaxScore());
			assertEquals(UserLessonStatus.COMPLETED, userLesson.getStatus());
		}).verifyComplete();
		assertNotNull(attempt.getSubmittedAt());
		verify(studentProgressHistoryRepository).save(any());
		verify(speakAttemptRepository).save(argThat(saved -> saved.getSubmittedAt() != null));
		verify(pointsService).addPointsForLessonResult(userLesson.getId(), userId, 4, "TASK_CORRECT", userId);
		verify(applicationEventPublisher).publishEvent(any(StudentStatsChangedEvent.class));
	}

	@Test
	void shouldAcceptAnyConfiguredCorrectAnswerWhenSubmittingLesson() {
		// given
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder().answers(List.of(
				AnswerItemRequest.builder().taskPublicId("tp1").taskType("choose").answer("2").build(),
				AnswerItemRequest.builder().taskPublicId("tp2").taskType("write").answer("hi").build(),
				AnswerItemRequest.builder().taskPublicId("tp3").taskType("scatter").answer("I am here").build()))
				.build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));
		when(taskPublicIdLookupService.getInternalId("tp1", "choose")).thenReturn(1);
		when(taskPublicIdLookupService.getInternalId("tp2", "write")).thenReturn(2);
		when(taskPublicIdLookupService.getInternalId("tp3", "scatter")).thenReturn(3);
		when(chooseTaskRepository.findByPublicId("tp1"))
				.thenReturn(Optional.of(ChooseTask.builder().id(1).lessonId(lessonId).correctAnswers("[0,2]").build()));
		when(writeTaskRepository.findByPublicId("tp2")).thenReturn(
				Optional.of(WriteTask.builder().id(2).lessonId(lessonId).correctAnswers("[\"hello\",\"hi\"]").build()));
		when(scatterTaskRepository.findByPublicId("tp3")).thenReturn(Optional.of(ScatterTask.builder().id(3)
				.lessonId(lessonId).correctAnswers("[\"I am there\",\"I am here\"]").build()));

		// when
		Mono<SubmitResponse> result = taskService.submitLesson(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(3, resp.getScore());
			assertEquals(3, resp.getMaxScore());
			assertEquals(List.of("0", "2"), resp.getDetails().get(0).getCorrectAnswers());
			assertEquals(List.of("hello", "hi"), resp.getDetails().get(1).getCorrectAnswers());
			assertEquals(List.of("I am there", "I am here"), resp.getDetails().get(2).getCorrectAnswers());
		}).verifyComplete();
	}

	@Test
	void shouldTreatSpeakingTaskWithoutAttemptIdAsIncorrect() {
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder()
				.answers(List.of(AnswerItemRequest.builder().taskPublicId("tp4").taskType("speak").answer("").build()))
				.build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));
		when(taskPublicIdLookupService.getInternalId("tp4", "speak")).thenReturn(4);
		when(speakTaskRepository.findByPublicId("tp4")).thenReturn(
				Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedTexts("[\"expected\"]").build()));

		StepVerifier.create(taskService.submitLesson(lessonId, Mono.just(request))).assertNext(response -> {
			assertEquals(0, response.getScore());
			assertEquals(1, response.getMaxScore());
			assertFalse(response.getDetails().get(0).getIsCorrect());
		}).verifyComplete();
		verify(speakAttemptRepository, never()).findByPublicId(any());
	}

	@Test
	void shouldNotTrustSpeakingAnswerWithoutAttemptId() {
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder().answers(List.of(
				AnswerItemRequest.builder().taskPublicId("tp4").taskType("speak").answer("Definitely correct").build()))
				.build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));
		when(taskPublicIdLookupService.getInternalId("tp4", "speak")).thenReturn(4);
		when(speakTaskRepository.findByPublicId("tp4")).thenReturn(
				Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedTexts("[\"expected\"]").build()));

		StepVerifier.create(taskService.submitLesson(lessonId, Mono.just(request))).assertNext(response -> {
			assertEquals(0, response.getScore());
			assertEquals(1, response.getMaxScore());
			assertFalse(response.getDetails().get(0).getIsCorrect());
			assertEquals("expected", response.getDetails().get(0).getCorrectAnswers().get(0));
		}).verifyComplete();
		verify(speakAttemptRepository, never()).findByPublicId(any());
	}

	@Test
	void shouldRejectSpeakAttemptFromDifferentUser() {
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder().answers(List.of(AnswerItemRequest.builder().taskPublicId("tp4")
				.taskType("speak").answer("").attemptId("attempt-4").build())).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));
		when(taskPublicIdLookupService.getInternalId("tp4", "speak")).thenReturn(4);
		when(speakTaskRepository.findByPublicId("tp4")).thenReturn(
				Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedTexts("[\"expected\"]").build()));
		when(speakAttemptRepository.findByPublicId("attempt-4")).thenReturn(
				Optional.of(SpeakAttempt.builder().publicId("attempt-4").userId(99).lessonId(lessonId).taskId(4)
						.userLesson(userLesson).matchedTranscription("matched").correct(true).score(1.0).build()));

		StepVerifier.create(taskService.submitLesson(lessonId, Mono.just(request))).expectErrorSatisfies(error -> {
			assertEquals(TaskErrorCode.SPEAK_ATTEMPT_INVALID, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectSpeakAttemptFromDifferentUserLesson() {
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder().answers(List.of(AnswerItemRequest.builder().taskPublicId("tp4")
				.taskType("speak").answer("").attemptId("attempt-4").build())).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));
		when(taskPublicIdLookupService.getInternalId("tp4", "speak")).thenReturn(4);
		when(speakTaskRepository.findByPublicId("tp4")).thenReturn(
				Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedTexts("[\"expected\"]").build()));
		UserLesson previousUserLesson = UserLesson.builder().id(999).userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		when(speakAttemptRepository.findByPublicId("attempt-4")).thenReturn(Optional.of(SpeakAttempt.builder()
				.publicId("attempt-4").userId(userId).lessonId(lessonId).taskId(4).userLesson(previousUserLesson)
				.matchedTranscription("matched").correct(true).score(1.0).build()));

		StepVerifier.create(taskService.submitLesson(lessonId, Mono.just(request))).expectErrorSatisfies(error -> {
			assertEquals(TaskErrorCode.SPEAK_ATTEMPT_INVALID, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRecordTabSwitchForInProgressLesson() {
		// given
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		TaskAttentionEventRequest request = TaskAttentionEventRequest.builder().taskPublicId("tp1").taskType("choose")
				.build();
		UserTaskAttentionEvent savedEvent = UserTaskAttentionEvent.builder().userId(userId).lessonId(lessonId).taskId(1)
				.taskType("choose_tasks").switchCount(1).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));
		when(taskPublicIdLookupService.getInternalId("tp1", "choose")).thenReturn(1);
		when(chooseTaskRepository.findByPublicId("tp1"))
				.thenReturn(Optional.of(ChooseTask.builder().id(1).lessonId(lessonId).build()));
		when(userTaskAttentionEventRepository.findByUserIdAndLessonIdAndTaskIdAndTaskType(userId, lessonId, 1,
				"choose_tasks")).thenReturn(Optional.empty());
		when(userTaskAttentionEventRepository.save(any())).thenReturn(savedEvent);

		// when
		Mono<Void> result = taskService.recordTabSwitch(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userTaskAttentionEventRepository).save(any());
	}

	@Test
	void shouldReturnErrorWhenInvalidTaskTypeInSubmit() {
		// given
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder()
				.answers(List
						.of(AnswerItemRequest.builder().taskPublicId("tp1").taskType("invalid").answer("ans").build()))
				.build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));

		// when
		Mono<SubmitResponse> result = taskService.submitLesson(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertEquals(TaskErrorCode.INVALID_TASK_TYPE, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldResetProgress() {
		// given
		Integer lessonId = 1;
		Integer studentId = 20;
		Lesson lesson = Lesson.builder().id(lessonId).build();
		UserLesson userLesson = UserLesson.builder().id(44).lessonId(lessonId).userId(studentId).build();

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userLessonRepository.findByUserIdAndLessonId(studentId, lessonId)).thenReturn(Optional.of(userLesson));

		// when
		Mono<Void> result = taskService.resetUserProgress(lessonId, studentId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userAnswerRepository).deleteByUserIdAndLessonId(studentId, lessonId);
		verify(userTaskAttentionEventRepository).deleteByUserIdAndLessonId(studentId, lessonId);
		verify(speakAttemptRepository).deleteByUserLessonId(44);
		verify(pointsService).rollbackPointsForLessonResult(44, studentId, null);
		verify(userLessonRepository).deleteByUserIdAndLessonId(studentId, lessonId);
		verify(studentProgressHistoryRepository).deleteByUserIdAndLessonId(studentId, lessonId);
	}

	@Test
	void shouldAssignSpeakAttemptToConcreteUserLesson() {
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		Lesson lesson = Lesson.builder().id(lessonId).publicId("lesson-1").isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId)
				.expectedTexts("[\"Hello\"]").build();
		UserLesson userLesson = UserLesson.builder().id(501).userId(1).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		FilePart audio = mock(FilePart.class);

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(1, lessonId)).thenReturn(Optional.of(userLesson));
		when(speakTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(sttClient.evaluate(audio, "Hello", 0.85, null))
				.thenReturn(Mono.just(SttEvaluationResponse.builder().rawTranscription("Hello")
						.matchedTranscription("hello").normalizedExpected("hello").normalizedActual("hello").score(1.0)
						.correct(true).words(List.of()).language("en").duration(0.9).build()));
		when(speakAttemptRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		StepVerifier.create(taskService.transcribeSpeakTask(lessonId, taskPublicId, Mono.just(audio)))
				.expectNextCount(1).verifyComplete();

		verify(speakAttemptRepository).save(
				argThat(saved -> saved.getUserLesson() != null && Objects.equals(saved.getUserLesson().getId(), 501)));
	}

	@Test
	void shouldRejectEvaluateWhenUnusedAttemptLimitExceeded() {
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId)
				.expectedTexts("[\"Hello\"]").build();
		UserLesson userLesson = UserLesson.builder().id(601).userId(1).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		FilePart audio = mock(FilePart.class);

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(1, lessonId)).thenReturn(Optional.of(userLesson));
		when(speakTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(speakAttemptRepository.countByUserLessonIdAndTaskIdAndSubmittedAtIsNull(601, 10)).thenReturn(5L);

		StepVerifier.create(taskService.transcribeSpeakTask(lessonId, taskPublicId, Mono.just(audio)))
				.expectErrorSatisfies(error -> {
					assertEquals(TaskErrorCode.SPEAK_ATTEMPT_LIMIT_EXCEEDED, ((TaskException) error).getErrorCode());
				}).verify();
		verifyNoInteractions(sttClient);
	}

	@Test
	void shouldNotSaveSpeakAttemptWhenSttEvaluationFails() {
		Integer lessonId = 1;
		String taskPublicId = "task-10";
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(10).publicId(taskPublicId).lessonId(lessonId)
				.expectedTexts("[\"Hello\"]").build();
		UserLesson userLesson = UserLesson.builder().id(602).userId(1).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		FilePart audio = mock(FilePart.class);

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(1, lessonId)).thenReturn(Optional.of(userLesson));
		when(speakTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(speakAttemptRepository.countByUserLessonIdAndTaskIdAndSubmittedAtIsNull(602, 10)).thenReturn(0L);
		when(sttClient.evaluate(audio, "Hello", 0.85, null))
				.thenReturn(Mono.error(new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE)));

		StepVerifier.create(taskService.transcribeSpeakTask(lessonId, taskPublicId, Mono.just(audio)))
				.expectErrorSatisfies(error -> {
					assertEquals(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ((TaskException) error).getErrorCode());
				}).verify();

		verify(speakAttemptRepository, never()).save(any());
		assertEquals(1.0, meterRegistry.get("freeedu.stt.evaluate.requests").counter().count());
		assertEquals(1.0, meterRegistry.get("freeedu.stt.evaluate.errors").counter().count());
		assertEquals(1.0, meterRegistry.get("freeedu.stt.evaluate.service_unavailable").counter().count());
		assertEquals(1L, meterRegistry.get("freeedu.stt.evaluate.duration").timer().count());
	}

	@Test
	void shouldRejectSpeakingSubmitFromPreviousLessonRun() {
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson currentUserLesson = UserLesson.builder().id(700).userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		UserLesson previousUserLesson = UserLesson.builder().id(699).userId(userId).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder().answers(List.of(AnswerItemRequest.builder().taskPublicId("tp4")
				.taskType("speak").answer("").attemptId("attempt-old").build())).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(currentUserLesson));
		when(taskPublicIdLookupService.getInternalId("tp4", "speak")).thenReturn(4);
		when(speakTaskRepository.findByPublicId("tp4")).thenReturn(
				Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedTexts("[\"expected\"]").build()));
		when(speakAttemptRepository.findByPublicId("attempt-old")).thenReturn(Optional.of(SpeakAttempt.builder()
				.publicId("attempt-old").userId(userId).lessonId(lessonId).taskId(4).userLesson(previousUserLesson)
				.matchedTranscription("matched").correct(true).score(1.0).build()));

		StepVerifier.create(taskService.submitLesson(lessonId, Mono.just(request))).expectErrorSatisfies(error -> {
			assertEquals(TaskErrorCode.SPEAK_ATTEMPT_INVALID, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldExecuteResetProgressInsideTransactionTemplate() {
		// given
		Integer lessonId = 1;
		Integer studentId = 20;
		Lesson lesson = Lesson.builder().id(lessonId).build();
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

		// when
		Mono<Void> result = taskService.resetUserProgress(lessonId, studentId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(transactionTemplate).execute(any());
	}

	@Test
	void shouldReturnErrorWhenLessonNotFoundInReset() {
		// given
		when(lessonRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = taskService.resetUserProgress(1, 10);

		// then
		StepVerifier.create(result).expectError(TaskException.class).verify();
	}

	@Test
	void shouldRecoverFromDataIntegrityViolationOnConcurrentGetLessonTasks() {
		// given
		Integer lessonId = 1;
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(lessonId).publicId("lesson-1").isActive(true).build();
		UserLesson concurrentUserLesson = UserLesson.builder().id(88).userId(10).lessonId(lessonId)
				.status(UserLessonStatus.IN_PROGRESS).score(0).maxScore(0).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(student.getId(), lessonId)).thenReturn(true);

		// First search returns empty, so we attempt to save
		when(userLessonRepository.findByUserIdAndLessonId(student.getId(), lessonId)).thenReturn(Optional.empty()) // first
																													// check
				.thenReturn(Optional.of(concurrentUserLesson)); // fallback check after exception

		// Save throws DataIntegrityViolationException due to concurrent insert
		when(userLessonRepository.save(any()))
				.thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate"));

		ChooseTask chooseTask = ChooseTask.builder().id(1).lessonId(lessonId).correctAnswers("[1]").build();
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(chooseTask));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("lesson-1", resp.getLessonPublicId());
			assertEquals("IN_PROGRESS", resp.getStatus());
		}).verifyComplete();
	}

	@Test
	void shouldReconcileStudentPointsWhenLessonRecalculated() {
		// given
		Integer lessonId = 1;
		ChooseTaskRequest request = ChooseTaskRequest.builder().task("T").possibleAnswers("A|B")
				.correctAnswers(List.of(1)).points(5).build();
		Lesson lesson = Lesson.builder().id(lessonId).publicId("lesson-1").build();

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> {
			ChooseTask t = inv.getArgument(0);
			t.setId(101);
			t.setPublicId("task-1");
			return t;
		});

		// Mock the recalculate components
		ChooseTask existingTask = ChooseTask.builder().id(101).lessonId(lessonId).points(5).correctAnswers("[1]")
				.build();
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(existingTask));

		UserLesson studentProgress = UserLesson.builder().id(999).userId(200).lessonId(lessonId)
				.status(UserLessonStatus.COMPLETED).score(1).maxScore(1).build();
		when(userLessonRepository.findByLessonId(lessonId)).thenReturn(List.of(studentProgress));

		UserAnswer answer = UserAnswer.builder().taskId(101).taskType("choose_tasks").userId(200).lessonId(lessonId)
				.isCorrect(true).build();
		when(userAnswerRepository.findByUserIdAndLessonId(200, lessonId)).thenReturn(List.of(answer));

		// when
		Mono<ChooseTaskResponse> result = taskService.createChooseTask(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("task-1", resp.getPublicId());
			// Verify the user lesson scores were updated with new points (5 instead of 1)
			verify(userLessonRepository).save(argThat(ul -> ul.getScore() == 5 && ul.getMaxScore() == 5));
			// Verify reconcilePointsForLessonResult was called to sync XP
			verify(pointsService).reconcilePointsForLessonResult(999, 200, 5, 200);
		}).verifyComplete();
	}
}
