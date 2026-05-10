package pl.freeedu.backend.admin.controller.v1;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.reactive.server.WebTestClient;
import pl.freeedu.backend.admin.dto.AdminAchievementResponse;
import pl.freeedu.backend.admin.service.AchievementManagementService;
import pl.freeedu.backend.achievement.exception.AchievementErrorCode;
import pl.freeedu.backend.achievement.exception.AchievementException;
import pl.freeedu.backend.achievement.model.AchievementType;
import pl.freeedu.backend.exception.GlobalExceptionHandler;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringJUnitConfig(classes = {AdminAchievementControllerWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class AdminAchievementControllerWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private AchievementManagementService achievementManagementService;

	@BeforeEach
	void setUp() {
		reset(achievementManagementService);
	}

	@Test
	void shouldReturnAchievementListForAdmin() {
		when(achievementManagementService.getAllAchievements())
				.thenReturn(Flux.fromIterable(List.of(response("ADMIN_TEST_ACH_B", "B title", 2, true),
						response("ADMIN_TEST_ACH_A", "A title", 1, false))));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).get()
				.uri("/api/v1/admin/achievements").exchange().expectStatus().isOk().expectBody().jsonPath("$[0].code")
				.isEqualTo("ADMIN_TEST_ACH_B").jsonPath("$[0].title").isEqualTo("B title").jsonPath("$[0].id")
				.doesNotExist();
		verify(achievementManagementService).getAllAchievements();
	}

	@Test
	void shouldForbidAchievementListForStudent() {
		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("student").roles("STUDENT")).get()
				.uri("/api/v1/admin/achievements").exchange().expectStatus().isForbidden();
		verify(achievementManagementService, never()).getAllAchievements();
	}

	@Test
	void shouldReturnAchievementByCodeForAdmin() {
		when(achievementManagementService.getAchievementByCode("FIRST_LESSON"))
				.thenReturn(Mono.just(response("FIRST_LESSON", "Pierwsza lekcja", 1, true)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).get()
				.uri("/api/v1/admin/achievements/FIRST_LESSON").exchange().expectStatus().isOk().expectBody()
				.jsonPath("$.code").isEqualTo("FIRST_LESSON").jsonPath("$.type").isEqualTo("LESSONS_COMPLETED");
	}

	@Test
	void shouldReturnNotFoundForMissingAchievementCode() {
		when(achievementManagementService.getAchievementByCode("MISSING"))
				.thenReturn(Mono.error(new AchievementException(AchievementErrorCode.ACHIEVEMENT_NOT_FOUND)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).get()
				.uri("/api/v1/admin/achievements/MISSING").exchange().expectStatus().isNotFound().expectBody()
				.jsonPath("$.code").isEqualTo("ACHIEVEMENT_NOT_FOUND");
	}

	@Test
	void shouldCreateAchievementForAdmin() {
		when(achievementManagementService.createAchievement(org.mockito.ArgumentMatchers.any()))
				.thenReturn(Mono.just(response("ADMIN_TEST_ACH_CREATE", "Create title", 3, true)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).post()
				.uri("/api/v1/admin/achievements").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{
						  "code": "ADMIN_TEST_ACH_CREATE",
						  "title": "Create title",
						  "description": "Create description",
						  "icon": "icon",
						  "color": "warning",
						  "type": "LESSONS_COMPLETED",
						  "threshold": 3,
						  "active": true,
						  "sortOrder": 3
						}
						""").exchange().expectStatus().isCreated().expectBody().jsonPath("$.code")
				.isEqualTo("ADMIN_TEST_ACH_CREATE");
	}

	@Test
	void shouldRejectCreateAchievementWithInvalidCodeFormat() {
		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).post()
				.uri("/api/v1/admin/achievements").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{
						  "code": "bad-code",
						  "title": "Create title",
						  "description": "Create description",
						  "icon": "icon",
						  "color": "warning",
						  "type": "LESSONS_COMPLETED",
						  "threshold": 3,
						  "active": true,
						  "sortOrder": 3
						}
						""").exchange().expectStatus().isBadRequest().expectBody().jsonPath("$.code")
				.isEqualTo("VALIDATION_FAILED");
	}

	@Test
	void shouldRejectCreateAchievementWithInvalidRule() {
		when(achievementManagementService.createAchievement(org.mockito.ArgumentMatchers.any()))
				.thenReturn(Mono.error(new AchievementException(AchievementErrorCode.INVALID_ACHIEVEMENT_RULE)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).post()
				.uri("/api/v1/admin/achievements").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{
						  "code": "ADMIN_TEST_BAD_RULE",
						  "title": "Bad rule",
						  "description": "Create description",
						  "icon": "icon",
						  "color": "warning",
						  "type": "AVATAR_CHANGED",
						  "threshold": 1,
						  "active": true,
						  "sortOrder": 3
						}
						""").exchange().expectStatus().isBadRequest().expectBody().jsonPath("$.code")
				.isEqualTo("INVALID_ACHIEVEMENT_RULE");
	}

	@Test
	void shouldUpdateAchievementForAdmin() {
		when(achievementManagementService.updateAchievement(org.mockito.ArgumentMatchers.eq("FIRST_LESSON"),
				org.mockito.ArgumentMatchers.any()))
				.thenReturn(Mono.just(response("FIRST_LESSON", "Updated title", 9, false)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).put()
				.uri("/api/v1/admin/achievements/FIRST_LESSON").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{
						  "title": "Updated title",
						  "description": "Updated description",
						  "icon": "new-icon",
						  "color": "success",
						  "threshold": 9,
						  "active": false,
						  "sortOrder": 7,
						  "code": "SHOULD_BE_IGNORED",
						  "type": "AVATAR_CHANGED"
						}
						""").exchange().expectStatus().isOk().expectBody().jsonPath("$.code").isEqualTo("FIRST_LESSON")
				.jsonPath("$.type").isEqualTo("LESSONS_COMPLETED").jsonPath("$.active").isEqualTo(false);
	}

	@Test
	void shouldPatchAchievementActiveForAdmin() {
		when(achievementManagementService.updateAchievementActive(org.mockito.ArgumentMatchers.eq("FIRST_LESSON"),
				org.mockito.ArgumentMatchers.any())).thenReturn(Mono.just(response("FIRST_LESSON", "Title", 1, false)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).patch()
				.uri("/api/v1/admin/achievements/FIRST_LESSON/active").contentType(MediaType.APPLICATION_JSON)
				.bodyValue("""
						{
						  "active": false
						}
						""").exchange().expectStatus().isOk().expectBody().jsonPath("$.active").isEqualTo(false);
	}

	@Test
	void shouldRejectPatchAchievementActiveWithMissingField() {
		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).patch()
				.uri("/api/v1/admin/achievements/FIRST_LESSON/active").contentType(MediaType.APPLICATION_JSON)
				.bodyValue("{}").exchange().expectStatus().isBadRequest().expectBody().jsonPath("$.code")
				.isEqualTo("VALIDATION_FAILED");
	}

	@Test
	void shouldDeleteAchievementForAdmin() {
		when(achievementManagementService.deleteAchievement("FIRST_LESSON")).thenReturn(Mono.empty());

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).delete()
				.uri("/api/v1/admin/achievements/FIRST_LESSON").exchange().expectStatus().isNoContent();
		verify(achievementManagementService).deleteAchievement("FIRST_LESSON");
	}

	@Test
	void shouldReturnNotFoundWhenDeletingMissingAchievement() {
		when(achievementManagementService.deleteAchievement("MISSING"))
				.thenReturn(Mono.error(new AchievementException(AchievementErrorCode.ACHIEVEMENT_NOT_FOUND)));

		webTestClient.mutateWith(SecurityMockServerConfigurers.mockUser("admin").roles("ADMIN")).delete()
				.uri("/api/v1/admin/achievements/MISSING").exchange().expectStatus().isNotFound().expectBody()
				.jsonPath("$.code").isEqualTo("ACHIEVEMENT_NOT_FOUND");
	}

	@Configuration
	static class TestConfig {

		@Bean
		AchievementManagementService achievementManagementService() {
			return mock(AchievementManagementService.class);
		}

		@Bean(name = "securityService")
		SecurityService securityService() {
			return mock(SecurityService.class);
		}

		@Bean
		AdminAchievementController adminAchievementController(
				AchievementManagementService achievementManagementService) {
			return new AdminAchievementController(achievementManagementService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext)
					.apply(SecurityMockServerConfigurers.springSecurity()).build();
		}
	}

	private static AdminAchievementResponse response(String code, String title, Integer threshold, Boolean active) {
		return AdminAchievementResponse.builder().code(code).title(title).description("Description").icon("icon")
				.color("warning").type(AchievementType.LESSONS_COMPLETED).threshold(threshold).active(active)
				.sortOrder(1).createdAt(LocalDateTime.of(2026, 5, 7, 12, 0))
				.updatedAt(LocalDateTime.of(2026, 5, 7, 12, 30)).build();
	}
}
