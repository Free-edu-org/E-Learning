package pl.freeedu.backend.lesson.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonAttachmentResponse {

	private Integer id;
	private String originalFileName;
	private String contentType;
	private Long fileSize;
	private LocalDateTime createdAt;
}
