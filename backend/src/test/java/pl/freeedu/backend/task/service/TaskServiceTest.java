package pl.freeedu.backend.task.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.codec.multipart.FilePart;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.security.service.SecurityService;
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

	private TaskService taskService;

	@BeforeEach
	void setUp() {
		taskService = new TaskService(chooseTaskRepository, writeTaskRepository, scatterTaskRepository,
				speakTaskRepository, userAnswerRepository, userLessonRepository, lessonRepository, securityService,
				userInGroupRepository, sttClient, 0.85);
	}

	@Test
	void shouldGetLessonTasksForStudentWithAccess() {
		// given
		Integer lessonId = 1;
		CustomUserDetails student = new CustomUserDetails(10, "student", "pass", Role.STUDENT);
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(student));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(student.getId(), lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(student.getId(), lessonId)).thenReturn(Optional.empty());

		ChooseTask chooseTask = ChooseTask.builder().id(1).lessonId(lessonId).correctAnswer(1).build();
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(chooseTask));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(lessonId, resp.getLessonId());
			assertEquals("IN_PROGRESS", resp.getStatus());
			assertNull(resp.getSections().get(0).getChooseTasks().get(0).getCorrectAnswer()); // stripped for student
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

		ChooseTask chooseTask = ChooseTask.builder().id(1).lessonId(lessonId).correctAnswer(1).build();
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of(chooseTask));
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		Mono<LessonTasksResponse> result = taskService.getLessonTasks(lessonId);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(1, resp.getSections().get(0).getChooseTasks().get(0).getCorrectAnswer()); // visible for
																									// teacher
		}).verifyComplete();
	}

	@Test
	void shouldCreateChooseTask() {
		// given
		Integer lessonId = 1;
		ChooseTaskRequest request = ChooseTaskRequest.builder().task("T").correctAnswer(1).build();
		Lesson lesson = Lesson.builder().id(1).build();

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<ChooseTaskResponse> result = taskService.createChooseTask(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("T", resp.getTask());
			verify(chooseTaskRepository).save(any());
		}).verifyComplete();
	}

	@Test
	void shouldUpdateChooseTask() {
		// given
		Integer lessonId = 1;
		Integer taskId = 10;
		ChooseTaskRequest request = ChooseTaskRequest.builder().task("New").build();
		ChooseTask task = ChooseTask.builder().id(taskId).lessonId(lessonId).build();

		when(chooseTaskRepository.findById(taskId)).thenReturn(Optional.of(task));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<ChooseTaskResponse> result = taskService.updateChooseTask(lessonId, taskId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("New", resp.getTask());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenTaskIdMismatchInUpdateChooseTask() {
		// given
		Integer lessonId = 1;
		Integer taskId = 10;
		ChooseTask task = ChooseTask.builder().id(taskId).lessonId(2).build();

		when(chooseTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

		// when
		Mono<ChooseTaskResponse> result = taskService.updateChooseTask(lessonId, taskId,
				Mono.just(ChooseTaskRequest.builder().build()));

		// then
		StepVerifier.create(result).expectError(TaskException.class).verify();
	}

	@Test
	void shouldDeleteChooseTask() {
		// given
		Integer lessonId = 1;
		Integer taskId = 10;
		ChooseTask task = ChooseTask.builder().id(taskId).lessonId(lessonId).build();

		when(chooseTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

		// when
		Mono<Void> result = taskService.deleteChooseTask(lessonId, taskId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(chooseTaskRepository).deleteById(taskId);
	}

	// Tests for Write, Scatter, Speak types... (similar logic, covering branches)

	@Test
	void shouldCreateWriteTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(writeTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<WriteTaskResponse> result = taskService.createWriteTask(1,
				Mono.just(WriteTaskRequest.builder().task("W").build()));

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("W", r.getTask())).verifyComplete();
	}

	@Test
	void shouldCreateScatterTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(scatterTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<ScatterTaskResponse> result = taskService.createScatterTask(1,
				Mono.just(ScatterTaskRequest.builder().task("S").build()));

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("S", r.getTask())).verifyComplete();
	}

	@Test
	void shouldCreateSpeakTask() {
		// given
		Lesson lesson = Lesson.builder().id(1).build();
		when(lessonRepository.findById(1)).thenReturn(Optional.of(lesson));
		when(speakTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<SpeakTaskResponse> result = taskService.createSpeakTask(1,
				Mono.just(SpeakTaskRequest.builder().task("Sp").build()));

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("Sp", r.getTask())).verifyComplete();
	}

	// Transcribe Speak Task tests
	@Test
	void shouldTranscribeSpeakTask() {
		// given
		Integer lessonId = 1;
		Integer taskId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(taskId).lessonId(lessonId).expectedText("Hello").build();
		FilePart audio = mock(FilePart.class);

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(speakTaskRepository.findById(taskId)).thenReturn(Optional.of(task));
		when(sttClient.transcribe(audio)).thenReturn(Mono.just(new SttTranscriptionResponse("Hello", "en", 1.0)));

		// when
		Mono<SpeakTranscriptionResponse> result = taskService.transcribeSpeakTask(lessonId, taskId, Mono.just(audio));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertTrue(resp.isCorrect());
			assertEquals("Hello", resp.getText());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenAudioMissingInTranscribe() {
		// given
		Integer lessonId = 1;
		Integer taskId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		SpeakTask task = SpeakTask.builder().id(taskId).lessonId(lessonId).build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(1));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(1, lessonId)).thenReturn(true);
		when(speakTaskRepository.findById(taskId)).thenReturn(Optional.of(task));

		// when
		Mono<SpeakTranscriptionResponse> result = taskService.transcribeSpeakTask(lessonId, taskId, Mono.empty());

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
				.answers(List.of(new AnswerItemRequest(1, "choose", "1"), new AnswerItemRequest(2, "write", "correct"),
						new AnswerItemRequest(3, "scatter", "word1 word2"),
						new AnswerItemRequest(4, "speak", "expected")))
				.build();

		when(securityService.getCurrentUserId()).thenReturn(Mono.just(userId));
		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(userId, lessonId)).thenReturn(true);
		when(userLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.of(userLesson));

		when(chooseTaskRepository.findById(1))
				.thenReturn(Optional.of(ChooseTask.builder().id(1).lessonId(lessonId).correctAnswer(1).build()));
		when(writeTaskRepository.findById(2))
				.thenReturn(Optional.of(WriteTask.builder().id(2).lessonId(lessonId).correctAnswer("correct").build()));
		when(scatterTaskRepository.findById(3)).thenReturn(
				Optional.of(ScatterTask.builder().id(3).lessonId(lessonId).correctAnswer("word1 word2").build()));
		when(speakTaskRepository.findById(4))
				.thenReturn(Optional.of(SpeakTask.builder().id(4).lessonId(lessonId).expectedText("expected").build()));

		// when
		Mono<SubmitResponse> result = taskService.submitLesson(lessonId, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(4, resp.getScore());
			assertEquals(4, resp.getMaxScore());
			assertEquals(UserLessonStatus.COMPLETED, userLesson.getStatus());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenInvalidTaskTypeInSubmit() {
		// given
		Integer lessonId = 1;
		Integer userId = 10;
		Lesson lesson = Lesson.builder().id(lessonId).isActive(true).build();
		UserLesson userLesson = UserLesson.builder().status(UserLessonStatus.IN_PROGRESS).build();
		SubmitRequest request = SubmitRequest.builder().answers(List.of(new AnswerItemRequest(1, "invalid", "ans")))
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

		when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

		// when
		Mono<Void> result = taskService.resetUserProgress(lessonId, studentId);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userAnswerRepository).deleteByUserIdAndLessonId(studentId, lessonId);
		verify(userLessonRepository).deleteByUserIdAndLessonId(studentId, lessonId);
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
}
