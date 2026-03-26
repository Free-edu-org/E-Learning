package pl.freeedu.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

	private Long totalUsers;

	private Long totalAdmins;

	private Long totalTeachers;

	private Long totalStudents;

	private Long totalGroups;
}
