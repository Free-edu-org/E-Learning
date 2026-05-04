package pl.freeedu.backend.lesson.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonRequest {

	@NotBlank(message = "Title is required")
	@Size(max = 30, message = "Title must be at most 30 characters long")
	private String title;

	@NotBlank(message = "Theme is required")
	@Size(max = 120, message = "Theme must be at most 120 characters long")
	private String theme;

	// optional list of group public ids to assign this lesson to
	private List<String> groupPublicIds;
}
