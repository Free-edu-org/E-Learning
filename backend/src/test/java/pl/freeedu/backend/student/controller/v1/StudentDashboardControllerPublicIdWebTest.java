package pl.freeedu.backend.student.controller.v1;

import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.reactive.server.WebTestClient;

import pl.freeedu.backend.exception.GlobalExceptionHandler;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.service.StudentService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {StudentDashboardControllerPublicIdWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class StudentDashboardControllerPublicIdWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private StudentService studentService;

	@Autowired
	private LessonPublicIdLookupService lessonPublicIdLookupService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(studentService, lessonPublicIdLookupService);
	}

	@Test
	void shouldReturnLessonResultByPublicIdWhenStudentHasAccess() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(17);
		when(studentService.getLessonResultDetails(17)).thenReturn(Mono.just(LessonResultDetailsResponse.builder()
				.lessonPublicId("lesson-public-id").lessonTitle("Lesson").userId(10).tasks(List.of()).build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/student/lessons/lesson-public-id/result").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.lessonPublicId").isEqualTo("lesson-public-id")
				.jsonPath("$.lessonId").doesNotExist();
		verify(studentService).getLessonResultDetails(17);
	}

	@Test
	void shouldReturnNotFoundWhenStudentRequestsMissingLessonPublicIdResult() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("missing-public-id"))
				.thenThrow(new TaskException(TaskErrorCode.LESSON_NOT_FOUND));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/student/lessons/missing-public-id/result").exchange();

		// then
		result.expectStatus().isNotFound();
		verify(studentService, never()).getLessonResultDetails(any());
	}

	@Configuration
	static class TestConfig {

		@Bean
		StudentService studentService() {
			return mock(StudentService.class);
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
		StudentDashboardController studentDashboardController(StudentService studentService,
				LessonPublicIdLookupService lessonPublicIdLookupService) {
			return new StudentDashboardController(studentService, lessonPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
