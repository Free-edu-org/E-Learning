package pl.freeedu.backend.teacher.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.teacher.dto.TeacherStatsResponse;
import pl.freeedu.backend.teacher.repository.TeacherStatsRepository;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.user.service.UserMapper;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.service.UserGroupService;

@Service
public class TeacherService {

	private final TeacherStatsRepository teacherStatsRepository;
	private final LessonRepository lessonRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final LessonMapper lessonMapper;
	private final SecurityService securityService;
	private final UserGroupService userGroupService;
	private final UserRepository userRepository;
	private final UserMapper userMapper;

	public TeacherService(TeacherStatsRepository teacherStatsRepository, LessonRepository lessonRepository,
			GroupHasLessonRepository groupHasLessonRepository, LessonMapper lessonMapper,
			SecurityService securityService, UserGroupService userGroupService, UserRepository userRepository,
			UserMapper userMapper) {
		this.teacherStatsRepository = teacherStatsRepository;
		this.lessonRepository = lessonRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.lessonMapper = lessonMapper;
		this.securityService = securityService;
		this.userGroupService = userGroupService;
		this.userRepository = userRepository;
		this.userMapper = userMapper;
	}

	public Mono<TeacherStatsResponse> getStats() {
		return securityService.getCurrentUserId()
				.flatMap(teacherId -> Mono
						.fromCallable(() -> TeacherStatsResponse.builder()
								.totalLessons(teacherStatsRepository.countTotalLessons(teacherId))
								.activeLessons(teacherStatsRepository.countActiveLessons(teacherId))
								.activeStudents(teacherStatsRepository.countActiveStudents(teacherId))
								.avgScore(teacherStatsRepository.calcAvgScore(teacherId)).build())
						.subscribeOn(Schedulers.boundedElastic()));
	}

	public Flux<LessonResponse> getLessons() {
		return securityService.getCurrentUserId().subscribeOn(Schedulers.boundedElastic())
				.flatMapMany(teacherId -> Flux.fromIterable(lessonRepository.findByTeacher_Id(teacherId)))
				.flatMap(lesson -> Mono.fromCallable(() -> {
					LessonResponse resp = lessonMapper.toResponse(lesson);
					resp.setGroups(groupHasLessonRepository.findGroupsForLesson(lesson.getId()));
					return resp;
				}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Flux<UserGroupResponse> getMyGroups() {
		return securityService.getCurrentUserId().subscribeOn(Schedulers.boundedElastic())
				.flatMapMany(userGroupService::getGroupsByTeacherId);
	}

	public Flux<UserResponse> getMyStudents() {
		return securityService.getCurrentUserId().flatMapMany(teacherId -> Mono.fromCallable(() -> {
			return userRepository.findByGroupsTeacherIdAndRole(teacherId, Role.STUDENT).stream()
					.map(userMapper::toUserResponse).toList();
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable));
	}
}
