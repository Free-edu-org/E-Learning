package pl.freeedu.backend.task.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.ChooseTask;
import pl.freeedu.backend.task.model.WriteTask;
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskHintImageServiceTest {

	@Mock
	private ChooseTaskRepository chooseTaskRepository;

	@Mock
	private WriteTaskRepository writeTaskRepository;

	@Mock
	private ScatterTaskRepository scatterTaskRepository;

	@Mock
	private SpeakTaskRepository speakTaskRepository;

	private TaskHintImageService taskHintImageService;

	@BeforeEach
	void setUp() {
		taskHintImageService = new TaskHintImageService(chooseTaskRepository, writeTaskRepository,
				scatterTaskRepository, speakTaskRepository);
	}

	@Test
	void deleteHintImageFileIfPresent_doesNothing_whenFileNameIsNull() {
		// given
		// (null input — nothing to delete)

		// when
		assertDoesNotThrow(() -> taskHintImageService.deleteHintImageFileIfPresent(null));

		// then
		verifyNoInteractions(chooseTaskRepository, writeTaskRepository, scatterTaskRepository, speakTaskRepository);
	}

	@Test
	void deleteHintImageFileIfPresent_doesNothing_whenFileNameIsBlank() {
		// given
		// (blank string — nothing to delete)

		// when
		assertDoesNotThrow(() -> taskHintImageService.deleteHintImageFileIfPresent("   "));

		// then
		verifyNoInteractions(chooseTaskRepository, writeTaskRepository, scatterTaskRepository, speakTaskRepository);
	}

	@Test
	void deleteHintImageFilesByLessonId_queriesAllFourRepositories() {
		// given
		Integer lessonId = 5;
		when(chooseTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(writeTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when
		taskHintImageService.deleteHintImageFilesByLessonId(lessonId);

		// then
		verify(chooseTaskRepository).findByLessonId(lessonId);
		verify(writeTaskRepository).findByLessonId(lessonId);
		verify(scatterTaskRepository).findByLessonId(lessonId);
		verify(speakTaskRepository).findByLessonId(lessonId);
	}

	@Test
	void deleteHintImageFilesByLessonId_doesNotThrow_whenTasksHaveNullHintImageFileName() {
		// given
		Integer lessonId = 5;
		when(chooseTaskRepository.findByLessonId(lessonId))
				.thenReturn(List.of(ChooseTask.builder().lessonId(lessonId).build()));
		when(writeTaskRepository.findByLessonId(lessonId))
				.thenReturn(List.of(WriteTask.builder().lessonId(lessonId).build()));
		when(scatterTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());
		when(speakTaskRepository.findByLessonId(lessonId)).thenReturn(List.of());

		// when / then — null filenames must be silently skipped
		assertDoesNotThrow(() -> taskHintImageService.deleteHintImageFilesByLessonId(lessonId));
	}

	@Test
	void deleteHintImage_throwsHintImageNotFound_whenChooseTaskHasNoHintImageFileName() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-pub";
		ChooseTask task = ChooseTask.builder().publicId(taskPublicId).lessonId(lessonId).hintImageFileName(null)
				.build();
		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<Void> result = taskHintImageService.deleteHintImage(lessonId, "choose", taskPublicId);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.HINT_IMAGE_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void deleteHintImage_throwsTaskNotFound_whenChooseTaskNotFound() {
		// given
		when(chooseTaskRepository.findByPublicId("missing")).thenReturn(Optional.empty());

		// when
		Mono<Void> result = taskHintImageService.deleteHintImage(1, "choose", "missing");

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.TASK_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void deleteHintImage_throwsTaskNotFound_whenChooseTaskBelongsToDifferentLesson() {
		// given
		ChooseTask task = ChooseTask.builder().publicId("task-pub").lessonId(99).hintImageFileName("file.jpg").build();
		when(chooseTaskRepository.findByPublicId("task-pub")).thenReturn(Optional.of(task));

		// when — requested with lessonId=1 but task belongs to lessonId=99
		Mono<Void> result = taskHintImageService.deleteHintImage(1, "choose", "task-pub");

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.TASK_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void deleteHintImage_throwsInvalidTaskType_whenTaskTypeIsUnknown() {
		// given
		// (no repository interaction needed for an unknown type)

		// when
		Mono<Void> result = taskHintImageService.deleteHintImage(1, "unknown_type", "task-pub");

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.INVALID_TASK_TYPE, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void deleteHintImage_clearsDbFieldAndCompletes_whenChooseTaskHasHintImageFileName() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-pub";
		ChooseTask task = ChooseTask.builder().publicId(taskPublicId).lessonId(lessonId).hintImageFileName("old.jpg")
				.build();
		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));
		when(chooseTaskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<Void> result = taskHintImageService.deleteHintImage(lessonId, "choose", taskPublicId);

		// then — DB field cleared, save called, method completes
		StepVerifier.create(result).verifyComplete();
		assertNull(task.getHintImageFileName());
		verify(chooseTaskRepository).save(task);
	}

	@Test
	void serveHintImage_throwsHintImageNotFound_whenHintImageFileNameIsNullInDb() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-pub";
		ChooseTask task = ChooseTask.builder().publicId(taskPublicId).lessonId(lessonId).hintImageFileName(null)
				.build();
		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when
		Mono<?> result = taskHintImageService.serveHintImage(lessonId, "choose", taskPublicId);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.HINT_IMAGE_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void serveHintImage_throwsHintImageNotFound_whenFileDoesNotExistOnDisk() {
		// given
		Integer lessonId = 1;
		String taskPublicId = "task-pub";
		ChooseTask task = ChooseTask.builder().publicId(taskPublicId).lessonId(lessonId)
				.hintImageFileName("nonexistent_hint_99999.jpg").build();
		when(chooseTaskRepository.findByPublicId(taskPublicId)).thenReturn(Optional.of(task));

		// when — DB has a filename but file is absent from disk
		Mono<?> result = taskHintImageService.serveHintImage(lessonId, "choose", taskPublicId);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.HINT_IMAGE_NOT_FOUND, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void uploadHintImage_throwsInvalidFileType_whenContentTypeIsNotAllowed() {
		// given
		Integer lessonId = 1;
		FilePart filePart = mock(FilePart.class);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.TEXT_PLAIN);
		when(filePart.headers()).thenReturn(headers);

		// when
		Mono<String> result = taskHintImageService.uploadHintImage(lessonId, "choose", "task-pub", filePart);

		// then — rejected before any file write
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.HINT_IMAGE_INVALID_FILE_TYPE, ((TaskException) error).getErrorCode());
		}).verify();
	}

	@Test
	void uploadHintImage_throwsInvalidFileType_whenContentTypeHasCharsetSuffix() {
		// given
		Integer lessonId = 1;
		FilePart filePart = mock(FilePart.class);
		HttpHeaders headers = new HttpHeaders();
		headers.set(HttpHeaders.CONTENT_TYPE, "text/html; charset=utf-8");
		when(filePart.headers()).thenReturn(headers);

		// when
		Mono<String> result = taskHintImageService.uploadHintImage(lessonId, "choose", "task-pub", filePart);

		// then — charset suffix must be stripped before type check
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof TaskException);
			assertEquals(TaskErrorCode.HINT_IMAGE_INVALID_FILE_TYPE, ((TaskException) error).getErrorCode());
		}).verify();
	}
}
