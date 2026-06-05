package pl.freeedu.backend.emailchange.repository;

import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.emailchange.model.EmailChangeToken;

@Repository
public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {

	Optional<EmailChangeToken> findByTokenHash(String tokenHash);

	@Modifying
	@Transactional
	@Query("""
			UPDATE EmailChangeToken ect
			SET ect.usedAt = :usedAt
			WHERE ect.userId = :userId
			  AND ect.usedAt IS NULL
			  AND ect.expiresAt > :now
			""")
	int invalidateActiveTokensForUser(@Param("userId") Integer userId, @Param("usedAt") LocalDateTime usedAt,
			@Param("now") LocalDateTime now);
}
