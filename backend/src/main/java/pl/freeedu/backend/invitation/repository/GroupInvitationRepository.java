package pl.freeedu.backend.invitation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.invitation.model.GroupInvitation;

import java.util.List;
import java.util.Optional;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Integer> {

	Optional<GroupInvitation> findByToken(String token);

	List<GroupInvitation> findByGroupIdOrderByCreatedAtDesc(Integer groupId);

	@Modifying
	@Transactional
	@Query("UPDATE GroupInvitation i SET i.usedCount = i.usedCount + 1 WHERE i.id = :id")
	void incrementUsedCount(@Param("id") Integer id);
}
