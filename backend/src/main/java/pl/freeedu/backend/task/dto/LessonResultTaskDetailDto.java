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
public class LessonResultTaskDetailDto {

	private String taskPublicId;
	private String taskType;
	private String section;
	private String taskText;
	private String hint;
	private String userAnswer;
	private String correctAnswer;
	private List<String> correctAnswers;
	private Boolean isCorrect;
	private Boolean originalIsCorrect;
	private Boolean manuallyReviewed;
	private String reviewStatus;
	private String possibleAnswers;
	private String words;
	private Integer tabSwitchCount;
}
