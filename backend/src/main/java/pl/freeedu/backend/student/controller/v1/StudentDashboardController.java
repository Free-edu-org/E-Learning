package pl.freeedu.backend.student.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.student.dto.StudentLessonResponse;
import pl.freeedu.backend.student.dto.StudentProgressResponse;
import pl.freeedu.backend.student.dto.StudentStatsResponse;
import pl.freeedu.backend.student.service.StudentService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/student")
@Tag(name = "Student Dashboard", description = "Endpoints dedicated for Student's Dashboard BFF")
public class StudentDashboardController {

	private final StudentService studentService;

	public StudentDashboardController(StudentService studentService) {
		this.studentService = studentService;
	}

	@Operation(summary = "Get student dashboard statistics")
	@ApiResponse(responseCode = "200", description = "Statistics scoped to current student")
	@GetMapping("/stats")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<StudentStatsResponse> getStats() {
		return studentService.getStats();
	}

	@Operation(summary = "Get student's lessons")
	@ApiResponse(responseCode = "200", description = "Lessons assigned to the current student through the student's group")
	@GetMapping("/lessons")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<StudentLessonResponse> getLessons() {
		return studentService.getLessons();
	}

	@Operation(summary = "Get student progress summary")
	@ApiResponse(responseCode = "200", description = "Progress summary scoped to current student")
	@GetMapping("/progress")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<StudentProgressResponse> getMyProgress() {
		return studentService.getProgress();
	}
}
