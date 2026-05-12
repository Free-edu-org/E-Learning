package pl.freeedu.backend.admin.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.achievement.exception.AchievementErrorCode;
import pl.freeedu.backend.achievement.exception.AchievementException;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.AchievementType;
import pl.freeedu.backend.achievement.repository.AchievementRepository;
import pl.freeedu.backend.admin.dto.CreateAchievementRequest;
import pl.freeedu.backend.admin.dto.UpdateAchievementActiveRequest;
import pl.freeedu.backend.admin.dto.UpdateAchievementRequest;
import pl.freeedu.backend.student.service.AchievementRuleEvaluator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AchievementManagementServiceTest {

	@Mock
	private AchievementRepository achievementRepository;

	@Mock
	private TransactionTemplate transactionTemplate;

	@Mock
	private AchievementRuleEvaluator achievementRuleEvaluator;

	@InjectMocks
	private AchievementManagementService achievementManagementService;

	@BeforeEach
	void setUp() {
		lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
	}

	@Test
	void shouldReturnAllAchievementsSorted() {
		Achievement first = achievement("FIRST", "First", AchievementType.LESSONS_COMPLETED, 1, true, 1);
		Achievement second = achievement("SECOND", "Second", AchievementType.POINTS, 10, false, 2);
		when(achievementRepository.findAllByOrderBySortOrderAscIdAsc()).thenReturn(List.of(first, second));

		Flux<?> result = achievementManagementService.getAllAchievements();

		StepVerifier.create(result)
				.assertNext(response -> assertEquals("FIRST",
						((pl.freeedu.backend.admin.dto.AdminAchievementResponse) response).getCode()))
				.assertNext(response -> assertEquals("SECOND",
						((pl.freeedu.backend.admin.dto.AdminAchievementResponse) response).getCode()))
				.verifyComplete();
	}

	@Test
	void shouldReturnAchievementByCode() {
		Achievement achievement = achievement("FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1,
				true, 1);
		when(achievementRepository.findByCode("FIRST_LESSON")).thenReturn(Optional.of(achievement));

		Mono<?> result = achievementManagementService.getAchievementByCode("FIRST_LESSON");

		StepVerifier.create(result).assertNext(response -> {
			pl.freeedu.backend.admin.dto.AdminAchievementResponse dto = (pl.freeedu.backend.admin.dto.AdminAchievementResponse) response;
			assertEquals("FIRST_LESSON", dto.getCode());
			assertEquals("Pierwsza lekcja", dto.getTitle());
		}).verifyComplete();
	}

	@Test
	void shouldReturnNotFoundWhenAchievementByCodeMissing() {
		when(achievementRepository.findByCode("MISSING")).thenReturn(Optional.empty());

		Mono<?> result = achievementManagementService.getAchievementByCode("MISSING");

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof AchievementException);
			assertEquals(AchievementErrorCode.ACHIEVEMENT_NOT_FOUND, ((AchievementException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldCreateAchievement() {
		CreateAchievementRequest request = CreateAchievementRequest.builder().code("ADMIN_TEST_ACH_CREATE")
				.title("Create title").description("Create description").icon("icon").color("warning")
				.type(AchievementType.LESSONS_COMPLETED).threshold(3).active(true).sortOrder(5).build();
		when(achievementRepository.existsByCode("ADMIN_TEST_ACH_CREATE")).thenReturn(false);
		when(achievementRepository.save(any())).thenAnswer(invocation -> {
			Achievement saved = invocation.getArgument(0);
			saved.setCreatedAt(LocalDateTime.of(2026, 5, 7, 10, 0));
			saved.setUpdatedAt(LocalDateTime.of(2026, 5, 7, 10, 0));
			return saved;
		});

		Mono<?> result = achievementManagementService.createAchievement(request);

		StepVerifier.create(result).assertNext(response -> {
			pl.freeedu.backend.admin.dto.AdminAchievementResponse dto = (pl.freeedu.backend.admin.dto.AdminAchievementResponse) response;
			assertEquals("ADMIN_TEST_ACH_CREATE", dto.getCode());
			assertEquals("Create title", dto.getTitle());
			assertEquals(AchievementType.LESSONS_COMPLETED, dto.getType());
		}).verifyComplete();
		verify(achievementRuleEvaluator).validateAchievement(any(Achievement.class));
	}

	@Test
	void shouldRejectDuplicateAchievementCodeOnCreate() {
		CreateAchievementRequest request = CreateAchievementRequest.builder().code("DUPLICATE_CODE").title("Title")
				.description("Description").icon("icon").color("warning").type(AchievementType.POINTS).threshold(10)
				.active(true).sortOrder(1).build();
		when(achievementRepository.existsByCode("DUPLICATE_CODE")).thenReturn(true);

		Mono<?> result = achievementManagementService.createAchievement(request);

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof AchievementException);
			assertEquals(AchievementErrorCode.ACHIEVEMENT_CODE_ALREADY_EXISTS,
					((AchievementException) error).getErrorCode());
		}).verify();
		verify(achievementRepository, never()).save(any());
	}

	@Test
	void shouldRejectInvalidRuleConfigurationOnCreate() {
		CreateAchievementRequest request = CreateAchievementRequest.builder().code("BAD_RULE").title("Title")
				.description("Description").icon("icon").color("warning").type(AchievementType.AVATAR_CHANGED)
				.threshold(1).active(true).sortOrder(1).build();
		when(achievementRepository.existsByCode("BAD_RULE")).thenReturn(false);
		org.mockito.Mockito.doThrow(new IllegalArgumentException("bad")).when(achievementRuleEvaluator)
				.validateAchievement(any(Achievement.class));

		Mono<?> result = achievementManagementService.createAchievement(request);

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof AchievementException);
			assertEquals(AchievementErrorCode.INVALID_ACHIEVEMENT_RULE, ((AchievementException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldUpdateEditableFieldsWithoutChangingCodeOrType() {
		Achievement existing = achievement("IMMUTABLE_CODE", "Old", AchievementType.POINTS, 10, true, 1);
		UpdateAchievementRequest request = UpdateAchievementRequest.builder().title("New title")
				.description("New description").icon("new-icon").color("success").threshold(25).active(false)
				.sortOrder(7).build();
		when(achievementRepository.findByCode("IMMUTABLE_CODE")).thenReturn(Optional.of(existing));
		when(achievementRepository.save(existing)).thenReturn(existing);

		Mono<?> result = achievementManagementService.updateAchievement("IMMUTABLE_CODE", request);

		StepVerifier.create(result).assertNext(response -> {
			pl.freeedu.backend.admin.dto.AdminAchievementResponse dto = (pl.freeedu.backend.admin.dto.AdminAchievementResponse) response;
			assertEquals("IMMUTABLE_CODE", dto.getCode());
			assertEquals(AchievementType.POINTS, dto.getType());
			assertEquals("New title", dto.getTitle());
			assertEquals(25, dto.getThreshold());
			assertEquals(false, dto.getActive());
		}).verifyComplete();
		verify(achievementRuleEvaluator).validateAchievement(existing);
	}

	@Test
	void shouldToggleAchievementActiveFlag() {
		Achievement existing = achievement("ACTIVE_CODE", "Title", AchievementType.LESSONS_COMPLETED, 1, true, 1);
		when(achievementRepository.findByCode("ACTIVE_CODE")).thenReturn(Optional.of(existing));
		when(achievementRepository.save(existing)).thenReturn(existing);

		Mono<?> result = achievementManagementService.updateAchievementActive("ACTIVE_CODE",
				UpdateAchievementActiveRequest.builder().active(false).build());

		StepVerifier.create(result)
				.assertNext(response -> assertEquals(false,
						((pl.freeedu.backend.admin.dto.AdminAchievementResponse) response).getActive()))
				.verifyComplete();
	}

	@Test
	void shouldDeleteAchievement() {
		Achievement existing = achievement("DELETE_ME", "Delete me", AchievementType.LESSONS_COMPLETED, 1, true, 1);
		when(achievementRepository.findByCode("DELETE_ME")).thenReturn(Optional.of(existing));

		Mono<Void> result = achievementManagementService.deleteAchievement("DELETE_ME");

		StepVerifier.create(result).verifyComplete();
		verify(achievementRepository).delete(existing);
	}

	@Test
	void shouldReturnNotFoundWhenDeletingMissingAchievement() {
		when(achievementRepository.findByCode("MISSING_DELETE")).thenReturn(Optional.empty());

		Mono<Void> result = achievementManagementService.deleteAchievement("MISSING_DELETE");

		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof AchievementException);
			assertEquals(AchievementErrorCode.ACHIEVEMENT_NOT_FOUND, ((AchievementException) error).getErrorCode());
		}).verify();
		verify(achievementRepository, never()).delete(any());
	}

	private Achievement achievement(String code, String title, AchievementType type, Integer threshold, Boolean active,
			Integer sortOrder) {
		return Achievement.builder().code(code).name(title).description("Description").icon("icon").color("warning")
				.type(type).threshold(threshold).active(active).sortOrder(sortOrder)
				.createdAt(LocalDateTime.of(2026, 5, 7, 12, 0)).updatedAt(LocalDateTime.of(2026, 5, 7, 12, 30)).build();
	}
}
