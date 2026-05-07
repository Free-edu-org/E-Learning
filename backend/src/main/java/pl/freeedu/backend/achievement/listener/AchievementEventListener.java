package pl.freeedu.backend.achievement.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import pl.freeedu.backend.achievement.event.AvatarChangedEvent;
import pl.freeedu.backend.achievement.event.LessonCompletedEvent;
import pl.freeedu.backend.achievement.event.StudentStatsChangedEvent;
import pl.freeedu.backend.student.service.StudentAchievementService;

@Slf4j
@Component
public class AchievementEventListener {

	private final StudentAchievementService studentAchievementService;

	public AchievementEventListener(StudentAchievementService studentAchievementService) {
		this.studentAchievementService = studentAchievementService;
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onLessonCompleted(LessonCompletedEvent event) {
		log.info("Received lesson completion event. User ID: {}, Lesson ID: {}, Lesson publicId: {}", event.userId(),
				event.lessonId(), event.lessonPublicId());
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onAvatarChanged(AvatarChangedEvent event) {
		log.info("Processing achievement check after avatar change. User ID: {}", event.userId());
		runAchievementCheck(event.userId(), "avatar change");
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void onStudentStatsChanged(StudentStatsChangedEvent event) {
		log.info("Processing achievement check after student stats change. User ID: {}, Reason: {}", event.userId(),
				event.reason());
		runAchievementCheck(event.userId(), "student stats change");
	}

	private void runAchievementCheck(Integer userId, String trigger) {
		try {
			studentAchievementService.checkAndUnlockAchievements(userId);
		} catch (Exception ex) {
			log.error("Achievement unlock check failed after {}. User ID: {}", trigger, userId, ex);
		}
	}
}
