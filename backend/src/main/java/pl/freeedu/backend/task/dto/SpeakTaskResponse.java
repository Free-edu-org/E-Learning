package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakTaskResponse {

	private String publicId;
	private String lessonPublicId;
	private String task;
	private String expectedText;
	private String hint;
	private String hintImageUrl;
	private String section;
	private LocalDateTime createdAt;
}
