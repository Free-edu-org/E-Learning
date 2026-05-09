package pl.freeedu.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.UserStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
	private String publicId;
	private String email;
	private String username;
	private Role role;
	private UserStatus status;
	private LocalDateTime createdAt;
	private String avatarUrl;
}
