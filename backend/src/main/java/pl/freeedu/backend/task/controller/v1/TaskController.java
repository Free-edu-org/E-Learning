package pl.freeedu.backend.task.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.task.dto.LessonTasksResponse;
import pl.freeedu.backend.task.dto.SubmitAnswersRequest;
import pl.freeedu.backend.task.dto.SubmitResultResponse;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/lessons/{lessonId}")
@Tag(name = "Tasks", description = "Student task endpoints")
public class TaskController {

	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@Operation(summary = "Get all tasks for a lesson (student or admin)")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Tasks grouped by section"),
			@ApiResponse(responseCode = "403", description = "Lesson already completed or no access"),
			@ApiResponse(responseCode = "404", description = "Lesson not found")})
	@GetMapping("/tasks")
	@PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
	public Mono<LessonTasksResponse> getLessonTasks(@PathVariable Integer lessonId) {
		return taskService.getLessonTasks(lessonId);
	}

	@Operation(summary = "Submit answers for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Submission result with scores"),
			@ApiResponse(responseCode = "403", description = "No access or already submitted"),
			@ApiResponse(responseCode = "404", description = "Lesson not found")})
	@PostMapping("/submit")
	@PreAuthorize("hasRole('STUDENT')")
	public Mono<SubmitResultResponse> submitAnswers(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<SubmitAnswersRequest> request) {
		return taskService.submitAnswers(lessonId, request);
	}
}
