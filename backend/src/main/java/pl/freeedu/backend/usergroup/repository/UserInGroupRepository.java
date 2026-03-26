package pl.freeedu.backend.usergroup.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.usergroup.model.UserInGroup;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserInGroupRepository extends JpaRepository<UserInGroup, Integer> {

	int countByGroupId(Integer groupId);

	boolean existsByUserId(Integer userId);

	boolean existsByUserIdAndGroupId(Integer userId, Integer groupId);

	Optional<UserInGroup> findByUserIdAndGroupId(Integer userId, Integer groupId);

	@Transactional
	void deleteByGroupId(Integer groupId);

	@Query("SELECT u.groupId as groupId, COUNT(u) as count FROM UserInGroup u GROUP BY u.groupId")
	List<GroupCountProjection> countAllByGroupId();

	@Query("SELECT u.userId FROM UserInGroup u WHERE u.groupId = :groupId")
	List<Integer> findUserIdsByGroupId(Integer groupId);

	interface GroupCountProjection {
		Integer getGroupId();
		Long getCount();
	}
}
