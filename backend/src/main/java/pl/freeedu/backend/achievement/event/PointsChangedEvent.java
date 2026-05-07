package pl.freeedu.backend.achievement.event;

public record PointsChangedEvent(Integer userId, Integer delta, String reason, Integer currentPoints) {
}