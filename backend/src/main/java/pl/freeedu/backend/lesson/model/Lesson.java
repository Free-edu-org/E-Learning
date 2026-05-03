package pl.freeedu.backend.lesson.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

import pl.freeedu.backend.user.model.User;

@Entity
@Table(name = "lessons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "public_id", nullable = false, unique = true, length = 36)
	private String publicId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String theme;

	@Column(name = "is_active", nullable = false)
	private Boolean isActive;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	void ensurePublicId() {
		if (publicId == null || publicId.isBlank()) {
			publicId = UUID.randomUUID().toString();
		}
	}
}
