package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.lesson.model.LessonAttachment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonAttachmentRepository extends JpaRepository<LessonAttachment, Integer> {

	Optional<LessonAttachment> findByLessonId(Integer lessonId);

	List<LessonAttachment> findByLessonIdIn(Collection<Integer> lessonIds);

	void deleteByLessonId(Integer lessonId);

	boolean existsByLessonId(Integer lessonId);
}
