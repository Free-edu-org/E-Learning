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
import pl.freeedu.backend.student.dto.StudentAchievementResponse;
import pl.freeedu.backend.student.dto.StudentProgressHistoryResponse;
import pl.freeedu.backend.student.dto.StudentSkillStatsResponse;
import pl.freeedu.backend.student.service.StudentAchievementService;
import pl.freeedu.backend.student.service.StudentService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {StudentDashboardControllerPublicIdWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class StudentDashboardControllerPublicIdWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private StudentService studentService;

	@Autowired
	private StudentAchievementService studentAchievementService;

	@Autowired
	private LessonPublicIdLookupService lessonPublicIdLookupService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(studentService, studentAchievementService, lessonPublicIdLookupService);
	}

	@Test
	void shouldReturnLessonResultByPublicIdWhenStudentHasAccess() {
		// given
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(17);
		when(studentService.getLessonResultDetails(17))
				.thenReturn(Mono.just(LessonResultDetailsResponse.builder().lessonPublicId("lesson-public-id")
						.lessonTitle("Lesson").userPublicId("student-public-id").tasks(List.of()).build()));

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

	@Test
	void shouldReturnStudentProgressHistoryForCurrentStudent() {
		// given
		when(studentService.getProgress()).thenReturn(Flux.fromIterable(
				List.of(StudentProgressHistoryResponse.builder().date("2026-04-09").progress(50.0).build(),
						StudentProgressHistoryResponse.builder().date("2026-04-10").progress(76.0).build())));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/student/progress").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$[0].date").isEqualTo("2026-04-09")
				.jsonPath("$[0].progress").isEqualTo(50.0).jsonPath("$[1].date").isEqualTo("2026-04-10")
				.jsonPath("$[1].progress").isEqualTo(76.0);
		verify(studentService).getProgress();
	}

	@Test
	void shouldReturnStudentSkillBreakdownForCurrentStudent() {
		// given
		when(studentService.getSkillStats()).thenReturn(Flux
				.fromIterable(List.of(StudentSkillStatsResponse.builder().category("Wybór").correct(6).wrong(2).build(),
					StudentSkillStatsResponse.builder().category("Pisanie").correct(1).wrong(1).build())));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/student/skills").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$[0].category").isEqualTo("Wybór").jsonPath("$[0].correct")
				.isEqualTo(6).jsonPath("$[0].wrong").isEqualTo(2);
		verify(studentService).getSkillStats();
	}

	@Test
	void shouldReturnStudentAchievementsForCurrentStudent() {
		// given
		when(studentAchievementService.getAchievementsForCurrentStudent())
				.thenReturn(Mono.just(List.of(StudentAchievementResponse.builder().id(1).title("Pierwsza lekcja")
					.description("Ukończyłeś swoją pierwszą lekcję").icon("").color("warning").unlocked(true)
					.unlockedAt(java.time.LocalDateTime.of(2026, 5, 6, 12, 30, 0)).newlyUnlocked(true).build())));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/student/achievements").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$[0].id").isEqualTo(1).jsonPath("$[0].title")
			.isEqualTo("Pierwsza lekcja").jsonPath("$[0].description").isEqualTo("Ukończyłeś swoją pierwszą lekcję")
				.jsonPath("$[0].icon").isEqualTo("").jsonPath("$[0].color").isEqualTo("warning")
				.jsonPath("$[0].unlocked").isEqualTo(true).jsonPath("$[0].unlockedAt").isEqualTo("2026-05-06T12:30:00")
				.jsonPath("$[0].newlyUnlocked").isEqualTo(true);
		verify(studentAchievementService).getAchievementsForCurrentStudent();
	}

	@Test
	void shouldForbidStudentAchievementsForNonStudentRole() {
		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).get()
				.uri("/api/v1/student/achievements").exchange();

		// then
		result.expectStatus().isForbidden();
		verify(studentAchievementService, never()).getAchievementsForCurrentStudent();
	}

	@Test
	void shouldMarkAchievementNotificationsSeenForCurrentStudent() {
		// given
		when(studentAchievementService.markNotificationsSeenForCurrentStudent()).thenReturn(Mono.just(2));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("student").roles("STUDENT")).post()
				.uri("/api/v1/student/achievements/notifications/seen").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.markedCount").isEqualTo(2);
		verify(studentAchievementService).markNotificationsSeenForCurrentStudent();
	}

	@Test
	void shouldForbidAchievementNotificationsSeenForNonStudentRole() {
		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/student/achievements/notifications/seen").exchange();

		// then
		result.expectStatus().isForbidden();
		verify(studentAchievementService, never()).markNotificationsSeenForCurrentStudent();
	}

	@Configuration
	static class TestConfig {

		@Bean
		StudentService studentService() {
			return mock(StudentService.class);
		}

		@Bean
		StudentAchievementService studentAchievementService() {
			return mock(StudentAchievementService.class);
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
				StudentAchievementService studentAchievementService,
				LessonPublicIdLookupService lessonPublicIdLookupService) {
			return new StudentDashboardController(studentService, studentAchievementService,
					lessonPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
