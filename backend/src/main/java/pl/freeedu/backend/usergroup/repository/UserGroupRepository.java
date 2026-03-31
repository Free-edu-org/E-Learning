package pl.freeedu.backend.usergroup.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.usergroup.model.UserGroup;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, Integer> {

	boolean existsByName(String name);

	List<UserGroup> findByTeacherId(Integer teacherId);
}
