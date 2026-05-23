package pl.freeedu.backend.student.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pl.freeedu.backend.achievement.event.PointsChangedEvent;
import pl.freeedu.backend.student.model.StudentPoint;
import pl.freeedu.backend.student.repository.StudentPointRepository;

@Service
public class PointService {

	public static final String TASK_CORRECT_REASON = "TASK_CORRECT";
	public static final String LESSON_RESET_REASON = "LESSON_RESET";
	public static final String LESSON_REVIEW_ADJUSTMENT_REASON = "LESSON_REVIEW_ADJUSTMENT";

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
		if (repository.existsByLessonResultIdAndReason(lessonResultId, LESSON_RESET_REASON)) {
			return;
		}
		Integer sum = repository.sumDeltaByLessonResultId(lessonResultId);
		if (sum == null || sum == 0) {
			return;
		}
		StudentPoint correction = StudentPoint.builder().userId(userId).lessonResultId(lessonResultId).delta(-sum)
				.reason(LESSON_RESET_REASON).createdBy(performedBy).build();
		try {
			repository.save(correction);
		} catch (DataIntegrityViolationException ex) {
			return;
		}
		publishPointsChanged(userId, -sum, LESSON_RESET_REASON);
	}

	@Transactional
	public void reconcilePointsForLessonResult(Integer lessonResultId, Integer userId, Integer targetPoints,
			Integer performedBy) {
		if (lessonResultId == null) {
			return;
		}

		int currentPoints = getLessonResultPoints(lessonResultId);
		int deltaNeeded = targetPoints - currentPoints;
		if (deltaNeeded == 0) {
			return;
		}

		StudentPoint adjustment = repository
				.findByLessonResultIdAndReason(lessonResultId, LESSON_REVIEW_ADJUSTMENT_REASON)
				.orElseGet(() -> StudentPoint.builder().userId(userId).lessonResultId(lessonResultId)
						.reason(LESSON_REVIEW_ADJUSTMENT_REASON).createdBy(performedBy).delta(0).build());
		adjustment.setUserId(userId);
		adjustment.setCreatedBy(performedBy);
		adjustment.setDelta(adjustment.getDelta() + deltaNeeded);
		repository.save(adjustment);
		publishPointsChanged(userId, deltaNeeded, LESSON_REVIEW_ADJUSTMENT_REASON);
	}

	public Integer getCurrentPoints(Integer userId) {
		Integer sum = repository.sumDeltaByUserId(userId);
		return sum == null ? 0 : sum;
	}

	public Integer getLessonResultPoints(Integer lessonResultId) {
		Integer sum = repository.sumDeltaByLessonResultId(lessonResultId);
		return sum == null ? 0 : sum;
	}

	private void publishPointsChanged(Integer userId, Integer delta, String reason) {
		applicationEventPublisher.publishEvent(new PointsChangedEvent(userId, delta, reason, getCurrentPoints(userId)));
	}
}
