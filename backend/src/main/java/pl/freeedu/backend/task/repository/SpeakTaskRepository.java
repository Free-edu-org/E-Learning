package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.SpeakTask;

import java.util.List;

@Repository
public interface SpeakTaskRepository extends JpaRepository<SpeakTask, Integer> {

	List<SpeakTask> findByLessonId(Integer lessonId);

	@Transactional
	void deleteByLessonId(Integer lessonId);
}
