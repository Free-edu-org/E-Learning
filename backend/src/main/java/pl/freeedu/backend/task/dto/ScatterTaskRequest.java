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

	private java.util.List<String> correctAnswers;

	@Size(max = 200, message = "Hint must be at most 200 characters long")
	private String hint;

	@Size(max = 80, message = "Section must be at most 80 characters long")
	private String section;

	@jakarta.validation.constraints.NotNull(message = "Points is required")
	@jakarta.validation.constraints.Min(value = 1, message = "Points must be at least 1")
	private Integer points;
}
