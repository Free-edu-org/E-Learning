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
public class SpeakTaskRequest {

	@NotBlank(message = "Expected text is required")
	@Size(max = 300, message = "Expected text must be at most 300 characters long")
	private String expectedText;

	@Size(max = 200, message = "Hint must be at most 200 characters long")
	private String hint;

	@Size(max = 80, message = "Section must be at most 80 characters long")
	private String section;
}
