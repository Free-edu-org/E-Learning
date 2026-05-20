package pl.freeedu.backend.achievement.listener;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.achievement.event.PointsChangedEvent;
import pl.freeedu.backend.achievement.event.StudentStatsChangedEvent;
import pl.freeedu.backend.student.service.StudentAchievementService;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AchievementEventListenerTest {

	@Mock
	private StudentAchievementService studentAchievementService;

	@InjectMocks
	private AchievementEventListener achievementEventListener;

	@Test
	void shouldInvokeAchievementCheckWhenStudentStatsChangedEventIsHandled() {
		// given
		StudentStatsChangedEvent event = new StudentStatsChangedEvent(7, "lesson-submitted");

		// when
		achievementEventListener.onStudentStatsChanged(event);

		// then
		verify(studentAchievementService).checkAndUnlockAchievements(7);
	}

	@Test
	void shouldInvokeAchievementCheckWhenPointsChangedEventIsHandled() {
		// given
		PointsChangedEvent event = new PointsChangedEvent(7, 3, "TASK_CORRECT", 10);

		// when
		achievementEventListener.onPointsChanged(event);

		// then
		verify(studentAchievementService).checkAndUnlockAchievements(7);
	}
}
