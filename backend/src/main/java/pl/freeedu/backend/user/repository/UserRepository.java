package pl.freeedu.backend.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
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

	List<User> findByTeacherIdAndRole(Integer teacherId, Role role);

	List<User> findByRoleOrderByCreatedAtDesc(Role role);

	long countByRole(Role role);
}
