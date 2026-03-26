package pl.freeedu.backend.admin.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.user.model.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStudentResponse {

	private Integer id;

	private String email;

	private String username;

	private Role role;

	private Integer teacherId;

	private String teacherName;

	private Integer groupId;

	private String groupName;

	private LocalDateTime createdAt;
}
