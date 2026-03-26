package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;
import pl.freeedu.backend.lesson.model.Lesson;
import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {
	@EntityGraph(attributePaths = {"teacher"})
	List<Lesson> findAll();

	@EntityGraph(attributePaths = {"teacher"})
	List<Lesson> findByTeacher_Id(Integer teacherId);

	@Override
	@EntityGraph(attributePaths = {"teacher"})
	Optional<Lesson> findById(Integer id);
}
