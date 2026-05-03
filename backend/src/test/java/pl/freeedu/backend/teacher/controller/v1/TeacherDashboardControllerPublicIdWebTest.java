package pl.freeedu.backend.teacher.controller.v1;

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
import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.teacher.dto.LessonStatsResponse;
import pl.freeedu.backend.teacher.service.TeacherService;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {TeacherDashboardControllerPublicIdWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class TeacherDashboardControllerPublicIdWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private TeacherService teacherService;

	@Autowired
	private LessonPublicIdLookupService lessonPublicIdLookupService;
	@Autowired
	private pl.freeedu.backend.user.service.UserPublicIdLookupService userPublicIdLookupService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(teacherService, lessonPublicIdLookupService, userPublicIdLookupService);
	}

	@Test
	void shouldReturnLessonStatsByPublicIdWhenTeacherRequestsOwnedLesson() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(21);
		when(teacherService.getLessonStats(21)).thenReturn(Mono.just(LessonStatsResponse.builder().avgScore(88.5)
				.studentsCompleted(2).bestScore(100.0).studentResults(List.of()).build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).get()
				.uri("/api/v1/teacher/lessons/lesson-public-id/stats").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.avgScore").isEqualTo(88.5).jsonPath("$.studentsCompleted")
				.isEqualTo(2);
		verify(teacherService).getLessonStats(21);
	}

	@Test
	void shouldReturnDetailedLessonResultByPublicIdWhenTeacherHasAccess() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(21);
		when(userPublicIdLookupService.getInternalId("77")).thenReturn(Mono.just(77));
		when(teacherService.getLessonResultDetails(21, 77)).thenReturn(Mono.just(LessonResultDetailsResponse.builder()
				.lessonPublicId("lesson-public-id").lessonTitle("Lesson").userPublicId("77").tasks(List.of()).build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).get()
				.uri("/api/v1/teacher/lessons/lesson-public-id/students/77/result").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.lessonPublicId").isEqualTo("lesson-public-id")
				.jsonPath("$.lessonId").doesNotExist();
		verify(teacherService).getLessonResultDetails(21, 77);
	}

	@Test
	void shouldReturnNotFoundWhenTeacherRequestsMissingLessonPublicIdStats() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("missing-public-id"))
				.thenThrow(new LessonException(LessonErrorCode.LESSON_NOT_FOUND));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).get()
				.uri("/api/v1/teacher/lessons/missing-public-id/stats").exchange();

		// then
		result.expectStatus().isNotFound();
		verify(teacherService, never()).getLessonStats(any());
	}

	@Test
	void shouldReturnForbiddenWhenTeacherRequestsForeignLessonResultByPublicId() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("foreign-lesson-public-id")).thenReturn(21);
		when(userPublicIdLookupService.getInternalId("77")).thenReturn(Mono.just(77));
		when(teacherService.getLessonResultDetails(21, 77))
				.thenThrow(new LessonException(LessonErrorCode.NOT_LESSON_OWNER));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).get()
				.uri("/api/v1/teacher/lessons/foreign-lesson-public-id/students/77/result").exchange();

		// then
		result.expectStatus().isForbidden();
		verify(teacherService).getLessonResultDetails(21, 77);
	}

	@Configuration
	static class TestConfig {

		@Bean
		pl.freeedu.backend.teacher.service.TeacherService teacherService() {
			return mock(pl.freeedu.backend.teacher.service.TeacherService.class);
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
		TeacherDashboardController teacherDashboardController(
				pl.freeedu.backend.teacher.service.TeacherService teacherService,
				LessonPublicIdLookupService lessonPublicIdLookupService,
				pl.freeedu.backend.user.service.UserPublicIdLookupService userPublicIdLookupService) {
			return new TeacherDashboardController(teacherService, lessonPublicIdLookupService,
					userPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
