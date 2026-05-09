package pl.freeedu.backend.accountinvitation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivateAccountRequest {

	@NotBlank(message = "Token is required")
	private String token;

	@NotBlank(message = "Username is required")
	@Size(max = 50, message = "Username must be at most 50 characters long")
	private String username;

	@NotBlank(message = "Password is required")
	@Size(min = 6, message = "Password must be at least 6 characters long")
	private String password;
}
