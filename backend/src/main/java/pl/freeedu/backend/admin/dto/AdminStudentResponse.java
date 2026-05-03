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

	private String publicId;

	private String email;

	private String username;

	private Role role;

	private String groupPublicId;

	private String groupName;

	private LocalDateTime createdAt;

	private String avatarUrl;
}
