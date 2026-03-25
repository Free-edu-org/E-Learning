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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.*;
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
			// Pobranie wszystkich lekcji, a następnie filtr i sort w Javie.
			// To podejście proste i zgodne ze stylem projektu; można zmienić na zapytanie
			// DB.
			List<Lesson> all = lessonRepository.findAll();

			// Filtry
			Stream<Lesson> stream = all.stream();
			if (search != null && !search.isBlank()) {
				String s = search.toLowerCase();
				stream = stream.filter(l -> (l.getTitle() != null && l.getTitle().toLowerCase().contains(s))
						|| (l.getTheme() != null && l.getTheme().toLowerCase().contains(s)));
			}
			if (status != null) {
				stream = stream.filter(l -> Objects.equals(status, l.getIsActive()));
				// simpler: stream = stream.filter(l -> status.equals(l.getIsActive()));
			}
			List<Lesson> filtered = stream.collect(Collectors.toList());

			// Jeśli groupId podane — tylko lessons powiązane z daną grupą
			if (groupId != null) {
				List<Long> lessonIdsForGroup = groupHasLessonRepository.findLessonIdsByGroupId(groupId);
				filtered = filtered.stream().filter(l -> lessonIdsForGroup.contains(l.getId()))
						.collect(Collectors.toList());
			}

			// Sortowanie
			Comparator<Lesson> comparator = Comparator.comparing(Lesson::getCreatedAt,
					Comparator.nullsLast(Comparator.naturalOrder()));
			if ("date_desc".equalsIgnoreCase(sort) || sort == null) {
				comparator = Comparator.comparing(Lesson::getCreatedAt,
						Comparator.nullsLast(Comparator.reverseOrder()));
			} else if ("date_asc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getCreatedAt,
						Comparator.nullsLast(Comparator.naturalOrder()));
			} else if ("name_asc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getTitle,
						Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
			} else if ("name_desc".equalsIgnoreCase(sort)) {
				comparator = Comparator.comparing(Lesson::getTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
						.reversed();
			}
			filtered.sort(comparator);

			return filtered;
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable)
				.flatMap(lesson -> Mono.fromCallable(() -> {
					LessonResponse resp = lessonMapper.toResponse(lesson);
					// pobierz grupy i ustaw
					List<GroupDto> groups = groupHasLessonRepository.findGroupsForLesson(lesson.getId());
					resp.setGroups(groups);
					return resp;
				}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<LessonResponse> createLesson(Mono<LessonRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
					Lesson l = Lesson.builder().title(request.getTitle()).theme(request.getTheme()).teacherId(teacherId)
							.isActive(Boolean.FALSE) // default false as spec
							.build();
					Lesson saved = lessonRepository.save(l);

					// przypisz do grup (opcjonalnie)
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
		return requestMono.flatMap(
				request -> securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
					Lesson lesson = lessonRepository.findById(id)
							.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
					if (!Objects.equals(lesson.getTeacherId(), currentUserId)) {
						throw new LessonException(LessonErrorCode.NOT_LESSON_OWNER);
					}
					lesson.setTitle(request.getTitle());
					lesson.setTheme(request.getTheme());
					Lesson saved = lessonRepository.save(lesson);

					// opcjonalna zmiana relacji grup: jeżeli request.groupIds != null -> odśwież
					// relacje
					if (request.getGroupIds() != null) {
						// usuń obecne relacje i zapisz nowe
						groupHasLessonRepository.deleteByLessonId(saved.getId());
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

	public Mono<Void> updateLessonStatus(Integer id, Mono<LessonStatusRequest> statusMono) {
		return statusMono.flatMap(
				statusReq -> securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
					Lesson lesson = lessonRepository.findById(id)
							.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
					if (!Objects.equals(lesson.getTeacherId(), currentUserId)) {
						throw new LessonException(LessonErrorCode.NOT_LESSON_OWNER);
					}
					lesson.setIsActive(statusReq.getIsActive());
					lessonRepository.save(lesson);
					return (Void) null;
				}).subscribeOn(Schedulers.boundedElastic()).then()));
	}

	public Mono<Void> deleteLesson(Integer id) {
		return securityService.getCurrentUserId().flatMap(currentUserId -> Mono.fromCallable(() -> {
			Lesson lesson = lessonRepository.findById(id)
					.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
			if (!Objects.equals(lesson.getTeacherId(), currentUserId)) {
				throw new LessonException(LessonErrorCode.NOT_LESSON_OWNER);
			}
			// kasowanie kaskadowe z tabeli group_has_lesson powinno być zapewnione przez
			// migracje DB,
			// ale usuwamy explicite relacje tutaj, żeby być bezpiecznym:
			groupHasLessonRepository.deleteByLessonId(id);
			lessonRepository.delete(lesson);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then());
	}
}
