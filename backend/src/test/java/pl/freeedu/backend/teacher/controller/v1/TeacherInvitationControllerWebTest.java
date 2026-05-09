package pl.freeedu.backend.teacher.controller.v1;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockUser;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.reactive.server.WebTestClient;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationErrorCode;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationException;
import pl.freeedu.backend.exception.GlobalExceptionHandler;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import pl.freeedu.backend.teacher.service.TeacherService;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.service.UserPublicIdLookupService;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {TeacherInvitationControllerWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class TeacherInvitationControllerWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private TeacherService teacherService;

	@Autowired
	private UserPublicIdLookupService userPublicIdLookupService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(teacherService, userPublicIdLookupService);
	}

	// --- POST /teacher/students/{id}/resend-invite ---

	@Test
	void shouldResendInviteAndReturn204() {
		// given
		when(userPublicIdLookupService.getInternalId("student-pub-id")).thenReturn(Mono.just(1));
		when(teacherService.resendInvite(1)).thenReturn(Mono.empty());

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/teacher/students/student-pub-id/resend-invite").exchange().expectStatus().isNoContent();
	}

	@Test
	void shouldReturn409WhenResendingToAlreadyActiveAccount() {
		// given
		when(userPublicIdLookupService.getInternalId("student-pub-id")).thenReturn(Mono.just(1));
		when(teacherService.resendInvite(1)).thenReturn(
				Mono.error(new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_ALREADY_ACTIVE)));

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/teacher/students/student-pub-id/resend-invite").exchange().expectStatus().isEqualTo(409);
	}

	@Test
	void shouldReturn403WhenResendingForAnotherTeachersStudent() {
		// given
		when(userPublicIdLookupService.getInternalId("student-pub-id")).thenReturn(Mono.just(1));
		when(teacherService.resendInvite(1))
				.thenReturn(Mono.error(new AccessDeniedException("Missing ownership over student")));

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/teacher/students/student-pub-id/resend-invite").exchange().expectStatus().isForbidden();
	}

	@Test
	void shouldReturn404WhenResendingForNonExistentStudent() {
		// given
		when(userPublicIdLookupService.getInternalId("missing-pub-id")).thenReturn(Mono.just(99));
		when(teacherService.resendInvite(99)).thenReturn(Mono.error(new UserException(UserErrorCode.USER_NOT_FOUND)));

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/teacher/students/missing-pub-id/resend-invite").exchange().expectStatus().isNotFound();
	}

	// --- DELETE /teacher/students/{id} ---

	@Test
	void shouldCancelInvitationAndReturn204() {
		// given
		when(userPublicIdLookupService.getInternalId("student-pub-id")).thenReturn(Mono.just(1));
		when(teacherService.cancelStudentInvitation(1)).thenReturn(Mono.empty());

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).delete()
				.uri("/api/v1/teacher/students/student-pub-id").exchange().expectStatus().isNoContent();
	}

	@Test
	void shouldReturn409WhenCancellingAlreadyActiveStudentInvitation() {
		// given
		when(userPublicIdLookupService.getInternalId("student-pub-id")).thenReturn(Mono.just(1));
		when(teacherService.cancelStudentInvitation(1))
				.thenReturn(Mono.error(new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_NOT_INVITED)));

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).delete()
				.uri("/api/v1/teacher/students/student-pub-id").exchange().expectStatus().isEqualTo(409);
	}

	@Test
	void shouldReturn403WhenCancellingAnotherTeachersStudentInvitation() {
		// given
		when(userPublicIdLookupService.getInternalId("student-pub-id")).thenReturn(Mono.just(1));
		when(teacherService.cancelStudentInvitation(1))
				.thenReturn(Mono.error(new AccessDeniedException("Missing ownership over student")));

		// when / then
		webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).delete()
				.uri("/api/v1/teacher/students/student-pub-id").exchange().expectStatus().isForbidden();
	}

	@Configuration
	static class TestConfig {

		@Bean
		TeacherService teacherService() {
			return mock(TeacherService.class);
		}

		@Bean
		LessonPublicIdLookupService lessonPublicIdLookupService() {
			return mock(LessonPublicIdLookupService.class);
		}

		@Bean
		UserPublicIdLookupService userPublicIdLookupService() {
			return mock(UserPublicIdLookupService.class);
		}

		@Bean(name = "securityService")
		SecurityService securityService() {
			return mock(SecurityService.class);
		}

		@Bean
		TeacherDashboardController teacherDashboardController(TeacherService teacherService,
				LessonPublicIdLookupService lessonPublicIdLookupService,
				UserPublicIdLookupService userPublicIdLookupService) {
			return new TeacherDashboardController(teacherService, lessonPublicIdLookupService,
					userPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
