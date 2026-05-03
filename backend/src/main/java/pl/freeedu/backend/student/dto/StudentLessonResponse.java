package pl.freeedu.backend.student.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.lesson.dto.GroupDto;
import pl.freeedu.backend.lesson.dto.LessonAttachmentResponse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentLessonResponse {

	private String publicId;
	private String title;
	private String theme;
	private Boolean isActive;
	private Integer teacherId;
	private String teacherName;
	private String teacherAvatarUrl;
	private LocalDateTime createdAt;
	private List<GroupDto> groups;
	private String status;
	private Integer score;
	private Integer maxScore;
	private Double resultPercent;
	private List<LessonAttachmentResponse> attachments;
}
