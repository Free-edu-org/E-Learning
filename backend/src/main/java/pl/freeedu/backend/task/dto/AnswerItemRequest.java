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
public class AnswerItemRequest {

	@NotBlank(message = "Task publicId is required")
	private String taskPublicId;

	@NotBlank(message = "Task type is required")
	private String taskType;

	@NotBlank(message = "Answer is required")
	private String answer;
}
