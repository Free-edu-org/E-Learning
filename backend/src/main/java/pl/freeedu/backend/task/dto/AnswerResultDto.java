package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResultDto {

	private String taskPublicId;
	private String taskType;
	private Boolean isCorrect;
	private String correctAnswer;
	private List<String> correctAnswers;
}
