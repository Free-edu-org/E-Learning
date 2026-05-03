package pl.freeedu.backend.lesson.dto;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import pl.freeedu.backend.student.dto.StudentLessonResponse;
import pl.freeedu.backend.task.dto.ChooseTaskResponse;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.dto.LessonTasksResponse;
import pl.freeedu.backend.task.dto.ScatterTaskResponse;
import pl.freeedu.backend.task.dto.SpeakTaskResponse;
import pl.freeedu.backend.task.dto.WriteTaskResponse;

class LessonPublicApiContractTest {

	@Test
	void shouldExposePublicIdentifierOnLessonFacingDtos() {
		// given
		Set<String> lessonResponseFields = fieldNames(LessonResponse.class);
		Set<String> studentLessonResponseFields = fieldNames(StudentLessonResponse.class);
		Set<String> lessonTasksResponseFields = fieldNames(LessonTasksResponse.class);
		Set<String> lessonResultDetailsResponseFields = fieldNames(LessonResultDetailsResponse.class);
		Set<String> chooseTaskResponseFields = fieldNames(ChooseTaskResponse.class);
		Set<String> writeTaskResponseFields = fieldNames(WriteTaskResponse.class);
		Set<String> scatterTaskResponseFields = fieldNames(ScatterTaskResponse.class);
		Set<String> speakTaskResponseFields = fieldNames(SpeakTaskResponse.class);

		// when
		// field sets prepared above

		// then
		assertTrue(lessonResponseFields.contains("publicId"));
		assertTrue(studentLessonResponseFields.contains("publicId"));
		assertTrue(lessonTasksResponseFields.contains("lessonPublicId"));
		assertTrue(lessonResultDetailsResponseFields.contains("lessonPublicId"));
		assertTrue(chooseTaskResponseFields.contains("lessonPublicId"));
		assertTrue(writeTaskResponseFields.contains("lessonPublicId"));
		assertTrue(scatterTaskResponseFields.contains("lessonPublicId"));
		assertTrue(speakTaskResponseFields.contains("lessonPublicId"));
	}

	@Test
	void shouldNotExposeInternalLessonIdOnLessonFacingDtos() {
		// given
		Set<Class<?>> lessonFacingDtos = Set.of(LessonResponse.class, StudentLessonResponse.class,
				LessonTasksResponse.class, LessonResultDetailsResponse.class, ChooseTaskResponse.class,
				WriteTaskResponse.class, ScatterTaskResponse.class, SpeakTaskResponse.class);

		// when
		boolean anyDtoExposesInternalLessonId = lessonFacingDtos.stream().map(this::fieldNames)
				.anyMatch(fields -> fields.contains("lessonId") || fields.contains("id"));

		// then
		assertFalse(anyDtoExposesInternalLessonId);
	}

	private Set<String> fieldNames(Class<?> type) {
		return Arrays.stream(type.getDeclaredFields()).map(field -> field.getName()).collect(Collectors.toSet());
	}
}
