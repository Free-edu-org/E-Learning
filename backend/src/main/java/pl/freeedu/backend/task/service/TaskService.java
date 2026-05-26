package pl.freeedu.backend.task.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.achievement.event.StudentStatsChangedEvent;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.model.StudentProgressHistory;
import pl.freeedu.backend.student.repository.StudentProgressHistoryRepository;
import pl.freeedu.backend.student.service.PointService;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.*;
import pl.freeedu.backend.task.repository.*;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TaskService {

	private static final int MAX_UNUSED_SPEAK_ATTEMPTS_PER_TASK = 5;

	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final SpeakTaskRepository speakTaskRepository;
	private final SpeakAttemptRepository speakAttemptRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final UserLessonRepository userLessonRepository;
	private final LessonRepository lessonRepository;
	private final SecurityService securityService;
	private final UserInGroupRepository userInGroupRepository;
	private final SttClient sttClient;
	private final TaskPublicIdLookupService taskPublicIdLookupService;
	private final TaskHintImageService taskHintImageService;
	private final StudentProgressHistoryRepository studentProgressHistoryRepository;
	private final UserTaskAttentionEventRepository userTaskAttentionEventRepository;
	private final PointService pointsService;
	private final TransactionTemplate transactionTemplate;
	private final ApplicationEventPublisher applicationEventPublisher;
	private final ObjectMapper objectMapper;
	private final MeterRegistry meterRegistry;
	private final double sttMinScore;

	public TaskService(ChooseTaskRepository chooseTaskRepository, WriteTaskRepository writeTaskRepository,
			ScatterTaskRepository scatterTaskRepository, SpeakTaskRepository speakTaskRepository,
			SpeakAttemptRepository speakAttemptRepository, UserAnswerRepository userAnswerRepository,
			UserLessonRepository userLessonRepository, LessonRepository lessonRepository,
			SecurityService securityService, UserInGroupRepository userInGroupRepository, SttClient sttClient,
			TaskPublicIdLookupService taskPublicIdLookupService, TaskHintImageService taskHintImageService,
			StudentProgressHistoryRepository studentProgressHistoryRepository,
			UserTaskAttentionEventRepository userTaskAttentionEventRepository, PointService pointsService,
			TransactionTemplate transactionTemplate, ApplicationEventPublisher applicationEventPublisher,
			MeterRegistry meterRegistry, @Value("${application.stt.min-score}") double sttMinScore) {
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.speakTaskRepository = speakTaskRepository;
		this.speakAttemptRepository = speakAttemptRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.userLessonRepository = userLessonRepository;
		this.lessonRepository = lessonRepository;
		this.securityService = securityService;
		this.userInGroupRepository = userInGroupRepository;
		this.sttClient = sttClient;
		this.taskPublicIdLookupService = taskPublicIdLookupService;
		this.taskHintImageService = taskHintImageService;
		this.studentProgressHistoryRepository = studentProgressHistoryRepository;
		this.userTaskAttentionEventRepository = userTaskAttentionEventRepository;
		this.pointsService = pointsService;
		this.transactionTemplate = transactionTemplate;
		this.applicationEventPublisher = applicationEventPublisher;
		this.objectMapper = new ObjectMapper();
		this.meterRegistry = meterRegistry;
		this.sttMinScore = sttMinScore;
	}

	public Mono<LessonTasksResponse> getLessonTasks(Integer lessonId) {
		return securityService.getCurrentUser().flatMap(user -> Mono.fromCallable(() -> {
			log.info("Fetching tasks for lesson ID: {}. Requested by user ID: {}", lessonId, user.getId());
			Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Fetch tasks failed: Lesson with ID: {} not found", lessonId);
				return new TaskException(TaskErrorCode.LESSON_NOT_FOUND);
			});

			boolean isStudent = user.getRole() == Role.STUDENT;
			String status = null;

			if (isStudent) {
				if (!userInGroupRepository.hasAccessToLesson(user.getId(), lessonId)) {
					log.warn("Access denied: Student ID: {} has no access to lesson ID: {}", user.getId(), lessonId);
					throw new TaskException(TaskErrorCode.STUDENT_NO_ACCESS);
				}

				Optional<UserLesson> existing = userLessonRepository.findByUserIdAndLessonId(user.getId(), lessonId);
				if (existing.isPresent()) {
					if (existing.get().getStatus() == UserLessonStatus.COMPLETED) {
						log.warn("Fetch tasks failed: Lesson ID: {} already completed by student ID: {}", lessonId,
								user.getId());
						throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
					}
					if (!Boolean.TRUE.equals(lesson.getIsActive())) {
						log.warn("Fetch tasks failed: Lesson ID: {} is not active", lessonId);
						throw new TaskException(TaskErrorCode.LESSON_NOT_ACTIVE);
					}
					status = existing.get().getStatus().name();
				} else {
					if (!Boolean.TRUE.equals(lesson.getIsActive())) {
						log.warn("Fetch tasks failed: Lesson ID: {} is not active", lessonId);
						throw new TaskException(TaskErrorCode.LESSON_NOT_ACTIVE);
					}
					log.info("Starting lesson ID: {} for student ID: {}", lessonId, user.getId());
					UserLesson userLesson = UserLesson.builder().userId(user.getId()).lessonId(lessonId)
							.status(UserLessonStatus.IN_PROGRESS).score(0).maxScore(0).build();
					userLessonRepository.save(userLesson);
					status = UserLessonStatus.IN_PROGRESS.name();
				}
			}

			List<ChooseTask> chooseTasks = chooseTaskRepository.findByLessonId(lessonId);
			List<WriteTask> writeTasks = writeTaskRepository.findByLessonId(lessonId);
			List<ScatterTask> scatterTasks = scatterTaskRepository.findByLessonId(lessonId);
			List<SpeakTask> speakTasks = speakTaskRepository.findByLessonId(lessonId);

			log.debug("Tasks fetched for lesson ID: {}. Choose: {}, Write: {}, Scatter: {}, Speak: {}", lessonId,
					chooseTasks.size(), writeTasks.size(), scatterTasks.size(), speakTasks.size());

			return buildLessonTasksResponse(lesson.getPublicId(), status, chooseTasks, writeTasks, scatterTasks,
					speakTasks, isStudent);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	// --- Choose Task CRUD ---

	public Mono<ChooseTaskResponse> createChooseTask(Integer lessonId, Mono<ChooseTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Creating new ChooseTask for lesson ID: {}", lessonId);
			lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Create ChooseTask failed: Lesson with ID: {} not found", lessonId);
				return new TaskException(TaskErrorCode.LESSON_NOT_FOUND);
			});
			List<Integer> correctAnswers = TaskAnswerUtils.normalizeChooseAnswers(request.getCorrectAnswers(),
					request.getPossibleAnswers());
			ChooseTask task = ChooseTask.builder().lessonId(lessonId).task(request.getTask())
					.possibleAnswers(request.getPossibleAnswers())
					.correctAnswers(TaskAnswerUtils.serializeIntegerAnswers(correctAnswers)).hint(request.getHint())
					.section(request.getSection()).build();
			ChooseTask saved = chooseTaskRepository.save(task);
			log.info("ChooseTask ID: {} created for lesson ID: {}", saved.getId(), lessonId);
			return toChooseTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<ChooseTaskResponse> updateChooseTask(Integer lessonId, String taskPublicId,
			Mono<ChooseTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Updating ChooseTask publicId: {} for lesson ID: {}", taskPublicId, lessonId);
			ChooseTask task = getChooseTaskForLesson(lessonId, taskPublicId);
			List<Integer> correctAnswers = TaskAnswerUtils.normalizeChooseAnswers(request.getCorrectAnswers(),
					request.getPossibleAnswers());
			task.setTask(request.getTask());
			task.setPossibleAnswers(request.getPossibleAnswers());
			task.setCorrectAnswers(TaskAnswerUtils.serializeIntegerAnswers(correctAnswers));
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			ChooseTask saved = chooseTaskRepository.save(task);
			log.info("ChooseTask publicId: {} updated successfully", taskPublicId);
			return toChooseTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteChooseTask(Integer lessonId, String taskPublicId) {
		return Mono.fromCallable(() -> {
			log.info("Deleting ChooseTask publicId: {} from lesson ID: {}", taskPublicId, lessonId);
			ChooseTask task = getChooseTaskForLesson(lessonId, taskPublicId);
			taskHintImageService.deleteHintImageFileIfPresent(task.getHintImageFileName());
			chooseTaskRepository.delete(task);
			log.info("ChooseTask publicId: {} deleted successfully", taskPublicId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	// --- Write Task CRUD ---

	public Mono<WriteTaskResponse> createWriteTask(Integer lessonId, Mono<WriteTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
			List<String> correctAnswers = TaskAnswerUtils.normalizeTextAnswers(request.getCorrectAnswers());
			WriteTask task = WriteTask.builder().lessonId(lessonId).task(request.getTask())
					.correctAnswers(TaskAnswerUtils.serializeStringAnswers(correctAnswers)).hint(request.getHint())
					.section(request.getSection()).build();
			WriteTask saved = writeTaskRepository.save(task);
			return toWriteTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<WriteTaskResponse> updateWriteTask(Integer lessonId, String taskPublicId,
			Mono<WriteTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			WriteTask task = getWriteTaskForLesson(lessonId, taskPublicId);
			List<String> correctAnswers = TaskAnswerUtils.normalizeTextAnswers(request.getCorrectAnswers());
			task.setTask(request.getTask());
			task.setCorrectAnswers(TaskAnswerUtils.serializeStringAnswers(correctAnswers));
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			WriteTask saved = writeTaskRepository.save(task);
			return toWriteTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteWriteTask(Integer lessonId, String taskPublicId) {
		return Mono.fromCallable(() -> {
			WriteTask task = getWriteTaskForLesson(lessonId, taskPublicId);
			taskHintImageService.deleteHintImageFileIfPresent(task.getHintImageFileName());
			writeTaskRepository.delete(task);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	// --- Scatter Task CRUD ---

	public Mono<ScatterTaskResponse> createScatterTask(Integer lessonId, Mono<ScatterTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
			List<String> correctAnswers = TaskAnswerUtils.normalizeTextAnswers(request.getCorrectAnswers());
			ScatterTask task = ScatterTask.builder().lessonId(lessonId).task(request.getTask())
					.words(request.getWords()).correctAnswers(TaskAnswerUtils.serializeStringAnswers(correctAnswers))
					.hint(request.getHint()).section(request.getSection()).build();
			ScatterTask saved = scatterTaskRepository.save(task);
			return toScatterTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<ScatterTaskResponse> updateScatterTask(Integer lessonId, String taskPublicId,
			Mono<ScatterTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			ScatterTask task = getScatterTaskForLesson(lessonId, taskPublicId);
			List<String> correctAnswers = TaskAnswerUtils.normalizeTextAnswers(request.getCorrectAnswers());
			task.setTask(request.getTask());
			task.setWords(request.getWords());
			task.setCorrectAnswers(TaskAnswerUtils.serializeStringAnswers(correctAnswers));
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			ScatterTask saved = scatterTaskRepository.save(task);
			return toScatterTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteScatterTask(Integer lessonId, String taskPublicId) {
		return Mono.fromCallable(() -> {
			ScatterTask task = getScatterTaskForLesson(lessonId, taskPublicId);
			taskHintImageService.deleteHintImageFileIfPresent(task.getHintImageFileName());
			scatterTaskRepository.delete(task);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	// --- Speak Task CRUD ---

	public Mono<SpeakTaskResponse> createSpeakTask(Integer lessonId, Mono<SpeakTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
			List<String> expectedTexts = TaskAnswerUtils.normalizeSingleTextAnswer(request.getExpectedTexts());
			SpeakTask task = SpeakTask.builder().lessonId(lessonId)
					.expectedTexts(TaskAnswerUtils.serializeStringAnswers(expectedTexts)).hint(request.getHint())
					.section(request.getSection()).build();
			SpeakTask saved = speakTaskRepository.save(task);
			return toSpeakTaskResponse(saved, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<SpeakTaskResponse> updateSpeakTask(Integer lessonId, String taskPublicId,
			Mono<SpeakTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			SpeakTask task = getSpeakTaskForLesson(lessonId, taskPublicId);
			List<String> expectedTexts = TaskAnswerUtils.normalizeSingleTextAnswer(request.getExpectedTexts());
			task.setExpectedTexts(TaskAnswerUtils.serializeStringAnswers(expectedTexts));
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			SpeakTask saved = speakTaskRepository.save(task);
			return toSpeakTaskResponse(saved, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteSpeakTask(Integer lessonId, String taskPublicId) {
		return Mono.fromCallable(() -> {
			SpeakTask task = getSpeakTaskForLesson(lessonId, taskPublicId);
			taskHintImageService.deleteHintImageFileIfPresent(task.getHintImageFileName());
			speakTaskRepository.delete(task);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	public Mono<SpeakTranscriptionResponse> transcribeSpeakTask(Integer lessonId, String taskPublicId,
			Mono<FilePart> audio) {
		return securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
			log.info("Speak task transcription started. Lesson ID: {}, Task publicId: {}, Student ID: {}", lessonId,
					taskPublicId, userId);
			Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Transcription failed: Lesson with ID: {} not found", lessonId);
				return new TaskException(TaskErrorCode.LESSON_NOT_FOUND);
			});
			if (!userInGroupRepository.hasAccessToLesson(userId, lessonId)) {
				log.warn("Access denied for transcription: Student ID: {} has no access to lesson ID: {}", userId,
						lessonId);
				throw new TaskException(TaskErrorCode.STUDENT_NO_ACCESS);
			}
			if (!Boolean.TRUE.equals(lesson.getIsActive())) {
				log.warn("Transcription failed: Lesson ID: {} is not active", lessonId);
				throw new TaskException(TaskErrorCode.LESSON_NOT_ACTIVE);
			}
			UserLesson userLesson = requireActiveUserLesson(userId, lessonId);
			SpeakTask speakTask = getSpeakTaskForLesson(lessonId, taskPublicId);
			requireSpeakAttemptLimitNotExceeded(userLesson.getId(), speakTask.getId());
			return new SpeakAttemptContext(userId, lesson, userLesson, speakTask);
		}).subscribeOn(Schedulers.boundedElastic())).flatMap(entry -> audio.switchIfEmpty(Mono.defer(() -> {
			log.warn("Transcription failed: Audio file is missing for task publicId: {}", taskPublicId);
			return Mono.error(new TaskException(TaskErrorCode.STT_AUDIO_REQUIRED));
		})).flatMap(filePart -> evaluateSpeakAttempt(entry, filePart)));
	}

	// --- Submit ---

	public Mono<SubmitResponse> submitLesson(Integer lessonId, Mono<SubmitRequest> requestMono) {
		return requestMono.flatMap(request -> securityService.getCurrentUserId()
				.flatMap(userId -> Mono.fromCallable(() -> submitLessonInTransaction(lessonId, userId, request))
						.subscribeOn(Schedulers.boundedElastic())));
	}

	private SubmitResponse submitLessonInTransaction(Integer lessonId, Integer userId, SubmitRequest request) {
		return transactionTemplate.execute(status -> {
			log.info("Lesson submission started for lesson ID: {} by student ID: {}", lessonId, userId);
			Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Submission failed: Lesson with ID: {} not found", lessonId);
				return new TaskException(TaskErrorCode.LESSON_NOT_FOUND);
			});
			if (!userInGroupRepository.hasAccessToLesson(userId, lessonId)) {
				log.warn("Access denied for submission: Student ID: {} has no access to lesson ID: {}", userId,
						lessonId);
				throw new TaskException(TaskErrorCode.STUDENT_NO_ACCESS);
			}

			Optional<UserLesson> maybeUserLesson = userLessonRepository.findByUserIdAndLessonId(userId, lessonId);
			if (maybeUserLesson.isPresent() && maybeUserLesson.get().getStatus() == UserLessonStatus.COMPLETED) {
				log.warn("Submission failed: Lesson ID: {} already completed by student ID: {}", lessonId, userId);
				throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
			}
			if (!Boolean.TRUE.equals(lesson.getIsActive())) {
				log.warn("Submission failed: Lesson ID: {} is not active", lessonId);
				throw new TaskException(TaskErrorCode.LESSON_NOT_ACTIVE);
			}
			UserLesson userLesson = maybeUserLesson.orElseThrow(() -> {
				log.warn("Submission failed: Lesson ID: {} not started by student ID: {}", lessonId, userId);
				return new TaskException(TaskErrorCode.LESSON_NOT_STARTED);
			});

			int score = 0;
			int maxScore = 0;
			List<AnswerResultDto> details = new ArrayList<>();

			log.debug("Processing {} answers for submission (Lesson ID: {})", request.getAnswers().size(), lessonId);
			for (AnswerItemRequest item : request.getAnswers()) {
				String dbTaskType = resolveDbTaskType(item.getTaskType());
				boolean correct = false;
				List<String> correctAnswers = List.of();

				Integer taskId = taskPublicIdLookupService.getInternalId(item.getTaskPublicId(), item.getTaskType());

				switch (item.getTaskType()) {
					case "choose" -> {
						ChooseTask ct = getChooseTaskForLesson(lessonId, item.getTaskPublicId());
						List<Integer> answers = TaskAnswerUtils.deserializeIntegerAnswers(ct.getCorrectAnswers());
						correctAnswers = answers.stream().map(String::valueOf).toList();
						correct = TaskAnswerUtils.matchesAnyChooseAnswer(item.getAnswer(), answers);
						maxScore++;
					}
					case "write" -> {
						WriteTask wt = getWriteTaskForLesson(lessonId, item.getTaskPublicId());
						correctAnswers = TaskAnswerUtils.deserializeStringAnswers(wt.getCorrectAnswers());
						correct = TaskAnswerUtils.matchesAnyTextAnswer(item.getAnswer(), correctAnswers);
						maxScore++;
					}
					case "scatter" -> {
						ScatterTask st = getScatterTaskForLesson(lessonId, item.getTaskPublicId());
						correctAnswers = TaskAnswerUtils.deserializeStringAnswers(st.getCorrectAnswers());
						correct = TaskAnswerUtils.matchesAnyTextAnswer(item.getAnswer(), correctAnswers);
						maxScore++;
					}
					case "speak" -> {
						SpeakTask st = getSpeakTaskForLesson(lessonId, item.getTaskPublicId());
						correctAnswers = TaskAnswerUtils.deserializeStringAnswers(st.getExpectedTexts());
						if (item.getAttemptId() == null || item.getAttemptId().isBlank()) {
							correct = false;
							item.setAnswer("");
						} else {
							SpeakAttempt attempt = requireValidSpeakAttempt(item.getAttemptId(), userId, userLesson,
									st.getId());
							correct = Boolean.TRUE.equals(attempt.getCorrect());
							item.setAnswer(attempt.getMatchedTranscription());
							if (attempt.getSubmittedAt() == null) {
								attempt.setSubmittedAt(LocalDateTime.now());
								speakAttemptRepository.save(attempt);
							}
						}
						maxScore++;
					}
					default -> {
						log.error("Invalid task type encountered during submission: {}", item.getTaskType());
						throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
					}
				}

				if (correct) {
					score++;
				}

				UserAnswer ua = UserAnswer.builder().taskId(taskId).taskType(dbTaskType).userId(userId)
						.lessonId(lessonId).answer(item.getAnswer()).isCorrect(correct).originalIsCorrect(correct)
						.manuallyReviewed(false).reviewedBy(null).reviewedAt(null).build();
				userAnswerRepository.save(ua);

				details.add(AnswerResultDto.builder().taskPublicId(item.getTaskPublicId()).taskType(item.getTaskType())
						.isCorrect(correct).correctAnswers(correctAnswers).build());
			}

			userLesson.setScore(score);
			userLesson.setMaxScore(maxScore);
			userLesson.setStatus(UserLessonStatus.COMPLETED);
			userLesson.setFinishedAt(LocalDateTime.now());
			userLessonRepository.save(userLesson);
			saveProgressHistorySnapshot(userId, lessonId, score, maxScore);
			pointsService.addPointsForLessonResult(userLesson.getId(), userId, score, "TASK_CORRECT", userId);
			applicationEventPublisher.publishEvent(new StudentStatsChangedEvent(userId, "lesson-submitted"));

			log.info("Lesson ID: {} submitted successfully by student ID: {}. Score: {}/{}", lessonId, userId, score,
					maxScore);
			return SubmitResponse.builder().score(score).maxScore(maxScore).details(details).build();
		});
	}

	public Mono<Void> recordTabSwitch(Integer lessonId, Mono<TaskAttentionEventRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					log.info("Recording tab switch. Lesson ID: {}, Student ID: {}, Task publicId: {}, Task type: {}",
							lessonId, userId, request.getTaskPublicId(), request.getTaskType());
					lessonRepository.findById(lessonId).orElseThrow(() -> {
						log.warn("Tab switch record failed: Lesson with ID: {} not found", lessonId);
						return new TaskException(TaskErrorCode.LESSON_NOT_FOUND);
					});
					if (!userInGroupRepository.hasAccessToLesson(userId, lessonId)) {
						log.warn("Tab switch record denied: Student ID: {} has no access to lesson ID: {}", userId,
								lessonId);
						throw new TaskException(TaskErrorCode.STUDENT_NO_ACCESS);
					}

					UserLesson userLesson = userLessonRepository.findByUserIdAndLessonId(userId, lessonId)
							.orElseThrow(() -> {
								log.warn("Tab switch record failed: Lesson ID: {} not started by student ID: {}",
										lessonId, userId);
								return new TaskException(TaskErrorCode.LESSON_NOT_STARTED);
							});
					if (userLesson.getStatus() == UserLessonStatus.COMPLETED) {
						log.warn("Tab switch record ignored: Lesson ID: {} already completed by student ID: {}",
								lessonId, userId);
						throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
					}

					Integer taskId = taskPublicIdLookupService.getInternalId(request.getTaskPublicId(),
							request.getTaskType());
					String dbTaskType = resolveDbTaskType(request.getTaskType());

					requireTaskBelongsToLesson(lessonId, request.getTaskPublicId(), request.getTaskType());

					UserTaskAttentionEvent attentionEvent = userTaskAttentionEventRepository
							.findByUserIdAndLessonIdAndTaskIdAndTaskType(userId, lessonId, taskId, dbTaskType)
							.orElseGet(() -> UserTaskAttentionEvent.builder().userId(userId).lessonId(lessonId)
									.taskId(taskId).taskType(dbTaskType).switchCount(0).build());
					attentionEvent.setSwitchCount(attentionEvent.getSwitchCount() + 1);
					attentionEvent.setLastSwitchedAt(LocalDateTime.now());
					userTaskAttentionEventRepository.save(attentionEvent);

					log.info("Tab switch recorded. Lesson ID: {}, Student ID: {}, Task ID: {}, Count: {}", lessonId,
							userId, taskId, attentionEvent.getSwitchCount());
					return (Void) null;
				}).subscribeOn(Schedulers.boundedElastic()))).then();
	}

	// --- Reset ---

	public Mono<Void> resetUserProgress(Integer lessonId, Integer userId) {
		return Mono.fromCallable(() -> {
			transactionTemplate.execute(status -> {
				lessonRepository.findById(lessonId)
						.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
				userAnswerRepository.deleteByUserIdAndLessonId(userId, lessonId);
				userTaskAttentionEventRepository.deleteByUserIdAndLessonId(userId, lessonId);
				userLessonRepository.findByUserIdAndLessonId(userId, lessonId).ifPresent(ul -> {
					speakAttemptRepository.deleteByUserLessonId(ul.getId());
					pointsService.rollbackPointsForLessonResult(ul.getId(), userId, null);
				});
				userLessonRepository.deleteByUserIdAndLessonId(userId, lessonId);
				studentProgressHistoryRepository.deleteByUserIdAndLessonId(userId, lessonId);
				return null;
			});
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	// --- Private helpers ---

	private String resolveDbTaskType(String taskType) {
		return switch (taskType) {
			case "choose" -> "choose_tasks";
			case "write" -> "write_tasks";
			case "scatter" -> "scatter_tasks";
			case "speak" -> "speak_tasks";
			default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		};
	}

	private void requireTaskBelongsToLesson(Integer lessonId, String taskPublicId, String taskType) {
		switch (taskType) {
			case "choose" -> getChooseTaskForLesson(lessonId, taskPublicId);
			case "write" -> getWriteTaskForLesson(lessonId, taskPublicId);
			case "scatter" -> getScatterTaskForLesson(lessonId, taskPublicId);
			case "speak" -> getSpeakTaskForLesson(lessonId, taskPublicId);
			default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		}
	}

	private void saveProgressHistorySnapshot(Integer userId, Integer lessonId, int score, int maxScore) {
		double lessonPercent = maxScore > 0 ? (score * 100.0) / maxScore : 0.0;
		LocalDate progressDate = LocalDate.now();

		StudentProgressHistory snapshot = studentProgressHistoryRepository
				.findByUserIdAndLessonIdAndProgressDate(userId, lessonId, progressDate)
				.orElseGet(() -> StudentProgressHistory.builder().userId(userId).lessonId(lessonId)
						.progressDate(progressDate).build());
		snapshot.setLessonId(lessonId);
		snapshot.setAvgScore(roundToOneDecimal(lessonPercent));
		studentProgressHistoryRepository.save(snapshot);
	}

	private double roundToOneDecimal(double value) {
		return Math.round(value * 10.0) / 10.0;
	}

	private ChooseTask getChooseTaskForLesson(Integer lessonId, String taskPublicId) {
		ChooseTask task = chooseTaskRepository.findByPublicId(taskPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
		if (!lessonId.equals(task.getLessonId())) {
			throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
		}
		return task;
	}

	private WriteTask getWriteTaskForLesson(Integer lessonId, String taskPublicId) {
		WriteTask task = writeTaskRepository.findByPublicId(taskPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
		if (!lessonId.equals(task.getLessonId())) {
			throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
		}
		return task;
	}

	private ScatterTask getScatterTaskForLesson(Integer lessonId, String taskPublicId) {
		ScatterTask task = scatterTaskRepository.findByPublicId(taskPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
		if (!lessonId.equals(task.getLessonId())) {
			throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
		}
		return task;
	}

	private SpeakTask getSpeakTaskForLesson(Integer lessonId, String taskPublicId) {
		SpeakTask task = speakTaskRepository.findByPublicId(taskPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
		if (!lessonId.equals(task.getLessonId())) {
			throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
		}
		return task;
	}

	private LessonTasksResponse buildLessonTasksResponse(String lessonPublicId, String status,
			List<ChooseTask> chooseTasks, List<WriteTask> writeTasks, List<ScatterTask> scatterTasks,
			List<SpeakTask> speakTasks, boolean stripAnswers) {

		Set<String> allSections = new TreeSet<>(Comparator.nullsFirst(Comparator.naturalOrder()));
		chooseTasks.forEach(t -> allSections.add(t.getSection()));
		writeTasks.forEach(t -> allSections.add(t.getSection()));
		scatterTasks.forEach(t -> allSections.add(t.getSection()));
		speakTasks.forEach(t -> allSections.add(t.getSection()));

		List<TaskSectionDto> sections = allSections.stream().map(section -> {
			List<ChooseTaskResponse> choose = chooseTasks.stream().filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toChooseTaskResponse(t, stripAnswers, lessonPublicId)).collect(Collectors.toList());
			List<WriteTaskResponse> write = writeTasks.stream().filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toWriteTaskResponse(t, stripAnswers, lessonPublicId)).collect(Collectors.toList());
			List<ScatterTaskResponse> scatter = scatterTasks.stream()
					.filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toScatterTaskResponse(t, stripAnswers, lessonPublicId)).collect(Collectors.toList());
			List<SpeakTaskResponse> speak = speakTasks.stream().filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toSpeakTaskResponse(t, lessonPublicId)).collect(Collectors.toList());
			return TaskSectionDto.builder().section(section).chooseTasks(choose).writeTasks(write).scatterTasks(scatter)
					.speakTasks(speak).build();
		}).collect(Collectors.toList());

		return LessonTasksResponse.builder().lessonPublicId(lessonPublicId).status(status).sections(sections).build();
	}

	private ChooseTaskResponse toChooseTaskResponse(ChooseTask t, boolean stripAnswer, String lessonPublicId) {
		String hintImageUrl = t.getHintImageFileName() != null
				? "/api/v1/lessons/" + lessonPublicId + "/tasks/choose/" + t.getPublicId() + "/hint-image"
				: null;
		List<Integer> correctAnswers = TaskAnswerUtils.deserializeIntegerAnswers(t.getCorrectAnswers());
		return ChooseTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.possibleAnswers(t.getPossibleAnswers()).correctAnswers(stripAnswer ? null : correctAnswers)
				.hint(t.getHint()).hintImageUrl(hintImageUrl).section(t.getSection()).createdAt(t.getCreatedAt())
				.build();
	}

	private WriteTaskResponse toWriteTaskResponse(WriteTask t, boolean stripAnswer, String lessonPublicId) {
		String hintImageUrl = t.getHintImageFileName() != null
				? "/api/v1/lessons/" + lessonPublicId + "/tasks/write/" + t.getPublicId() + "/hint-image"
				: null;
		List<String> correctAnswers = TaskAnswerUtils.deserializeStringAnswers(t.getCorrectAnswers());
		return WriteTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.correctAnswers(stripAnswer ? null : correctAnswers).hint(t.getHint()).hintImageUrl(hintImageUrl)
				.section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}

	private ScatterTaskResponse toScatterTaskResponse(ScatterTask t, boolean stripAnswer, String lessonPublicId) {
		String hintImageUrl = t.getHintImageFileName() != null
				? "/api/v1/lessons/" + lessonPublicId + "/tasks/scatter/" + t.getPublicId() + "/hint-image"
				: null;
		List<String> correctAnswers = TaskAnswerUtils.deserializeStringAnswers(t.getCorrectAnswers());
		return ScatterTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.words(t.getWords()).correctAnswers(stripAnswer ? null : correctAnswers).hint(t.getHint())
				.hintImageUrl(hintImageUrl).section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}

	private SpeakTaskResponse toSpeakTaskResponse(SpeakTask t, String lessonPublicId) {
		String hintImageUrl = t.getHintImageFileName() != null
				? "/api/v1/lessons/" + lessonPublicId + "/tasks/speak/" + t.getPublicId() + "/hint-image"
				: null;
		List<String> expectedTexts = TaskAnswerUtils.deserializeStringAnswers(t.getExpectedTexts());
		return SpeakTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId)
				.expectedTexts(expectedTexts).hint(t.getHint()).hintImageUrl(hintImageUrl).section(t.getSection())
				.createdAt(t.getCreatedAt()).build();
	}

	private String requireLessonPublicId(Integer lessonId) {
		return lessonRepository.findById(lessonId).map(Lesson::getPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
	}

	private SpeakTranscriptionResponse buildSpeakTranscriptionResponse(SpeakAttemptContext context,
			SttEvaluationResponse evaluation) {
		SpeakAttempt attempt = saveSpeakAttempt(context, evaluation);
		return SpeakTranscriptionResponse.builder().attemptId(attempt.getPublicId())
				.text(nullToEmpty(attempt.getMatchedTranscription()))
				.rawText(nullToEmpty(attempt.getRawTranscription())).expectedText(attempt.getExpectedText())
				.correct(Boolean.TRUE.equals(attempt.getCorrect()))
				.score(Optional.ofNullable(attempt.getScore()).orElse(0.0))
				.words(toSpeakWordResults(evaluation.getWords())).build();
	}

	private SpeakAttempt saveSpeakAttempt(SpeakAttemptContext context, SttEvaluationResponse evaluation) {
		SpeakAttempt attempt = SpeakAttempt.builder().userId(context.userId()).lessonId(context.lesson().getId())
				.taskId(context.speakTask().getId()).userLesson(context.userLesson())
				.expectedText(nullToEmpty(evaluation.getExpectedText()).isBlank()
						? TaskAnswerUtils.deserializeStringAnswers(context.speakTask().getExpectedTexts()).get(0)
						: evaluation.getExpectedText())
				.rawTranscription(nullToEmpty(evaluation.getRawTranscription()))
				.matchedTranscription(nullToEmpty(evaluation.getMatchedTranscription()))
				.normalizedExpected(nullToEmpty(evaluation.getNormalizedExpected()))
				.normalizedActual(nullToEmpty(evaluation.getNormalizedActual())).score(evaluation.getScore())
				.correct(evaluation.isCorrect()).wordsJson(serializeWords(evaluation.getWords()))
				.language(evaluation.getLanguage()).duration(evaluation.getDuration()).build();
		SpeakAttempt savedAttempt = speakAttemptRepository.save(attempt);
		log.info(
				"Saved speak attempt: userId={}, lessonPublicId={}, userLessonId={}, taskPublicId={}, attemptPublicId={}, score={}, correct={}, duration={}, language={}",
				context.userId(), context.lesson().getPublicId(), context.userLesson().getId(),
				context.speakTask().getPublicId(), savedAttempt.getPublicId(), savedAttempt.getScore(),
				savedAttempt.getCorrect(), savedAttempt.getDuration(), savedAttempt.getLanguage());
		log.debug(
				"Speak attempt transcription details: attemptPublicId={}, rawTranscription='{}', matchedTranscription='{}'",
				savedAttempt.getPublicId(), savedAttempt.getRawTranscription(), savedAttempt.getMatchedTranscription());
		return savedAttempt;
	}

	private Mono<SpeakTranscriptionResponse> evaluateSpeakAttempt(SpeakAttemptContext context, FilePart filePart) {
		incrementMetric("freeedu.stt.evaluate.requests");
		long startedAtNanos = System.nanoTime();
		List<String> expectedTexts = TaskAnswerUtils.deserializeStringAnswers(context.speakTask().getExpectedTexts());
		String expectedText = expectedTexts.get(0);
		Mono<SttEvaluationResponse> evaluation = sttClient.evaluate(filePart, expectedText, sttMinScore, null);
		return evaluation
				.flatMap(sttResponse -> Mono.fromCallable(() -> buildSpeakTranscriptionResponse(context, sttResponse))
						.subscribeOn(Schedulers.boundedElastic()))
				.doOnSuccess(response -> {
					recordSttEvaluateDuration(startedAtNanos);
					incrementMetric("freeedu.stt.evaluate.success");
					incrementMetric(
							response.isCorrect() ? "freeedu.stt.evaluate.correct" : "freeedu.stt.evaluate.incorrect");
				}).doOnError(error -> {
					recordSttEvaluateDuration(startedAtNanos);
					incrementMetric("freeedu.stt.evaluate.errors");
					logSpeakEvaluationFailure(context, error);
					if (error instanceof TaskException taskException) {
						if (taskException.getErrorCode() == TaskErrorCode.STT_SERVICE_UNAVAILABLE) {
							incrementMetric("freeedu.stt.evaluate.service_unavailable");
						} else if (taskException.getErrorCode() == TaskErrorCode.STT_RECOGNITION_FAILED) {
							incrementMetric("freeedu.stt.evaluate.recognition_failed");
						}
					}
				});
	}

	private void recordSttEvaluateDuration(long startedAtNanos) {
		Timer.builder("freeedu.stt.evaluate.duration").register(meterRegistry)
				.record(System.nanoTime() - startedAtNanos, java.util.concurrent.TimeUnit.NANOSECONDS);
	}

	private void incrementMetric(String metricName) {
		meterRegistry.counter(metricName).increment();
	}

	private void logSpeakEvaluationFailure(SpeakAttemptContext context, Throwable error) {
		String errorType = error instanceof TaskException taskException
				? taskException.getErrorCode().toString()
				: error.getClass().getSimpleName();
		log.warn(
				"Speak evaluation failed: errorType={}, userId={}, lessonPublicId={}, userLessonId={}, taskPublicId={}",
				errorType, context.userId(), context.lesson().getPublicId(), context.userLesson().getId(),
				context.speakTask().getPublicId());
	}

	private SpeakAttempt requireValidSpeakAttempt(String attemptPublicId, Integer userId, UserLesson userLesson,
			Integer taskId) {
		if (attemptPublicId == null || attemptPublicId.isBlank()) {
			throw new TaskException(TaskErrorCode.SPEAK_ATTEMPT_REQUIRED);
		}

		SpeakAttempt attempt = speakAttemptRepository.findByPublicId(attemptPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.SPEAK_ATTEMPT_NOT_FOUND));

		if (!Objects.equals(attempt.getUserId(), userId) || !Objects.equals(attempt.getTaskId(), taskId)
				|| attempt.getUserLesson() == null
				|| !Objects.equals(attempt.getUserLesson().getId(), userLesson.getId())) {
			throw new TaskException(TaskErrorCode.SPEAK_ATTEMPT_INVALID);
		}

		return attempt;
	}

	private UserLesson requireActiveUserLesson(Integer userId, Integer lessonId) {
		UserLesson userLesson = userLessonRepository.findByUserIdAndLessonId(userId, lessonId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_STARTED));
		if (userLesson.getStatus() == UserLessonStatus.COMPLETED) {
			throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
		}
		return userLesson;
	}

	private void requireSpeakAttemptLimitNotExceeded(Integer userLessonId, Integer taskId) {
		long unusedAttempts = speakAttemptRepository.countByUserLessonIdAndTaskIdAndSubmittedAtIsNull(userLessonId,
				taskId);
		if (unusedAttempts >= MAX_UNUSED_SPEAK_ATTEMPTS_PER_TASK) {
			throw new TaskException(TaskErrorCode.SPEAK_ATTEMPT_LIMIT_EXCEEDED);
		}
	}

	private List<SpeakWordResultDto> toSpeakWordResults(List<SttEvaluationWordDto> words) {
		if (words == null || words.isEmpty()) {
			return Collections.emptyList();
		}
		return words.stream().map(word -> SpeakWordResultDto.builder().expected(nullToEmpty(word.getExpected()))
				.actual(nullToEmpty(word.getActual())).correct(word.isCorrect()).build()).toList();
	}

	private String serializeWords(List<SttEvaluationWordDto> words) {
		try {
			return objectMapper.writeValueAsString(words == null ? List.of() : words);
		} catch (Exception exception) {
			throw new IllegalStateException("Failed to serialize STT evaluation words", exception);
		}
	}

	private String nullToEmpty(String value) {
		return value == null ? "" : value;
	}

	private record SpeakAttemptContext(Integer userId, Lesson lesson, UserLesson userLesson, SpeakTask speakTask) {
	}
}
