package pl.freeedu.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

	@NotBlank(message = "Token is required")
	private String token;

	@NotBlank(message = "New password is required")
	private String newPassword;

	@NotBlank(message = "Confirm password is required")
	private String confirmPassword;
}
