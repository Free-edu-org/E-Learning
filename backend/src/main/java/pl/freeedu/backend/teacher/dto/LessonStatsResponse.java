package pl.freeedu.backend.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonStatsResponse {

	private Double avgScore;
	private Integer studentsCompleted;
	private Double bestScore;
	private List<LessonStatsStudentResult> studentResults;
}
