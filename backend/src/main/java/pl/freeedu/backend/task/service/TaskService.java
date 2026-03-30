package pl.freeedu.backend.task.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
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
import java.util.*;
import java.util.stream.Collectors;

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

	public TaskService(ChooseTaskRepository chooseTaskRepository, WriteTaskRepository writeTaskRepository,
			ScatterTaskRepository scatterTaskRepository, SpeakTaskRepository speakTaskRepository,
			UserAnswerRepository userAnswerRepository, UserLessonRepository userLessonRepository,
			LessonRepository lessonRepository, SecurityService securityService,
			UserInGroupRepository userInGroupRepository) {
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.speakTaskRepository = speakTaskRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.userLessonRepository = userLessonRepository;
		this.lessonRepository = lessonRepository;
		this.securityService = securityService;
		this.userInGroupRepository = userInGroupRepository;
	}

	public Mono<LessonTasksResponse> getLessonTasks(Integer lessonId) {
		return securityService.getCurrentUser().flatMap(user -> Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));

			boolean isStudent = user.getRole() == Role.STUDENT;
			String status = null;

			if (isStudent) {
				if (!userInGroupRepository.hasAccessToLesson(user.getId(), lessonId)) {
					throw new TaskException(TaskErrorCode.STUDENT_NO_ACCESS);
				}

				Optional<UserLesson> existing = userLessonRepository.findByUserIdAndLessonId(user.getId(), lessonId);
				if (existing.isPresent()) {
					if (existing.get().getStatus() == UserLessonStatus.COMPLETED) {
						throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
					}
					status = existing.get().getStatus().name();
				} else {
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

			return buildLessonTasksResponse(lessonId, status, chooseTasks, writeTasks, scatterTasks, speakTasks,
					isStudent);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	// --- Choose Task CRUD ---

	public Mono<ChooseTaskResponse> createChooseTask(Integer lessonId, Mono<ChooseTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
			ChooseTask task = ChooseTask.builder().lessonId(lessonId).task(request.getTask())
					.possibleAnswers(request.getPossibleAnswers()).correctAnswer(request.getCorrectAnswer())
					.hint(request.getHint()).section(request.getSection()).build();
			ChooseTask saved = chooseTaskRepository.save(task);
			return toChooseTaskResponse(saved, false);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<ChooseTaskResponse> updateChooseTask(Integer lessonId, Integer taskId,
			Mono<ChooseTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			ChooseTask task = chooseTaskRepository.findById(taskId)
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			task.setTask(request.getTask());
			task.setPossibleAnswers(request.getPossibleAnswers());
			task.setCorrectAnswer(request.getCorrectAnswer());
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			ChooseTask saved = chooseTaskRepository.save(task);
			return toChooseTaskResponse(saved, false);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteChooseTask(Integer lessonId, Integer taskId) {
		return Mono.fromCallable(() -> {
			chooseTaskRepository.findById(taskId).orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			chooseTaskRepository.deleteById(taskId);
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
			return toWriteTaskResponse(saved, false);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<WriteTaskResponse> updateWriteTask(Integer lessonId, Integer taskId,
			Mono<WriteTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			WriteTask task = writeTaskRepository.findById(taskId)
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			task.setTask(request.getTask());
			task.setCorrectAnswer(request.getCorrectAnswer());
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			WriteTask saved = writeTaskRepository.save(task);
			return toWriteTaskResponse(saved, false);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteWriteTask(Integer lessonId, Integer taskId) {
		return Mono.fromCallable(() -> {
			writeTaskRepository.findById(taskId).orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			writeTaskRepository.deleteById(taskId);
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
			return toScatterTaskResponse(saved, false);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<ScatterTaskResponse> updateScatterTask(Integer lessonId, Integer taskId,
			Mono<ScatterTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			ScatterTask task = scatterTaskRepository.findById(taskId)
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			task.setTask(request.getTask());
			task.setWords(request.getWords());
			task.setCorrectAnswer(request.getCorrectAnswer());
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			ScatterTask saved = scatterTaskRepository.save(task);
			return toScatterTaskResponse(saved, false);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteScatterTask(Integer lessonId, Integer taskId) {
		return Mono.fromCallable(() -> {
			scatterTaskRepository.findById(taskId).orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			scatterTaskRepository.deleteById(taskId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	// --- Speak Task CRUD ---

	public Mono<SpeakTaskResponse> createSpeakTask(Integer lessonId, Mono<SpeakTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId).orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
			SpeakTask task = SpeakTask.builder().lessonId(lessonId).task(request.getTask()).hint(request.getHint())
					.section(request.getSection()).build();
			SpeakTask saved = speakTaskRepository.save(task);
			return toSpeakTaskResponse(saved);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<SpeakTaskResponse> updateSpeakTask(Integer lessonId, Integer taskId,
			Mono<SpeakTaskRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			SpeakTask task = speakTaskRepository.findById(taskId)
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			task.setTask(request.getTask());
			task.setHint(request.getHint());
			task.setSection(request.getSection());
			SpeakTask saved = speakTaskRepository.save(task);
			return toSpeakTaskResponse(saved);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> deleteSpeakTask(Integer lessonId, Integer taskId) {
		return Mono.fromCallable(() -> {
			speakTaskRepository.findById(taskId).orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			speakTaskRepository.deleteById(taskId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	// --- Submit ---

	public Mono<SubmitResponse> submitLesson(Integer lessonId, Mono<SubmitRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					UserLesson userLesson = userLessonRepository.findByUserIdAndLessonId(userId, lessonId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_STARTED));

					if (userLesson.getStatus() == UserLessonStatus.COMPLETED) {
						throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
					}

					int score = 0;
					int maxScore = 0;
					List<AnswerResultDto> details = new ArrayList<>();

					for (AnswerItemRequest item : request.getAnswers()) {
						String dbTaskType = resolveDbTaskType(item.getTaskType());
						boolean correct = false;
						String correctAnswer = null;

						switch (item.getTaskType()) {
							case "choose" -> {
								ChooseTask ct = chooseTaskRepository.findById(item.getTaskId())
										.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
								correctAnswer = String.valueOf(ct.getCorrectAnswer());
								correct = item.getAnswer().trim().equals(correctAnswer);
								maxScore++;
							}
							case "write" -> {
								WriteTask wt = writeTaskRepository.findById(item.getTaskId())
										.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
								correctAnswer = wt.getCorrectAnswer();
								correct = item.getAnswer().trim().equalsIgnoreCase(correctAnswer.trim());
								maxScore++;
							}
							case "scatter" -> {
								ScatterTask st = scatterTaskRepository.findById(item.getTaskId())
										.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
								correctAnswer = st.getCorrectAnswer();
								correct = item.getAnswer().trim().equalsIgnoreCase(correctAnswer.trim());
								maxScore++;
							}
							case "speak" -> {
								correct = true;
								correctAnswer = null;
								maxScore++;
							}
							default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
						}

						if (correct) {
							score++;
						}

						UserAnswer ua = UserAnswer.builder().taskId(item.getTaskId()).taskType(dbTaskType)
								.userId(userId).lessonId(lessonId).answer(item.getAnswer()).isCorrect(correct).build();
						userAnswerRepository.save(ua);

						details.add(AnswerResultDto.builder().taskId(item.getTaskId()).taskType(item.getTaskType())
								.isCorrect(correct).correctAnswer(correctAnswer).build());
					}

					userLesson.setScore(score);
					userLesson.setMaxScore(maxScore);
					userLesson.setStatus(UserLessonStatus.COMPLETED);
					userLesson.setFinishedAt(LocalDateTime.now());
					userLessonRepository.save(userLesson);

					return SubmitResponse.builder().score(score).maxScore(maxScore).details(details).build();
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	// --- Reset ---

	public Mono<Void> resetUserProgress(Integer lessonId, Integer userId) {
		return Mono.fromCallable(() -> {
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

	private LessonTasksResponse buildLessonTasksResponse(Integer lessonId, String status, List<ChooseTask> chooseTasks,
			List<WriteTask> writeTasks, List<ScatterTask> scatterTasks, List<SpeakTask> speakTasks,
			boolean stripAnswers) {

		Set<String> allSections = new TreeSet<>(Comparator.nullsFirst(Comparator.naturalOrder()));
		chooseTasks.forEach(t -> allSections.add(t.getSection()));
		writeTasks.forEach(t -> allSections.add(t.getSection()));
		scatterTasks.forEach(t -> allSections.add(t.getSection()));
		speakTasks.forEach(t -> allSections.add(t.getSection()));

		List<TaskSectionDto> sections = allSections.stream().map(section -> {
			List<ChooseTaskResponse> choose = chooseTasks.stream().filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toChooseTaskResponse(t, stripAnswers)).collect(Collectors.toList());
			List<WriteTaskResponse> write = writeTasks.stream().filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toWriteTaskResponse(t, stripAnswers)).collect(Collectors.toList());
			List<ScatterTaskResponse> scatter = scatterTasks.stream()
					.filter(t -> Objects.equals(t.getSection(), section))
					.map(t -> toScatterTaskResponse(t, stripAnswers)).collect(Collectors.toList());
			List<SpeakTaskResponse> speak = speakTasks.stream().filter(t -> Objects.equals(t.getSection(), section))
					.map(this::toSpeakTaskResponse).collect(Collectors.toList());
			return TaskSectionDto.builder().section(section).chooseTasks(choose).writeTasks(write).scatterTasks(scatter)
					.speakTasks(speak).build();
		}).collect(Collectors.toList());

		return LessonTasksResponse.builder().lessonId(lessonId).status(status).sections(sections).build();
	}

	private ChooseTaskResponse toChooseTaskResponse(ChooseTask t, boolean stripAnswer) {
		return ChooseTaskResponse.builder().id(t.getId()).lessonId(t.getLessonId()).task(t.getTask())
				.possibleAnswers(t.getPossibleAnswers()).correctAnswer(stripAnswer ? null : t.getCorrectAnswer())
				.hint(t.getHint()).section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}

	private WriteTaskResponse toWriteTaskResponse(WriteTask t, boolean stripAnswer) {
		return WriteTaskResponse.builder().id(t.getId()).lessonId(t.getLessonId()).task(t.getTask())
				.correctAnswer(stripAnswer ? null : t.getCorrectAnswer()).hint(t.getHint()).section(t.getSection())
				.createdAt(t.getCreatedAt()).build();
	}

	private ScatterTaskResponse toScatterTaskResponse(ScatterTask t, boolean stripAnswer) {
		return ScatterTaskResponse.builder().id(t.getId()).lessonId(t.getLessonId()).task(t.getTask())
				.words(t.getWords()).correctAnswer(stripAnswer ? null : t.getCorrectAnswer()).hint(t.getHint())
				.section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}

	private SpeakTaskResponse toSpeakTaskResponse(SpeakTask t) {
		return SpeakTaskResponse.builder().id(t.getId()).lessonId(t.getLessonId()).task(t.getTask()).hint(t.getHint())
				.section(t.getSection()).createdAt(t.getCreatedAt()).build();
	}
}
