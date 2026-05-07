package pl.freeedu.backend.student.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_points")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentPoint {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "lesson_result_id")
	private Integer lessonResultId;

	@Column(nullable = false)
	private Integer delta;

	@Column(nullable = false)
	private String reason;

	@Column(name = "created_by")
	private Integer createdBy;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
