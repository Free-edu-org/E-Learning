package pl.freeedu.backend.task.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

final class TaskAnswerUtils {

	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
	private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
	};
	private static final TypeReference<List<Integer>> INTEGER_LIST_TYPE = new TypeReference<>() {
	};

	private TaskAnswerUtils() {
	}

	static List<Integer> normalizeChooseAnswers(Integer legacyAnswer, List<Integer> requestedAnswers,
			String possibleAnswers) {
		List<Integer> answers = requestedAnswers != null && !requestedAnswers.isEmpty()
				? requestedAnswers
				: legacyAnswer != null ? List.of(legacyAnswer) : List.of();
		int optionCount = possibleAnswers == null
				? 0
				: (int) List.of(possibleAnswers.split("\\|")).stream().map(String::trim)
						.filter(value -> !value.isEmpty()).count();
		Set<Integer> distinct = new LinkedHashSet<>();
		for (Integer answer : answers) {
			if (answer == null || answer < 0 || answer >= optionCount || !distinct.add(answer)) {
				throw new TaskException(TaskErrorCode.INVALID_TASK_ANSWERS);
			}
		}
		if (distinct.isEmpty()) {
			throw new TaskException(TaskErrorCode.INVALID_TASK_ANSWERS);
		}
		return List.copyOf(distinct);
	}

	static List<String> normalizeTextAnswers(String legacyAnswer, List<String> requestedAnswers) {
		List<String> source = requestedAnswers != null && !requestedAnswers.isEmpty()
				? requestedAnswers
				: legacyAnswer != null ? List.of(legacyAnswer) : List.of();
		List<String> normalized = new ArrayList<>();
		Set<String> distinct = new LinkedHashSet<>();
		for (String answer : source) {
			if (answer == null || answer.trim().isEmpty() || answer.trim().length() > 300) {
				throw new TaskException(TaskErrorCode.INVALID_TASK_ANSWERS);
			}
			String trimmed = answer.trim();
			String key = trimmed.toLowerCase(Locale.ROOT);
			if (!distinct.add(key)) {
				throw new TaskException(TaskErrorCode.INVALID_TASK_ANSWERS);
			}
			normalized.add(trimmed);
		}
		if (normalized.isEmpty()) {
			throw new TaskException(TaskErrorCode.INVALID_TASK_ANSWERS);
		}
		return List.copyOf(normalized);
	}

	static List<String> normalizeSingleTextAnswer(String legacyAnswer, List<String> requestedAnswers) {
		List<String> normalized = normalizeTextAnswers(legacyAnswer, requestedAnswers);
		if (normalized.size() > 1) {
			throw new TaskException(TaskErrorCode.INVALID_TASK_ANSWERS);
		}
		return normalized;
	}

	static String serializeStringAnswers(List<String> answers) {
		try {
			return OBJECT_MAPPER.writeValueAsString(answers);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to serialize task answers", exception);
		}
	}

	static String serializeIntegerAnswers(List<Integer> answers) {
		try {
			return OBJECT_MAPPER.writeValueAsString(answers);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to serialize task answers", exception);
		}
	}

	static List<String> deserializeStringAnswers(String serializedAnswers, String fallbackAnswer) {
		if (serializedAnswers == null || serializedAnswers.isBlank()) {
			return fallbackAnswer == null || fallbackAnswer.isBlank() ? List.of() : List.of(fallbackAnswer);
		}
		try {
			return OBJECT_MAPPER.readValue(serializedAnswers, STRING_LIST_TYPE);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to deserialize task answers", exception);
		}
	}

	static List<Integer> deserializeIntegerAnswers(String serializedAnswers, Integer fallbackAnswer) {
		if (serializedAnswers == null || serializedAnswers.isBlank()) {
			return fallbackAnswer == null ? List.of() : List.of(fallbackAnswer);
		}
		try {
			return OBJECT_MAPPER.readValue(serializedAnswers, INTEGER_LIST_TYPE);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to deserialize task answers", exception);
		}
	}

	static boolean matchesAnyTextAnswer(String submittedAnswer, List<String> correctAnswers) {
		String normalizedSubmitted = submittedAnswer == null ? "" : submittedAnswer.trim();
		return correctAnswers.stream().anyMatch(answer -> normalizedSubmitted.equalsIgnoreCase(answer.trim()));
	}

	static boolean matchesAnyChooseAnswer(String submittedAnswer, List<Integer> correctAnswers) {
		String normalizedSubmitted = submittedAnswer == null ? "" : submittedAnswer.trim();
		return correctAnswers.stream().map(String::valueOf).anyMatch(normalizedSubmitted::equals);
	}
}
