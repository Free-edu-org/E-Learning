package pl.freeedu.backend.user.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.user.dto.RegisterUserRequest;
import pl.freeedu.backend.user.dto.ChangePasswordRequest;
import pl.freeedu.backend.user.dto.UpdateUserRequest;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.service.UserService;
import reactor.core.publisher.Mono;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ProblemDetail;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "Endpoints for user CRUD operations")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@Operation(summary = "Create an admin user", description = "Allows an existing admin to create a new administrative account.")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Admin user successfully created"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Conflict - EMAIL_ALREADY_TAKEN or USERNAME_ALREADY_TAKEN", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/admin")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<Void> createAdmin(@Valid @RequestBody Mono<RegisterUserRequest> request) {
		return userService.createAdmin(request);
	}

	@Operation(summary = "Register a new student", description = "Allows an existing admin to register a new user as a student.")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Student user successfully registered"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Conflict - EMAIL_ALREADY_TAKEN or USERNAME_ALREADY_TAKEN", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/register")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<Void> registerStudent(@Valid @RequestBody Mono<RegisterUserRequest> request) {
		return userService.registerStudent(request);
	}

	@Operation(summary = "Get user details", description = "Retrieve a user's details. Only available to the account owner or an admin.")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User details successfully retrieved"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - lack of permissions", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/{id}")
	@PreAuthorize("@securityService.isOwnerOrAdmin(#id)")
	public Mono<UserResponse> getUser(@PathVariable Integer id) {
		return userService.getUser(id);
	}

	@Operation(summary = "Get current user profile", description = "Retrieve the profile details of the currently authenticated user.")
	@ApiResponses(value = {
			@ApiResponse(responseCode = "200", description = "Current user details successfully retrieved"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/me")
	@PreAuthorize("isAuthenticated()")
	public Mono<UserResponse> getCurrentUser() {
		return userService.getCurrentUser();
	}

	@Operation(summary = "Update user details", description = "Update user's profile information. Only available to the account owner or an admin.")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User details successfully updated"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - lack of permissions", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Conflict - EMAIL_ALREADY_TAKEN or USERNAME_ALREADY_TAKEN", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/{id}")
	@PreAuthorize("@securityService.isOwnerOrAdmin(#id)")
	public Mono<UserResponse> updateUser(@PathVariable Integer id,
			@Valid @RequestBody Mono<UpdateUserRequest> request) {
		return userService.updateUser(id, request);
	}

	@Operation(summary = "Change user password", description = "Change a user's password. Requires the old password. Only available to the account owner or an admin.")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Password successfully changed"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - INVALID_CREDENTIALS", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - lack of permissions", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/{id}/password")
	@PreAuthorize("@securityService.isOwnerOrAdmin(#id)")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> changePassword(@PathVariable Integer id,
			@Valid @RequestBody Mono<ChangePasswordRequest> request) {
		return userService.changePassword(id, request);
	}

	@Operation(summary = "Delete an account", description = "Deletes a user account. Only available to the account owner or an admin.")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "User successfully deleted"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - lack of permissions", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/{id}")
	@PreAuthorize("@securityService.isOwnerOrAdmin(#id)")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteUser(@PathVariable Integer id) {
		return userService.deleteUser(id);
	}
}
