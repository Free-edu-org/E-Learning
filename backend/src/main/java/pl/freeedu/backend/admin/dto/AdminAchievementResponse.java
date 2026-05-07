package pl.freeedu.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pl.freeedu.backend.achievement.model.AchievementType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAchievementResponse {

	private String code;
	private String title;
	private String description;
	private String icon;
	private String color;
	private AchievementType type;
	private Integer threshold;
	private Boolean active;
	private Integer sortOrder;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
