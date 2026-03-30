package pl.freeedu.backend.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
	Optional<User> findByEmail(String email);

	Optional<User> findByUsername(String username);

	boolean existsByEmail(String email);

	boolean existsByUsername(String username);

	@Query("SELECT u FROM User u JOIN UserInGroup uig ON u.id = uig.userId JOIN UserGroup ug ON uig.groupId = ug.id WHERE ug.teacherId = :teacherId AND u.role = :role")
	List<User> findByGroupsTeacherIdAndRole(@Param("teacherId") Integer teacherId, @Param("role") Role role);

	List<User> findByRoleOrderByCreatedAtDesc(Role role);

	long countByRole(Role role);
}
