package pl.freeedu.backend.lesson.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_has_lesson")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserHasLesson {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
