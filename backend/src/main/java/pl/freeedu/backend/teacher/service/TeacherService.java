package pl.freeedu.backend.teacher.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.repository.TeacherStatsRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class TeacherService {

	private final TeacherStatsRepository teacherStatsRepository;

	public TeacherService(TeacherStatsRepository teacherStatsRepository) {
		this.teacherStatsRepository = teacherStatsRepository;
	}

	public Mono<TeacherStatsResponse> getStats() {
		return Mono
				.fromCallable(
						() -> TeacherStatsResponse.builder().totalLessons(teacherStatsRepository.countTotalLessons())
								.activeLessons(teacherStatsRepository.countActiveLessons())
								.activeStudents(teacherStatsRepository.countActiveStudents())
								.avgScore(teacherStatsRepository.calcAvgScore()).build())
				.subscribeOn(Schedulers.boundedElastic());
	}
}
