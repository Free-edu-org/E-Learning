package pl.freeedu.backend.teacher.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

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
}
