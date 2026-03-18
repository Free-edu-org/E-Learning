package pl.freeedu.backend.usergroup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGroupResponse {

	private Integer id;

	private String name;

	private String description;

	private LocalDateTime createdAt;
}
