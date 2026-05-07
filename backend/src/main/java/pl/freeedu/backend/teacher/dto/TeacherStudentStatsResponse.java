package pl.freeedu.backend.teacher.dto;

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
public class TeacherStudentStatsResponse {

	private TeacherStudentResponse student;
	private int totalLessons;
	private int completedLessons;
	private double avgScore;
	private List<StudentLessonResult> lessonResults;
	private List<ProgressPoint> progressHistory;
	private List<SkillStat> skillStats;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class StudentLessonResult {

		private String lessonPublicId;
		private String lessonTitle;
		private int score;
		private int maxScore;
		private double resultPercent;
		private LocalDateTime completedAt;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class ProgressPoint {

		private String date;
		private double progress;
	}

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class SkillStat {

		private String category;
		private int correct;
		private int wrong;
	}
}
