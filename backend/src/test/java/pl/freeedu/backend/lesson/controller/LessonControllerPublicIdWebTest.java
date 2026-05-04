package pl.freeedu.backend.lesson.controller;

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
import pl.freeedu.backend.lesson.dto.LessonRequest;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.service.LessonAttachmentService;
import pl.freeedu.backend.lesson.service.LessonPublicIdLookupService;
import pl.freeedu.backend.lesson.service.LessonService;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.support.ControllerTestSecurityConfig;
import pl.freeedu.backend.usergroup.service.UserGroupPublicIdLookupService;
import reactor.core.publisher.Mono;

@SpringJUnitConfig(classes = {LessonControllerPublicIdWebTest.TestConfig.class, GlobalExceptionHandler.class,
		ControllerTestSecurityConfig.class})
class LessonControllerPublicIdWebTest {

	@Autowired
	private WebTestClient webTestClient;

	@Autowired
	private LessonService lessonService;

	@Autowired
	private LessonPublicIdLookupService lessonPublicIdLookupService;

	@Autowired
	private SecurityService securityService;

	@Autowired
	private UserGroupPublicIdLookupService userGroupPublicIdLookupService;

	@BeforeEach
	void setUp() {
		org.mockito.Mockito.reset(lessonService, lessonPublicIdLookupService, userGroupPublicIdLookupService,
				securityService);
	}

	@Test
	void shouldCreateLessonAndReturnPublicIdWithoutInternalIdWhenTeacherCreatesLesson() {
		// given
		LessonResponse response = LessonResponse.builder().publicId("11111111-1111-1111-1111-111111111111")
				.title("Lesson").theme("Theme").groups(List.of()).build();
		when(lessonService.createLesson(any())).thenReturn(Mono.just(response));
		when(userGroupPublicIdLookupService.getRequiredInternalId("group-public-1")).thenReturn(1);
		when(userGroupPublicIdLookupService.getRequiredInternalId("group-public-2")).thenReturn(2);

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).post()
				.uri("/api/v1/lessons").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{"title":"Lesson","theme":"Theme","groupPublicIds":["group-public-1","group-public-2"]}
						""").exchange();

		// then
		result.expectStatus().isCreated().expectBody().jsonPath("$.publicId")
				.isEqualTo("11111111-1111-1111-1111-111111111111").jsonPath("$.id").doesNotExist();
		verify(lessonService).createLesson(any());
	}

	@Test
	void shouldUpdateLessonByPublicIdWhenTeacherOwnsLesson() {
		// given
		when(securityService.isLessonOwner(any(), eq("lesson-public-id"))).thenReturn(true);
		when(lessonPublicIdLookupService.getRequiredInternalId("lesson-public-id")).thenReturn(25);
		when(userGroupPublicIdLookupService.getRequiredInternalId("group-public-3")).thenReturn(3);
		when(lessonService.updateLesson(eq(25), any())).thenReturn(Mono
				.just(LessonResponse.builder().publicId("lesson-public-id").title("Updated").theme("Theme").build()));

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).put()
				.uri("/api/v1/lessons/lesson-public-id").contentType(MediaType.APPLICATION_JSON).bodyValue("""
						{"title":"Updated","theme":"Theme","groupPublicIds":["group-public-3"]}
						""").exchange();

		// then
		result.expectStatus().isOk().expectBody().jsonPath("$.publicId").isEqualTo("lesson-public-id").jsonPath("$.id")
				.doesNotExist();
		verify(lessonPublicIdLookupService).getRequiredInternalId("lesson-public-id");
		verify(lessonService).updateLesson(eq(25), any());
	}

	@Test
	void shouldReturnForbiddenWhenTeacherTriesToUpdateForeignLessonByPublicId() {
		// given
		when(securityService.isLessonOwner(any(), eq("foreign-lesson-public-id"))).thenReturn(false);

		// when
		WebTestClient.ResponseSpec result = webTestClient.mutateWith(mockUser("teacher").roles("TEACHER")).put()
				.uri("/api/v1/lessons/foreign-lesson-public-id").contentType(MediaType.APPLICATION_JSON)
				.bodyValue(LessonRequest.builder().title("Updated").theme("Theme").build()).exchange();

		// then
		result.expectStatus().isForbidden();
		verify(lessonPublicIdLookupService, never()).getRequiredInternalId("foreign-lesson-public-id");
		verify(lessonService, never()).updateLesson(any(), any());
	}

	@Configuration
	static class TestConfig {

		@Bean
		LessonService lessonService() {
			return mock(LessonService.class);
		}

		@Bean
		LessonAttachmentService lessonAttachmentService() {
			return mock(LessonAttachmentService.class);
		}

		@Bean
		LessonPublicIdLookupService lessonPublicIdLookupService() {
			return mock(LessonPublicIdLookupService.class);
		}

		@Bean
		UserGroupPublicIdLookupService userGroupPublicIdLookupService() {
			return mock(UserGroupPublicIdLookupService.class);
		}

		@Bean(name = "securityService")
		SecurityService securityService() {
			return mock(SecurityService.class);
		}

		@Bean
		LessonController lessonController(LessonService lessonService, LessonAttachmentService lessonAttachmentService,
				LessonPublicIdLookupService lessonPublicIdLookupService,
				UserGroupPublicIdLookupService userGroupPublicIdLookupService) {
			return new LessonController(lessonService, lessonAttachmentService, lessonPublicIdLookupService,
					userGroupPublicIdLookupService);
		}

		@Bean
		WebTestClient webTestClient(ApplicationContext applicationContext) {
			return WebTestClient.bindToApplicationContext(applicationContext).apply(springSecurity()).build();
		}
	}
}
