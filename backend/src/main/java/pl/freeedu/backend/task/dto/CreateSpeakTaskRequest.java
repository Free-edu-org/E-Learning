package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSpeakTaskRequest {

	@NotBlank(message = "Task text is required")
	private String task;

	private String hint;
	private String section;
}
