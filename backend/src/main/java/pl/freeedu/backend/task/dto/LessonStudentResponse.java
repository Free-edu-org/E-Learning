package pl.freeedu.backend.task.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonStudentResponse {

	private Integer id;
	private String username;
	private String email;
	/** "direct" or "group" */
	private String accessType;
	/** Group name if accessType is "group", null otherwise */
	private String groupName;
}
