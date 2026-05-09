package pl.freeedu.backend.accountinvitation.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.accountinvitation.model.InvitationToken;

@Repository
public interface InvitationTokenRepository extends JpaRepository<InvitationToken, Long> {

	Optional<InvitationToken> findByTokenHash(String tokenHash);

	@Modifying
	@Transactional
	@Query("""
			UPDATE InvitationToken it
			SET it.usedAt = :usedAt
			WHERE it.userId = :userId
			  AND it.usedAt IS NULL
			""")
	int invalidateActiveTokensForUser(@Param("userId") Integer userId, @Param("usedAt") LocalDateTime usedAt);
}
