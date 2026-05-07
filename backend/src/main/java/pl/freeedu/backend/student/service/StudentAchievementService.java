package pl.freeedu.backend.student.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.model.UserAchievement;
import pl.freeedu.backend.achievement.repository.AchievementRepository;
import pl.freeedu.backend.achievement.repository.UserAchievementRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.dto.StudentAchievementResponse;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
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
			return buildAchievementReadModelForUser(userId);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Integer> markNotificationsSeenForCurrentStudent() {
		return securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
			log.info("Marking achievement notifications as seen for current student ID: {}", userId);
			return userAchievementRepository.markNotificationsSeenByUserId(userId, LocalDateTime.now());
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void checkAndUnlockAchievements(Integer userId) {
		log.info("Checking and unlocking achievements for student ID: {}", userId);
		StudentGamificationStats stats = studentGamificationStatsService.buildStats(userId);
		List<Achievement> achievements = achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
		Set<Integer> alreadyUnlockedAchievementIds = userAchievementRepository.findByUserId(userId).stream()
				.map(UserAchievement::getAchievementId).collect(Collectors.toSet());

		for (Achievement achievement : achievements) {
			boolean unlocked = achievementRuleEvaluator.isUnlocked(achievement, stats);
			if (unlocked) {
				persistUnlockIfNeeded(userId, achievement, alreadyUnlockedAchievementIds);
			}
		}
	}

	private List<StudentAchievementResponse> buildAchievementReadModelForUser(Integer userId) {
		List<Achievement> achievements = achievementRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
		Map<Integer, UserAchievement> unlockedAchievementsById = userAchievementRepository.findByUserId(userId).stream()
				.collect(Collectors.toMap(UserAchievement::getAchievementId, Function.identity()));

		List<StudentAchievementResponse> responses = achievements.stream().map(achievement -> {
			UserAchievement unlockedAchievement = unlockedAchievementsById.get(achievement.getId());
			return StudentAchievementResponse.builder().id(achievement.getId()).title(achievement.getName())
					.description(achievement.getDescription()).icon(achievement.getIcon()).color(achievement.getColor())
					.unlocked(unlockedAchievement != null)
					.unlockedAt(unlockedAchievement != null ? unlockedAchievement.getCreatedAt() : null)
					.newlyUnlocked(unlockedAchievement != null && unlockedAchievement.getNotificationSeenAt() == null)
					.build();
		}).toList();

		log.info("Resolved {} achievements for student ID: {}", responses.size(), userId);
		return responses;
	}

	private void persistUnlockIfNeeded(Integer userId, Achievement achievement,
			Set<Integer> alreadyUnlockedAchievementIds) {
		if (alreadyUnlockedAchievementIds.contains(achievement.getId())) {
			return;
		}

		try {
			log.info("Persisting newly unlocked achievement {} for student ID: {}", achievement.getCode(), userId);
			userAchievementRepository
					.save(UserAchievement.builder().userId(userId).achievementId(achievement.getId()).build());
			alreadyUnlockedAchievementIds.add(achievement.getId());
		} catch (DataIntegrityViolationException ex) {
			log.warn("Achievement {} already unlocked concurrently for student ID: {}", achievement.getCode(), userId);
			alreadyUnlockedAchievementIds.add(achievement.getId());
		}
	}
}
