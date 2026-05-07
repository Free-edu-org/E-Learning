package pl.freeedu.backend.achievement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.achievement.model.UserAchievement;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Integer> {

	List<UserAchievement> findByUserId(Integer userId);

	@Transactional
	@Modifying
	@Query("""
			UPDATE UserAchievement ua
			SET ua.notificationSeenAt = :seenAt
			WHERE ua.userId = :userId AND ua.notificationSeenAt IS NULL
			""")
	int markNotificationsSeenByUserId(@Param("userId") Integer userId, @Param("seenAt") LocalDateTime seenAt);
}
