package pl.freeedu.backend.student.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.AchievementType;
import pl.freeedu.backend.achievement.model.UserAchievement;
import pl.freeedu.backend.achievement.repository.AchievementRepository;
import pl.freeedu.backend.achievement.repository.UserAchievementRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.dto.StudentAchievementResponse;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentAchievementServiceTest {

	@Mock
	private SecurityService securityService;
	@Mock
	private AchievementRepository achievementRepository;
	@Mock
	private UserAchievementRepository userAchievementRepository;
	@Mock
	private StudentGamificationStatsService studentGamificationStatsService;
	@Mock
	private AchievementRuleEvaluator achievementRuleEvaluator;

	private StudentAchievementService studentAchievementService;

	@BeforeEach
	void setUp() {
		studentAchievementService = new StudentAchievementService(securityService, achievementRepository,
				userAchievementRepository, studentGamificationStatsService, achievementRuleEvaluator);
	}

	@Test
	void shouldReturnLockedAchievementWithoutCreatingUnlockInReadOnlyGet() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of());

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> {
			assertEquals(1, responses.size());
			assertFalse(responses.get(0).isUnlocked());
			assertNull(responses.get(0).getUnlockedAt());
			assertFalse(responses.get(0).isNewlyUnlocked());
		}).verifyComplete();
		verify(userAchievementRepository, never()).save(any(UserAchievement.class));
		verify(studentGamificationStatsService, never()).buildStats(any());
		verify(achievementRuleEvaluator, never()).isUnlocked(any(), any());
	}

	@Test
	void shouldReturnNewlyUnlockedTrueWhenUnlockedAchievementHasNoSeenTimestamp() {
		// given
		LocalDateTime unlockedAt = LocalDateTime.of(2026, 5, 6, 12, 30, 0);
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(
				List.of(UserAchievement.builder().userId(7).achievementId(1).createdAt(unlockedAt).build()));

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> {
			assertTrue(responses.get(0).isUnlocked());
			assertEquals(unlockedAt, responses.get(0).getUnlockedAt());
			assertTrue(responses.get(0).isNewlyUnlocked());
		}).verifyComplete();
	}

	@Test
	void shouldReturnNewlyUnlockedFalseWhenSeenTimestampExists() {
		// given
		LocalDateTime unlockedAt = LocalDateTime.of(2026, 5, 6, 12, 30, 0);
		LocalDateTime seenAt = LocalDateTime.of(2026, 5, 6, 13, 0, 0);
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of(UserAchievement.builder().userId(7)
				.achievementId(1).createdAt(unlockedAt).notificationSeenAt(seenAt).build()));

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> {
			assertTrue(responses.get(0).isUnlocked());
			assertEquals(unlockedAt, responses.get(0).getUnlockedAt());
			assertFalse(responses.get(0).isNewlyUnlocked());
		}).verifyComplete();
	}

	@Test
	void shouldSaveNewUnlockWhenAchievementBecomesUnlocked() {
		// given
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(1).currentPoints(0).avatarChanged(false).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of());
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(true);

		// when
		studentAchievementService.checkAndUnlockAchievements(7);

		// then
		verify(userAchievementRepository).save(any(UserAchievement.class));
	}

	@Test
	void shouldNotCreateDuplicateUnlockWhenAlreadyUnlocked() {
		// given
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(1).currentPoints(0).avatarChanged(false).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1)));
		when(userAchievementRepository.findByUserId(7))
				.thenReturn(List.of(UserAchievement.builder().userId(7).achievementId(1).build()));
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(true);

		// when
		studentAchievementService.checkAndUnlockAchievements(7);

		// then
		verify(userAchievementRepository, never()).save(any(UserAchievement.class));
	}

	@Test
	void shouldIgnoreDuplicateKeyDuringUnlockPersistence() {
		// given
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(1).currentPoints(0).avatarChanged(false).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of());
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(true);
		when(userAchievementRepository.save(any(UserAchievement.class)))
				.thenThrow(new DataIntegrityViolationException("duplicate"));

		// when
		studentAchievementService.checkAndUnlockAchievements(7);

		// then
		verify(userAchievementRepository).save(any(UserAchievement.class));
	}

	@Test
	void shouldKeepPreviouslyUnlockedPointsAchievementAfterCurrentPointsDrop() {
		// given
		LocalDateTime unlockedAt = LocalDateTime.of(2026, 5, 6, 12, 30, 0);
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc())
				.thenReturn(List.of(activeAchievement(1, "TEN_POINTS", "10 punktów", AchievementType.POINTS, 10)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(
				List.of(UserAchievement.builder().userId(7).achievementId(1).createdAt(unlockedAt).build()));

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> {
			assertEquals(1, responses.size());
			assertTrue(responses.get(0).isUnlocked());
			assertEquals(unlockedAt, responses.get(0).getUnlockedAt());
		}).verifyComplete();
	}

	private Achievement activeAchievement(Integer id, String code, String name, AchievementType type,
			Integer threshold) {
		return Achievement.builder().id(id).code(code).name(name).description(name + " desc").icon("").color("warning")
				.type(type).threshold(threshold).active(true).sortOrder(id).build();
	}
}
