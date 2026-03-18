package pl.freeedu.backend.usergroup.controller.v1;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.service.UserGroupService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ProblemDetail;

@RestController
@RequestMapping("/api/v1/user-groups")
@Tag(name = "User Groups", description = "Endpoints for managing user groups")
public class UserGroupController {

	private final UserGroupService userGroupService;

	public UserGroupController(UserGroupService userGroupService) {
		this.userGroupService = userGroupService;
	}

	@Operation(summary = "Create a new user group")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "User group successfully created"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<UserGroupResponse> create(@Valid @RequestBody Mono<UserGroupRequest> request) {
		return userGroupService.create(request);
	}

	@Operation(summary = "Get all user groups")
	@ApiResponse(responseCode = "200", description = "List of all user groups")
	@GetMapping
	@ResponseStatus(HttpStatus.OK)
	public Flux<UserGroupResponse> getAll() {
		return userGroupService.getAll();
	}

	@Operation(summary = "Get user group by id")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User group found"),
			@ApiResponse(responseCode = "404", description = "User group not found")})
	@GetMapping("/{id}")
	@ResponseStatus(HttpStatus.OK)
	public Mono<UserGroupResponse> getById(@PathVariable Integer id) {
		return userGroupService.getById(id);
	}

	@Operation(summary = "Update user group")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User group successfully updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "User group not found")})
	@PutMapping("/{id}")
	@ResponseStatus(HttpStatus.OK)
	public Mono<UserGroupResponse> update(@PathVariable Integer id,
			@Valid @RequestBody Mono<UserGroupRequest> request) {
		return userGroupService.update(id, request);
	}

	@Operation(summary = "Delete user group")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "User group successfully deleted"),
			@ApiResponse(responseCode = "404", description = "User group not found")})
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> delete(@PathVariable Integer id) {
		return userGroupService.delete(id);
	}
}
