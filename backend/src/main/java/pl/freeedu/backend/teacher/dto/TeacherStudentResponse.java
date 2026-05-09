package pl.freeedu.backend.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.user.model.UserStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStudentResponse {
	private String publicId;
	private String username;
	private String email;
	private String role;
	private UserStatus status;
	private LocalDateTime createdAt;
	private String groupPublicId;
	private String avatarUrl;
}
