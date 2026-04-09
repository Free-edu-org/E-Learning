package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.UserLesson;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLessonRepository extends JpaRepository<UserLesson, Integer> {

	Optional<UserLesson> findByUserIdAndLessonId(Integer userId, Integer lessonId);

	List<UserLesson> findByUserIdAndLessonIdIn(Integer userId, List<Integer> lessonIds);

	@Transactional
	void deleteByUserIdAndLessonId(Integer userId, Integer lessonId);
}
