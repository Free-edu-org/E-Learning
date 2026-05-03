package pl.freeedu.backend.teacher.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonStatsStudentResult {

	private String userPublicId;
	private String username;
	private Instant completedAt;
	private Integer score;
	private Integer maxScore;
	private Double resultPercent;
	private String avatarUrl;
}
