package pl.freeedu.backend.task.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.codec.multipart.FilePart;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.model.StudentProgressHistory;
import pl.freeedu.backend.student.repository.StudentProgressHistoryRepository;
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

	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final SpeakTaskRepository speakTaskRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final UserLessonRepository userLessonRepository;
	private final LessonRepository lessonRepository;
	private final SecurityService securityService;
	private final UserInGroupRepository userInGroupRepository;
	private final SttClient sttClient;
	private final TaskPublicIdLookupService taskPublicIdLookupService;
	private final StudentProgressHistoryRepository studentProgressHistoryRepository;
	private final TaskHintImageService taskHintImageService;
	private final double sttMinScore;

	public TaskService(ChooseTaskRepository chooseTaskRepository, WriteTaskRepository writeTaskRepository,
			ScatterTaskRepository scatterTaskRepository, SpeakTaskRepository speakTaskRepository,
			UserAnswerRepository userAnswerRepository, UserLessonRepository userLessonRepository,
			LessonRepository lessonRepository, SecurityService securityService,
			UserInGroupRepository userInGroupRepository, SttClient sttClient,
			TaskPublicIdLookupService taskPublicIdLookupService,
			StudentProgressHistoryRepository studentProgressHistoryRepository,
			TaskHintImageService taskHintImageService, @Value("${application.stt.min-score}") double sttMinScore) {
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.speakTaskRepository = speakTaskRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.userLessonRepository = userLessonRepository;
		this.lessonRepository = lessonRepository;
		this.securityService = securityService;
		this.userInGroupRepository = userInGroupRepository;
		this.sttClient = sttClient;
		this.taskPublicIdLookupService = taskPublicIdLookupService;
		this.studentProgressHistoryRepository = studentProgressHistoryRepository;
		this.taskHintImageService = taskHintImageService;
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
			ChooseTask task = ChooseTask.builder().lessonId(lessonId).task(request.getTask())
					.possibleAnswers(request.getPossibleAnswers()).correctAnswer(request.getCorrectAnswer())
					.hint(request.getHint()).section(request.getSection()).build();
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
			task.setTask(request.getTask());
			task.setPossibleAnswers(request.getPossibleAnswers());
			task.setCorrectAnswer(request.getCorrectAnswer());
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
			WriteTask task = WriteTask.builder().lessonId(lessonId).task(request.getTask())
					.correctAnswer(request.getCorrectAnswer()).hint(request.getHint()).section(request.getSection())
					.build();
			WriteTask saved = writeTaskRepository.save(task);
			return toWriteTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<WriteTaskResponse> updateWriteTask(Integer lessonId, String taskPublicId,
			Mono<WriteTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			WriteTask task = getWriteTaskForLesson(lessonId, taskPublicId);
			task.setTask(request.getTask());
			task.setCorrectAnswer(request.getCorrectAnswer());
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
			ScatterTask task = ScatterTask.builder().lessonId(lessonId).task(request.getTask())
					.words(request.getWords()).correctAnswer(request.getCorrectAnswer()).hint(request.getHint())
					.section(request.getSection()).build();
			ScatterTask saved = scatterTaskRepository.save(task);
			return toScatterTaskResponse(saved, false, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<ScatterTaskResponse> updateScatterTask(Integer lessonId, String taskPublicId,
			Mono<ScatterTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			ScatterTask task = getScatterTaskForLesson(lessonId, taskPublicId);
			task.setTask(request.getTask());
			task.setWords(request.getWords());
			task.setCorrectAnswer(request.getCorrectAnswer());
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
			SpeakTask task = SpeakTask.builder().lessonId(lessonId).task(request.getTask())
					.expectedText(request.getExpectedText()).hint(request.getHint()).section(request.getSection())
					.build();
			SpeakTask saved = speakTaskRepository.save(task);
			return toSpeakTaskResponse(saved, requireLessonPublicId(lessonId));
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<SpeakTaskResponse> updateSpeakTask(Integer lessonId, String taskPublicId,
			Mono<SpeakTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			SpeakTask task = getSpeakTaskForLesson(lessonId, taskPublicId);
			task.setTask(request.getTask());
			task.setExpectedText(request.getExpectedText());
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
			return getSpeakTaskForLesson(lessonId, taskPublicId);
		}).subscribeOn(Schedulers.boundedElastic())).flatMap(speakTask -> audio.switchIfEmpty(Mono.defer(() -> {
			log.warn("Transcription failed: Audio file is missing for task publicId: {}", taskPublicId);
			return Mono.error(new TaskException(TaskErrorCode.STT_AUDIO_REQUIRED));
		})).flatMap(
				filePart -> sttClient.transcribe(filePart).map(sttResponse -> buildSpeakTranscriptionResponse(speakTask,
						sttResponse.getText() == null ? "" : sttResponse.getText()))));
	}

	// --- Submit ---

	public Mono<SubmitResponse> submitLesson(Integer lessonId, Mono<SubmitRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
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

					Optional<UserLesson> maybeUserLesson = userLessonRepository.findByUserIdAndLessonId(userId,
							lessonId);
					if (maybeUserLesson.isPresent()
							&& maybeUserLesson.get().getStatus() == UserLessonStatus.COMPLETED) {
						log.warn("Submission failed: Lesson ID: {} already completed by student ID: {}", lessonId,
								userId);
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

					log.debug("Processing {} answers for submission (Lesson ID: {})", request.getAnswers().size(),
							lessonId);
					for (AnswerItemRequest item : request.getAnswers()) {
						String dbTaskType = resolveDbTaskType(item.getTaskType());
						boolean correct = false;
						String correctAnswer = null;

						Integer taskId = taskPublicIdLookupService.getInternalId(item.getTaskPublicId(),
								item.getTaskType());

						switch (item.getTaskType()) {
							case "choose" -> {
								ChooseTask ct = getChooseTaskForLesson(lessonId, item.getTaskPublicId());
								correctAnswer = String.valueOf(ct.getCorrectAnswer());
								correct = item.getAnswer().trim().equals(correctAnswer);
								maxScore++;
							}
							case "write" -> {
								WriteTask wt = getWriteTaskForLesson(lessonId, item.getTaskPublicId());
								correctAnswer = wt.getCorrectAnswer();
								correct = item.getAnswer().trim().equalsIgnoreCase(correctAnswer.trim());
								maxScore++;
							}
							case "scatter" -> {
								ScatterTask st = getScatterTaskForLesson(lessonId, item.getTaskPublicId());
								correctAnswer = st.getCorrectAnswer();
								correct = item.getAnswer().trim().equalsIgnoreCase(correctAnswer.trim());
								maxScore++;
							}
							case "speak" -> {
								SpeakTask st = getSpeakTaskForLesson(lessonId, item.getTaskPublicId());
								correctAnswer = st.getExpectedText();
								correct = isSpeakAnswerCorrect(item.getAnswer(), correctAnswer);
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
								.lessonId(lessonId).answer(item.getAnswer()).isCorrect(correct).build();
						userAnswerRepository.save(ua);

						details.add(AnswerResultDto.builder().taskPublicId(item.getTaskPublicId())
								.taskType(item.getTaskType()).isCorrect(correct).correctAnswer(correctAnswer).build());
					}

					userLesson.setScore(score);
					userLesson.setMaxScore(maxScore);
					userLesson.setStatus(UserLessonStatus.COMPLETED);
					userLesson.setFinishedAt(LocalDateTime.now());
					userLessonRepository.save(userLesson);
					saveProgressHistorySnapshot(userId);

					log.info("Lesson ID: {} submitted successfully by student ID: {}. Score: {}/{}", lessonId, userId,
							score, maxScore);
					return SubmitResponse.builder().score(score).maxScore(maxScore).details(details).build();
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	// --- Reset ---

	public Mono<Void> resetUserProgress(Integer lessonId, Integer userId) {
		return Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
			userAnswerRepository.deleteByUserIdAndLessonId(userId, lessonId);
			userLessonRepository.deleteByUserIdAndLessonId(userId, lessonId);
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

	private void saveProgressHistorySnapshot(Integer userId) {
		double averageScore = Optional
				.ofNullable(
						userLessonRepository.findAveragePercentByUserIdAndStatus(userId, UserLessonStatus.COMPLETED))
				.orElse(0.0);
		LocalDate progressDate = LocalDate.now();

		StudentProgressHistory snapshot = studentProgressHistoryRepository
				.findByUserIdAndProgressDate(userId, progressDate)
				.orElseGet(() -> StudentProgressHistory.builder().userId(userId).progressDate(progressDate).build());
		snapshot.setAvgScore(roundToOneDecimal(averageScore));
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
		return ChooseTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.possibleAnswers(t.getPossibleAnswers()).correctAnswer(stripAnswer ? null : t.getCorrectAnswer())
				.hint(t.getHint()).section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}

	private WriteTaskResponse toWriteTaskResponse(WriteTask t, boolean stripAnswer, String lessonPublicId) {
		return WriteTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.correctAnswer(stripAnswer ? null : t.getCorrectAnswer()).hint(t.getHint()).section(t.getSection())
				.createdAt(t.getCreatedAt()).build();
	}

	private ScatterTaskResponse toScatterTaskResponse(ScatterTask t, boolean stripAnswer, String lessonPublicId) {
		return ScatterTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.words(t.getWords()).correctAnswer(stripAnswer ? null : t.getCorrectAnswer()).hint(t.getHint())
				.section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}

	private SpeakTaskResponse toSpeakTaskResponse(SpeakTask t, String lessonPublicId) {
		return SpeakTaskResponse.builder().publicId(t.getPublicId()).lessonPublicId(lessonPublicId).task(t.getTask())
				.expectedText(t.getExpectedText()).hint(t.getHint()).section(t.getSection()).createdAt(t.getCreatedAt())
				.build();
	}

	private String requireLessonPublicId(Integer lessonId) {
		return lessonRepository.findById(lessonId).map(Lesson::getPublicId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
	}

	private SpeakTranscriptionResponse buildSpeakTranscriptionResponse(SpeakTask speakTask, String transcription) {
		double score = similarity(transcription, speakTask.getExpectedText());
		return SpeakTranscriptionResponse.builder().text(transcription).expectedText(speakTask.getExpectedText())
				.correct(score >= sttMinScore).score(score)
				.words(buildSpeakWordResults(transcription, speakTask.getExpectedText())).build();
	}

	private boolean isSpeakAnswerCorrect(String answer, String expectedText) {
		return similarity(answer, expectedText) >= sttMinScore;
	}

	private double similarity(String actual, String expected) {
		String normalizedActual = normalizeSpeechText(actual);
		String normalizedExpected = normalizeSpeechText(expected);
		if (normalizedActual.isEmpty() || normalizedExpected.isEmpty()) {
			return 0.0;
		}
		if (normalizedActual.equals(normalizedExpected)) {
			return 1.0;
		}
		int distance = levenshteinDistance(normalizedActual, normalizedExpected);
		int maxLength = Math.max(normalizedActual.length(), normalizedExpected.length());
		return Math.max(0.0, 1.0 - ((double) distance / maxLength));
	}

	private String normalizeSpeechText(String value) {
		if (value == null) {
			return "";
		}
		return value.toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}\\s]", " ").replaceAll("\\s+", " ").trim();
	}

	private List<SpeakWordResultDto> buildSpeakWordResults(String actual, String expected) {
		List<String> actualWords = splitNormalizedWords(actual);
		List<String> expectedWords = splitNormalizedWords(expected);
		List<SpeakWordResultDto> results = new ArrayList<>();

		for (int i = 0; i < expectedWords.size(); i++) {
			String expectedWord = expectedWords.get(i);
			String actualWord = i < actualWords.size() ? actualWords.get(i) : "";
			results.add(SpeakWordResultDto.builder().expected(expectedWord).actual(actualWord)
					.correct(expectedWord.equals(actualWord)).build());
		}

		return results;
	}

	private List<String> splitNormalizedWords(String value) {
		String normalized = normalizeSpeechText(value);
		if (normalized.isEmpty()) {
			return Collections.emptyList();
		}
		return Arrays.asList(normalized.split(" "));
	}

	private int levenshteinDistance(String left, String right) {
		int[] previous = new int[right.length() + 1];
		int[] current = new int[right.length() + 1];

		for (int j = 0; j <= right.length(); j++) {
			previous[j] = j;
		}

		for (int i = 1; i <= left.length(); i++) {
			current[0] = i;
			for (int j = 1; j <= right.length(); j++) {
				int cost = left.charAt(i - 1) == right.charAt(j - 1) ? 0 : 1;
				current[j] = Math.min(Math.min(current[j - 1] + 1, previous[j] + 1), previous[j - 1] + cost);
			}
			int[] tmp = previous;
			previous = current;
			current = tmp;
		}

		return previous[right.length()];
	}
}
