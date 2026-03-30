package pl.freeedu.backend.task.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "speak_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakTask {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String task;

	@Column(columnDefinition = "TEXT")
	private String hint;

	@Column(name = "section")
	private String section;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
