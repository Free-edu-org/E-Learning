package pl.freeedu.backend.student.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.AchievementType;
import pl.freeedu.backend.achievement.model.UserAchievement;
import pl.freeedu.backend.achievement.repository.AchievementRepository;
import pl.freeedu.backend.achievement.repository.UserAchievementRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.dto.StudentAchievementResponse;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
	void shouldReturnOnlyActiveAchievementsWithRequiredDtoFields() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(1).currentPoints(10).avatarChanged(true).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(List.of(
				activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1, true),
				activeAchievement(3, "TEN_POINTS", "10 punktów", AchievementType.POINTS, 10, true)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of());
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(true, true);

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> {
			assertEquals(2, responses.size());
			assertEquals("Pierwsza lekcja", responses.get(0).getTitle());
			assertEquals("10 punktów", responses.get(1).getTitle());
			assertEquals(true, responses.get(0).isUnlocked());
			assertEquals(true, responses.get(1).isUnlocked());
		}).verifyComplete();
	}

	@Test
	void shouldPersistUnlockIdempotentlyWithoutDuplicates() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(1).currentPoints(0).avatarChanged(false).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(List.of(
				activeAchievement(1, "FIRST_LESSON", "Pierwsza lekcja", AchievementType.LESSONS_COMPLETED, 1, true)));
		when(userAchievementRepository.findByUserId(7))
				.thenReturn(List.of(UserAchievement.builder().userId(7).achievementId(1).build()));
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(true);

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> assertEquals(true, responses.get(0).isUnlocked()))
				.verifyComplete();
		verify(userAchievementRepository, never()).save(any(UserAchievement.class));
	}

	@Test
	void shouldPersistNewUnlockWhenAchievementBecomesUnlocked() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(0).currentPoints(10).avatarChanged(false).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(3, "TEN_POINTS", "10 punktów", AchievementType.POINTS, 10, true)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of());
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(true);

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> assertEquals(true, responses.get(0).isUnlocked()))
				.verifyComplete();
		verify(userAchievementRepository).save(any(UserAchievement.class));
	}

	@Test
	void shouldNotUseHardcodedCodeChecksAndRespectEvaluatorResult() {
		// given
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(7));
		when(studentGamificationStatsService.buildStats(7)).thenReturn(StudentGamificationStats.builder()
				.completedLessonsCount(999).currentPoints(999).avatarChanged(true).build());
		when(achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc()).thenReturn(
				List.of(activeAchievement(44, "CUSTOM_CODE", "Custom", AchievementType.LESSONS_COMPLETED, 5000, true)));
		when(userAchievementRepository.findByUserId(7)).thenReturn(List.of());
		when(achievementRuleEvaluator.isUnlocked(any(Achievement.class), any(StudentGamificationStats.class)))
				.thenReturn(false);

		// when
		Mono<List<StudentAchievementResponse>> result = studentAchievementService.getAchievementsForCurrentStudent();

		// then
		StepVerifier.create(result).assertNext(responses -> assertEquals(false, responses.get(0).isUnlocked()))
				.verifyComplete();
		verify(userAchievementRepository, never()).save(any(UserAchievement.class));
	}

	private Achievement activeAchievement(Integer id, String code, String name, AchievementType type, Integer threshold,
			boolean active) {
		return Achievement.builder().id(id).code(code).name(name).description(name + " desc").icon("").color("warning")
				.type(type).threshold(threshold).active(active).sortOrder(id).build();
	}
}
