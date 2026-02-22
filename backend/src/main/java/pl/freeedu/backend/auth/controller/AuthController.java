package pl.freeedu.backend.auth.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.LoginRequest;
import pl.freeedu.backend.auth.dto.RegisterRequest;
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
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration and login")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@Operation(summary = "Register a new user")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "User successfully registered"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Email is already taken", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<AuthResponse> register(@Valid @RequestBody Mono<RegisterRequest> request) {
		return authService.register(request);
	}

	@Operation(summary = "Login an existing user")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User successfully authenticated"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/login")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AuthResponse> login(@Valid @RequestBody Mono<LoginRequest> request) {
		return authService.login(request);
	}
}
