package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WriteTaskRequest {

	@NotBlank(message = "Task is required")
	private String task;

	@NotBlank(message = "Correct answer is required")
	private String correctAnswer;

	private String hint;

	private String section;
}
