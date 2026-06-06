package pl.freeedu.backend.teacher.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RestController
@RequestMapping("/api/v1/teacher/task-bank")
@Tag(name = "Teacher Task Bank", description = "Endpoints for managing teacher task bank")
public class TeacherTaskBankController {

	private final TaskService taskService;
	private final LessonPublicIdLookupService lessonPublicIdLookupService;

	public TeacherTaskBankController(TaskService taskService, LessonPublicIdLookupService lessonPublicIdLookupService) {
		this.taskService = taskService;
		this.lessonPublicIdLookupService = lessonPublicIdLookupService;
	}

	@GetMapping("/tasks")
	@PreAuthorize("hasRole('TEACHER')")
	@Operation(summary = "Get all tasks owned by the current teacher, including already assigned lesson tasks")
	@ApiResponse(responseCode = "200", description = "Task bank retrieved successfully")
	public Mono<LessonTasksResponse> getTaskBank() {
		return taskService.getTeacherTaskBank();
	}

	@PostMapping("/tasks/choose")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<ChooseTaskResponse> createChooseTask(@Valid @RequestBody Mono<ChooseTaskRequest> request) {
		return taskService.createBankChooseTask(request);
	}

	@PutMapping("/tasks/choose/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	public Mono<ChooseTaskResponse> updateChooseTask(@PathVariable String taskPublicId,
			@Valid @RequestBody Mono<ChooseTaskRequest> request) {
		return taskService.updateBankChooseTask(taskPublicId, request);
	}

	@DeleteMapping("/tasks/choose/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteChooseTask(@PathVariable String taskPublicId) {
		return taskService.deleteBankChooseTask(taskPublicId);
	}

	@PostMapping("/tasks/write")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<WriteTaskResponse> createWriteTask(@Valid @RequestBody Mono<WriteTaskRequest> request) {
		return taskService.createBankWriteTask(request);
	}

	@PutMapping("/tasks/write/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	public Mono<WriteTaskResponse> updateWriteTask(@PathVariable String taskPublicId,
			@Valid @RequestBody Mono<WriteTaskRequest> request) {
		return taskService.updateBankWriteTask(taskPublicId, request);
	}

	@DeleteMapping("/tasks/write/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteWriteTask(@PathVariable String taskPublicId) {
		return taskService.deleteBankWriteTask(taskPublicId);
	}

	@PostMapping("/tasks/scatter")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<ScatterTaskResponse> createScatterTask(@Valid @RequestBody Mono<ScatterTaskRequest> request) {
		return taskService.createBankScatterTask(request);
	}

	@PutMapping("/tasks/scatter/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	public Mono<ScatterTaskResponse> updateScatterTask(@PathVariable String taskPublicId,
			@Valid @RequestBody Mono<ScatterTaskRequest> request) {
		return taskService.updateBankScatterTask(taskPublicId, request);
	}

	@DeleteMapping("/tasks/scatter/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteScatterTask(@PathVariable String taskPublicId) {
		return taskService.deleteBankScatterTask(taskPublicId);
	}

	@PostMapping("/tasks/speak")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<SpeakTaskResponse> createSpeakTask(@Valid @RequestBody Mono<SpeakTaskRequest> request) {
		return taskService.createBankSpeakTask(request);
	}

	@PutMapping("/tasks/speak/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	public Mono<SpeakTaskResponse> updateSpeakTask(@PathVariable String taskPublicId,
			@Valid @RequestBody Mono<SpeakTaskRequest> request) {
		return taskService.updateBankSpeakTask(taskPublicId, request);
	}

	@DeleteMapping("/tasks/speak/{taskPublicId}")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteSpeakTask(@PathVariable String taskPublicId) {
		return taskService.deleteBankSpeakTask(taskPublicId);
	}

	@PostMapping("/tasks/{taskType}/{taskPublicId}/assign")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> assignTaskToLesson(@PathVariable String taskType, @PathVariable String taskPublicId,
			@Valid @RequestBody Mono<AssignTaskToLessonRequest> request) {
		return request.flatMap(assignRequest -> Mono
				.fromCallable(() -> assignRequest.getLessonPublicIds().stream()
						.map(lessonPublicIdLookupService::getRequiredInternalId).toList())
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonIds -> taskService.assignBankTaskToLessons(taskType, taskPublicId, lessonIds)));
	}
}
