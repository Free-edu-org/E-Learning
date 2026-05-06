package pl.freeedu.backend.student.service;

import lombok.Builder;

@Builder
public record StudentGamificationStats(long completedLessonsCount, int currentPoints, boolean avatarChanged) {
}
