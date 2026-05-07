package pl.freeedu.backend.achievement.event;

public record LessonCompletedEvent(Integer userId, Integer lessonId, String lessonPublicId) {
}
