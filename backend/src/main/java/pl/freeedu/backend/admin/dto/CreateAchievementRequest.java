package pl.freeedu.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.achievement.model.AchievementType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAchievementRequest {

	@NotBlank(message = "Code is required")
	@Size(max = 64, message = "Code must be at most 64 characters long")
	@Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Code must use uppercase snake case")
	private String code;

	@NotBlank(message = "Title is required")
	@Size(max = 255, message = "Title must be at most 255 characters long")
	private String title;

	@NotBlank(message = "Description is required")
	@Size(max = 255, message = "Description must be at most 255 characters long")
	private String description;

	@NotBlank(message = "Icon is required")
	@Size(max = 32, message = "Icon must be at most 32 characters long")
	private String icon;

	@NotBlank(message = "Color is required")
	@Size(max = 32, message = "Color must be at most 32 characters long")
	private String color;

	@NotNull(message = "Type is required")
	private AchievementType type;

	private Integer threshold;

	@NotNull(message = "Active flag is required")
	private Boolean active;

	@NotNull(message = "Sort order is required")
	@Min(value = 0, message = "Sort order must be greater than or equal to 0")
	private Integer sortOrder;
}
