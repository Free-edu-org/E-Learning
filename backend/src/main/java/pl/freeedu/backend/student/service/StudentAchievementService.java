package pl.freeedu.backend.student.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.UserAchievement;
import pl.freeedu.backend.achievement.repository.AchievementRepository;
import pl.freeedu.backend.achievement.repository.UserAchievementRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.dto.StudentAchievementResponse;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class StudentAchievementService {

	private final SecurityService securityService;
	private final AchievementRepository achievementRepository;
	private final UserAchievementRepository userAchievementRepository;
	private final StudentGamificationStatsService studentGamificationStatsService;
	private final AchievementRuleEvaluator achievementRuleEvaluator;

	public StudentAchievementService(SecurityService securityService, AchievementRepository achievementRepository,
			UserAchievementRepository userAchievementRepository,
			StudentGamificationStatsService studentGamificationStatsService,
			AchievementRuleEvaluator achievementRuleEvaluator) {
		this.securityService = securityService;
		this.achievementRepository = achievementRepository;
		this.userAchievementRepository = userAchievementRepository;
		this.studentGamificationStatsService = studentGamificationStatsService;
		this.achievementRuleEvaluator = achievementRuleEvaluator;
	}

	public Mono<List<StudentAchievementResponse>> getAchievementsForCurrentStudent() {
		return securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
			log.info("Fetching achievements for current student ID: {}", userId);
			return buildAchievementsForUser(userId);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	private List<StudentAchievementResponse> buildAchievementsForUser(Integer userId) {
		StudentGamificationStats stats = studentGamificationStatsService.buildStats(userId);

		List<Achievement> achievements = achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
		Set<Integer> alreadyUnlockedAchievementIds = userAchievementRepository.findByUserId(userId).stream()
				.map(UserAchievement::getAchievementId).collect(Collectors.toSet());

		List<StudentAchievementResponse> responses = achievements.stream().map(achievement -> {
			boolean unlocked = achievementRuleEvaluator.isUnlocked(achievement, stats);
			persistUnlockIfNeeded(userId, achievement, unlocked, alreadyUnlockedAchievementIds);
			return StudentAchievementResponse.builder().id(achievement.getId()).title(achievement.getName())
					.description(achievement.getDescription()).icon(achievement.getIcon()).color(achievement.getColor())
					.unlocked(unlocked).build();
		}).toList();

		log.info("Resolved {} achievements for student ID: {}", responses.size(), userId);
		return responses;
	}

	private void persistUnlockIfNeeded(Integer userId, Achievement achievement, boolean unlocked,
			Set<Integer> alreadyUnlockedAchievementIds) {
		if (!unlocked || alreadyUnlockedAchievementIds.contains(achievement.getId())) {
			return;
		}

		log.info("Persisting newly unlocked achievement {} for student ID: {}", achievement.getCode(), userId);
		userAchievementRepository
				.save(UserAchievement.builder().userId(userId).achievementId(achievement.getId()).build());
		alreadyUnlockedAchievementIds.add(achievement.getId());
	}
}
