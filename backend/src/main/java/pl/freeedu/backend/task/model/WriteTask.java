package pl.freeedu.backend.task.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "write_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WriteTask {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "public_id", unique = true, nullable = false)
	@Builder.Default
	private String publicId = UUID.randomUUID().toString();

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String task;

	@Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
	private String correctAnswer;

	@Column(columnDefinition = "TEXT")
	private String hint;

	@Column(name = "section")
	private String section;

	@Column(name = "hint_image_file_name")
	private String hintImageFileName;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	private void ensurePublicId() {
		if (publicId == null || publicId.isBlank()) {
			publicId = UUID.randomUUID().toString();
		}
	}
}
