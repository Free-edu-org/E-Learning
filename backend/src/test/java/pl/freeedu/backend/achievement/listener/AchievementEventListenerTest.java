package pl.freeedu.backend.achievement.listener;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.achievement.event.AvatarChangedEvent;
import pl.freeedu.backend.achievement.event.LessonCompletedEvent;
import pl.freeedu.backend.achievement.event.StudentStatsChangedEvent;
import pl.freeedu.backend.student.service.StudentAchievementService;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AchievementEventListenerTest {

	@Mock
	private StudentAchievementService studentAchievementService;

	@InjectMocks
	private AchievementEventListener achievementEventListener;

	@Test
	void shouldInvokeAchievementCheckWhenLessonCompletedEventIsHandled() {
		// given
		LessonCompletedEvent event = new LessonCompletedEvent(7, 11, "lesson-public-id");

		// when
		achievementEventListener.onLessonCompleted(event);

		// then
		verify(studentAchievementService, never()).checkAndUnlockAchievements(7);
	}

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
}
