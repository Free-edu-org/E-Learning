package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChooseTaskRequest {

	@NotBlank(message = "Task is required")
	private String task;

	@NotBlank(message = "Possible answers are required")
	private String possibleAnswers;

	@NotNull(message = "Correct answer is required")
	private Integer correctAnswer;

	private String hint;

	private String section;
}
