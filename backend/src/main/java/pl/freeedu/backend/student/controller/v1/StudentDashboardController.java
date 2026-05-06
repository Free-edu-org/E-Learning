package pl.freeedu.backend.student.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.student.dto.StudentAchievementResponse;
import pl.freeedu.backend.student.dto.StudentLessonResponse;
import pl.freeedu.backend.student.dto.StudentProgressHistoryResponse;
import pl.freeedu.backend.student.dto.StudentSkillStatsResponse;
import pl.freeedu.backend.student.dto.StudentStatsResponse;
import pl.freeedu.backend.student.service.StudentAchievementService;
import pl.freeedu.backend.student.service.StudentService;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student")
@Tag(name = "Student Dashboard", description = "Endpoints dedicated for Student's Dashboard BFF")
public class StudentDashboardController {

	private final StudentService studentService;
	private final StudentAchievementService studentAchievementService;
	private final LessonPublicIdLookupService lessonPublicIdLookupService;

	public StudentDashboardController(StudentService studentService,
			StudentAchievementService studentAchievementService,
			LessonPublicIdLookupService lessonPublicIdLookupService) {
		this.studentService = studentService;
		this.studentAchievementService = studentAchievementService;
		this.lessonPublicIdLookupService = lessonPublicIdLookupService;
	}

	@Operation(summary = "Get student dashboard statistics")
	@ApiResponse(responseCode = "200", description = "Statistics scoped to current student")
	@GetMapping("/stats")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<StudentStatsResponse> getStats() {
		return studentService.getStats();
	}

	@Operation(summary = "Get student's lessons")
	@ApiResponse(responseCode = "200", description = "Lessons assigned to the current student through the student's group")
	@GetMapping("/lessons")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<StudentLessonResponse> getLessons() {
		return studentService.getLessons();
	}

	@Operation(summary = "Get student progress history")
	@ApiResponse(responseCode = "200", description = "Historical average lesson result scoped to current student")
	@GetMapping("/progress")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<StudentProgressHistoryResponse> getMyProgress() {
		return studentService.getProgress();
	}

	@Operation(summary = "Get student skill breakdown")
	@ApiResponse(responseCode = "200", description = "Correct and wrong answers grouped by task category for current student")
	@GetMapping("/skills")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Flux<StudentSkillStatsResponse> getSkillStats() {
		return studentService.getSkillStats();
	}

	@Operation(summary = "Get student achievements")
	@ApiResponse(responseCode = "200", description = "Achievements scoped to current student")
	@GetMapping("/achievements")
	@PreAuthorize("hasRole('STUDENT')")
	public Mono<ResponseEntity<List<StudentAchievementResponse>>> getAchievements() {
		return studentAchievementService.getAchievementsForCurrentStudent().map(ResponseEntity::ok);
	}

	@Operation(summary = "Get detailed result of student's completed lesson")
	@ApiResponse(responseCode = "200", description = "Detailed result scoped to current student")
	@GetMapping("/lessons/{lessonPublicId}/result")
	@PreAuthorize("hasRole('STUDENT')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<LessonResultDetailsResponse> getLessonResultDetails(@PathVariable String lessonPublicId) {
		return Mono.fromCallable(() -> lessonPublicIdLookupService.getRequiredInternalId(lessonPublicId))
				.subscribeOn(Schedulers.boundedElastic())
				.flatMap(lessonId -> studentService.getLessonResultDetails(lessonId));
	}
}
