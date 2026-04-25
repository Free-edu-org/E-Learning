package pl.freeedu.backend.teacher.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.teacher.dto.LessonStatsStudentResult;

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

	@SuppressWarnings("unchecked")
	public List<LessonStatsStudentResult> getLessonStudentResults(Integer lessonId, Integer teacherId) {
		List<Object[]> rows = entityManager.createNativeQuery("SELECT u.id, u.username, MAX(ua.created_at), "
				+ "SUM(CASE WHEN ua.is_correct = TRUE THEN 1 ELSE 0 END), " + "COUNT(*), "
				+ "(SUM(CASE WHEN ua.is_correct = TRUE THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*)), u.avatar_url "
				+ "FROM user_answers ua " + "INNER JOIN users u ON ua.user_id = u.id "
				+ "INNER JOIN lessons l ON ua.lesson_id = l.id "
				+ "WHERE ua.lesson_id = :lessonId AND l.teacher_id = :teacherId "
				+ "GROUP BY u.id, u.username, u.avatar_url "
				+ "ORDER BY (SUM(CASE WHEN ua.is_correct = TRUE THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*)) DESC")
				.setParameter("lessonId", lessonId).setParameter("teacherId", teacherId).getResultList();

		return rows.stream().map(row -> LessonStatsStudentResult
				.builder().userId(((Number) row[0]).intValue()).username(
						(String) row[1])
				.completedAt(row[2] != null
						? (row[2] instanceof java.sql.Timestamp ts
								? ts.toInstant()
								: ((java.time.LocalDateTime) row[2]).toInstant(java.time.ZoneOffset.UTC))
						: null)
				.score(((Number) row[3]).intValue()).maxScore(((Number) row[4]).intValue())
				.resultPercent(((Number) row[5]).doubleValue()).avatarUrl((String) row[6]).build()).toList();
	}
}
