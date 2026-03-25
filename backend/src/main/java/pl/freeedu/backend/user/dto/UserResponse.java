package pl.freeedu.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.user.model.Role;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
	private Integer id;
	private String email;
	private String username;
	private Role role;
	private LocalDateTime createdAt;
}
