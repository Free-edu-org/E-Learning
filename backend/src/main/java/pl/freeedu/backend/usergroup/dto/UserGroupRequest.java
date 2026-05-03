package pl.freeedu.backend.usergroup.dto;

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
public class UserGroupRequest {

	@NotBlank(message = "Name is required")
	@Size(max = 60, message = "Name must be at most 60 characters long")
	private String name;

	@NotBlank(message = "Description is required")
	@Size(max = 300, message = "Description must be at most 300 characters long")
	private String description;

	private String teacherPublicId;
}
