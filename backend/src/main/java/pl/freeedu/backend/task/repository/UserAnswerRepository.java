package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.UserAnswer;

import java.util.List;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Integer> {

	List<UserAnswer> findByUserIdAndLessonId(Integer userId, Integer lessonId);

	@Transactional
	void deleteByUserIdAndLessonId(Integer userId, Integer lessonId);
}
