package pl.freeedu.backend.teacher.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.teacher.dto.LessonStatsStudentResult;
import pl.freeedu.backend.teacher.dto.TeacherStudentStatsResponse;

import java.util.List;

@Repository
public class TeacherStatsRepository {

	@PersistenceContext
	private EntityManager entityManager;

	public Long countTotalLessons(Integer teacherId) {
		return ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM lessons WHERE teacher_id = :tid")
				.setParameter("tid", teacherId).getSingleResult()).longValue();
	}

	public Long countActiveLessons(Integer teacherId) {
		return ((Number) entityManager
				.createNativeQuery("SELECT COUNT(*) FROM lessons WHERE is_active = TRUE AND teacher_id = :tid")
				.setParameter("tid", teacherId).getSingleResult()).longValue();
	}

	public Long countActiveStudents(Integer teacherId) {
		return ((Number) entityManager.createNativeQuery(
				"SELECT COUNT(DISTINCT uig.user_id) FROM user_in_group uig INNER JOIN group_has_lesson ghl ON uig.group_id = ghl.group_id INNER JOIN lessons l ON ghl.lesson_id = l.id WHERE l.teacher_id = :tid")
				.setParameter("tid", teacherId).getSingleResult()).longValue();
	}

	public Double calcAvgScore(Integer teacherId) {
		return ((Number) entityManager.createNativeQuery(
				"SELECT COALESCE(AVG(CASE WHEN ua.is_correct = TRUE THEN 100.0 ELSE 0.0 END), 0.0) FROM user_answers ua INNER JOIN lessons l ON ua.lesson_id = l.id WHERE l.teacher_id = :tid")
				.setParameter("tid", teacherId).getSingleResult()).doubleValue();
	}

	public Long countStudentTotalLessons(Integer studentId, Integer teacherId) {
		return ((Number) entityManager
				.createNativeQuery("SELECT COUNT(DISTINCT l.id) FROM lessons l "
						+ "INNER JOIN group_has_lesson ghl ON l.id = ghl.lesson_id "
						+ "INNER JOIN user_in_group uig ON ghl.group_id = uig.group_id "
						+ "WHERE uig.user_id = :studentId AND l.teacher_id = :teacherId")
				.setParameter("studentId", studentId).setParameter("teacherId", teacherId).getSingleResult())
				.longValue();
	}

	@SuppressWarnings("unchecked")
	public List<TeacherStudentStatsResponse.StudentLessonResult> getStudentLessonResults(Integer studentId,
			Integer teacherId) {
		List<Object[]> rows = entityManager.createNativeQuery("SELECT l.public_id, l.title, ul.score, ul.max_score, "
				+ "(ul.score * 100.0 / NULLIF(ul.max_score, 0)), ul.finished_at " + "FROM user_lessons ul "
				+ "INNER JOIN lessons l ON ul.lesson_id = l.id "
				+ "INNER JOIN group_has_lesson ghl ON l.id = ghl.lesson_id "
				+ "INNER JOIN user_in_group uig ON ghl.group_id = uig.group_id "
				+ "WHERE ul.user_id = :studentId AND ul.status = 'COMPLETED' "
				+ "AND l.teacher_id = :teacherId AND uig.user_id = :studentId " + "ORDER BY ul.finished_at DESC")
				.setParameter("studentId", studentId).setParameter("teacherId", teacherId).getResultList();
		return rows.stream()
				.map(row -> TeacherStudentStatsResponse.StudentLessonResult.builder().lessonPublicId((String) row[0])
						.lessonTitle((String) row[1]).score(row[2] != null ? ((Number) row[2]).intValue() : 0)
						.maxScore(row[3] != null ? ((Number) row[3]).intValue() : 0)
						.resultPercent(row[4] != null ? ((Number) row[4]).doubleValue() : 0.0)
						.completedAt(row[5] != null
								? (row[5] instanceof java.sql.Timestamp ts
										? ts.toLocalDateTime()
										: (java.time.LocalDateTime) row[5])
								: null)
						.build())
				.toList();
	}

	@SuppressWarnings("unchecked")
	public List<LessonStatsStudentResult> getLessonStudentResults(Integer lessonId, Integer teacherId) {
		List<Object[]> rows = entityManager.createNativeQuery("SELECT u.public_id, u.username, MAX(ua.created_at), "
				+ "SUM(CASE WHEN ua.is_correct = TRUE THEN 1 ELSE 0 END), " + "COUNT(*), "
				+ "(SUM(CASE WHEN ua.is_correct = TRUE THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*)), u.avatar_url, "
				+ "COALESCE((SELECT SUM(utae.switch_count) FROM user_task_attention_events utae "
				+ "WHERE utae.user_id = ua.user_id AND utae.lesson_id = ua.lesson_id), 0) " + "FROM user_answers ua "
				+ "INNER JOIN users u ON ua.user_id = u.id " + "INNER JOIN lessons l ON ua.lesson_id = l.id "
				+ "WHERE ua.lesson_id = :lessonId AND l.teacher_id = :teacherId "
				+ "GROUP BY u.public_id, u.username, u.avatar_url "
				+ "ORDER BY (SUM(CASE WHEN ua.is_correct = TRUE THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*)) DESC")
				.setParameter("lessonId", lessonId).setParameter("teacherId", teacherId).getResultList();

		return rows.stream().map(row -> LessonStatsStudentResult
				.builder().userPublicId((String) row[0]).username(
						(String) row[1])
				.completedAt(row[2] != null
						? (row[2] instanceof java.sql.Timestamp ts
								? ts.toInstant()
								: ((java.time.LocalDateTime) row[2]).toInstant(java.time.ZoneOffset.UTC))
						: null)
				.score(((Number) row[3]).intValue()).maxScore(((Number) row[4]).intValue())
				.resultPercent(((Number) row[5]).doubleValue()).avatarUrl((String) row[6])
				.totalTabSwitchCount(((Number) row[7]).intValue()).build()).toList();
	}
}
