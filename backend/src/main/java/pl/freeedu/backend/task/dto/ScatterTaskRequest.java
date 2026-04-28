package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScatterTaskRequest {

	@NotBlank(message = "Task is required")
	@Size(max = 300, message = "Task must be at most 300 characters long")
	private String task;

	@NotBlank(message = "Words are required")
	@Size(max = 600, message = "Words must be at most 600 characters long")
	private String words;

	@NotBlank(message = "Correct answer is required")
	@Size(max = 300, message = "Correct answer must be at most 300 characters long")
	private String correctAnswer;

	@Size(max = 200, message = "Hint must be at most 200 characters long")
	private String hint;

	@Size(max = 80, message = "Section must be at most 80 characters long")
	private String section;
}
