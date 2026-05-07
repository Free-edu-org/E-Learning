package pl.freeedu.backend.student.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.student.model.StudentPoint;
import pl.freeedu.backend.student.repository.StudentPointRepository;
import pl.freeedu.backend.student.service.PointsService;

@Service
public class PointsServiceImpl implements PointsService {

	private final StudentPointRepository repository;

	public PointsServiceImpl(StudentPointRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional
	public void addPointsForLessonResult(Integer lessonResultId, Integer userId, Integer points, String reason,
			Integer performedBy) {
		if (lessonResultId != null && repository.existsByLessonResultIdAndReason(lessonResultId, reason)) {
			return; // idempotent: already applied
		}
		StudentPoint p = StudentPoint.builder().userId(userId).lessonResultId(lessonResultId).delta(points)
				.reason(reason).createdBy(performedBy).build();
		repository.save(p);
	}

	@Override
	@Transactional
	public void rollbackPointsForLessonResult(Integer lessonResultId, Integer userId, Integer performedBy) {
		if (lessonResultId == null)
			return;
		Integer sum = repository.sumDeltaByLessonResultId(lessonResultId);
		if (sum == null || sum == 0)
			return;
		StudentPoint correction = StudentPoint.builder().userId(userId).lessonResultId(lessonResultId).delta(-sum)
				.reason("LESSON_RESET").createdBy(performedBy).build();
		repository.save(correction);
	}

	@Override
	public Integer getCurrentPoints(Integer userId) {
		Integer sum = repository.sumDeltaByUserId(userId);
		return sum == null ? 0 : sum;
	}
}
