package pl.freeedu.backend.task.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lessons/{lessonId}")
@Tag(name = "Task Management", description = "Teacher task CRUD endpoints")
public class TaskManagementController {

	private final TaskService taskService;

	public TaskManagementController(TaskService taskService) {
		this.taskService = taskService;
	}

	// ---- CREATE ----

	@Operation(summary = "Create a speak task")
	@PostMapping("/tasks/speak")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<TaskResponse> createSpeakTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<CreateSpeakTaskRequest> request) {
		return taskService.createSpeakTask(lessonId, request);
	}

	@Operation(summary = "Create a choose task")
	@PostMapping("/tasks/choose")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<TaskResponse> createChooseTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<CreateChooseTaskRequest> request) {
		return taskService.createChooseTask(lessonId, request);
	}

	@Operation(summary = "Create a write task")
	@PostMapping("/tasks/write")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<TaskResponse> createWriteTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<CreateWriteTaskRequest> request) {
		return taskService.createWriteTask(lessonId, request);
	}

	@Operation(summary = "Create a scatter task")
	@PostMapping("/tasks/scatter")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<TaskResponse> createScatterTask(@PathVariable Integer lessonId,
			@Valid @RequestBody Mono<CreateScatterTaskRequest> request) {
		return taskService.createScatterTask(lessonId, request);
	}

	// ---- UPDATE ----

	@Operation(summary = "Update a speak task")
	@PutMapping("/tasks/speak/{taskId}")
	@PreAuthorize("hasRole('ADMIN')")
	public Mono<TaskResponse> updateSpeakTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<CreateSpeakTaskRequest> request) {
		return taskService.updateSpeakTask(lessonId, taskId, request);
	}

	@Operation(summary = "Update a choose task")
	@PutMapping("/tasks/choose/{taskId}")
	@PreAuthorize("hasRole('ADMIN')")
	public Mono<TaskResponse> updateChooseTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<CreateChooseTaskRequest> request) {
		return taskService.updateChooseTask(lessonId, taskId, request);
	}

	@Operation(summary = "Update a write task")
	@PutMapping("/tasks/write/{taskId}")
	@PreAuthorize("hasRole('ADMIN')")
	public Mono<TaskResponse> updateWriteTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<CreateWriteTaskRequest> request) {
		return taskService.updateWriteTask(lessonId, taskId, request);
	}

	@Operation(summary = "Update a scatter task")
	@PutMapping("/tasks/scatter/{taskId}")
	@PreAuthorize("hasRole('ADMIN')")
	public Mono<TaskResponse> updateScatterTask(@PathVariable Integer lessonId, @PathVariable Integer taskId,
			@Valid @RequestBody Mono<CreateScatterTaskRequest> request) {
		return taskService.updateScatterTask(lessonId, taskId, request);
	}

	// ---- DELETE ----

	@Operation(summary = "Delete a task by type and id")
	@DeleteMapping("/tasks/{taskType}/{taskId}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteTask(@PathVariable Integer lessonId, @PathVariable String taskType,
			@PathVariable Integer taskId) {
		return taskService.deleteTask(lessonId, taskType, taskId);
	}

	// ---- RESET student progress ----

	@Operation(summary = "Reset student lesson progress")
	@PostMapping("/users/{userId}/reset")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> resetStudentLesson(@PathVariable Integer lessonId, @PathVariable Integer userId) {
		return taskService.resetStudentLesson(lessonId, userId);
	}

	// ---- INDIVIDUAL STUDENT ASSIGNMENT ----

	@Operation(summary = "Get all students with access to this lesson (group + direct)")
	@GetMapping("/students")
	@PreAuthorize("hasRole('ADMIN')")
	public Mono<List<LessonStudentResponse>> getAssignedStudents(@PathVariable Integer lessonId) {
		return taskService.getAssignedStudents(lessonId);
	}

	@Operation(summary = "Assign a student directly to this lesson")
	@PostMapping("/students/{userId}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<Void> assignStudent(@PathVariable Integer lessonId, @PathVariable Integer userId) {
		return taskService.assignStudent(lessonId, userId);
	}

	@Operation(summary = "Remove direct student assignment from this lesson")
	@DeleteMapping("/students/{userId}")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> removeStudent(@PathVariable Integer lessonId, @PathVariable Integer userId) {
		return taskService.removeStudent(lessonId, userId);
	}
}
