package pl.freeedu.backend.task.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.task.dto.StudentLessonResponse;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/v1/student")
@Tag(name = "Student", description = "Student endpoints")
public class StudentController {

	private final TaskService taskService;

	public StudentController(TaskService taskService) {
		this.taskService = taskService;
	}

	@Operation(summary = "Get lessons available to the current student")
	@GetMapping("/lessons")
	@PreAuthorize("hasRole('STUDENT')")
	public Mono<List<StudentLessonResponse>> getStudentLessons() {
		return taskService.getStudentLessons();
	}
}
