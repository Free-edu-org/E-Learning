package pl.freeedu.backend.lesson.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.lesson.dto.LessonAttachmentResponse;
import pl.freeedu.backend.lesson.dto.LessonRequest;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.dto.LessonStatusRequest;
import pl.freeedu.backend.lesson.service.LessonAttachmentService;
import pl.freeedu.backend.lesson.service.LessonService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/lessons")
@Tag(name = "Lessons", description = "Endpoints for managing lessons")
public class LessonController {

	private final LessonService lessonService;
	private final LessonAttachmentService lessonAttachmentService;

	public LessonController(LessonService lessonService, LessonAttachmentService lessonAttachmentService) {
		this.lessonService = lessonService;
		this.lessonAttachmentService = lessonAttachmentService;
	}

	@Operation(summary = "Get list of lessons (with filters)")
	@ApiResponse(responseCode = "200", description = "List of lessons")
	@GetMapping
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public Flux<LessonResponse> getLessons(@RequestParam(required = false) String search,
			@RequestParam(required = false) Integer groupId, @RequestParam(required = false) Boolean status,
			@RequestParam(required = false) String sort) {
		return lessonService.getLessons(search, groupId, status, sort);
	}

	@Operation(summary = "Create a new lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Lesson successfully created"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class)))})
	@PostMapping
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<LessonResponse> createLesson(@Valid @RequestBody Mono<LessonRequest> lessonRequest) {
		return lessonService.createLesson(lessonRequest);
	}

	@Operation(summary = "Update lesson data")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "Lesson successfully updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson not found")})
	@PutMapping("/{id}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #id))")
	public Mono<LessonResponse> updateLesson(@PathVariable Integer id,
			@Valid @RequestBody Mono<LessonRequest> lessonRequest) {
		return lessonService.updateLesson(id, lessonRequest);
	}

	@Operation(summary = "Quick status change (is_active)")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Lesson status updated"),
			@ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson not found")})
	@PatchMapping("/{id}/status")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #id))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> updateLessonStatus(@PathVariable Integer id,
			@Valid @RequestBody Mono<LessonStatusRequest> statusRequest) {
		return lessonService.updateLessonStatus(id, statusRequest);
	}

	@Operation(summary = "Delete lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Lesson successfully deleted"),
			@ApiResponse(responseCode = "404", description = "Lesson not found")})
	@DeleteMapping("/{id}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #id))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteLesson(@PathVariable Integer id) {
		return lessonService.deleteLesson(id);
	}

	@Operation(summary = "Upload PDF attachment for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "201", description = "Attachment uploaded successfully"),
			@ApiResponse(responseCode = "400", description = "Invalid file type or file too large", content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
			@ApiResponse(responseCode = "404", description = "Lesson not found")})
	@PostMapping(value = "/{lessonId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<LessonAttachmentResponse> uploadAttachment(@PathVariable Integer lessonId,
			@RequestPart("file") FilePart filePart) {
		return lessonAttachmentService.uploadAttachment(lessonId, filePart);
	}

	@Operation(summary = "Download PDF attachment for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "200", description = "PDF file"),
			@ApiResponse(responseCode = "404", description = "Lesson or attachment not found")})
	@GetMapping("/{lessonId}/attachments/{attachmentId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or "
			+ "(hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId)) or "
			+ "(hasRole('STUDENT') and @securityService.hasStudentAccessToLesson(authentication, #lessonId))")
	public Mono<ResponseEntity<Resource>> downloadAttachment(@PathVariable Integer lessonId,
			@PathVariable Integer attachmentId) {
		return lessonAttachmentService.downloadAttachment(lessonId, attachmentId);
	}

	@Operation(summary = "Delete PDF attachment for a lesson")
	@ApiResponses(value = {@ApiResponse(responseCode = "204", description = "Attachment deleted"),
			@ApiResponse(responseCode = "404", description = "Lesson or attachment not found")})
	@DeleteMapping("/{lessonId}/attachments/{attachmentId}")
	@PreAuthorize("@securityService.isAdmin(authentication) or (hasRole('TEACHER') and @securityService.isLessonOwner(authentication, #lessonId))")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteAttachment(@PathVariable Integer lessonId, @PathVariable Integer attachmentId) {
		return lessonAttachmentService.deleteAttachment(lessonId, attachmentId);
	}
}
