package pl.freeedu.backend.task.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_lessons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLesson {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private UserLessonStatus status;

	@Column
	private Integer score;

	@Column(name = "max_score")
	private Integer maxScore;

	@Column(name = "started_at", insertable = false, updatable = false)
	private LocalDateTime startedAt;

	@Column(name = "finished_at")
	private LocalDateTime finishedAt;
}
