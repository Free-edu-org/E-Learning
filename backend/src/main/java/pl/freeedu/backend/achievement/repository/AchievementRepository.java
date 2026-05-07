package pl.freeedu.backend.achievement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.achievement.model.Achievement;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Integer> {

	Optional<Achievement> findByCode(String code);

	boolean existsByCode(String code);

	List<Achievement> findAllByOrderBySortOrderAscIdAsc();

	List<Achievement> findByActiveTrueOrderBySortOrderAscIdAsc();
}
