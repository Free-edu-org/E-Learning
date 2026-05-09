package pl.freeedu.backend.accountinvitation.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.accountinvitation.dto.ActivateAccountRequest;
import pl.freeedu.backend.accountinvitation.dto.InviteTokenInfoResponse;
import pl.freeedu.backend.accountinvitation.service.AccountActivationService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Account Activation", description = "Public endpoints for email-based student account activation")
public class AccountActivationController {

	private final AccountActivationService accountActivationService;

	public AccountActivationController(AccountActivationService accountActivationService) {
		this.accountActivationService = accountActivationService;
	}

	@Operation(summary = "Validate invitation token and retrieve account email")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Token is valid; returns associated email"),
			@ApiResponse(responseCode = "400", description = "Token is invalid, expired, or already used")})
	@GetMapping("/invite/{token}")
	@ResponseStatus(HttpStatus.OK)
	public Mono<InviteTokenInfoResponse> validateInviteToken(@PathVariable String token) {
		return accountActivationService.validateToken(token);
	}

	@Operation(summary = "Activate invited student account with username and password")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Account successfully activated"),
			@ApiResponse(responseCode = "400", description = "Token invalid / expired / used, or validation failed"),
			@ApiResponse(responseCode = "409", description = "Account already active or username taken")})
	@PostMapping("/activate")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> activateAccount(@Valid @RequestBody Mono<ActivateAccountRequest> request) {
		return accountActivationService.activateAccount(request);
	}
}
