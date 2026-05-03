package pl.freeedu.backend.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.model.ChooseTask;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChooseTaskRepository extends JpaRepository<ChooseTask, Integer> {

	List<ChooseTask> findByLessonId(Integer lessonId);

	Optional<ChooseTask> findByPublicId(String publicId);

	@Transactional
	void deleteByLessonId(Integer lessonId);
}
