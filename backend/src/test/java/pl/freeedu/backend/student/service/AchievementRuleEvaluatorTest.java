package pl.freeedu.backend.student.service;

import org.junit.jupiter.api.Test;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.AchievementType;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AchievementRuleEvaluatorTest {

	private final AchievementRuleEvaluator evaluator = new AchievementRuleEvaluator();

	@Test
	void shouldReturnFalseForLessonsCompletedWhenCompletedLessonsBelowThreshold() {
		assertFalse(evaluator.isUnlocked(achievement(AchievementType.LESSONS_COMPLETED, 1), stats(0, 0, false)));
	}

	@Test
	void shouldReturnTrueForLessonsCompletedWhenCompletedLessonsMeetThreshold() {
		assertTrue(evaluator.isUnlocked(achievement(AchievementType.LESSONS_COMPLETED, 1), stats(1, 0, false)));
	}

	@Test
	void shouldReturnFalseForLessonsCompletedThresholdFiveWhenCompletedLessonsAreFour() {
		assertFalse(evaluator.isUnlocked(achievement(AchievementType.LESSONS_COMPLETED, 5), stats(4, 0, false)));
	}

	@Test
	void shouldReturnFalseForPointsWhenPointsBelowThreshold() {
		assertFalse(evaluator.isUnlocked(achievement(AchievementType.POINTS, 10), stats(0, 9, false)));
	}

	@Test
	void shouldReturnTrueForPointsWhenPointsMeetThreshold() {
		assertTrue(evaluator.isUnlocked(achievement(AchievementType.POINTS, 10), stats(0, 10, false)));
	}

	@Test
	void shouldReturnFalseForAvatarChangedWhenAvatarWasNotChanged() {
		assertFalse(evaluator.isUnlocked(achievement(AchievementType.AVATAR_CHANGED, null), stats(0, 0, false)));
	}

	@Test
	void shouldReturnTrueForAvatarChangedWhenAvatarWasChanged() {
		assertTrue(evaluator.isUnlocked(achievement(AchievementType.AVATAR_CHANGED, null), stats(0, 0, true)));
	}

	@Test
	void shouldRejectLessonsCompletedWithoutPositiveThreshold() {
		assertThrows(IllegalArgumentException.class,
				() -> evaluator.isUnlocked(achievement(AchievementType.LESSONS_COMPLETED, 0), stats(0, 0, false)));
	}

	@Test
	void shouldRejectPointsWithoutPositiveThreshold() {
		assertThrows(IllegalArgumentException.class,
				() -> evaluator.isUnlocked(achievement(AchievementType.POINTS, null), stats(0, 0, false)));
	}

	private Achievement achievement(AchievementType type, Integer threshold) {
		return Achievement.builder().id(1).code("TEST").name("Test").description("Test").icon("").color("info")
				.type(type).threshold(threshold).active(true).build();
	}

	private StudentGamificationStats stats(long completedLessons, int points, boolean avatarChanged) {
		return StudentGamificationStats.builder().completedLessonsCount(completedLessons).currentPoints(points)
				.avatarChanged(avatarChanged).build();
	}
}
