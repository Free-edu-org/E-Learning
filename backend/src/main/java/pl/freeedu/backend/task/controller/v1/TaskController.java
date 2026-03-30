package pl.freeedu.backend.task.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/lessons/{lessonId}")
@Tag(name = "Tasks", description = "Endpoints for managing lesson tasks and submissions")
public class TaskController {

	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	// --- Get all tasks for a lesson ---

	@Operation(summary = "Get all tasks for a lesson grouped by section")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
			@ApiResponse(responseCode = "403", description = "Lesson already completed or no access", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/tasks")
	@PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
	public Mono<LessonTasksResponse> getLessonTasks(@PathVariable Integer lessonId) {
		return taskService.getLessonTasks(lessonId);
	}

	// --- Choose Task CRUD ---

	@Operation(summary = "Create a choose task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Choose task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/choose")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<ChooseTaskResponse> createChooseTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<ChooseTaskRequest> request) {
		return taskService.createChooseTask(lessonId, request);
	}

	@Operation(summary = "Update a choose task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Choose task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/choose/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	public Mono<ChooseTaskResponse> updateChooseTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<ChooseTaskRequest> request) {
		return taskService.updateChooseTask(lessonId, taskId, request);
	}

	@Operation(summary = "Delete a choose task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Choose task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/choose/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteChooseTask(@PathVariable Integer lessonId, @PathVariable Integer taskId) {
		return taskService.deleteChooseTask(lessonId, taskId);
	}

	// --- Write Task CRUD ---

	@Operation(summary = "Create a write task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Write task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/write")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<WriteTaskResponse> createWriteTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<WriteTaskRequest> request) {
		return taskService.createWriteTask(lessonId, request);
	}

	@Operation(summary = "Update a write task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Write task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/write/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	public Mono<WriteTaskResponse> updateWriteTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<WriteTaskRequest> request) {
		return taskService.updateWriteTask(lessonId, taskId, request);
	}

	@Operation(summary = "Delete a write task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Write task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/write/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteWriteTask(@PathVariable Integer lessonId, @PathVariable Integer taskId) {
		return taskService.deleteWriteTask(lessonId, taskId);
	}

	// --- Scatter Task CRUD ---

	@Operation(summary = "Create a scatter task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Scatter task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/scatter")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<ScatterTaskResponse> createScatterTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<ScatterTaskRequest> request) {
		return taskService.createScatterTask(lessonId, request);
	}

	@Operation(summary = "Update a scatter task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Scatter task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/scatter/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	public Mono<ScatterTaskResponse> updateScatterTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<ScatterTaskRequest> request) {
		return taskService.updateScatterTask(lessonId, taskId, request);
	}

	@Operation(summary = "Delete a scatter task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Scatter task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/scatter/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteScatterTask(@PathVariable Integer lessonId, @PathVariable Integer taskId) {
		return taskService.deleteScatterTask(lessonId, taskId);
	}

	// --- Speak Task CRUD ---

	@Operation(summary = "Create a speak task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Speak task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/speak")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<SpeakTaskResponse> createSpeakTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<SpeakTaskRequest> request) {
		return taskService.createSpeakTask(lessonId, request);
	}

	@Operation(summary = "Update a speak task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Speak task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/speak/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	public Mono<SpeakTaskResponse> updateSpeakTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<SpeakTaskRequest> request) {
		return taskService.updateSpeakTask(lessonId, taskId, request);
	}

	@Operation(summary = "Delete a speak task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Speak task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/speak/{taskId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteSpeakTask(@PathVariable Integer lessonId, @PathVariable Integer taskId) {
		return taskService.deleteSpeakTask(lessonId, taskId);
	}

	// --- Submit lesson answers ---

	@Operation(summary = "Submit all answers for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Answers evaluated successfully"),
			@ApiResponse(responseCode = "400", description = "Lesson not started or invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Lesson already completed or student has no access", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson or task not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/submit")
	@PreAuthorize("hasRole('STUDENT')")
	public Mono<SubmitResponse> submitLesson(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<SubmitRequest> request) {
		return taskService.submitLesson(lessonId, request);
	}

	// --- Reset user progress ---

	@Operation(summary = "Reset student progress for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Progress reset successfully"),
			@ApiResponse(responseCode = "404", description = "Lesson not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/users/{userId}/reset")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> resetProgress(@PathVariable Integer lessonId, @PathVariable Integer userId) {
		return taskService.resetUserProgress(lessonId, userId);
	}
}
