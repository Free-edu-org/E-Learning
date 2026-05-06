package pl.freeedu.backend.task.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.ChooseTask;
import pl.freeedu.backend.task.model.ScatterTask;
import pl.freeedu.backend.task.model.SpeakTask;
import pl.freeedu.backend.task.model.WriteTask;
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class TaskHintImageService {

	private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of("image/jpeg", "jpg", "image/png", "png",
			"image/webp", "webp", "image/gif", "gif");

	private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
	static final String HINT_IMAGE_DIR = "uploads/task-hints";

	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final SpeakTaskRepository speakTaskRepository;

	public TaskHintImageService(ChooseTaskRepository chooseTaskRepository, WriteTaskRepository writeTaskRepository,
			ScatterTaskRepository scatterTaskRepository, SpeakTaskRepository speakTaskRepository) {
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.speakTaskRepository = speakTaskRepository;
	}

	public Mono<String> uploadHintImage(Integer lessonId, String taskType, String taskPublicId, FilePart filePart) {
		return Mono.fromCallable(() -> {
			log.info("Hint image upload started. Lesson ID: {}, taskType: {}, taskPublicId: {}", lessonId, taskType,
					taskPublicId);

			String contentType = filePart.headers().getContentType() != null
					? filePart.headers().getContentType().toString()
					: "";
			String baseType = contentType.contains(";")
					? contentType.substring(0, contentType.indexOf(';')).trim()
					: contentType.trim();
			if (!ALLOWED_IMAGE_TYPES.containsKey(baseType)) {
				log.warn("Hint image upload failed: invalid content type '{}' for task publicId: {}", baseType,
						taskPublicId);
				throw new TaskException(TaskErrorCode.HINT_IMAGE_INVALID_FILE_TYPE);
			}
			return baseType;
		}).subscribeOn(Schedulers.boundedElastic()).flatMap(baseType -> {
			String extension = ALLOWED_IMAGE_TYPES.get(baseType);
			String storedName = "task_hint_" + taskType + "_" + taskPublicId + "_" + UUID.randomUUID() + "."
					+ extension;
			Path dir = Paths.get(HINT_IMAGE_DIR);
			Path filePath = dir.resolve(storedName);

			return Mono.fromCallable(() -> {
				try {
					Files.createDirectories(dir);
					return filePath;
				} catch (IOException e) {
					log.error("Failed to prepare hint image directory", e);
					throw new RuntimeException("Failed to prepare hint image directory", e);
				}
			}).subscribeOn(Schedulers.boundedElastic()).flatMap(path -> filePart.transferTo(path).thenReturn(path))
					.flatMap(path -> Mono.fromCallable(() -> {
						try {
							long fileSize = Files.size(path);
							if (fileSize > MAX_FILE_SIZE_BYTES) {
								log.warn("Hint image upload failed: file too large ({} bytes) for task publicId: {}",
										fileSize, taskPublicId);
								Files.deleteIfExists(path);
								throw new TaskException(TaskErrorCode.HINT_IMAGE_FILE_TOO_LARGE);
							}

							String oldFileName = updateTaskHintImageFileName(lessonId, taskType, taskPublicId,
									storedName);
							if (oldFileName != null) {
								deleteFileQuietly(Paths.get(HINT_IMAGE_DIR).resolve(oldFileName));
							}

							log.info("Hint image uploaded successfully for task publicId: {}. Stored as: {}",
									taskPublicId, storedName);
							return storedName;
						} catch (IOException e) {
							log.error("Failed to process hint image file for task publicId: {}", taskPublicId, e);
							throw new RuntimeException("Failed to process hint image file", e);
						}
					}).subscribeOn(Schedulers.boundedElastic()));
		});
	}

	public Mono<ResponseEntity<Resource>> serveHintImage(Integer lessonId, String taskType, String taskPublicId) {
		return Mono.fromCallable(() -> {
			log.info("Serving hint image. Lesson ID: {}, taskType: {}, taskPublicId: {}", lessonId, taskType,
					taskPublicId);
			String fileName = getTaskHintImageFileName(lessonId, taskType, taskPublicId);
			if (fileName == null) {
				log.warn("Hint image not found for task publicId: {}", taskPublicId);
				throw new TaskException(TaskErrorCode.HINT_IMAGE_NOT_FOUND);
			}

			Path filePath = Paths.get(HINT_IMAGE_DIR).resolve(fileName);
			Resource resource = new FileSystemResource(filePath);
			if (!resource.exists()) {
				log.error("Hint image file missing on disk: {}", filePath);
				throw new TaskException(TaskErrorCode.HINT_IMAGE_NOT_FOUND);
			}

			String contentType = resolveContentTypeFromFileName(fileName);
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.parseMediaType(contentType));
			headers.setCacheControl("max-age=3600, private");

			log.debug("Serving hint image file: {}", filePath);
			return ResponseEntity.<Resource>ok().headers(headers).body(resource);
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Void> deleteHintImage(Integer lessonId, String taskType, String taskPublicId) {
		return Mono.fromCallable(() -> {
			log.info("Deleting hint image. Lesson ID: {}, taskType: {}, taskPublicId: {}", lessonId, taskType,
					taskPublicId);
			String oldFileName = updateTaskHintImageFileName(lessonId, taskType, taskPublicId, null);
			if (oldFileName == null) {
				log.warn("Delete hint image: no image found for task publicId: {}", taskPublicId);
				throw new TaskException(TaskErrorCode.HINT_IMAGE_NOT_FOUND);
			}
			deleteFileQuietly(Paths.get(HINT_IMAGE_DIR).resolve(oldFileName));
			log.info("Hint image deleted for task publicId: {}", taskPublicId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	/**
	 * Called from TaskService when a task is deleted — cleans up the file only, no
	 * DB update needed since the row is being deleted anyway.
	 */
	public void deleteHintImageFileIfPresent(String fileName) {
		if (fileName == null || fileName.isBlank()) {
			return;
		}
		deleteFileQuietly(Paths.get(HINT_IMAGE_DIR).resolve(fileName));
	}

	/**
	 * Called from LessonService before a lesson is deleted — cleans up hint image
	 * files for all tasks in the lesson. DB rows are removed by cascade so only the
	 * files need explicit cleanup here.
	 */
	public void deleteHintImageFilesByLessonId(Integer lessonId) {
		java.util.stream.Stream
				.of(chooseTaskRepository.findByLessonId(lessonId).stream().map(ChooseTask::getHintImageFileName),
						writeTaskRepository.findByLessonId(lessonId).stream().map(WriteTask::getHintImageFileName),
						scatterTaskRepository.findByLessonId(lessonId).stream().map(ScatterTask::getHintImageFileName),
						speakTaskRepository.findByLessonId(lessonId).stream().map(SpeakTask::getHintImageFileName))
				.flatMap(s -> s).filter(f -> f != null && !f.isBlank())
				.forEach(f -> deleteFileQuietly(Paths.get(HINT_IMAGE_DIR).resolve(f)));
	}

	// ─── Private helpers ─────────────────────────────────────────────────────────

	/**
	 * Finds the task, sets hintImageFileName to newFileName, saves, and returns the
	 * OLD file name (or null if there was none).
	 */
	private String updateTaskHintImageFileName(Integer lessonId, String taskType, String taskPublicId,
			String newFileName) {
		return switch (taskType) {
			case "choose" -> {
				ChooseTask task = chooseTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				String old = task.getHintImageFileName();
				task.setHintImageFileName(newFileName);
				chooseTaskRepository.save(task);
				yield old;
			}
			case "write" -> {
				WriteTask task = writeTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				String old = task.getHintImageFileName();
				task.setHintImageFileName(newFileName);
				writeTaskRepository.save(task);
				yield old;
			}
			case "scatter" -> {
				ScatterTask task = scatterTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				String old = task.getHintImageFileName();
				task.setHintImageFileName(newFileName);
				scatterTaskRepository.save(task);
				yield old;
			}
			case "speak" -> {
				SpeakTask task = speakTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				String old = task.getHintImageFileName();
				task.setHintImageFileName(newFileName);
				speakTaskRepository.save(task);
				yield old;
			}
			default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		};
	}

	private String getTaskHintImageFileName(Integer lessonId, String taskType, String taskPublicId) {
		return switch (taskType) {
			case "choose" -> {
				ChooseTask task = chooseTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				yield task.getHintImageFileName();
			}
			case "write" -> {
				WriteTask task = writeTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				yield task.getHintImageFileName();
			}
			case "scatter" -> {
				ScatterTask task = scatterTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				yield task.getHintImageFileName();
			}
			case "speak" -> {
				SpeakTask task = speakTaskRepository.findByPublicId(taskPublicId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				if (!lessonId.equals(task.getLessonId())) {
					throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
				}
				yield task.getHintImageFileName();
			}
			default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		};
	}

	private String resolveContentTypeFromFileName(String fileName) {
		if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
			return "image/jpeg";
		}
		if (fileName.endsWith(".png")) {
			return "image/png";
		}
		if (fileName.endsWith(".webp")) {
			return "image/webp";
		}
		if (fileName.endsWith(".gif")) {
			return "image/gif";
		}
		return "application/octet-stream";
	}

	private void deleteFileQuietly(Path path) {
		try {
			Files.deleteIfExists(path);
		} catch (IOException e) {
			log.warn("Failed to delete hint image file: {}. Error: {}", path, e.getMessage());
		}
	}
}
