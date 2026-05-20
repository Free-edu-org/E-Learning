package pl.freeedu.backend.task.dto;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

class SpeakTranscriptionResponseApiContractTest {

	@Test
	void shouldExposeSpeakingEvaluationFieldsNeededByFrontend() {
		// given
		Set<String> fieldNames = fieldNames(SpeakTranscriptionResponse.class);

		// when
		// field set prepared above

		// then
		assertTrue(fieldNames.contains("attemptId"));
		assertTrue(fieldNames.contains("text"));
		assertTrue(fieldNames.contains("rawText"));
		assertTrue(fieldNames.contains("expectedText"));
		assertTrue(fieldNames.contains("correct"));
		assertTrue(fieldNames.contains("score"));
		assertTrue(fieldNames.contains("words"));
	}

	@Test
	void shouldNotExposeInternalDatabaseIdentifiersOnSpeakingEvaluationResponse() {
		// given
		Set<String> fieldNames = fieldNames(SpeakTranscriptionResponse.class);

		// when
		boolean exposesInternalId = fieldNames.contains("id") || fieldNames.contains("lessonId")
				|| fieldNames.contains("taskId") || fieldNames.contains("userLessonId");

		// then
		assertFalse(exposesInternalId);
	}

	private Set<String> fieldNames(Class<?> type) {
		return Arrays.stream(type.getDeclaredFields()).map(field -> field.getName()).collect(Collectors.toSet());
	}
}
