package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChooseTaskRequest {

	@NotBlank(message = "Task text is required")
	private String task;

	@NotBlank(message = "Possible answers are required")
	private String possibleAnswers;

	@NotNull(message = "Correct answer index is required")
	private Integer correctAnswer;

	private String hint;
	private String section;
}
