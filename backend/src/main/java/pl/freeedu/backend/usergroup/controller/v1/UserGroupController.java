package pl.freeedu.backend.usergroup.controller.v1;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.service.UserGroupPublicIdLookupService;
import pl.freeedu.backend.usergroup.service.UserGroupService;
import pl.freeedu.backend.user.service.UserPublicIdLookupService;
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
	private final UserGroupPublicIdLookupService userGroupPublicIdLookupService;
	private final UserPublicIdLookupService userPublicIdLookupService;

	public UserGroupController(UserGroupService userGroupService,
			UserGroupPublicIdLookupService userGroupPublicIdLookupService,
			UserPublicIdLookupService userPublicIdLookupService) {
		this.userGroupService = userGroupService;
		this.userGroupPublicIdLookupService = userGroupPublicIdLookupService;
		this.userPublicIdLookupService = userPublicIdLookupService;
	}

	@Operation(summary = "Create a new user group")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "User group successfully created"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Group name already exists", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<UserGroupResponse> create(@Valid @RequestBody Mono<UserGroupRequest> request) {
		return userGroupService.create(request);
	}

	@Operation(summary = "Get all user groups")
	@ApiResponse(responseCode = "200", description = "List of all user groups")
	@GetMapping
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<UserGroupResponse> getAll() {
		return userGroupService.getVisibleGroups();
	}

	@Operation(summary = "Get user group by publicId")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User group found"),
			@ApiResponse(responseCode = "404", description = "User group not found")})
	@GetMapping("/{groupPublicId}")
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	@ResponseStatus(HttpStatus.OK)
	public Mono<UserGroupResponse> getById(@PathVariable String groupPublicId) {
		return userGroupService.getById(userGroupPublicIdLookupService.getRequiredInternalId(groupPublicId));
	}

	@Operation(summary = "Update user group")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "User group successfully updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "User group not found")})
	@PutMapping("/{groupPublicId}")
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	@ResponseStatus(HttpStatus.OK)
	public Mono<UserGroupResponse> update(@PathVariable String groupPublicId,
			@Valid @RequestBody Mono<UserGroupRequest> request) {
		return userGroupService.update(userGroupPublicIdLookupService.getRequiredInternalId(groupPublicId), request);
	}

	@Operation(summary = "Delete user group")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "User group successfully deleted"),
			@ApiResponse(responseCode = "404", description = "User group not found")})
	@DeleteMapping("/{groupPublicId}")
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> delete(@PathVariable String groupPublicId) {
		return userGroupService.delete(userGroupPublicIdLookupService.getRequiredInternalId(groupPublicId));
	}

	@Operation(summary = "Add a member to a group")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Member added to group"),
			@ApiResponse(responseCode = "400", description = "Invalid role for group member"),
			@ApiResponse(responseCode = "404", description = "Group or user not found"),
			@ApiResponse(responseCode = "409", description = "Student already assigned to a group")})
	@PostMapping("/{groupPublicId}/members/{userPublicId}")
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> addMember(@PathVariable String groupPublicId, @PathVariable String userPublicId) {
		return userPublicIdLookupService.getInternalId(userPublicId).flatMap(userId -> userGroupService
				.addMember(userGroupPublicIdLookupService.getRequiredInternalId(groupPublicId), userId));
	}

	@Operation(summary = "Remove a member from a group")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Member removed from group"),
			@ApiResponse(responseCode = "404", description = "Group or membership not found")})
	@DeleteMapping("/{groupPublicId}/members/{userPublicId}")
	@PreAuthorize("hasRole('ADMIN') or (hasRole('TEACHER') and @securityService.isGroupOwner(authentication, #groupPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> removeMember(@PathVariable String groupPublicId, @PathVariable String userPublicId) {
		return userPublicIdLookupService.getInternalId(userPublicId).flatMap(userId -> userGroupService
				.removeMember(userGroupPublicIdLookupService.getRequiredInternalId(groupPublicId), userId));
	}
}
