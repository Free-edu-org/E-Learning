package pl.freeedu.backend.lesson.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonAttachment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(name = "original_file_name", nullable = false)
	private String originalFileName;

	@Column(name = "stored_file_name", nullable = false)
	private String storedFileName;

	@Column(name = "content_type", nullable = false)
	private String contentType;

	@Column(name = "file_size", nullable = false)
	private Long fileSize;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
