package pl.freeedu.backend.task.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.model.UserHasLesson;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.lesson.repository.UserHasLessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.mapper.TaskMapper;
import pl.freeedu.backend.task.model.*;
import pl.freeedu.backend.task.repository.*;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskService {

	private final SpeakTaskRepository speakTaskRepository;
	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final UserLessonRepository userLessonRepository;
	private final LessonRepository lessonRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final UserHasLessonRepository userHasLessonRepository;
	private final UserRepository userRepository;
	private final UserGroupRepository userGroupRepository;
	private final SecurityService securityService;
	private final TaskMapper taskMapper;

	public TaskService(SpeakTaskRepository speakTaskRepository, ChooseTaskRepository chooseTaskRepository,
			WriteTaskRepository writeTaskRepository, ScatterTaskRepository scatterTaskRepository,
			UserAnswerRepository userAnswerRepository, UserLessonRepository userLessonRepository,
			LessonRepository lessonRepository, UserInGroupRepository userInGroupRepository,
			GroupHasLessonRepository groupHasLessonRepository, UserHasLessonRepository userHasLessonRepository,
			UserRepository userRepository, UserGroupRepository userGroupRepository, SecurityService securityService,
			TaskMapper taskMapper) {
		this.speakTaskRepository = speakTaskRepository;
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.userLessonRepository = userLessonRepository;
		this.lessonRepository = lessonRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.userHasLessonRepository = userHasLessonRepository;
		this.userRepository = userRepository;
		this.userGroupRepository = userGroupRepository;
		this.securityService = securityService;
		this.taskMapper = taskMapper;
	}

	// ==================== A. Get lesson tasks ====================

	public Mono<LessonTasksResponse> getLessonTasks(Integer lessonId) {
		return securityService.getCurrentUser().flatMap(user -> Mono.fromCallable(() -> {
			Lesson lesson = lessonRepository.findById(lessonId)
					.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));

			boolean isAdmin = user.getRole() == Role.ADMIN;
			String status = null;

			if (!isAdmin) {
				// Student: verify access via group or direct assignment
				boolean hasAccess = userHasLessonRepository.existsByUserIdAndLessonId(user.getId(), lessonId);
				if (!hasAccess) {
					UserInGroup uig = userInGroupRepository.findByUserId(user.getId()).orElse(null);
					if (uig != null) {
						List<Integer> lessonIds = groupHasLessonRepository.findLessonIdsByGroupId(uig.getGroupId());
						hasAccess = lessonIds.contains(lessonId);
					}
				}
				if (!hasAccess) {
					throw new TaskException(TaskErrorCode.LESSON_NOT_ACCESSIBLE);
				}

				// Check user_lessons
				Optional<UserLesson> existing = userLessonRepository.findByUserIdAndLessonId(user.getId(), lessonId);
				if (existing.isPresent() && LessonStatus.COMPLETED.equals(existing.get().getStatus())) {
					throw new TaskException(TaskErrorCode.LESSON_ALREADY_COMPLETED);
				}
				if (existing.isEmpty()) {
					UserLesson ul = UserLesson.builder().userId(user.getId()).lessonId(lessonId)
							.status(LessonStatus.IN_PROGRESS).build();
					userLessonRepository.save(ul);
				}
				status = LessonStatus.IN_PROGRESS;
			}

			// Fetch all tasks
			List<TaskResponse> allTasks = new ArrayList<>();

			speakTaskRepository.findByLessonId(lessonId).forEach(
					t -> allTasks.add(isAdmin ? taskMapper.toAdminResponse(t) : taskMapper.toStudentResponse(t)));
			chooseTaskRepository.findByLessonId(lessonId).forEach(
					t -> allTasks.add(isAdmin ? taskMapper.toAdminResponse(t) : taskMapper.toStudentResponse(t)));
			writeTaskRepository.findByLessonId(lessonId).forEach(
					t -> allTasks.add(isAdmin ? taskMapper.toAdminResponse(t) : taskMapper.toStudentResponse(t)));
			scatterTaskRepository.findByLessonId(lessonId).forEach(
					t -> allTasks.add(isAdmin ? taskMapper.toAdminResponse(t) : taskMapper.toStudentResponse(t)));

			// Group by section
			Map<String, List<TaskResponse>> sections = allTasks.stream().collect(Collectors.groupingBy(
					t -> t.getSection() != null ? t.getSection() : "default", LinkedHashMap::new, Collectors.toList()));

			return LessonTasksResponse.builder().lessonId(lessonId).lessonTitle(lesson.getTitle()).status(status)
					.sections(sections).build();
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	// ==================== A2. Student lesson list ====================

	public Mono<List<StudentLessonResponse>> getStudentLessons() {
		return securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
			Set<Integer> lessonIds = new LinkedHashSet<>();
			// group-based access
			UserInGroup uig = userInGroupRepository.findByUserId(userId).orElse(null);
			if (uig != null) {
				lessonIds.addAll(groupHasLessonRepository.findLessonIdsByGroupId(uig.getGroupId()));
			}
			// direct assignment
			lessonIds.addAll(userHasLessonRepository.findLessonIdsByUserId(userId));

			if (lessonIds.isEmpty()) {
				return List.<StudentLessonResponse>of();
			}
			List<Lesson> lessons = lessonRepository.findAllById(lessonIds);
			return lessons.stream().filter(Lesson::getIsActive).map(lesson -> {
				String status = userLessonRepository.findByUserIdAndLessonId(userId, lesson.getId())
						.map(UserLesson::getStatus).orElse(null);
				return StudentLessonResponse.builder().id(lesson.getId()).title(lesson.getTitle())
						.theme(lesson.getTheme()).status(status).build();
			}).collect(Collectors.toList());
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	// ==================== B. Teacher CRUD ====================

	private Lesson verifyLessonOwnership(Integer lessonId, Integer currentUserId) {
		Lesson lesson = lessonRepository.findById(lessonId)
				.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));
		if (!Objects.equals(lesson.getTeacherId(), currentUserId)) {
			throw new TaskException(TaskErrorCode.NOT_LESSON_OWNER);
		}
		return lesson;
	}

	// --- CREATE ---

	public Mono<TaskResponse> createSpeakTask(Integer lessonId, Mono<CreateSpeakTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					SpeakTask entity = taskMapper.toEntity(request);
					entity.setLessonId(lessonId);
					SpeakTask saved = speakTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<TaskResponse> createChooseTask(Integer lessonId, Mono<CreateChooseTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					ChooseTask entity = taskMapper.toEntity(request);
					entity.setLessonId(lessonId);
					ChooseTask saved = chooseTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<TaskResponse> createWriteTask(Integer lessonId, Mono<CreateWriteTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					WriteTask entity = taskMapper.toEntity(request);
					entity.setLessonId(lessonId);
					WriteTask saved = writeTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<TaskResponse> createScatterTask(Integer lessonId, Mono<CreateScatterTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					ScatterTask entity = taskMapper.toEntity(request);
					entity.setLessonId(lessonId);
					ScatterTask saved = scatterTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	// --- UPDATE ---

	public Mono<TaskResponse> updateSpeakTask(Integer lessonId, Integer taskId,
			Mono<CreateSpeakTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					SpeakTask entity = speakTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(entity.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					entity.setTask(request.getTask());
					entity.setHint(request.getHint());
					entity.setSection(request.getSection());
					SpeakTask saved = speakTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<TaskResponse> updateChooseTask(Integer lessonId, Integer taskId,
			Mono<CreateChooseTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					ChooseTask entity = chooseTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(entity.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					entity.setTask(request.getTask());
					entity.setPossibleAnswers(request.getPossibleAnswers());
					entity.setCorrectAnswer(request.getCorrectAnswer());
					entity.setHint(request.getHint());
					entity.setSection(request.getSection());
					ChooseTask saved = chooseTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<TaskResponse> updateWriteTask(Integer lessonId, Integer taskId,
			Mono<CreateWriteTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					WriteTask entity = writeTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(entity.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					entity.setTask(request.getTask());
					entity.setCorrectAnswer(request.getCorrectAnswer());
					entity.setHint(request.getHint());
					entity.setSection(request.getSection());
					WriteTask saved = writeTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<TaskResponse> updateScatterTask(Integer lessonId, Integer taskId,
			Mono<CreateScatterTaskRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					verifyLessonOwnership(lessonId, userId);
					ScatterTask entity = scatterTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(entity.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					entity.setTask(request.getTask());
					entity.setWords(request.getWords());
					entity.setCorrectAnswer(request.getCorrectAnswer());
					entity.setHint(request.getHint());
					entity.setSection(request.getSection());
					ScatterTask saved = scatterTaskRepository.save(entity);
					return taskMapper.toAdminResponse(saved);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	// --- DELETE ---

	public Mono<Void> deleteTask(Integer lessonId, String taskTypeParam, Integer taskId) {
		return securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
			verifyLessonOwnership(lessonId, userId);
			TaskType type;
			try {
				type = TaskType.fromPathParam(taskTypeParam);
			} catch (IllegalArgumentException e) {
				throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
			}
			switch (type) {
				case SPEAK -> {
					SpeakTask t = speakTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(t.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					speakTaskRepository.delete(t);
				}
				case CHOOSE -> {
					ChooseTask t = chooseTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(t.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					chooseTaskRepository.delete(t);
				}
				case WRITE -> {
					WriteTask t = writeTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(t.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					writeTaskRepository.delete(t);
				}
				case SCATTER -> {
					ScatterTask t = scatterTaskRepository.findById(taskId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
					if (!Objects.equals(t.getLessonId(), lessonId)) {
						throw new TaskException(TaskErrorCode.TASK_NOT_FOUND);
					}
					scatterTaskRepository.delete(t);
				}
			}
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then());
	}

	// ==================== C. Submit answers (evaluation engine)
	// ====================

	@Transactional
	public Mono<SubmitResultResponse> submitAnswers(Integer lessonId, Mono<SubmitAnswersRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					// 1. Check lesson exists
					lessonRepository.findById(lessonId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_FOUND));

					// 2. Check student access (group or direct assignment)
					boolean hasAccess = userHasLessonRepository.existsByUserIdAndLessonId(userId, lessonId);
					if (!hasAccess) {
						UserInGroup uig = userInGroupRepository.findByUserId(userId).orElse(null);
						if (uig != null) {
							hasAccess = groupHasLessonRepository.findLessonIdsByGroupId(uig.getGroupId())
									.contains(lessonId);
						}
					}
					if (!hasAccess) {
						throw new TaskException(TaskErrorCode.LESSON_NOT_ACCESSIBLE);
					}

					// 3. Check user_lesson status
					UserLesson userLesson = userLessonRepository.findByUserIdAndLessonId(userId, lessonId)
							.orElseThrow(() -> new TaskException(TaskErrorCode.LESSON_NOT_STARTED));
					if (LessonStatus.COMPLETED.equals(userLesson.getStatus())) {
						throw new TaskException(TaskErrorCode.ALREADY_SUBMITTED);
					}

					// 4. Count total tasks for max_score
					int maxScore = speakTaskRepository.findByLessonId(lessonId).size()
							+ chooseTaskRepository.findByLessonId(lessonId).size()
							+ writeTaskRepository.findByLessonId(lessonId).size()
							+ scatterTaskRepository.findByLessonId(lessonId).size();

					// 5. Evaluate each answer
					int score = 0;
					List<AnswerResultItem> results = new ArrayList<>();
					for (SubmitAnswerItem item : request.getAnswers()) {
						boolean correct = evaluateAnswer(item);
						if (correct) {
							score++;
						}

						UserAnswer ua = UserAnswer.builder().taskId(item.getTaskId()).taskType(item.getTaskType())
								.userId(userId).lessonId(lessonId).answer(item.getAnswer()).isCorrect(correct).build();
						userAnswerRepository.save(ua);

						results.add(AnswerResultItem.builder().taskId(item.getTaskId()).taskType(item.getTaskType())
								.isCorrect(correct).build());
					}

					// 6. Update user_lessons
					userLesson.setScore(score);
					userLesson.setMaxScore(maxScore);
					userLesson.setStatus(LessonStatus.COMPLETED);
					userLesson.setFinishedAt(LocalDateTime.now());
					userLessonRepository.save(userLesson);

					return SubmitResultResponse.builder().lessonId(lessonId).score(score).maxScore(maxScore)
							.status(LessonStatus.COMPLETED).results(results).build();
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	private boolean evaluateAnswer(SubmitAnswerItem item) {
		TaskType type;
		try {
			type = TaskType.fromTableName(item.getTaskType());
		} catch (IllegalArgumentException e) {
			throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		}
		return switch (type) {
			case SPEAK -> true;
			case CHOOSE -> {
				ChooseTask ct = chooseTaskRepository.findById(item.getTaskId())
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				try {
					yield ct.getCorrectAnswer().equals(Integer.parseInt(item.getAnswer().trim()));
				} catch (NumberFormatException e) {
					yield false;
				}
			}
			case WRITE -> {
				WriteTask wt = writeTaskRepository.findById(item.getTaskId())
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				yield wt.getCorrectAnswer().trim().equalsIgnoreCase(item.getAnswer().trim());
			}
			case SCATTER -> {
				ScatterTask st = scatterTaskRepository.findById(item.getTaskId())
						.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
				yield st.getCorrectAnswer().trim().equalsIgnoreCase(item.getAnswer().trim());
			}
		};
	}

	// ==================== D. Reset student lesson ====================

	@Transactional
	public Mono<Void> resetStudentLesson(Integer lessonId, Integer targetUserId) {
		return securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
			verifyLessonOwnership(lessonId, currentUserId);
			userAnswerRepository.deleteByUserIdAndLessonId(targetUserId, lessonId);
			userLessonRepository.deleteByUserIdAndLessonId(targetUserId, lessonId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then());
	}

	// ==================== E. Individual student assignment ====================

	public Mono<List<LessonStudentResponse>> getAssignedStudents(Integer lessonId) {
		return securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
			verifyLessonOwnership(lessonId, currentUserId);

			List<LessonStudentResponse> result = new ArrayList<>();
			Set<Integer> seenUserIds = new HashSet<>();

			// 1. Direct assignments
			List<Integer> directUserIds = userHasLessonRepository.findUserIdsByLessonId(lessonId);
			if (!directUserIds.isEmpty()) {
				for (User u : userRepository.findAllById(directUserIds)) {
					seenUserIds.add(u.getId());
					result.add(LessonStudentResponse.builder().id(u.getId()).username(u.getUsername())
							.email(u.getEmail()).accessType("direct").build());
				}
			}

			// 2. Group-based assignments
			List<pl.freeedu.backend.lesson.model.GroupHasLesson> groupLinks = groupHasLessonRepository
					.findByLessonId(lessonId);
			if (!groupLinks.isEmpty()) {
				List<Integer> groupIds = groupLinks.stream().map(gl -> gl.getGroupId()).collect(Collectors.toList());
				Map<Integer, String> groupNames = userGroupRepository.findAllById(groupIds).stream()
						.collect(Collectors.toMap(UserGroup::getId, UserGroup::getName));
				List<UserInGroup> memberships = userInGroupRepository.findByGroupIdIn(groupIds);
				List<Integer> memberUserIds = memberships.stream().map(UserInGroup::getUserId)
						.filter(id -> !seenUserIds.contains(id)).distinct().collect(Collectors.toList());
				if (!memberUserIds.isEmpty()) {
					Map<Integer, Integer> userToGroup = new HashMap<>();
					for (UserInGroup m : memberships) {
						userToGroup.putIfAbsent(m.getUserId(), m.getGroupId());
					}
					for (User u : userRepository.findAllById(memberUserIds)) {
						Integer gId = userToGroup.get(u.getId());
						result.add(LessonStudentResponse.builder().id(u.getId()).username(u.getUsername())
								.email(u.getEmail()).accessType("group").groupName(groupNames.getOrDefault(gId, ""))
								.build());
					}
				}
			}

			return result;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> assignStudent(Integer lessonId, Integer userId) {
		return securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
			verifyLessonOwnership(lessonId, currentUserId);
			if (!userHasLessonRepository.existsByUserIdAndLessonId(userId, lessonId)) {
				userHasLessonRepository.save(UserHasLesson.builder().userId(userId).lessonId(lessonId).build());
			}
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then());
	}

	@Transactional
	public Mono<Void> removeStudent(Integer lessonId, Integer userId) {
		return securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
			verifyLessonOwnership(lessonId, currentUserId);
			userHasLessonRepository.deleteByUserIdAndLessonId(userId, lessonId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then());
	}
}
