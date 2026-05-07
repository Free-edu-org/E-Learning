package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.UserLesson;
import pl.freeedu.backend.task.model.UserLessonStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLessonRepository extends JpaRepository<UserLesson, Integer> {

	Optional<UserLesson> findByUserIdAndLessonId(Integer userId, Integer lessonId);

	List<UserLesson> findByUserIdAndLessonIdIn(Integer userId, List<Integer> lessonIds);

	long countByUserIdAndStatus(Integer userId, UserLessonStatus status);

	@Query("SELECT COALESCE(AVG((ul.score * 100.0) / ul.maxScore), 0.0) " + "FROM UserLesson ul "
			+ "WHERE ul.userId = :userId AND ul.status = :status AND ul.maxScore > 0")
	Double findAveragePercentByUserIdAndStatus(@Param("userId") Integer userId,
			@Param("status") UserLessonStatus status);

	@Transactional
	void deleteByUserIdAndLessonId(Integer userId, Integer lessonId);
}
