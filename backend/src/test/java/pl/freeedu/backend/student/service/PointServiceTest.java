package pl.freeedu.backend.student.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

import pl.freeedu.backend.achievement.event.PointsChangedEvent;
import pl.freeedu.backend.student.model.StudentPoint;
import pl.freeedu.backend.student.repository.StudentPointRepository;

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
		when(studentPointRepository.sumDeltaByUserId(7)).thenReturn(5);

		// when
		pointService.addPointsForLessonResult(11, 7, 3, "TASK_CORRECT", 7);

		// then
		verify(studentPointRepository).save(any(StudentPoint.class));
		ArgumentCaptor<PointsChangedEvent> captor = ArgumentCaptor.forClass(PointsChangedEvent.class);
		verify(applicationEventPublisher).publishEvent(captor.capture());
		assertEquals(7, captor.getValue().userId());
		assertEquals(3, captor.getValue().delta());
		assertEquals("TASK_CORRECT", captor.getValue().reason());
		assertEquals(5, captor.getValue().currentPoints());
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
		when(studentPointRepository.sumDeltaByLessonResultId(11)).thenReturn(0);

		// when
		pointService.rollbackPointsForLessonResult(11, 7, null);

		// then
		verify(studentPointRepository, never()).save(any(StudentPoint.class));
		verify(applicationEventPublisher, never()).publishEvent(any());
	}
}