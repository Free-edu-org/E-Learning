package pl.freeedu.backend.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonStatsStudentResult {

	private Integer userId;
	private String username;
	private String completedAt;
	private Integer score;
	private Integer maxScore;
	private Double resultPercent;
}
