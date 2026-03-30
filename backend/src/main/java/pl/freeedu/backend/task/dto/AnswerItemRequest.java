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
public class AnswerItemRequest {

	@NotNull(message = "Task ID is required")
	private Integer taskId;

	@NotBlank(message = "Task type is required")
	private String taskType;

	@NotBlank(message = "Answer is required")
	private String answer;
}
