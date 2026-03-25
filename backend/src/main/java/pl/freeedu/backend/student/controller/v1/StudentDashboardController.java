package pl.freeedu.backend.student.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/student")
@Tag(name = "Student Dashboard", description = "Endpoints dedicated for Student's Dashboard BFF")
public class StudentDashboardController {

	// TODO: Replace with StudentService and real DTO mappings
	@Operation(summary = "Get personal progress")
	@GetMapping("/progress")
	@ResponseStatus(HttpStatus.OK)
	public Mono<String> getMyProgress() {
		return Mono.just("Student progress placeholder (e.g. marks, upcoming lessons)");
	}
}
