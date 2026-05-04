package pl.freeedu.backend.lesson.model;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class LessonPublicIdTest {

	@Test
	void shouldGenerateUniqueUuidPublicIdsWhenNewLessonsAreCreated() {
		// given
		Lesson firstLesson = Lesson.builder().id(10).title("Lesson 1").theme("Theme 1").isActive(true).build();
		Lesson secondLesson = Lesson.builder().id(11).title("Lesson 2").theme("Theme 2").isActive(true).build();

		// when
		firstLesson.ensurePublicId();
		secondLesson.ensurePublicId();

		// then
		assertNotNull(firstLesson.getPublicId());
		assertNotNull(secondLesson.getPublicId());
		assertFalse(firstLesson.getPublicId().isBlank());
		assertFalse(secondLesson.getPublicId().isBlank());
		assertDoesNotThrow(() -> UUID.fromString(firstLesson.getPublicId()));
		assertDoesNotThrow(() -> UUID.fromString(secondLesson.getPublicId()));
		assertNotEquals(firstLesson.getPublicId(), secondLesson.getPublicId());
		assertNotEquals(String.valueOf(firstLesson.getId()), firstLesson.getPublicId());
		assertNotEquals(String.valueOf(secondLesson.getId()), secondLesson.getPublicId());
	}

	@Test
	void shouldKeepExistingPublicIdWhenAlreadyProvided() {
		// given
		String existingPublicId = "11111111-1111-1111-1111-111111111111";
		Lesson lesson = Lesson.builder().id(22).publicId(existingPublicId).title("Lesson").theme("Theme").isActive(true)
				.build();

		// when
		lesson.ensurePublicId();

		// then
		assertNotEquals(String.valueOf(lesson.getId()), lesson.getPublicId());
		assertNotNull(lesson.getPublicId());
		assertNotEquals("", lesson.getPublicId());
		assertNotEquals(" ", lesson.getPublicId());
		assertNotEquals(UUID.randomUUID().toString(), lesson.getPublicId());
		assertNotEquals("22222222-2222-2222-2222-222222222222", lesson.getPublicId());
		org.junit.jupiter.api.Assertions.assertEquals(existingPublicId, lesson.getPublicId());
	}
}
