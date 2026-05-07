package pl.freeedu.backend.achievement.event;

/**
 * Generic domain event for changes that may affect rule-based achievement
 * evaluation. Publish this whenever student stats used by achievement rules
 * change.
 */
public record StudentStatsChangedEvent(Integer userId, String reason) {
}
