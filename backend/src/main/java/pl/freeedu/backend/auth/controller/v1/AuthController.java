package pl.freeedu.backend.auth.controller.v1;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.ForgotPasswordRequest;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.auth.dto.ResetPasswordRequest;
import pl.freeedu.backend.auth.service.AuthService;
import reactor.core.publisher.Mono;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ProblemDetail;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user login")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@Operation(summary = "Login an existing user")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User successfully authenticated"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - INVALID_CREDENTIALS", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/login")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AuthResponse> login(@Valid @RequestBody Mono<LoginRequest> request) {
		return authService.login(request);
	}

	@Operation(summary = "Request a password reset link")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "202", description = "If the account exists, a reset link has been sent."),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/forgot-password")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public Mono<MessageResponse> forgotPassword(@Valid @RequestBody Mono<ForgotPasswordRequest> request) {
		return authService.forgotPassword(request);
	}

	@Operation(summary = "Reset password using a password reset token")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Password successfully reset"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED, PASSWORD_CONFIRMATION_MISMATCH, PASSWORD_RESET_TOKEN_INVALID, PASSWORD_RESET_TOKEN_EXPIRED or PASSWORD_RESET_TOKEN_USED", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> resetPassword(@Valid @RequestBody Mono<ResetPasswordRequest> request) {
		return authService.resetPassword(request);
	}
}
