package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.ScatterTask;

import java.util.List;

@Repository
public interface ScatterTaskRepository extends JpaRepository<ScatterTask, Integer> {

	List<ScatterTask> findByLessonId(Integer lessonId);

	@Transactional
	void deleteByLessonId(Integer lessonId);
}
