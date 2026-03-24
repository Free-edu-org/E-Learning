package pl.freeedu.backend.lesson.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.freeedu.backend.lesson.dto.LessonRequest;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.dto.LessonStatusRequest;
import pl.freeedu.backend.lesson.service.LessonService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/lessons")
@Tag(name = "Lessons", description = "Endpoints for managing lessons")
public class LessonController {

	private final LessonService lessonService;

	public LessonController(LessonService lessonService) {
		this.lessonService = lessonService;
	}

	@Operation(summary = "Get list of lessons (with filters)")
	@GetMapping
	@PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
	public Flux<LessonResponse> getLessons(
			@RequestParam(required = false) String search,
			@RequestParam(required = false) Integer groupId,
			@RequestParam(required = false) Boolean status,
			@RequestParam(required = false) String sort) {
		return lessonService.getLessons(search, groupId, status, sort);
	}

	@Operation(summary = "Create a new lesson")
	@PostMapping
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.CREATED)
	public Mono<LessonResponse> createLesson(@RequestBody Mono<LessonRequest> lessonRequest) {
		return lessonService.createLesson(lessonRequest);
	}

	@Operation(summary = "Update lesson data")
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('TEACHER')")
	public Mono<LessonResponse> updateLesson(
			@PathVariable Long id,
			@RequestBody Mono<LessonRequest> lessonRequest) {
		return lessonService.updateLesson(id, lessonRequest);
	}

	@Operation(summary = "Quick status change (is_active)")
	@PatchMapping("/{id}/status")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> updateLessonStatus(
			@PathVariable Long id,
			@RequestBody Mono<LessonStatusRequest> statusRequest) {
		return lessonService.updateLessonStatus(id, statusRequest);
	}

	@Operation(summary = "Delete lesson")
	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('TEACHER')")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public Mono<Void> deleteLesson(@PathVariable Long id) {
		return lessonService.deleteLesson(id);
	}
}