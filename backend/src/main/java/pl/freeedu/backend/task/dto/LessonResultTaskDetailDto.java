package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResultTaskDetailDto {

	private String taskPublicId;
	private String taskType;
	private String section;
	private String taskText;
	private String hint;
	private String userAnswer;
	private String correctAnswer;
	private Boolean isCorrect;
	private String possibleAnswers;
	private String words;
	private Integer tabSwitchCount;
}
