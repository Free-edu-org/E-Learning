package pl.freeedu.backend.task.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswersRequest {

	@NotNull(message = "Answers list is required")
	@Size(min = 1, message = "At least one answer is required")
	private List<@Valid SubmitAnswerItem> answers;
}
