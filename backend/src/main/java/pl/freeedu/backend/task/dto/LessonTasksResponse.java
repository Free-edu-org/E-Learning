package pl.freeedu.backend.task.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonTasksResponse {

	private Integer lessonId;
	private String lessonTitle;
	private String status;
	private Map<String, List<TaskResponse>> sections;
}
