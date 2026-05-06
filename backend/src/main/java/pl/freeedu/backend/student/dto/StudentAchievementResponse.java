package pl.freeedu.backend.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAchievementResponse {

	private Integer id;

	private String title;

	private String description;

	private String icon;

	private String color;

	private boolean unlocked;
}
