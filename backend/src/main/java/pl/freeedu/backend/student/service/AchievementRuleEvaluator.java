package pl.freeedu.backend.student.service;

import org.springframework.stereotype.Component;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.AchievementType;

@Component
public class AchievementRuleEvaluator {

	public boolean isUnlocked(Achievement achievement, StudentGamificationStats stats) {
		validateAchievement(achievement);

		return switch (achievement.getType()) {
			case LESSONS_COMPLETED -> stats.completedLessonsCount() >= achievement.getThreshold();
			case POINTS -> stats.currentPoints() >= achievement.getThreshold();
			case AVATAR_CHANGED -> stats.avatarChanged();
		};
	}

	public void validateAchievement(Achievement achievement) {
		AchievementType type = achievement.getType();
		Integer threshold = achievement.getThreshold();

		if (type == null) {
			throw new IllegalArgumentException("Achievement type is required");
		}

		switch (type) {
			case LESSONS_COMPLETED, POINTS -> {
				if (threshold == null || threshold <= 0) {
					throw new IllegalArgumentException("Achievement threshold must be greater than 0 for type " + type);
				}
			}
			case AVATAR_CHANGED -> {
				if (threshold != null) {
					throw new IllegalArgumentException("Achievement threshold must be null for type AVATAR_CHANGED");
				}
			}
		}
	}
}
