package pl.freeedu.backend.lesson.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

	@EntityGraph(attributePaths = {"teacher"})
	List<Lesson> findByIdIn(List<Integer> ids);

	@Override
	@EntityGraph(attributePaths = {"teacher"})
	Optional<Lesson> findById(Integer id);

	@EntityGraph(attributePaths = {"teacher"})
	Optional<Lesson> findByPublicId(String publicId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT l FROM Lesson l WHERE l.id = :id")
	Optional<Lesson> findByIdForUpdate(@Param("id") Integer id);
}
