package pl.freeedu.backend.task.model;

import lombok.Getter;

@Getter
public enum TaskType {

	SPEAK("speak_tasks", "speak"), CHOOSE("choose_tasks", "choose"), WRITE("write_tasks",
			"write"), SCATTER("scatter_tasks", "scatter");

	private final String tableName;
	private final String pathParam;

	TaskType(String tableName, String pathParam) {
		this.tableName = tableName;
		this.pathParam = pathParam;
	}

	public static TaskType fromPathParam(String param) {
		for (TaskType t : values()) {
			if (t.pathParam.equalsIgnoreCase(param)) {
				return t;
			}
		}
		throw new IllegalArgumentException("Unknown task type: " + param);
	}

	public static TaskType fromTableName(String name) {
		for (TaskType t : values()) {
			if (t.tableName.equalsIgnoreCase(name)) {
				return t;
			}
		}
		throw new IllegalArgumentException("Unknown task type table: " + name);
	}
}
