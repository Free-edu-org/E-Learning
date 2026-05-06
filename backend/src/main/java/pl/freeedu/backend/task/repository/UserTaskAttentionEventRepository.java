package pl.freeedu.backend.task.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.UserTaskAttentionEvent;

@Repository
public interface UserTaskAttentionEventRepository extends JpaRepository<UserTaskAttentionEvent, Integer> {

	Optional<UserTaskAttentionEvent> findByUserIdAndLessonIdAndTaskIdAndTaskType(Integer userId, Integer lessonId,
			Integer taskId, String taskType);

	List<UserTaskAttentionEvent> findByUserIdAndLessonId(Integer userId, Integer lessonId);

	@Transactional
	void deleteByUserIdAndLessonId(Integer userId, Integer lessonId);
}
