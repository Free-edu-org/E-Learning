package pl.freeedu.backend.task.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResultItem {

	private Integer taskId;
	private String taskType;
	private Boolean isCorrect;
}
