package pl.freeedu.backend.lesson.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;

@ExtendWith(MockitoExtension.class)
class LessonPublicIdLookupServiceTest {

	@Mock
	private LessonRepository lessonRepository;

	@InjectMocks
	private LessonPublicIdLookupService lessonPublicIdLookupService;

	@Test
	void shouldReturnInternalIdWhenLessonExistsForPublicId() {
		// given
		Lesson lesson = Lesson.builder().id(15).publicId("lesson-public-id").build();
		when(lessonRepository.findByPublicId("lesson-public-id")).thenReturn(Optional.of(lesson));

		// when
		Integer internalId = lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id");

		// then
		assertEquals(15, internalId);
		verify(lessonRepository).findByPublicId("lesson-public-id");
	}

	@Test
	void shouldReturnLessonWhenLessonExistsForPublicId() {
		// given
		Lesson lesson = Lesson.builder().id(18).publicId("lesson-public-id").build();
		when(lessonRepository.findByPublicId("lesson-public-id")).thenReturn(Optional.of(lesson));

		// when
		Lesson foundLesson = lessonPublicIdLookupService.getRequiredLesson("lesson-public-id");

		// then
		assertSame(lesson, foundLesson);
		verify(lessonRepository).findByPublicId("lesson-public-id");
	}

	@Test
	void shouldThrowLessonNotFoundWhenPublicIdDoesNotExist() {
		// given
		when(lessonRepository.findByPublicId("missing-public-id")).thenReturn(Optional.empty());

		// when
		LessonException exception = assertThrows(LessonException.class,
				() -> lessonPublicIdLookupService.getRequiredInternalId("missing-public-id"));

		// then
		assertEquals(LessonErrorCode.LESSON_NOT_FOUND, exception.getErrorCode());
		verify(lessonRepository).findByPublicId("missing-public-id");
	}

	@Test
	void shouldNotFallbackToInternalIntegerIdWhenPathVariableLooksNumeric() {
		// given
		when(lessonRepository.findByPublicId("15")).thenReturn(Optional.empty());

		// when
		LessonException exception = assertThrows(LessonException.class,
				() -> lessonPublicIdLookupService.getRequiredInternalId("15"));

		// then
		assertEquals(LessonErrorCode.LESSON_NOT_FOUND, exception.getErrorCode());
		verify(lessonRepository).findByPublicId("15");
	}
}
