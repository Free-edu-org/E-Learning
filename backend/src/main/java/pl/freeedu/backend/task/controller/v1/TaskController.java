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
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.service.TaskService;
import pl.freeedu.backend.user.service.UserPublicIdLookupService;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RestController
@RequestMapping("/api/v1/lessons/{lessonPublicId}")
@Tag(name = "Tasks", description = "Endpoints for managing lesson tasks and submissions")
public class TaskController {

	private final TaskService taskService;
	private final LessonPublicIdLookupService lessonPublicIdLookupService;
	private final UserPublicIdLookupService userPublicIdLookupService;

	public TaskController(TaskService taskService, LessonPublicIdLookupService lessonPublicIdLookupService,
			UserPublicIdLookupService userPublicIdLookupService) {
		this.taskService = taskService;
		this.lessonPublicIdLookupService = lessonPublicIdLookupService;
		this.userPublicIdLookupService = userPublicIdLookupService;
	}

	// --- Get all tasks for a lesson ---

	@Operation(summary = "Get all tasks for a lesson grouped by section")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
			@ApiResponse(responseCode = "403", description = "Lesson already completed or no access", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping("/tasks")
	@PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
	public Mono<LessonTasksResponse> getLessonTasks(@PathVariable String lessonPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic()).flatMap(taskService::getLessonTasks);
	}

	// --- Choose Task CRUD ---

	@Operation(summary = "Create a choose task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Choose task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/choose")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<ChooseTaskResponse> createChooseTask(@PathVariable String lessonPublicId,
			@Valid @RequestBody Mono<ChooseTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.createChooseTask(lessonId, request));
	}

	@Operation(summary = "Update a choose task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Choose task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/choose/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	public Mono<ChooseTaskResponse> updateChooseTask(@PathVariable String lessonPublicId,
			@PathVariable String taskPublicId, @Valid @RequestBody Mono<ChooseTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.updateChooseTask(lessonId, taskPublicId, request));
	}

	@Operation(summary = "Delete a choose task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Choose task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/choose/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteChooseTask(@PathVariable String lessonPublicId, @PathVariable String taskPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.deleteChooseTask(lessonId, taskPublicId));
	}

	// --- Write Task CRUD ---

	@Operation(summary = "Create a write task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Write task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/write")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<WriteTaskResponse> createWriteTask(@PathVariable String lessonPublicId,
			@Valid @RequestBody Mono<WriteTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.createWriteTask(lessonId, request));
	}

	@Operation(summary = "Update a write task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Write task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/write/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	public Mono<WriteTaskResponse> updateWriteTask(@PathVariable String lessonPublicId,
			@PathVariable String taskPublicId, @Valid @RequestBody Mono<WriteTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.updateWriteTask(lessonId, taskPublicId, request));
	}

	@Operation(summary = "Delete a write task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Write task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/write/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteWriteTask(@PathVariable String lessonPublicId, @PathVariable String taskPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.deleteWriteTask(lessonId, taskPublicId));
	}

	// --- Scatter Task CRUD ---

	@Operation(summary = "Create a scatter task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Scatter task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/scatter")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<ScatterTaskResponse> createScatterTask(@PathVariable String lessonPublicId,
			@Valid @RequestBody Mono<ScatterTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.createScatterTask(lessonId, request));
	}

	@Operation(summary = "Update a scatter task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Scatter task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/scatter/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	public Mono<ScatterTaskResponse> updateScatterTask(@PathVariable String lessonPublicId,
			@PathVariable String taskPublicId, @Valid @RequestBody Mono<ScatterTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.updateScatterTask(lessonId, taskPublicId, request));
	}

	@Operation(summary = "Delete a scatter task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Scatter task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/scatter/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteScatterTask(@PathVariable String lessonPublicId, @PathVariable String taskPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.deleteScatterTask(lessonId, taskPublicId));
	}

	// --- Speak Task CRUD ---

	@Operation(summary = "Create a speak task")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Speak task created"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tasks/speak")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<SpeakTaskResponse> createSpeakTask(@PathVariable String lessonPublicId,
			@Valid @RequestBody Mono<SpeakTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.createSpeakTask(lessonId, request));
	}

	@Operation(summary = "Update a speak task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Speak task updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PutMapping("/tasks/speak/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	public Mono<SpeakTaskResponse> updateSpeakTask(@PathVariable String lessonPublicId,
			@PathVariable String taskPublicId, @Valid @RequestBody Mono<SpeakTaskRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.updateSpeakTask(lessonId, taskPublicId, request));
	}

	@Operation(summary = "Delete a speak task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Speak task deleted"),
			@ApiResponse(responseCode = "404", description = "Task not found in the lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping("/tasks/speak/{taskPublicId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteSpeakTask(@PathVariable String lessonPublicId, @PathVariable String taskPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.deleteSpeakTask(lessonId, taskPublicId));
	}

	@Operation(summary = "Transcribe a speak task audio answer")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Audio transcribed and evaluated"),
			@ApiResponse(responseCode = "400", description = "Audio file is missing", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Lesson is inactive or student has no access", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson or task not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "503", description = "STT service unavailable", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping(value = "/tasks/speak/{taskPublicId}/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('STUDENT')")
	public Mono<SpeakTranscriptionResponse> transcribeSpeakTask(@PathVariable String lessonPublicId,
			@PathVariable String taskPublicId, @RequestPart("file") Mono<FilePart> audio) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.transcribeSpeakTask(lessonId, taskPublicId, audio));
	}

	// --- Submit lesson answers ---

	@Operation(summary = "Submit all answers for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Answers evaluated successfully"),
			@ApiResponse(responseCode = "400", description = "Lesson not started or invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Lesson already completed or student has no access", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson or task not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/submit")
	@PreAuthorize("hasRole('STUDENT')")
	public Mono<SubmitResponse> submitLesson(@PathVariable String lessonPublicId,
			@Valid @RequestBody Mono<SubmitRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.submitLesson(lessonId, request));
	}

	@Operation(summary = "Record a student tab switch for the active lesson task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Tab switch recorded"),
			@ApiResponse(responseCode = "400", description = "Lesson not started or invalid input", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Lesson already completed or student has no access", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson or task not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/tab-switches")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> recordTabSwitch(@PathVariable String lessonPublicId,
			@Valid @RequestBody Mono<TaskAttentionEventRequest> request) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskService.recordTabSwitch(lessonId, request));
	}

	// --- Reset user progress ---

	@Operation(summary = "Reset student progress for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Progress reset successfully"),
			@ApiResponse(responseCode = "404", description = "Lesson not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping("/users/{userPublicId}/reset")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> resetProgress(@PathVariable String lessonPublicId, @PathVariable String userPublicId) {
		return userPublicIdLookupService.getInternalId(userPublicId)
				.flatMap(userId -> Mono
						.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
						.subscribeOn(Schedulers.boundedElastic())
						.flatMap(lessonId -> taskService.resetUserProgress(lessonId, userId)));
	}
}
