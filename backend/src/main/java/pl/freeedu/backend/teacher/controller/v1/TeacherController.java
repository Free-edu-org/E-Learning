package pl.freeedu.backend.teacher.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.service.TeacherService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/teacher")
@Tag(name = "Teacher", description = "Endpoints for teacher dashboard")
public class TeacherController {

	private final TeacherService teacherService;

	public TeacherController(TeacherService teacherService) {
		this.teacherService = teacherService;
	}

	@Operation(summary = "Get dashboard statistics")
	@ApiResponse(responseCode = "200", description = "Dashboard statistics")
	@GetMapping("/stats")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<TeacherStatsResponse> getStats() {
		return teacherService.getStats();
	}
}
