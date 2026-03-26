package pl.freeedu.backend.teacher.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.service.TeacherService;
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
	@ResponseStatus(HttpStatus.OK)
	public Mono<TeacherStatsResponse> getStats() {
		return teacherService.getStats();
	}

	@Operation(summary = "Get private lessons")
	@ApiResponse(responseCode = "200", description = "List of lessons scoped to current user")
	@GetMapping("/lessons")
	@ResponseStatus(HttpStatus.OK)
	public Flux<LessonResponse> getLessons() {
		return teacherService.getLessons();
	}

	@Operation(summary = "Get teacher's groups")
	@ApiResponse(responseCode = "200", description = "List of groups owned by the current teacher")
	@GetMapping("/my-groups")
	@ResponseStatus(HttpStatus.OK)
	public Flux<UserGroupResponse> getMyGroups() {
		return teacherService.getMyGroups();
	}
}
