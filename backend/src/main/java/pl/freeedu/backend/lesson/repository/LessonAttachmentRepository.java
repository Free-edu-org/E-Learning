package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.lesson.model.LessonAttachment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonAttachmentRepository extends JpaRepository<LessonAttachment, Integer> {

	List<LessonAttachment> findAllByLessonId(Integer lessonId);

	List<LessonAttachment> findByLessonIdIn(Collection<Integer> lessonIds);

	Optional<LessonAttachment> findByPublicId(String publicId);

	void deleteByLessonId(Integer lessonId);

	long countByLessonId(Integer lessonId);
}
