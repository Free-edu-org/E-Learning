package pl.freeedu.backend.emailverification.repository;

import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.freeedu.backend.emailverification.model.EmailVerificationToken;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

	Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

	@Modifying
	@Transactional
	@Query("""
			UPDATE EmailVerificationToken evt
			SET evt.usedAt = :usedAt
			WHERE evt.userId = :userId
			  AND evt.usedAt IS NULL
			  AND evt.expiresAt > :now
			""")
	int invalidateActiveTokensForUser(@Param("userId") Integer userId, @Param("usedAt") LocalDateTime usedAt,
			@Param("now") LocalDateTime now);
}
