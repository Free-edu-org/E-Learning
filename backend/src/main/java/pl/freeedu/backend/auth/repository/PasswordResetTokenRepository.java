package pl.freeedu.backend.auth.repository;

import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.auth.model.PasswordResetToken;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

	Optional<PasswordResetToken> findByTokenHash(String tokenHash);

	@Modifying
	@Transactional
	@Query("""
			UPDATE PasswordResetToken prt
			SET prt.usedAt = :usedAt
			WHERE prt.userId = :userId
			  AND prt.usedAt IS NULL
			  AND prt.expiresAt > :now
			""")
	int invalidateActiveTokensForUser(@Param("userId") Integer userId, @Param("usedAt") LocalDateTime usedAt,
			@Param("now") LocalDateTime now);
}
