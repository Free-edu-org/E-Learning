package pl.freeedu.backend.task.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitResultResponse {

	private Integer lessonId;
	private Integer score;
	private Integer maxScore;
	private String status;
	private List<AnswerResultItem> results;
}
