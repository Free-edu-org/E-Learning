package pl.freeedu.backend.student.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pl.freeedu.backend.achievement.event.PointsChangedEvent;
import pl.freeedu.backend.student.model.StudentPoint;
import pl.freeedu.backend.student.repository.StudentPointRepository;

@Service
public class PointService {

	private final StudentPointRepository repository;
	private final ApplicationEventPublisher applicationEventPublisher;

	public PointService(StudentPointRepository repository, ApplicationEventPublisher applicationEventPublisher) {
		this.repository = repository;
		this.applicationEventPublisher = applicationEventPublisher;
	}

	@Transactional
	public void addPointsForLessonResult(Integer lessonResultId, Integer userId, Integer points, String reason,
			Integer performedBy) {
		if (lessonResultId != null && repository.existsByLessonResultIdAndReason(lessonResultId, reason)) {
			return;
		}
		StudentPoint p = StudentPoint.builder().userId(userId).lessonResultId(lessonResultId).delta(points)
				.reason(reason).createdBy(performedBy).build();
		repository.save(p);
		publishPointsChanged(userId, points, reason);
	}

	@Transactional
	public void rollbackPointsForLessonResult(Integer lessonResultId, Integer userId, Integer performedBy) {
		if (lessonResultId == null) {
			return;
		}
		Integer sum = repository.sumDeltaByLessonResultId(lessonResultId);
		if (sum == null || sum == 0) {
			return;
		}
		StudentPoint correction = StudentPoint.builder().userId(userId).lessonResultId(lessonResultId).delta(-sum)
				.reason("LESSON_RESET").createdBy(performedBy).build();
		repository.save(correction);
		publishPointsChanged(userId, -sum, "LESSON_RESET");
	}

	public Integer getCurrentPoints(Integer userId) {
		Integer sum = repository.sumDeltaByUserId(userId);
		return sum == null ? 0 : sum;
	}

	private void publishPointsChanged(Integer userId, Integer delta, String reason) {
		applicationEventPublisher.publishEvent(new PointsChangedEvent(userId, delta, reason, getCurrentPoints(userId)));
	}
}
