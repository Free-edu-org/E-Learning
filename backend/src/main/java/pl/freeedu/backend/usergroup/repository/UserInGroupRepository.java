package pl.freeedu.backend.usergroup.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.usergroup.model.UserInGroup;

import java.util.Optional;

@Repository
public interface UserInGroupRepository extends JpaRepository<UserInGroup, Integer> {

	int countByGroupId(Integer groupId);

	boolean existsByUserId(Integer userId);

	boolean existsByUserIdAndGroupId(Integer userId, Integer groupId);

	Optional<UserInGroup> findByUserIdAndGroupId(Integer userId, Integer groupId);

	void deleteByGroupId(Integer groupId);
}
