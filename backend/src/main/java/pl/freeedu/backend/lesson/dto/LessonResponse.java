package pl.freeedu.backend.lesson.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {

	private String publicId;
	private String title;
	private String theme;
	private Boolean isActive;
	private String teacherPublicId;
	private String teacherName;
	private String teacherAvatarUrl;
	private LocalDateTime createdAt;

	// aggregated groups assigned to lesson
	private List<GroupDto> groups;

	// file attachments (up to 5)
	private List<LessonAttachmentResponse> attachments;
}
