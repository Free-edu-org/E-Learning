package pl.freeedu.backend.invitation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationInfoResponse {

	private String token;
	private String groupName;
	private Integer maxUses;
	private Integer usedCount;
}
