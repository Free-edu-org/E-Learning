package pl.freeedu.backend.student.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;

import pl.freeedu.backend.achievement.event.PointsChangedEvent;
import pl.freeedu.backend.student.model.StudentPoint;
import pl.freeedu.backend.student.repository.StudentPointRepository;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class PointServiceTest {

	@Mock
	private StudentPointRepository studentPointRepository;
	@Mock
	private ApplicationEventPublisher applicationEventPublisher;

	private PointService pointService;

	@BeforeEach
	void setUp() {
		pointService = new PointService(studentPointRepository, applicationEventPublisher);
	}

	@Test
	void shouldSaveLedgerAndPublishEventWhenAddingPointsForLessonResult() {
		// given
		when(studentPointRepository.existsByLessonResultIdAndReason(11, "TASK_CORRECT")).thenReturn(false);
		when(studentPointRepository.sumDeltaByUserId(7)).thenReturn(8);

		// when
		pointService.addPointsForLessonResult(11, 7, 3, "TASK_CORRECT", 7);

		// then
		verify(studentPointRepository).save(any(StudentPoint.class));
		ArgumentCaptor<PointsChangedEvent> captor = ArgumentCaptor.forClass(PointsChangedEvent.class);
		verify(applicationEventPublisher).publishEvent(captor.capture());
		assertEquals(7, captor.getValue().userId());
		assertEquals(3, captor.getValue().delta());
		assertEquals("TASK_CORRECT", captor.getValue().reason());
		assertEquals(8, captor.getValue().currentPoints());
	}

	@Test
	void shouldBeIdempotentWhenPointsAlreadyExistForLessonResultAndReason() {
		// given
		when(studentPointRepository.existsByLessonResultIdAndReason(11, "TASK_CORRECT")).thenReturn(true);

		// when
		pointService.addPointsForLessonResult(11, 7, 3, "TASK_CORRECT", 7);

		// then
		verify(studentPointRepository, never()).save(any(StudentPoint.class));
		verify(applicationEventPublisher, never()).publishEvent(any());
	}

	@Test
	void shouldSaveNegativeCorrectionAndPublishEventWhenRollingBackLessonResultPoints() {
		// given
		when(studentPointRepository.existsByLessonResultIdAndReason(11, "LESSON_RESET")).thenReturn(false);
		when(studentPointRepository.sumDeltaByLessonResultId(11)).thenReturn(3);
		when(studentPointRepository.sumDeltaByUserId(7)).thenReturn(2);

		// when
		pointService.rollbackPointsForLessonResult(11, 7, null);

		// then
		verify(studentPointRepository).save(any(StudentPoint.class));
		ArgumentCaptor<PointsChangedEvent> captor = ArgumentCaptor.forClass(PointsChangedEvent.class);
		verify(applicationEventPublisher).publishEvent(captor.capture());
		assertEquals(-3, captor.getValue().delta());
		assertEquals("LESSON_RESET", captor.getValue().reason());
		assertEquals(2, captor.getValue().currentPoints());
	}

	@Test
	void shouldNotSaveAnythingWhenRollbackHasNoPoints() {
		// given
		when(studentPointRepository.existsByLessonResultIdAndReason(11, "LESSON_RESET")).thenReturn(false);
		when(studentPointRepository.sumDeltaByLessonResultId(11)).thenReturn(0);

		// when
		pointService.rollbackPointsForLessonResult(11, 7, null);

		// then
		verify(studentPointRepository, never()).save(any(StudentPoint.class));
		verify(applicationEventPublisher, never()).publishEvent(any());
	}

	@Test
	void shouldNotSaveAnythingWhenRollbackAlreadyExists() {
		// given
		when(studentPointRepository.existsByLessonResultIdAndReason(11, "LESSON_RESET")).thenReturn(true);

		// when
		pointService.rollbackPointsForLessonResult(11, 7, null);

		// then
		verify(studentPointRepository, never()).sumDeltaByLessonResultId(any());
		verify(studentPointRepository, never()).save(any(StudentPoint.class));
		verify(applicationEventPublisher, never()).publishEvent(any());
	}

	@Test
	void shouldIgnoreDuplicateRollbackInsertRaisedByConcurrentRequest() {
		// given
		when(studentPointRepository.existsByLessonResultIdAndReason(11, "LESSON_RESET")).thenReturn(false);
		when(studentPointRepository.sumDeltaByLessonResultId(11)).thenReturn(3);
		when(studentPointRepository.save(any(StudentPoint.class)))
				.thenThrow(new DataIntegrityViolationException("duplicate LESSON_RESET"));

		// when
		pointService.rollbackPointsForLessonResult(11, 7, null);

		// then
		verify(applicationEventPublisher, never()).publishEvent(any());
	}

	@Test
	void shouldCreateReviewAdjustmentWhenManualReviewChangesLessonPoints() {
		// given
		when(studentPointRepository.sumDeltaByLessonResultId(11)).thenReturn(0);
		when(studentPointRepository.findByLessonResultIdAndReason(11, PointService.LESSON_REVIEW_ADJUSTMENT_REASON))
				.thenReturn(Optional.empty());
		when(studentPointRepository.sumDeltaByUserId(7)).thenReturn(5);

		// when
		pointService.reconcilePointsForLessonResult(11, 7, 3, 10);

		// then
		ArgumentCaptor<StudentPoint> pointCaptor = ArgumentCaptor.forClass(StudentPoint.class);
		verify(studentPointRepository).save(pointCaptor.capture());
		assertEquals(11, pointCaptor.getValue().getLessonResultId());
		assertEquals(7, pointCaptor.getValue().getUserId());
		assertEquals(10, pointCaptor.getValue().getCreatedBy());
		assertEquals(PointService.LESSON_REVIEW_ADJUSTMENT_REASON, pointCaptor.getValue().getReason());
		assertEquals(3, pointCaptor.getValue().getDelta());

		ArgumentCaptor<PointsChangedEvent> eventCaptor = ArgumentCaptor.forClass(PointsChangedEvent.class);
		verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
		assertEquals(3, eventCaptor.getValue().delta());
		assertEquals(PointService.LESSON_REVIEW_ADJUSTMENT_REASON, eventCaptor.getValue().reason());
	}

	@Test
	void shouldAccumulateReviewAdjustmentWithoutPointDriftAcrossMultipleManualFlips() {
		// given
		StudentPoint adjustment = StudentPoint.builder().userId(7).lessonResultId(11)
				.reason(PointService.LESSON_REVIEW_ADJUSTMENT_REASON).createdBy(10).delta(1).build();
		when(studentPointRepository.sumDeltaByLessonResultId(11)).thenReturn(1, 0);
		when(studentPointRepository.findByLessonResultIdAndReason(11, PointService.LESSON_REVIEW_ADJUSTMENT_REASON))
				.thenReturn(Optional.of(adjustment));
		when(studentPointRepository.sumDeltaByUserId(7)).thenReturn(9, 8);

		// when
		pointService.reconcilePointsForLessonResult(11, 7, 0, 10);
		pointService.reconcilePointsForLessonResult(11, 7, 1, 10);

		// then
		ArgumentCaptor<StudentPoint> pointCaptor = ArgumentCaptor.forClass(StudentPoint.class);
		verify(studentPointRepository, org.mockito.Mockito.times(2)).save(pointCaptor.capture());
		assertSame(adjustment, pointCaptor.getAllValues().get(0));
		assertSame(adjustment, pointCaptor.getAllValues().get(1));
		assertEquals(1, adjustment.getDelta());

		ArgumentCaptor<PointsChangedEvent> eventCaptor = ArgumentCaptor.forClass(PointsChangedEvent.class);
		verify(applicationEventPublisher, org.mockito.Mockito.times(2)).publishEvent(eventCaptor.capture());
		assertEquals(-1, eventCaptor.getAllValues().get(0).delta());
		assertEquals(1, eventCaptor.getAllValues().get(1).delta());
	}
}
