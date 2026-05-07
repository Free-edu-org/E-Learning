package pl.freeedu.backend.invitation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

	private String token;
	private String groupPublicId;
	private String groupName;
	private Integer maxUses;
	private Integer usedCount;
	private LocalDateTime expiresAt;
	private Boolean isActive;
	private LocalDateTime createdAt;
}
