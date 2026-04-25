package pl.freeedu.backend.teacher.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStudentResponse {
	private Integer id;
	private String username;
	private String email;
	private String role;
	private LocalDateTime createdAt;
	private Integer groupId;
	private String avatarUrl;
}
