package pl.freeedu.backend.lesson.model;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum LessonLabelColor {
	GRAY("gray"), RED("red"), ORANGE("orange"), YELLOW("yellow"), GREEN("green"), BLUE("blue"), PURPLE("purple");

	private final String value;

	LessonLabelColor(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	public static boolean isValid(String value) {
		return Arrays.stream(values()).anyMatch(color -> color.value.equals(value));
	}

	public static Set<String> apiValues() {
		return Arrays.stream(values()).map(LessonLabelColor::getValue).collect(Collectors.toUnmodifiableSet());
	}
}
