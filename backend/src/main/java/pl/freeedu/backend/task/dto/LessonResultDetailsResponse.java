package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResultDetailsResponse {

	private String lessonPublicId;
	private String lessonTitle;
	private Integer userId;
	private String username;
	private Integer score;
	private Integer maxScore;
	private Double resultPercent;
	private LocalDateTime completedAt;
	private List<LessonResultTaskDetailDto> tasks;
}
