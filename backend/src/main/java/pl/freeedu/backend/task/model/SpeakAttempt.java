package pl.freeedu.backend.task.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "speak_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakAttempt {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "public_id", unique = true, nullable = false)
	@Builder.Default
	private String publicId = UUID.randomUUID().toString();

	@Column(name = "user_id", nullable = false)
	private Integer userId;

	@Column(name = "lesson_id", nullable = false)
	private Integer lessonId;

	@Column(name = "task_id", nullable = false)
	private Integer taskId;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_lesson_id", nullable = false)
	private UserLesson userLesson;

	@Column(name = "expected_text", nullable = false, columnDefinition = "TEXT")
	private String expectedText;

	@Column(name = "raw_transcription", nullable = false, columnDefinition = "TEXT")
	private String rawTranscription;

	@Column(name = "matched_transcription", nullable = false, columnDefinition = "TEXT")
	private String matchedTranscription;

	@Column(name = "normalized_expected", nullable = false, columnDefinition = "TEXT")
	private String normalizedExpected;

	@Column(name = "normalized_actual", nullable = false, columnDefinition = "TEXT")
	private String normalizedActual;

	@Column(nullable = false)
	private Double score;

	@Column(name = "is_correct", nullable = false)
	private Boolean correct;

	@Column(name = "words_json", nullable = false, columnDefinition = "TEXT")
	private String wordsJson;

	@Column(length = 32)
	private String language;

	@Column
	private Double duration;

	@Column(name = "submitted_at")
	private LocalDateTime submittedAt;

	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	private void ensurePublicId() {
		if (publicId == null || publicId.isBlank()) {
			publicId = UUID.randomUUID().toString();
		}
	}
}
