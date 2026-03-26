package pl.freeedu.backend.lesson.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.lesson.model.UserHasLesson;

import java.util.List;

@Repository
public interface UserHasLessonRepository extends JpaRepository<UserHasLesson, Integer> {

	@Query("SELECT uhl.lessonId FROM UserHasLesson uhl WHERE uhl.userId = :userId")
	List<Integer> findLessonIdsByUserId(Integer userId);

	@Query("SELECT uhl.userId FROM UserHasLesson uhl WHERE uhl.lessonId = :lessonId")
	List<Integer> findUserIdsByLessonId(Integer lessonId);

	@Transactional
	@Modifying
	void deleteByUserIdAndLessonId(Integer userId, Integer lessonId);

	@Transactional
	@Modifying
	void deleteByLessonId(Integer lessonId);

	boolean existsByUserIdAndLessonId(Integer userId, Integer lessonId);
}
