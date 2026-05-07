package pl.freeedu.backend.student.service;

public interface PointsService {
	void addPointsForLessonResult(Integer lessonResultId, Integer userId, Integer points, String reason,
			Integer performedBy);
	void rollbackPointsForLessonResult(Integer lessonResultId, Integer userId, Integer performedBy);
	Integer getCurrentPoints(Integer userId);
}
