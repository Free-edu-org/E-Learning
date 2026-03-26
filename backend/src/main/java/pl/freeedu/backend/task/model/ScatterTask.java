package pl.freeedu.backend.task.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "scatter_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScatterTask {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String task;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String words;

	@Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
	private String correctAnswer;

	@Column(columnDefinition = "TEXT")
	private String hint;

	@Column(length = 255)
	private String section;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
