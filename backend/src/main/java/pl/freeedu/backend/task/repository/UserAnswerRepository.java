package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.UserAnswer;

import java.util.List;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Integer> {

	List<UserAnswer> findByUserIdAndLessonId(Integer userId, Integer lessonId);

	@Query(value = """
			SELECT ua.task_type,
			       SUM(CASE WHEN ua.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_count,
			       SUM(CASE WHEN ua.is_correct = FALSE THEN 1 ELSE 0 END) AS wrong_count
			FROM user_answers ua
			WHERE ua.user_id = :userId
			GROUP BY ua.task_type
			""", nativeQuery = true)
	List<Object[]> getSkillBreakdownByUserId(@Param("userId") Integer userId);

	@Transactional
	void deleteByUserIdAndLessonId(Integer userId, Integer lessonId);
}
