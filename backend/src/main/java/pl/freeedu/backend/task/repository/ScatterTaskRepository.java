package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.ScatterTask;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScatterTaskRepository extends JpaRepository<ScatterTask, Integer> {

	List<ScatterTask> findByLessonId(Integer lessonId);

	Optional<ScatterTask> findByPublicId(String publicId);

	@Transactional
	void deleteByLessonId(Integer lessonId);
}
