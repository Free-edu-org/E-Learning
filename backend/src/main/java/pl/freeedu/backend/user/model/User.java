package pl.freeedu.backend.user.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "public_id", nullable = false, unique = true, updatable = false)
	private String publicId;

	@Column(nullable = false, unique = true)
	private String email;

	@Column
	private String username;

	@Column
	private String password;

	@Column(name = "token_version", nullable = false)
	@Builder.Default
	private Integer tokenVersion = 0;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Role role;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private UserStatus status = UserStatus.ACTIVE;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "avatar_url")
	private String avatarUrl;

	@PrePersist
	void ensurePublicId() {
		if (publicId == null || publicId.isBlank()) {
			publicId = java.util.UUID.randomUUID().toString();
		}
	}
}
