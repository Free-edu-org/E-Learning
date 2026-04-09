package pl.freeedu.backend.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentStatsResponse {

	private Integer totalLessons;
	private Integer completedLessons;
	private Integer inProgressLessons;
	private Double averageScore;
}
