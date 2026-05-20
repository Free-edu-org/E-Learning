package pl.freeedu.backend.task.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.freeedu.backend.task.model.SpeakAttempt;

public interface SpeakAttemptRepository extends JpaRepository<SpeakAttempt, Integer> {

	Optional<SpeakAttempt> findByPublicId(String publicId);

	long countByUserLessonIdAndTaskIdAndSubmittedAtIsNull(Integer userLessonId, Integer taskId);

	void deleteByUserLessonId(Integer userLessonId);

	long deleteBySubmittedAtIsNullAndCreatedAtBefore(LocalDateTime cutoff);
}
