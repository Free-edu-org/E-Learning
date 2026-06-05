package pl.freeedu.backend.emailchange.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.emailchange.dto.ConfirmEmailChangeRequest;
import pl.freeedu.backend.emailchange.service.EmailChangeService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/auth/email-change")
@Tag(name = "Email Change", description = "Public endpoint for confirming email address change")
public class EmailChangeController {

	private final EmailChangeService emailChangeService;

	public EmailChangeController(EmailChangeService emailChangeService) {
		this.emailChangeService = emailChangeService;
	}

	@Operation(summary = "Confirm email change", description = "Validates the one-time token sent to the new email address and applies the email change.")
	@PostMapping("/confirm")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> confirm(@Valid @RequestBody Mono<ConfirmEmailChangeRequest> request) {
		return emailChangeService.confirmEmailChange(request);
	}
}
