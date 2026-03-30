package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChooseTaskResponse {

	private Integer id;
	private Integer lessonId;
	private String task;
	private String possibleAnswers;
	private Integer correctAnswer;
	private String hint;
	private String section;
	private LocalDateTime createdAt;
}
