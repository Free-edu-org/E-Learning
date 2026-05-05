package pl.freeedu.backend.task.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_task_attention_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTaskAttentionEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(name = "task_id", nullable = false)
	private Integer taskId;

	@Column(name = "task_type", nullable = false)
	private String taskType;

	@Column(name = "switch_count", nullable = false)
	private Integer switchCount;

	@Column(name = "last_switched_at")
	private LocalDateTime lastSwitchedAt;
}
