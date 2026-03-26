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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.admin.dto.AdminCreateStudentRequest;
import pl.freeedu.backend.admin.dto.AdminStudentResponse;
import pl.freeedu.backend.admin.dto.AdminStatsResponse;
import pl.freeedu.backend.admin.dto.AdminUpdateStudentRequest;
import pl.freeedu.backend.admin.service.AdminService;
import pl.freeedu.backend.user.dto.UserResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Dashboard", description = "Endpoints dedicated for Admin's Dashboard BFF")
public class AdminDashboardController {

	private final AdminService adminService;

	public AdminDashboardController(AdminService adminService) {
		this.adminService = adminService;
	}

	@Operation(summary = "Get global system stats")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Aggregated admin dashboard statistics"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/stats")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AdminStatsResponse> getGlobalStats() {
		return adminService.getStats();
	}

	@Operation(summary = "Get all teachers visible to admin")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "List of teacher accounts"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/teachers")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<UserResponse> getTeachers() {
		return adminService.getTeachers();
	}

	@Operation(summary = "Get all students visible to admin")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "List of student accounts"),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/students")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<AdminStudentResponse> getStudents() {
		return adminService.getStudents();
	}

	@Operation(summary = "Create a student with assigned teacher and optional group")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Student account successfully created"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED, INVALID_TEACHER_ASSIGNMENT or GROUP_TEACHER_MISMATCH", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND or USER_GROUP_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Conflict - EMAIL_ALREADY_TAKEN or USERNAME_ALREADY_TAKEN", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/students")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<UserResponse> createStudent(@Valid @RequestBody Mono<AdminCreateStudentRequest> request) {
		return request.flatMap(adminService::createStudent);
	}

	@Operation(summary = "Update student profile, teacher assignment and optional group")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Student account successfully updated"),
			@ApiResponse(responseCode = "400", description = "Bad Request - VALIDATION_FAILED, INVALID_STUDENT_ASSIGNMENT, INVALID_TEACHER_ASSIGNMENT or GROUP_TEACHER_MISMATCH", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "401", description = "Unauthorized - invalid token", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires ADMIN role", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Not Found - USER_NOT_FOUND or USER_GROUP_NOT_FOUND", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "409", description = "Conflict - EMAIL_ALREADY_TAKEN or USERNAME_ALREADY_TAKEN", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/students/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<AdminStudentResponse> updateStudent(@PathVariable Integer id,
			@Valid @RequestBody Mono<AdminUpdateStudentRequest> request) {
		return request.flatMap(payload -> adminService.updateStudent(id, payload));
	}
}
