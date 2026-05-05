package pl.freeedu.backend.task.controller.v1;

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
import pl.freeedu.backend.task.dto.LessonTasksResponse;
import pl.freeedu.backend.task.dto.SubmitResponse;
import pl.freeedu.backend.task.dto.TaskSectionDto;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.service.TaskService;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {TaskControllerPublicIdWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class TaskControllerPublicIdWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private TaskService taskService;

	@Autowired
	private LessonPublicIdLookupService lessonPublicIdLookupService;
	@Autowired
	private pl.freeedu.backend.user.service.UserPublicIdLookupService userPublicIdLookupService;

	@Autowired
	private SecurityService securityService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(taskService, lessonPublicIdLookupService, securityService, userPublicIdLookupService);
	}

	@Test
	void shouldReturnLessonTasksByPublicIdWhenStudentHasAccess() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(9);
		when(taskService.getLessonTasks(9)).thenReturn(
				Mono.just(LessonTasksResponse.builder().lessonPublicId("lesson-public-id").status("IN_PROGRESS")
						.sections(List.of(TaskSectionDto.builder().section("A").build())).build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/lessons/lesson-public-id/tasks").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.lessonPublicId").isEqualTo("lesson-public-id")
				.jsonPath("$.lessonId").doesNotExist();
		verify(lessonPublicIdLookupService).getRequiredInternalId("lesson-public-id");
		verify(taskService).getLessonTasks(9);
	}

	@Test
	void shouldSubmitLessonByPublicIdWhenStudentHasAccess() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(9);
		when(taskService.submitLesson(eq(9), any()))
				.thenReturn(Mono.just(SubmitResponse.builder().score(3).maxScore(4).details(List.of()).build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).post()
				.uri("/api/v1/lessons/lesson-public-id/submit").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{"answers":[{"taskPublicId":"task-public-id","taskType":"choose","answer":"1"}]}
						""").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.score").isEqualTo(3).jsonPath("$.maxScore").isEqualTo(4);
		verify(lessonPublicIdLookupService).getRequiredInternalId("lesson-public-id");
		verify(taskService).submitLesson(eq(9), any());
	}

	@Test
	void shouldRecordTabSwitchByPublicIdWhenStudentHasAccess() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(9);
		when(taskService.recordTabSwitch(eq(9), any())).thenReturn(Mono.empty());

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).post()
				.uri("/api/v1/lessons/lesson-public-id/tab-switches").contentType(MediaType.APPLICATION_JSON)
				.bodyValue("""
						{"taskPublicId":"task-public-id","taskType":"choose"}
						""").exchange();

		// then
		result.expectStatus().isNoContent();
		verify(lessonPublicIdLookupService).getRequiredInternalId("lesson-public-id");
		verify(taskService).recordTabSwitch(eq(9), any());
	}

	@Test
	void shouldReturnNotFoundWhenLessonPublicIdDoesNotExistForLessonTasks() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("missing-public-id"))
				.thenThrow(new TaskException(TaskErrorCode.LESSON_NOT_FOUND));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/lessons/missing-public-id/tasks").exchange();

		// then
		result.expectStatus().isNotFound();
		verify(taskService, never()).getLessonTasks(any());
	}

	@Test
	void shouldReturnNotFoundWhenInternalIntegerIdIsUsedInsteadOfPublicId() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("15"))
				.thenThrow(new TaskException(TaskErrorCode.LESSON_NOT_FOUND));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/lessons/15/tasks").exchange();

		// then
		result.expectStatus().isNotFound();
		verify(taskService, never()).getLessonTasks(any());
	}

	@Test
	void shouldReturnForbiddenWhenStudentWithoutAccessRequestsLessonByPublicId() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(9);
		when(taskService.getLessonTasks(9)).thenThrow(new TaskException(TaskErrorCode.STUDENT_NO_ACCESS));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/lessons/lesson-public-id/tasks").exchange();

		// then
		result.expectStatus().isForbidden();
		verify(taskService).getLessonTasks(9);
	}

	@Test
	void shouldReturnForbiddenWhenTeacherTriesToCreateTaskForForeignLessonByPublicId() {
		// given
		when(securityService.isLessonOwner(any(), eq("foreign-lesson-public-id"))).thenReturn(false);

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/lessons/foreign-lesson-public-id/tasks/choose").contentType(MediaType.APPLICATION_JSON)
				.bodyValue("""
						{"task":"Question","possibleAnswers":"a|b","correctAnswer":1}
						""").exchange();

		// then
		result.expectStatus().isForbidden();
		verify(lessonPublicIdLookupService, never()).getRequiredInternalId("foreign-lesson-public-id");
		verify(taskService, never()).createChooseTask(any(), any());
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

		@Bean
		pl.freeedu.backend.user.service.UserPublicIdLookupService userPublicIdLookupService() {
			return mock(pl.freeedu.backend.user.service.UserPublicIdLookupService.class);
		}

		@Bean(name = "securityService")
		SecurityService securityService() {
			return mock(SecurityService.class);
		}

		@Bean
		TaskController taskController(TaskService taskService, LessonPublicIdLookupService lessonPublicIdLookupService,
				pl.freeedu.backend.user.service.UserPublicIdLookupService userPublicIdLookupService) {
			return new TaskController(taskService, lessonPublicIdLookupService, userPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
