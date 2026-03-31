package pl.freeedu.backend.usergroup.dto;

import jakarta.validation.constraints.NotBlank;
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
	private String name;

	@NotBlank(message = "Description is required")
	private String description;

	private Integer teacherId;
}
