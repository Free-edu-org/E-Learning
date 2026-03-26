package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWriteTaskRequest {

	@NotBlank(message = "Task text is required")
	private String task;

	@NotBlank(message = "Correct answer is required")
	private String correctAnswer;

	private String hint;
	private String section;
}
