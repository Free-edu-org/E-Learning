package pl.freeedu.backend.invitation.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_invitations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupInvitation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "group_id", nullable = false)
	private Integer groupId;

	@Column(name = "created_by", nullable = false)
	private Integer createdBy;

	@Column(nullable = false, unique = true, updatable = false)
	private String token;

	@Column(name = "max_uses", nullable = false)
	private Integer maxUses;

	@Column(name = "used_count", nullable = false)
	@Builder.Default
	private Integer usedCount = 0;

	@Column(name = "expires_at", nullable = false)
	private LocalDateTime expiresAt;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private Boolean isActive = true;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	void ensureToken() {
		if (token == null || token.isBlank()) {
			token = UUID.randomUUID().toString();
		}
	}
}
