package pl.freeedu.backend.task.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentLessonResponse {

	private Integer id;
	private String title;
	private String theme;
	private String status;
}
