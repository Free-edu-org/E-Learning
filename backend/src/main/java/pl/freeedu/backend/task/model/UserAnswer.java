package pl.freeedu.backend.task.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "task_id", nullable = false)
	private Integer taskId;

	@Column(name = "task_type", nullable = false, length = 50)
	private String taskType;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String answer;

	@Column(name = "is_correct", nullable = false)
	private Boolean isCorrect;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
