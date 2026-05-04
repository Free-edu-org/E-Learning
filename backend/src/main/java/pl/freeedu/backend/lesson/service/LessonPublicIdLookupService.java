package pl.freeedu.backend.lesson.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;

@Service
public class LessonPublicIdLookupService {

	private final LessonRepository lessonRepository;

	public LessonPublicIdLookupService(LessonRepository lessonRepository) {
		this.lessonRepository = lessonRepository;
	}

	public Lesson getRequiredLesson(String publicId) {
		return lessonRepository.findByPublicId(publicId)
				.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
	}

	public Integer getRequiredInternalId(String publicId) {
		return getRequiredLesson(publicId).getId();
	}
}
