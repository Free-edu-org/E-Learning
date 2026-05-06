package pl.freeedu.backend.task.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.task.dto.LessonResultDetailsResponse;
import pl.freeedu.backend.task.dto.LessonResultTaskDetailDto;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.model.UserAnswer;
import pl.freeedu.backend.task.model.UserTaskAttentionEvent;
import pl.freeedu.backend.task.model.UserLesson;
import pl.freeedu.backend.task.model.UserLessonStatus;
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.UserAnswerRepository;
import pl.freeedu.backend.task.repository.UserTaskAttentionEventRepository;
import pl.freeedu.backend.task.repository.UserLessonRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LessonResultDetailsService {

	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final SpeakTaskRepository speakTaskRepository;
	private final UserAnswerRepository userAnswerRepository;
	private final UserLessonRepository userLessonRepository;
	private final UserTaskAttentionEventRepository userTaskAttentionEventRepository;
	private final LessonRepository lessonRepository;
	private final UserRepository userRepository;

	public LessonResultDetailsService(ChooseTaskRepository chooseTaskRepository,
			WriteTaskRepository writeTaskRepository, ScatterTaskRepository scatterTaskRepository,
			SpeakTaskRepository speakTaskRepository, UserAnswerRepository userAnswerRepository,
			UserLessonRepository userLessonRepository,
			UserTaskAttentionEventRepository userTaskAttentionEventRepository, LessonRepository lessonRepository,
			UserRepository userRepository) {
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.speakTaskRepository = speakTaskRepository;
		this.userAnswerRepository = userAnswerRepository;
		this.userLessonRepository = userLessonRepository;
		this.userTaskAttentionEventRepository = userTaskAttentionEventRepository;
		this.lessonRepository = lessonRepository;
		this.userRepository = userRepository;
	}

	public Mono<LessonResultDetailsResponse> getCompletedLessonResult(Integer lessonId, Integer userId) {
		return Mono.fromCallable(() -> {
			log.info("Fetching completed lesson result. Lesson ID: {}, User ID: {}", lessonId, userId);
			Lesson lesson = lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Result fetch failed: Lesson with ID: {} not found", lessonId);
				return new TaskException(TaskErrorCode.LESSON_NOT_FOUND);
			});
			User user = userRepository.findById(userId).orElseThrow(() -> {
				log.warn("Result fetch failed: User with ID: {} not found", userId);
				return new TaskException(TaskErrorCode.LESSON_RESULT_NOT_FOUND);
			});
			UserLesson userLesson = userLessonRepository.findByUserIdAndLessonId(userId, lessonId)
					.filter(savedLesson -> savedLesson.getStatus() == UserLessonStatus.COMPLETED).orElseThrow(() -> {
						log.warn("Result fetch failed: No completed lesson result for user ID: {} and lesson ID: {}",
								userId, lessonId);
						return new TaskException(TaskErrorCode.LESSON_RESULT_NOT_FOUND);
					});

			Map<String, UserAnswer> answersByKey = userAnswerRepository.findByUserIdAndLessonId(userId, lessonId)
					.stream().collect(Collectors.toMap(answer -> answerKey(answer.getTaskType(), answer.getTaskId()),
							Function.identity(), (left, right) -> right));
			Map<String, Integer> tabSwitchesByKey = userTaskAttentionEventRepository
					.findByUserIdAndLessonId(userId, lessonId).stream()
					.collect(Collectors.toMap(event -> answerKey(event.getTaskType(), event.getTaskId()),
							UserTaskAttentionEvent::getSwitchCount, Integer::sum));

			List<LessonResultTaskDetailDto> taskDetails = buildTaskDefinitions(lessonId).stream()
					.map(task -> task.toDto(answersByKey.get(answerKey(task.dbTaskType(), task.taskId())),
							tabSwitchesByKey.getOrDefault(answerKey(task.dbTaskType(), task.taskId()), 0)))
					.toList();

			log.info("Result details fetched successfully for user ID: {} and lesson ID: {}", userId, lessonId);
			return LessonResultDetailsResponse.builder().lessonPublicId(lesson.getPublicId())
					.lessonTitle(lesson.getTitle()).userPublicId(user.getPublicId()).username(user.getUsername())
					.score(userLesson.getScore()).maxScore(userLesson.getMaxScore())
					.resultPercent(toPercent(userLesson.getScore(), userLesson.getMaxScore()))
					.completedAt(userLesson.getFinishedAt()).tasks(taskDetails).build();
		}).subscribeOn(Schedulers.boundedElastic());
	}

	private List<TaskDefinition> buildTaskDefinitions(Integer lessonId) {
		List<TaskDefinition> definitions = chooseTaskRepository.findByLessonId(lessonId).stream()
				.map(task -> TaskDefinition.choose(task.getId(), task.getPublicId(), task.getSection(), task.getTask(),
						task.getHint(), task.getPossibleAnswers(), String.valueOf(task.getCorrectAnswer())))
				.collect(Collectors.toList());

		definitions.addAll(writeTaskRepository.findByLessonId(lessonId).stream()
				.map(task -> TaskDefinition.write(task.getId(), task.getPublicId(), task.getSection(), task.getTask(),
						task.getHint(), task.getCorrectAnswer()))
				.toList());
		definitions.addAll(scatterTaskRepository
				.findByLessonId(lessonId).stream().map(task -> TaskDefinition.scatter(task.getId(), task.getPublicId(),
						task.getSection(), task.getTask(), task.getHint(), task.getWords(), task.getCorrectAnswer()))
				.toList());
		definitions.addAll(speakTaskRepository.findByLessonId(lessonId).stream()
				.map(task -> TaskDefinition.speak(task.getId(), task.getPublicId(), task.getSection(), task.getTask(),
						task.getHint(), task.getExpectedText()))
				.toList());

		definitions
				.sort(Comparator.comparing(TaskDefinition::section, Comparator.nullsFirst(String::compareToIgnoreCase))
						.thenComparing(TaskDefinition::displayOrder).thenComparing(TaskDefinition::taskId));
		return definitions;
	}

	private Double toPercent(Integer score, Integer maxScore) {
		if (score == null || maxScore == null || maxScore <= 0) {
			return 0.0;
		}
		return Math.round(((score * 100.0) / maxScore) * 10.0) / 10.0;
	}

	private String answerKey(String taskType, Integer taskId) {
		return taskType + "_" + taskId;
	}

	private record TaskDefinition(Integer taskId, String publicId, String taskType, String dbTaskType, String section,
			String taskText, String hint, String correctAnswer, String possibleAnswers, String words,
			int displayOrder) {

		private static TaskDefinition choose(Integer taskId, String publicId, String section, String taskText,
				String hint, String possibleAnswers, String correctAnswer) {
			return new TaskDefinition(taskId, publicId, "choose", "choose_tasks", section, taskText, hint,
					correctAnswer, possibleAnswers, null, 0);
		}

		private static TaskDefinition write(Integer taskId, String publicId, String section, String taskText,
				String hint, String correctAnswer) {
			return new TaskDefinition(taskId, publicId, "write", "write_tasks", section, taskText, hint, correctAnswer,
					null, null, 1);
		}

		private static TaskDefinition scatter(Integer taskId, String publicId, String section, String taskText,
				String hint, String words, String correctAnswer) {
			return new TaskDefinition(taskId, publicId, "scatter", "scatter_tasks", section, taskText, hint,
					correctAnswer, null, words, 2);
		}

		private static TaskDefinition speak(Integer taskId, String publicId, String section, String taskText,
				String hint, String correctAnswer) {
			return new TaskDefinition(taskId, publicId, "speak", "speak_tasks", section, taskText, hint, correctAnswer,
					null, null, 3);
		}

		private LessonResultTaskDetailDto toDto(UserAnswer answer, Integer tabSwitchCount) {
			String mappedUserAnswer = answer != null ? answer.getAnswer() : null;
			String mappedCorrectAnswer = correctAnswer;

			if ("choose".equals(taskType) && possibleAnswers != null) {
				mappedUserAnswer = mapChooseAnswer(mappedUserAnswer, possibleAnswers);
				mappedCorrectAnswer = mapChooseAnswer(correctAnswer, possibleAnswers);
			}

			return LessonResultTaskDetailDto.builder().taskPublicId(publicId).taskType(taskType).section(section)
					.taskText(taskText).hint(hint).userAnswer(mappedUserAnswer).correctAnswer(mappedCorrectAnswer)
					.isCorrect(answer != null ? Boolean.TRUE.equals(answer.getIsCorrect()) : Boolean.FALSE)
					.possibleAnswers(possibleAnswers).words(words).tabSwitchCount(tabSwitchCount).build();
		}

		private String mapChooseAnswer(String answer, String possibleAnswers) {
			if (answer == null || answer.isBlank()) {
				return answer;
			}
			List<String> options = List.of(possibleAnswers.split("\\|"));
			try {
				int index = Integer.parseInt(answer.trim());
				if (index >= 0 && index < options.size()) {
					return options.get(index);
				}
			} catch (NumberFormatException ignored) {
			}
			return answer;
		}
	}
}
