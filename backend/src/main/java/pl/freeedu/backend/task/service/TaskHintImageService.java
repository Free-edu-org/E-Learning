package pl.freeedu.backend.task.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

@Slf4j
@Service
public class TaskHintImageService {

	static final String HINT_IMAGE_DIR = "uploads/hint-images";

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

	/**
	 * Called from TaskService when a task is deleted — cleans up the file only, no
	 * DB update needed since the row is being deleted anyway.
	 */
	public void deleteHintImageFileIfPresent(String fileName) {
		if (fileName == null || fileName.isBlank()) {
			return;
		}
		try {
			Files.deleteIfExists(Paths.get(HINT_IMAGE_DIR).resolve(fileName));
			log.debug("Deleted hint image file: {}", fileName);
		} catch (IOException e) {
			log.warn("Failed to delete hint image file: {}. Error: {}", fileName, e.getMessage());
		}
	}

	/**
	 * Called from LessonService when a lesson is deleted — cleans up all hint image
	 * files for every task that belongs to the lesson. Must be called
	 * <em>before</em> the lesson row (and its cascaded task rows) are removed from
	 * the database so that the task records can still be queried.
	 */
	public void deleteHintImageFilesByLessonId(Integer lessonId) {
		Stream.of(chooseTaskRepository.findByLessonId(lessonId).stream().map(t -> t.getHintImageFileName()),
				writeTaskRepository.findByLessonId(lessonId).stream().map(t -> t.getHintImageFileName()),
				scatterTaskRepository.findByLessonId(lessonId).stream().map(t -> t.getHintImageFileName()),
				speakTaskRepository.findByLessonId(lessonId).stream().map(t -> t.getHintImageFileName()))
				.flatMap(s -> s).forEach(this::deleteHintImageFileIfPresent);
		log.debug("Finished cleaning up hint image files for lesson ID: {}", lessonId);
	}
}
