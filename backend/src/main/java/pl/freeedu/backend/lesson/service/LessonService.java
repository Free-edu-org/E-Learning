package pl.freeedu.backend.lesson.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.dto.GroupDto;
import pl.freeedu.backend.lesson.dto.LessonRequest;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.dto.LessonStatusRequest;
import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.model.GroupHasLesson;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.user.model.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class LessonService {

	private final LessonRepository lessonRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final LessonMapper lessonMapper;
	private final SecurityService securityService;

	public LessonService(LessonRepository lessonRepository, GroupHasLessonRepository groupHasLessonRepository,
			LessonMapper lessonMapper, SecurityService securityService) {
		this.lessonRepository = lessonRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.lessonMapper = lessonMapper;
		this.securityService = securityService;
	}

	public Flux<LessonResponse> getLessons(String search, Integer groupId, Boolean status, String sort) {
		return Mono.fromCallable(() -> {
			List<Lesson> all = lessonRepository.findAll();

			Stream<Lesson> stream = all.stream();
			if (search != null && !search.isBlank()) {
				String s = search.toLowerCase();
				stream = stream.filter(l -> (l.getTitle() != null && l.getTitle().toLowerCase().contains(s))
						|| (l.getTheme() != null && l.getTheme().toLowerCase().contains(s)));
			}
			if (status != null) {
				stream = stream.filter(l -> Objects.equals(status, l.getIsActive()));
			}
			List<Lesson> filtered = stream.collect(Collectors.toList());

			if (groupId != null) {
				List<Integer> lessonIdsForGroup = groupHasLessonRepository.findLessonIdsByGroupId(groupId);
				filtered = filtered.stream().filter(l -> lessonIdsForGroup.contains(l.getId()))
						.collect(Collectors.toList());
			}

			Comparator<Lesson> comparator = Comparator.comparing(Lesson::getCreatedAt,
					Comparator.nullsLast(Comparator.reverseOrder()));
			if ("date_asc".equalsIgnoreCase(sort) || "createdAt:asc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getCreatedAt,
						Comparator.nullsLast(Comparator.naturalOrder()));
			} else if ("name_asc".equalsIgnoreCase(sort) || "title:asc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getTitle,
						Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
			} else if ("name_desc".equalsIgnoreCase(sort) || "title:desc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
						.reversed();
			} else if ("createdAt:desc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getCreatedAt,
						Comparator.nullsLast(Comparator.reverseOrder()));
			}
			filtered.sort(comparator);

			return filtered;
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable)
				.flatMap(lesson -> Mono.fromCallable(() -> {
					LessonResponse resp = lessonMapper.toResponse(lesson);
					List<GroupDto> groups = groupHasLessonRepository.findGroupsForLesson(lesson.getId());
					resp.setGroups(groups);
					return resp;
				}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<LessonResponse> createLesson(Mono<LessonRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
					User teacherRef = User.builder().id(teacherId).build();
					Lesson lesson = Lesson.builder().title(request.getTitle()).theme(request.getTheme())
							.teacher(teacherRef).isActive(Boolean.FALSE).build();
					Lesson saved = lessonRepository.save(lesson);

					if (request.getGroupIds() != null && !request.getGroupIds().isEmpty()) {
						List<GroupHasLesson> relations = request.getGroupIds().stream()
								.map(gid -> GroupHasLesson.builder().groupId(gid).lessonId(saved.getId()).build())
								.collect(Collectors.toList());
						groupHasLessonRepository.saveAll(relations);
					}

					LessonResponse resp = lessonMapper.toResponse(saved);
					resp.setGroups(groupHasLessonRepository.findGroupsForLesson(saved.getId()));
					return resp;
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<LessonResponse> updateLesson(Integer id, Mono<LessonRequest> requestMono) {
		return requestMono.flatMap(request -> Mono
				.fromCallable(() -> lessonRepository.findById(id)
						.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND)))
				.subscribeOn(Schedulers.boundedElastic()).flatMap(lesson -> Mono.fromCallable(() -> {
					lesson.setTitle(request.getTitle());
					lesson.setTheme(request.getTheme());
					Lesson saved = lessonRepository.save(lesson);

					if (request.getGroupIds() != null) {
						groupHasLessonRepository.deleteByLessonId(saved.getId());
						List<GroupHasLesson> relations = request.getGroupIds().stream()
								.map(gid -> GroupHasLesson.builder().groupId(gid).lessonId(saved.getId()).build())
								.collect(Collectors.toList());
						groupHasLessonRepository.saveAll(relations);
					}

					Lesson reloaded = lessonRepository.findById(saved.getId()).orElse(saved);
					LessonResponse resp = lessonMapper.toResponse(reloaded);
					resp.setGroups(groupHasLessonRepository.findGroupsForLesson(saved.getId()));
					return resp;
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<Void> updateLessonStatus(Integer id, Mono<LessonStatusRequest> statusMono) {
		return statusMono.flatMap(statusReq -> Mono
				.fromCallable(() -> lessonRepository.findById(id)
						.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND)))
				.subscribeOn(Schedulers.boundedElastic()).flatMap(lesson -> Mono.fromCallable(() -> {
					lesson.setIsActive(statusReq.getIsActive());
					lessonRepository.save(lesson);
					return (Void) null;
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<Void> deleteLesson(Integer id) {
		return Mono
				.fromCallable(() -> lessonRepository.findById(id)
						.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND)))
				.subscribeOn(Schedulers.boundedElastic()).flatMap(lesson -> Mono.fromCallable(() -> {
					groupHasLessonRepository.deleteByLessonId(id);
					lessonRepository.delete(lesson);
					return (Void) null;
				}).subscribeOn(Schedulers.boundedElastic())).then();
	}
}
