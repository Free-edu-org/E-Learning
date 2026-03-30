package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitRequest {

	@NotNull(message = "Answers are required")
	private List<AnswerItemRequest> answers;
}
