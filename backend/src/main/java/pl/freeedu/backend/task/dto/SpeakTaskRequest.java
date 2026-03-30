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
public class SpeakTaskRequest {

	@NotBlank(message = "Task is required")
	private String task;

	private String hint;

	private String section;
}
