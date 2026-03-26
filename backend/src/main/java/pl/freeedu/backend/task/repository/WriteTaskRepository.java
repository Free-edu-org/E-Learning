package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.task.model.WriteTask;

import java.util.List;

@Repository
public interface WriteTaskRepository extends JpaRepository<WriteTask, Integer> {

	List<WriteTask> findByLessonId(Integer lessonId);
}
