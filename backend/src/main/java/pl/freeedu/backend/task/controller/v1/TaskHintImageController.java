package pl.freeedu.backend.task.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.task.service.TaskHintImageService;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RestController
@RequestMapping("/api/v1/lessons/{lessonPublicId}/tasks/{taskType}/{taskPublicId}/hint-image")
@Tag(name = "Task Hint Images", description = "Manage hint images for individual tasks")
public class TaskHintImageController {

	private final TaskHintImageService taskHintImageService;
	private final LessonPublicIdLookupService lessonPublicIdLookupService;

	public TaskHintImageController(TaskHintImageService taskHintImageService,
			LessonPublicIdLookupService lessonPublicIdLookupService) {
		this.taskHintImageService = taskHintImageService;
		this.lessonPublicIdLookupService = lessonPublicIdLookupService;
	}

	@Operation(summary = "Upload or replace hint image for a task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Hint image uploaded successfully"),
			@ApiResponse(responseCode = "400", description = "Invalid file type or file too large", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "403", description = "Not the lesson owner", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson or task not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> uploadHintImage(@PathVariable String lessonPublicId, @PathVariable String taskType,
			@PathVariable String taskPublicId, @RequestPart("file") FilePart file) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskHintImageService.uploadHintImage(lessonId, taskType, taskPublicId, file))
				.then();
	}

	@Operation(summary = "Get hint image for a task")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Hint image returned"),
			@ApiResponse(responseCode = "403", description = "No access to lesson", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Hint image not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@GetMapping
	@PreAuthorize("@securityService.isAdmin(authentication) "
			+ "or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId)) "
			+ "or (hasRole('STUDENT') and @securityService.hasStudentAccessToLesson(authentication, #lessonPublicId))")
	public Mono<ResponseEntity<Resource>> getHintImage(@PathVariable String lessonPublicId,
			@PathVariable String taskType, @PathVariable String taskPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskHintImageService.serveHintImage(lessonId, taskType, taskPublicId));
	}

	@Operation(summary = "Delete hint image for a task")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Hint image deleted"),
			@ApiResponse(responseCode = "403", description = "Not the lesson owner", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Hint image not found", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@DeleteMapping
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonPublicId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteHintImage(@PathVariable String lessonPublicId, @PathVariable String taskType,
			@PathVariable String taskPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> taskHintImageService.deleteHintImage(lessonId, taskType, taskPublicId));
	}
}
