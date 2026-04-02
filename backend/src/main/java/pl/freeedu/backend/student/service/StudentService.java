package pl.freeedu.backend.student.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.student.dto.StudentLessonResponse;
import pl.freeedu.backend.student.dto.StudentProgressResponse;
import pl.freeedu.backend.student.dto.StudentStatsResponse;
import pl.freeedu.backend.task.model.UserLesson;
import pl.freeedu.backend.task.model.UserLessonStatus;
import pl.freeedu.backend.task.repository.UserLessonRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class StudentService {

	private final SecurityService securityService;
	private final UserInGroupRepository userInGroupRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final LessonRepository lessonRepository;
	private final UserLessonRepository userLessonRepository;
	private final LessonMapper lessonMapper;

	public StudentService(SecurityService securityService, UserInGroupRepository userInGroupRepository,
			GroupHasLessonRepository groupHasLessonRepository, LessonRepository lessonRepository,
			UserLessonRepository userLessonRepository, LessonMapper lessonMapper) {
		this.securityService = securityService;
		this.userInGroupRepository = userInGroupRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.lessonRepository = lessonRepository;
		this.userLessonRepository = userLessonRepository;
		this.lessonMapper = lessonMapper;
	}

	public Mono<StudentStatsResponse> getStats() {
		return loadDashboardSnapshot().map(StudentDashboardSnapshot::stats);
	}

	public Flux<StudentLessonResponse> getLessons() {
		return loadDashboardSnapshot().flatMapMany(snapshot -> Flux.fromIterable(snapshot.lessons()));
	}

	public Mono<StudentProgressResponse> getProgress() {
		return loadDashboardSnapshot().map(StudentDashboardSnapshot::progress);
	}

	private Mono<StudentDashboardSnapshot> loadDashboardSnapshot() {
		return securityService.getCurrentUserId().flatMap(userId -> Mono
				.fromCallable(() -> buildDashboardSnapshot(userId)).subscribeOn(Schedulers.boundedElastic()));
	}

	private StudentDashboardSnapshot buildDashboardSnapshot(Integer userId) {
		Optional<Integer> maybeGroupId = userInGroupRepository.findByUserId(userId)
				.map(membership -> membership.getGroupId());
		if (maybeGroupId.isEmpty()) {
			return emptySnapshot(
					"Nie masz jeszcze przypisanej grupy. Gdy nauczyciel doda Cie do grupy, tutaj pojawia sie lekcje i wyniki.");
		}

		List<Integer> lessonIds = groupHasLessonRepository.findLessonIdsByGroupId(maybeGroupId.get());
		if (lessonIds.isEmpty()) {
			return emptySnapshot(
					"Twoja grupa nie ma jeszcze przypisanych lekcji. Wroc pozniej lub skontaktuj sie z nauczycielem.");
		}

		List<Lesson> lessons = lessonRepository.findByIdIn(lessonIds);
		Map<Integer, UserLesson> userLessonsByLessonId = userLessonRepository
				.findByUserIdAndLessonIdIn(userId, lessonIds).stream()
				.collect(Collectors.toMap(UserLesson::getLessonId, Function.identity()));

		List<StudentLessonResponse> studentLessons = new ArrayList<>();
		for (Lesson lesson : lessons) {
			var lessonResponse = lessonMapper.toResponse(lesson);
			lessonResponse.setGroups(groupHasLessonRepository.findGroupsForLesson(lesson.getId()));

			UserLesson userLesson = userLessonsByLessonId.get(lesson.getId());
			Integer score = userLesson != null ? userLesson.getScore() : null;
			Integer maxScore = userLesson != null ? userLesson.getMaxScore() : null;

			studentLessons
					.add(StudentLessonResponse.builder().id(lessonResponse.getId()).title(lessonResponse.getTitle())
							.theme(lessonResponse.getTheme()).isActive(lessonResponse.getIsActive())
							.teacherId(lessonResponse.getTeacherId()).teacherName(lessonResponse.getTeacherName())
							.createdAt(lessonResponse.getCreatedAt()).groups(lessonResponse.getGroups())
							.status(userLesson != null ? userLesson.getStatus().name() : "NOT_STARTED").score(score)
							.maxScore(maxScore).resultPercent(toPercent(score, maxScore)).build());
		}

		studentLessons.sort(Comparator.comparing(StudentLessonResponse::getCreatedAt,
				Comparator.nullsLast(Comparator.reverseOrder())));

		int totalLessons = studentLessons.size();
		int completedLessons = (int) studentLessons.stream()
				.filter(lesson -> UserLessonStatus.COMPLETED.name().equals(lesson.getStatus())).count();
		int inProgressLessons = (int) studentLessons.stream()
				.filter(lesson -> UserLessonStatus.IN_PROGRESS.name().equals(lesson.getStatus())).count();

		double averageScore = studentLessons.stream().filter(lesson -> lesson.getResultPercent() != null)
				.mapToDouble(StudentLessonResponse::getResultPercent).average().orElse(0.0);

		StudentStatsResponse stats = StudentStatsResponse.builder().totalLessons(totalLessons)
				.completedLessons(completedLessons).inProgressLessons(inProgressLessons)
				.averageScore(roundToOneDecimal(averageScore)).build();

		StudentProgressResponse progress = StudentProgressResponse.builder()
				.summary(buildSummary(totalLessons, completedLessons, inProgressLessons, stats.getAverageScore()))
				.totalLessons(totalLessons).completedLessons(completedLessons).inProgressLessons(inProgressLessons)
				.averageScore(stats.getAverageScore()).build();

		return new StudentDashboardSnapshot(studentLessons, stats, progress);
	}

	private StudentDashboardSnapshot emptySnapshot(String summary) {
		StudentStatsResponse stats = StudentStatsResponse.builder().totalLessons(0).completedLessons(0)
				.inProgressLessons(0).averageScore(0.0).build();

		StudentProgressResponse progress = StudentProgressResponse.builder().summary(summary).totalLessons(0)
				.completedLessons(0).inProgressLessons(0).averageScore(0.0).build();

		return new StudentDashboardSnapshot(List.of(), stats, progress);
	}

	private String buildSummary(int totalLessons, int completedLessons, int inProgressLessons, double averageScore) {
		if (totalLessons == 0) {
			return "Nie masz jeszcze przypisanych lekcji.";
		}
		if (completedLessons == 0 && inProgressLessons == 0) {
			return "Masz przypisane " + totalLessons
					+ " lekcje. Rozpocznij pierwsza, aby zaczac budowac historie wynikow.";
		}
		if (completedLessons == 0) {
			return "Masz " + inProgressLessons
					+ " rozpoczete lekcje. Dokoncz je, aby zobaczyc pierwszy wynik procentowy.";
		}
		return "Ukonczono " + completedLessons + " z " + totalLessons + " lekcji. Sredni wynik wynosi "
				+ roundToOneDecimal(averageScore) + "%.";
	}

	private Double toPercent(Integer score, Integer maxScore) {
		if (score == null || maxScore == null || maxScore <= 0) {
			return null;
		}
		return roundToOneDecimal((score * 100.0) / maxScore);
	}

	private double roundToOneDecimal(double value) {
		return Math.round(value * 10.0) / 10.0;
	}

	private record StudentDashboardSnapshot(List<StudentLessonResponse> lessons, StudentStatsResponse stats,
			StudentProgressResponse progress) {
	}
}
