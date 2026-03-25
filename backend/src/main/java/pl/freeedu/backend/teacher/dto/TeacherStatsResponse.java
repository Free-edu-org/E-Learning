package pl.freeedu.backend.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStatsResponse {

	private Long totalLessons;

	private Long activeLessons;

	private Long activeStudents;

	private Double avgScore;
}
