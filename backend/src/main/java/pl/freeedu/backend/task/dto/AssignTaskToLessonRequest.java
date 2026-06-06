package pl.freeedu.backend.task.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTaskToLessonRequest {

	@NotEmpty(message = "At least one lesson publicId is required")
	private java.util.List<String> lessonPublicIds;
}
