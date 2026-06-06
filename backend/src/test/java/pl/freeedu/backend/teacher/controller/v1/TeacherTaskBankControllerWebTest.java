package pl.freeedu.backend.teacher.controller.v1;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockUser;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.reactive.server.WebTestClient;

import pl.freeedu.backend.exception.GlobalExceptionHandler;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import pl.freeedu.backend.task.dto.AssignTaskToLessonRequest;
import pl.freeedu.backend.task.dto.LessonTasksResponse;
import pl.freeedu.backend.task.dto.TaskSectionDto;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {TeacherTaskBankControllerWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class TeacherTaskBankControllerWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private TaskService taskService;

	@Autowired
	private LessonPublicIdLookupService lessonPublicIdLookupService;

	@Autowired
	private SecurityService securityService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(taskService, lessonPublicIdLookupService, securityService);
	}

	@Test
	void shouldReturnTeacherTaskBankWhenTeacherRequestsTasks() {
		// given
		when(taskService.getTeacherTaskBank()).thenReturn(Mono.just(LessonTasksResponse.builder()
				.sections(List.of(TaskSectionDto.builder().section("Bank").build())).build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).get()
				.uri("/api/v1/teacher/task-bank/tasks").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.sections[0].section").isEqualTo("Bank");
		verify(taskService).getTeacherTaskBank();
	}

	@Test
	void shouldRequireTeacherRoleForTeacherTaskBank() {
		// given

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/teacher/task-bank/tasks").exchange();

		// then
		result.expectStatus().isForbidden();
		verify(taskService, never()).getTeacherTaskBank();
	}

	@Test
	void shouldReturnConflictWhenBankTaskEditIsLockedAfterUse() {
		// given
		when(taskService.updateBankWriteTask(eq("bank-write"), any()))
				.thenReturn(Mono.error(new TaskException(TaskErrorCode.TASK_EDIT_LOCKED_AFTER_USE)));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).put()
				.uri("/api/v1/teacher/task-bank/tasks/write/bank-write").contentType(MediaType.APPLICATION_JSON)
				.bodyValue("""
						{"task":"Updated","correctAnswers":["answer"]}
						""").exchange();

		// then
		result.expectStatus().isEqualTo(409).expectBody().jsonPath("$.code").isEqualTo("TASK_EDIT_LOCKED_AFTER_USE");
		verify(taskService).updateBankWriteTask(eq("bank-write"), any());
	}

	@Test
	void shouldReturnConflictWhenBankTaskDeleteIsLockedAfterUse() {
		// given
		when(taskService.deleteBankWriteTask("bank-write"))
				.thenReturn(Mono.error(new TaskException(TaskErrorCode.TASK_EDIT_LOCKED_AFTER_USE)));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).delete()
				.uri("/api/v1/teacher/task-bank/tasks/write/bank-write").exchange();

		// then
		result.expectStatus().isEqualTo(409).expectBody().jsonPath("$.code").isEqualTo("TASK_EDIT_LOCKED_AFTER_USE");
		verify(taskService).deleteBankWriteTask("bank-write");
	}

	@Test
	void shouldResolveLessonPublicIdsBeforeAssigningBankTask() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-a")).thenReturn(21);
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-b")).thenReturn(22);
		when(taskService.assignBankTaskToLessons("write", "bank-write", List.of(21, 22))).thenReturn(Mono.empty());

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/teacher/task-bank/tasks/write/bank-write/assign").contentType(MediaType.APPLICATION_JSON)
				.bodyValue(AssignTaskToLessonRequest.builder().lessonPublicIds(List.of("lesson-a", "lesson-b")).build())
				.exchange();

		// then
		result.expectStatus().isNoContent();
		verify(lessonPublicIdLookupService).getRequiredInternalId("lesson-a");
		verify(lessonPublicIdLookupService).getRequiredInternalId("lesson-b");
		verify(taskService).assignBankTaskToLessons("write", "bank-write", List.of(21, 22));
	}

	@Test
	void shouldReturnBadRequestWhenAssignRequestHasNoLessonIds() {
		// given

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/teacher/task-bank/tasks/write/bank-write/assign").contentType(MediaType.APPLICATION_JSON)
				.bodyValue(AssignTaskToLessonRequest.builder().lessonPublicIds(List.of()).build()).exchange();

		// then
		result.expectStatus().isBadRequest().expectBody().jsonPath("$.code").isEqualTo("VALIDATION_FAILED");
		verify(taskService, never()).assignBankTaskToLessons(any(), any(), any());
		verify(lessonPublicIdLookupService, never()).getRequiredInternalId(any());
	}

	@Configuration
	static class TestConfig {

		@Bean
		TaskService taskService() {
			return mock(TaskService.class);
		}

		@Bean
		LessonPublicIdLookupService lessonPublicIdLookupService() {
			return mock(LessonPublicIdLookupService.class);
		}

		@Bean(name = "securityService")
		SecurityService securityService() {
			return mock(SecurityService.class);
		}

		@Bean
		TeacherTaskBankController teacherTaskBankController(TaskService taskService,
				LessonPublicIdLookupService lessonPublicIdLookupService) {
			return new TeacherTaskBankController(taskService, lessonPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
