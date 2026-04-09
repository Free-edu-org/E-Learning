package pl.freeedu.backend.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgressResponse {

	private String summary;
	private Integer completedLessons;
	private Integer totalLessons;
	private Integer inProgressLessons;
	private Double averageScore;
}
