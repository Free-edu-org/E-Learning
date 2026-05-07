package pl.freeedu.backend.achievement.listener;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.achievement.event.AvatarChangedEvent;
import pl.freeedu.backend.achievement.event.StudentStatsChangedEvent;
import pl.freeedu.backend.student.service.StudentAchievementService;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AchievementEventListenerTest {

	@Mock
	private StudentAchievementService studentAchievementService;

	@InjectMocks
	private AchievementEventListener achievementEventListener;

	@Test
	void shouldInvokeAchievementCheckWhenAvatarChangedEventIsHandled() {
		// given
		AvatarChangedEvent event = new AvatarChangedEvent(7);

		// when
		achievementEventListener.onAvatarChanged(event);

		// then
		verify(studentAchievementService).checkAndUnlockAchievements(7);
	}

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
	void shouldNotPropagateFailureFromAchievementCheck() {
		// given
		AvatarChangedEvent event = new AvatarChangedEvent(7);
		doThrow(new RuntimeException("boom")).when(studentAchievementService).checkAndUnlockAchievements(7);

		// when / then
		assertDoesNotThrow(() -> achievementEventListener.onAvatarChanged(event));
		verify(studentAchievementService).checkAndUnlockAchievements(7);
	}
}
