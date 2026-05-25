package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChooseTaskResponse {

	private String publicId;
	private String lessonPublicId;
	private String task;
	private String possibleAnswers;
	private List<Integer> correctAnswers;
	private String hint;
	private String hintImageUrl;
	private String section;
	private LocalDateTime createdAt;
}
