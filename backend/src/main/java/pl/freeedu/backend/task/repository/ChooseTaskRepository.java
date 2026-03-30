package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.ChooseTask;

import java.util.List;

@Repository
public interface ChooseTaskRepository extends JpaRepository<ChooseTask, Integer> {

	List<ChooseTask> findByLessonId(Integer lessonId);

	@Transactional
	void deleteByLessonId(Integer lessonId);
}
