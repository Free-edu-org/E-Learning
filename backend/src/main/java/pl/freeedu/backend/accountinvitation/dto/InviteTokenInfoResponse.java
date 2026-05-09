package pl.freeedu.backend.accountinvitation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteTokenInfoResponse {
	private String email;
}
