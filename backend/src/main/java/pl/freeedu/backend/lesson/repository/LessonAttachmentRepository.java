package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.lesson.model.LessonAttachment;

import java.util.Optional;

@Repository
public interface LessonAttachmentRepository extends JpaRepository<LessonAttachment, Integer> {

	Optional<LessonAttachment> findByLessonId(Integer lessonId);

	void deleteByLessonId(Integer lessonId);

	boolean existsByLessonId(Integer lessonId);
}
