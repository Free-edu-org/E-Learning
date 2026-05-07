package pl.freeedu.backend.achievement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.achievement.model.Achievement;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Integer> {

	List<Achievement> findByActiveTrueOrderBySortOrderAscIdAsc();
}
