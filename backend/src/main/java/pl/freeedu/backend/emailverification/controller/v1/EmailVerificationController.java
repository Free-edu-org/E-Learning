package pl.freeedu.backend.emailverification.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
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
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.emailverification.dto.ConfirmEmailVerificationRequest;
import pl.freeedu.backend.emailverification.dto.EmailVerificationTokenInfoResponse;
import pl.freeedu.backend.emailverification.dto.ResendEmailVerificationRequest;
import pl.freeedu.backend.emailverification.service.EmailVerificationService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/auth/email-verification")
@Tag(name = "Email Verification", description = "Public endpoints for verifying student email addresses")
public class EmailVerificationController {

	private final EmailVerificationService emailVerificationService;

	public EmailVerificationController(EmailVerificationService emailVerificationService) {
		this.emailVerificationService = emailVerificationService;
	}

	@Operation(summary = "Get email verification token info")
	@GetMapping("/{token}")
	@ResponseStatus(HttpStatus.OK)
	public Mono<EmailVerificationTokenInfoResponse> getTokenInfo(@PathVariable String token) {
		return emailVerificationService.getTokenInfo(token);
	}

	@Operation(summary = "Confirm email verification token")
	@PostMapping("/confirm")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> confirm(@Valid @RequestBody Mono<ConfirmEmailVerificationRequest> request) {
		return emailVerificationService.confirmEmailVerification(request);
	}

	@Operation(summary = "Resend email verification link")
	@PostMapping("/resend")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public Mono<MessageResponse> resend(@Valid @RequestBody Mono<ResendEmailVerificationRequest> request) {
		return emailVerificationService.resendVerification(request);
	}
}
