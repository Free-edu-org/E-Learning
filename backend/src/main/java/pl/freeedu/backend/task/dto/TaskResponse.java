package pl.freeedu.backend.task.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {

	private Integer id;
	private String taskType;
	private String task;
	private String hint;
	private String section;

	// choose_tasks only
	private String possibleAnswers;

	// scatter_tasks only
	private String words;

	// ADMIN-only fields (null for students)
	private Integer correctAnswerIndex;
	private String correctAnswerText;
}
