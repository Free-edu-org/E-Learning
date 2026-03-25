package pl.freeedu.backend.teacher.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

@Repository
public class TeacherStatsRepository {

	@PersistenceContext
	private EntityManager entityManager;

	public Long countTotalLessons() {
		return ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM lessons").getSingleResult()).longValue();
	}

	public Long countActiveLessons() {
		return ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM lessons WHERE is_active = TRUE")
				.getSingleResult()).longValue();
	}

	public Long countActiveStudents() {
		return ((Number) entityManager.createNativeQuery(
				"SELECT COUNT(DISTINCT uig.user_id) FROM user_in_group uig INNER JOIN group_has_lesson ghl ON uig.group_id = ghl.group_id")
				.getSingleResult()).longValue();
	}

	public Double calcAvgScore() {
		return ((Number) entityManager.createNativeQuery(
				"SELECT COALESCE(AVG(CASE WHEN is_correct = TRUE THEN 100.0 ELSE 0.0 END), 0.0) FROM user_answers")
				.getSingleResult()).doubleValue();
	}
}
