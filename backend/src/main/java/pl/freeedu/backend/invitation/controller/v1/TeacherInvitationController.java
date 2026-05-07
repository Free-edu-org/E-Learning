package pl.freeedu.backend.invitation.controller.v1;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.invitation.dto.CreateInvitationRequest;
import pl.freeedu.backend.invitation.dto.InvitationResponse;
import pl.freeedu.backend.invitation.service.InvitationService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/v1/teacher/groups/{groupPublicId}/invitations")
public class TeacherInvitationController {

	private final InvitationService invitationService;

	public TeacherInvitationController(InvitationService invitationService) {
		this.invitationService = invitationService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	public Mono<InvitationResponse> createInvitation(@PathVariable String groupPublicId,
			@Valid @RequestBody Mono<CreateInvitationRequest> request) {
		return invitationService.createInvitation(groupPublicId, request);
	}

	@GetMapping
	@ResponseStatus(HttpStatus.OK)
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	public Flux<InvitationResponse> getInvitations(@PathVariable String groupPublicId) {
		return invitationService.getInvitations(groupPublicId);
	}

	@DeleteMapping("/{token}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	public Mono<Void> deactivateInvitation(@PathVariable String groupPublicId, @PathVariable String token) {
		return invitationService.deactivateInvitation(groupPublicId, token);
	}
}
