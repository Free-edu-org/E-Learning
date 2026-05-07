package pl.freeedu.backend.admin.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.achievement.exception.AchievementErrorCode;
import pl.freeedu.backend.achievement.exception.AchievementException;
import pl.freeedu.backend.achievement.model.Achievement;
import pl.freeedu.backend.achievement.repository.AchievementRepository;
import pl.freeedu.backend.admin.dto.AdminAchievementResponse;
import pl.freeedu.backend.admin.dto.CreateAchievementRequest;
import pl.freeedu.backend.admin.dto.UpdateAchievementActiveRequest;
import pl.freeedu.backend.admin.dto.UpdateAchievementRequest;
import pl.freeedu.backend.student.service.AchievementRuleEvaluator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
public class AchievementManagementService {

	private final AchievementRepository achievementRepository;
	private final TransactionTemplate transactionTemplate;
	private final AchievementRuleEvaluator achievementRuleEvaluator;

	public AchievementManagementService(AchievementRepository achievementRepository,
			TransactionTemplate transactionTemplate, AchievementRuleEvaluator achievementRuleEvaluator) {
		this.achievementRepository = achievementRepository;
		this.transactionTemplate = transactionTemplate;
		this.achievementRuleEvaluator = achievementRuleEvaluator;
	}

	public Flux<AdminAchievementResponse> getAllAchievements() {
		return Mono.fromCallable(
				() -> achievementRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(this::toResponse).toList())
				.subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}

	public Mono<AdminAchievementResponse> getAchievementByCode(String code) {
		return Mono.fromCallable(() -> toResponse(getRequiredAchievement(code)))
				.subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<AdminAchievementResponse> createAchievement(CreateAchievementRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			log.info("Creating achievement definition. Code: {}", request.getCode());
			if (achievementRepository.existsByCode(request.getCode())) {
				log.warn("Achievement creation failed: code already exists. Code: {}", request.getCode());
				throw new AchievementException(AchievementErrorCode.ACHIEVEMENT_CODE_ALREADY_EXISTS);
			}

			Achievement achievement = Achievement.builder().code(request.getCode()).name(request.getTitle())
					.description(request.getDescription()).icon(request.getIcon()).color(request.getColor())
					.type(request.getType()).threshold(request.getThreshold()).active(request.getActive())
					.sortOrder(request.getSortOrder()).build();
			validateRuleConfiguration(achievement);

			try {
				Achievement saved = achievementRepository.save(achievement);
				log.info("Achievement definition created successfully. Code: {}", saved.getCode());
				return toResponse(saved);
			} catch (DataIntegrityViolationException ex) {
				log.warn("Achievement creation failed due to data integrity violation. Code: {}", request.getCode());
				if (achievementRepository.existsByCode(request.getCode())) {
					throw new AchievementException(AchievementErrorCode.ACHIEVEMENT_CODE_ALREADY_EXISTS, ex);
				}
				throw ex;
			}
		})).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<AdminAchievementResponse> updateAchievement(String code, UpdateAchievementRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			log.info("Updating achievement definition. Code: {}", code);
			Achievement achievement = getRequiredAchievement(code);

			achievement.setName(request.getTitle());
			achievement.setDescription(request.getDescription());
			achievement.setIcon(request.getIcon());
			achievement.setColor(request.getColor());
			achievement.setThreshold(request.getThreshold());
			achievement.setActive(request.getActive());
			achievement.setSortOrder(request.getSortOrder());
			validateRuleConfiguration(achievement);

			Achievement saved = achievementRepository.save(achievement);
			log.info("Achievement definition updated successfully. Code: {}", code);
			return toResponse(saved);
		})).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<AdminAchievementResponse> updateAchievementActive(String code, UpdateAchievementActiveRequest request) {
		return Mono.fromCallable(() -> transactionTemplate.execute(status -> {
			log.info("Updating achievement active flag. Code: {}, Active: {}", code, request.getActive());
			Achievement achievement = getRequiredAchievement(code);
			achievement.setActive(request.getActive());
			Achievement saved = achievementRepository.save(achievement);
			log.info("Achievement active flag updated successfully. Code: {}, Active: {}", code, request.getActive());
			return toResponse(saved);
		})).subscribeOn(Schedulers.boundedElastic());
	}

	private Achievement getRequiredAchievement(String code) {
		return achievementRepository.findByCode(code).orElseThrow(() -> {
			log.warn("Achievement not found. Code: {}", code);
			return new AchievementException(AchievementErrorCode.ACHIEVEMENT_NOT_FOUND);
		});
	}

	private void validateRuleConfiguration(Achievement achievement) {
		try {
			achievementRuleEvaluator.validateAchievement(achievement);
		} catch (IllegalArgumentException ex) {
			log.warn("Invalid achievement rule configuration. Code: {}, Type: {}, Threshold: {}", achievement.getCode(),
					achievement.getType(), achievement.getThreshold());
			throw new AchievementException(AchievementErrorCode.INVALID_ACHIEVEMENT_RULE, ex);
		}
	}

	private AdminAchievementResponse toResponse(Achievement achievement) {
		return AdminAchievementResponse.builder().code(achievement.getCode()).title(achievement.getName())
				.description(achievement.getDescription()).icon(achievement.getIcon()).color(achievement.getColor())
				.type(achievement.getType()).threshold(achievement.getThreshold()).active(achievement.getActive())
				.sortOrder(achievement.getSortOrder()).createdAt(achievement.getCreatedAt())
				.updatedAt(achievement.getUpdatedAt()).build();
	}
}
