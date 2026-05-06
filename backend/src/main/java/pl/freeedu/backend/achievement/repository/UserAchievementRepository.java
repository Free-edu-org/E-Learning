package pl.freeedu.backend.achievement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.achievement.model.UserAchievement;

import java.util.List;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Integer> {

	List<UserAchievement> findByUserId(Integer userId);

	boolean existsByUserIdAndAchievementId(Integer userId, Integer achievementId);
}
