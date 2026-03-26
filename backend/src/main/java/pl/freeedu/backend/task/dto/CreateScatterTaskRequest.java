package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScatterTaskRequest {

	@NotBlank(message = "Task text is required")
	private String task;

	@NotBlank(message = "Words are required")
	private String words;

	@NotBlank(message = "Correct answer is required")
	private String correctAnswer;

	private String hint;
	private String section;
}
