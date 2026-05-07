package pl.freeedu.backend.invitation.controller.v1;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.invitation.dto.InvitationInfoResponse;
import pl.freeedu.backend.invitation.dto.RegisterWithInvitationRequest;
import pl.freeedu.backend.invitation.service.InvitationService;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/v1/invitations")
public class InvitationController {

	private final InvitationService invitationService;

	public InvitationController(InvitationService invitationService) {
		this.invitationService = invitationService;
	}

	@GetMapping("/{token}")
	@ResponseStatus(HttpStatus.OK)
	public Mono<InvitationInfoResponse> getInvitationInfo(@PathVariable String token) {
		return invitationService.getInvitationInfo(token);
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<AuthResponse> registerWithInvitation(@Valid @RequestBody Mono<RegisterWithInvitationRequest> request) {
		return invitationService.registerWithInvitation(request);
	}
}
