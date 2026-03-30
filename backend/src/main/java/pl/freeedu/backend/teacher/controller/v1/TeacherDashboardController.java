package pl.freeedu.backend.teacher.controller.v1;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.teacher.dto.TeacherCreateStudentRequest;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.service.TeacherService;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/teacher")
@Tag(name = "Teacher Dashboard", description = "Endpoints dedicated for Teacher's Dashboard BFF")
public class TeacherDashboardController {

	private final TeacherService teacherService;

	public TeacherDashboardController(TeacherService teacherService) {
		this.teacherService = teacherService;
	}

	@Operation(summary = "Get private dashboard statistics")
	@ApiResponse(responseCode = "200", description = "Dashboard statistics scoped to current user")
	@GetMapping("/stats")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<TeacherStatsResponse> getStats() {
		return teacherService.getStats();
	}

	@Operation(summary = "Get private lessons")
	@ApiResponse(responseCode = "200", description = "List of lessons scoped to current user")
	@GetMapping("/lessons")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<LessonResponse> getLessons() {
		return teacherService.getLessons();
	}

	@Operation(summary = "Get teacher's groups")
	@ApiResponse(responseCode = "200", description = "List of groups owned by the current teacher")
	@GetMapping("/my-groups")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<UserGroupResponse> getMyGroups() {
		return teacherService.getMyGroups();
	}

	@Operation(summary = "Get teacher's students")
	@ApiResponse(responseCode = "200", description = "List of unique students assigned to the current teacher groups")
	@GetMapping("/students")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<UserResponse> getMyStudents() {
		return teacherService.getMyStudents();
	}

	@Operation(summary = "Create a student assigned to the teacher's group")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Student successfully created"),
			@ApiResponse(responseCode = "400", description = "Bad Request"),
			@ApiResponse(responseCode = "403", description = "Forbidden - requires TEACHER role"),
			@ApiResponse(responseCode = "404", description = "Group not found"),
			@ApiResponse(responseCode = "409", description = "Conflict - EMAIL_ALREADY_TAKEN or USERNAME_ALREADY_TAKEN")})
	@PostMapping("/students")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<UserResponse> createStudent(
			@Valid @RequestBody Mono<TeacherCreateStudentRequest> request) {
		return teacherService.createStudent(request);
	}
}
