package pl.freeedu.backend.admin.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.admin.dto.AdminAchievementResponse;
import pl.freeedu.backend.admin.dto.CreateAchievementRequest;
import pl.freeedu.backend.admin.dto.UpdateAchievementActiveRequest;
import pl.freeedu.backend.admin.dto.UpdateAchievementRequest;
import pl.freeedu.backend.admin.service.AchievementManagementService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/admin/achievements")
@Tag(name = "Admin Achievement Management", description = "Endpoints for achievement definition management")
public class AdminAchievementController {

	private final AchievementManagementService achievementManagementService;

	public AdminAchievementController(AchievementManagementService achievementManagementService) {
		this.achievementManagementService = achievementManagementService;
	}

	@Operation(summary = "Get all achievement definitions")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "List of all achievement definitions"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<AdminAchievementResponse> getAchievements() {
		return achievementManagementService.getAllAchievements();
	}

	@Operation(summary = "Get achievement definition by code")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Achievement definition"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - ACHIEVEMENT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/{code}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AdminAchievementResponse> getAchievement(@PathVariable String code) {
		return achievementManagementService.getAchievementByCode(code);
	}

	@Operation(summary = "Create achievement definition")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Achievement definition created"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED or INVALID_ACHIEVEMENT_RULE", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Conflict - ACHIEVEMENT_CODE_ALREADY_EXISTS", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<AdminAchievementResponse> createAchievement(
			@Valid @RequestBody Mono<CreateAchievementRequest> request) {
		return request.flatMap(achievementManagementService::createAchievement);
	}

	@Operation(summary = "Update editable achievement definition fields")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Achievement definition updated"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED or INVALID_ACHIEVEMENT_RULE", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - ACHIEVEMENT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/{code}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AdminAchievementResponse> updateAchievement(@PathVariable String code,
			@Valid @RequestBody Mono<UpdateAchievementRequest> request) {
		return request.flatMap(payload -> achievementManagementService.updateAchievement(code, payload));
	}

	@Operation(summary = "Update achievement active flag")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Achievement active flag updated"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - ACHIEVEMENT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PatchMapping("/{code}/active")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AdminAchievementResponse> updateAchievementActive(@PathVariable String code,
			@Valid @RequestBody Mono<UpdateAchievementActiveRequest> request) {
		return request.flatMap(payload -> achievementManagementService.updateAchievementActive(code, payload));
	}

	@Operation(summary = "Delete achievement definition")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Achievement definition deleted"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - ACHIEVEMENT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/{code}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteAchievement(@PathVariable String code) {
		return achievementManagementService.deleteAchievement(code);
	}
}
