package pl.freeedu.backend.lesson.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.dto.LessonAttachmentResponse;
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
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;
import pl.freeedu.backend.task.service.TaskHintImageService;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.usergroup.service.UserGroupPublicIdLookupService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
public class LessonService {

	private final LessonRepository lessonRepository;
	private final GroupHasLessonRepository groupHasLessonRepository;
	private final LessonMapper lessonMapper;
	private final SecurityService securityService;
	private final LessonAttachmentService lessonAttachmentService;
	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final SpeakTaskRepository speakTaskRepository;
	private final TaskHintImageService taskHintImageService;
	private final UserGroupPublicIdLookupService userGroupPublicIdLookupService;
	private final UserRepository userRepository;

	public LessonService(LessonRepository lessonRepository, GroupHasLessonRepository groupHasLessonRepository,
			LessonMapper lessonMapper, SecurityService securityService, LessonAttachmentService lessonAttachmentService,
			ChooseTaskRepository chooseTaskRepository, WriteTaskRepository writeTaskRepository,
			SpeakTaskRepository speakTaskRepository, ScatterTaskRepository scatterTaskRepository,
			UserGroupPublicIdLookupService userGroupPublicIdLookupService, UserRepository userRepository,
			TaskHintImageService taskHintImageService) {
		this.lessonRepository = lessonRepository;
		this.groupHasLessonRepository = groupHasLessonRepository;
		this.lessonMapper = lessonMapper;
		this.securityService = securityService;
		this.lessonAttachmentService = lessonAttachmentService;
		this.chooseTaskRepository = chooseTaskRepository;
		this.writeTaskRepository = writeTaskRepository;
		this.scatterTaskRepository = scatterTaskRepository;
		this.speakTaskRepository = speakTaskRepository;
		this.taskHintImageService = taskHintImageService;
		this.userGroupPublicIdLookupService = userGroupPublicIdLookupService;
		this.userRepository = userRepository;
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

			List<Integer> lessonIds = filtered.stream().map(Lesson::getId).collect(Collectors.toList());
			Map<Integer, List<LessonAttachmentResponse>> attachmentsMap = lessonAttachmentService
					.findByLessonIds(lessonIds);

			return filtered.stream().map(lesson -> {
				LessonResponse resp = lessonMapper.toResponse(lesson);
				resp.setGroups(groupHasLessonRepository.findGroupsForLesson(lesson.getId()));
				resp.setAttachments(attachmentsMap.getOrDefault(lesson.getId(), List.of()));
				return resp;
			}).collect(Collectors.toList());
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}

	public Mono<LessonResponse> createLesson(Mono<LessonRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(teacherId -> Mono.fromCallable(() -> {
					log.info("Creating new lesson. Teacher ID: {}", teacherId);
					User teacher = userRepository.findById(teacherId)
							.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
					Lesson lesson = Lesson.builder().title(request.getTitle()).theme(request.getTheme())
							.teacher(teacher).isActive(Boolean.FALSE).build();
					Lesson saved = lessonRepository.save(lesson);

					if (request.getGroupPublicIds() != null && !request.getGroupPublicIds().isEmpty()) {
						List<Integer> groupIds = resolveGroupIds(request.getGroupPublicIds());
						log.debug("Linking lesson ID: {} to groups: {}", saved.getId(), groupIds);
						List<GroupHasLesson> relations = groupIds.stream()
								.map(gid -> GroupHasLesson.builder().groupId(gid).lessonId(saved.getId()).build())
								.collect(Collectors.toList());
						groupHasLessonRepository.saveAll(relations);
					}

					LessonResponse resp = lessonMapper.toResponse(saved);
					resp.setGroups(groupHasLessonRepository.findGroupsForLesson(saved.getId()));
					resp.setAttachments(lessonAttachmentService.findByLessonId(saved.getId()));
					log.info("Lesson created successfully. Lesson ID: {}", saved.getId());
					return resp;
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<LessonResponse> updateLesson(Integer id, Mono<LessonRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Updating lesson ID: {}", id);
			return lessonRepository.findById(id).orElseThrow(() -> {
				log.warn("Update failed: Lesson with ID: {} not found", id);
				return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
			});
		}).subscribeOn(Schedulers.boundedElastic()).flatMap(lesson -> Mono.fromCallable(() -> {
			lesson.setTitle(request.getTitle());
			lesson.setTheme(request.getTheme());
			Lesson saved = lessonRepository.save(lesson);

			if (request.getGroupPublicIds() != null) {
				List<Integer> groupIds = resolveGroupIds(request.getGroupPublicIds());
				log.debug("Updating group links for lesson ID: {}. New groups: {}", saved.getId(), groupIds);
				groupHasLessonRepository.deleteByLessonId(saved.getId());
				List<GroupHasLesson> relations = groupIds.stream()
						.map(gid -> GroupHasLesson.builder().groupId(gid).lessonId(saved.getId()).build())
						.collect(Collectors.toList());
				groupHasLessonRepository.saveAll(relations);
			}

			Lesson reloaded = lessonRepository.findById(saved.getId()).orElse(saved);
			LessonResponse resp = lessonMapper.toResponse(reloaded);
			resp.setGroups(groupHasLessonRepository.findGroupsForLesson(saved.getId()));
			resp.setAttachments(lessonAttachmentService.findByLessonId(saved.getId()));
			log.info("Lesson ID: {} updated successfully", id);
			return resp;
		}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<Void> updateLessonStatus(Integer id, Mono<LessonStatusRequest> statusMono) {
		return statusMono.flatMap(statusReq -> Mono.fromCallable(() -> {
			log.info("Updating status for lesson ID: {}. Target status: isActive={}", id, statusReq.getIsActive());
			return lessonRepository.findById(id).orElseThrow(() -> {
				log.warn("Status update failed: Lesson with ID: {} not found", id);
				return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
			});
		}).subscribeOn(Schedulers.boundedElastic()).flatMap(lesson -> Mono.fromCallable(() -> {
			if (Boolean.TRUE.equals(statusReq.getIsActive()) && !hasAnyTask(id)) {
				log.warn("Status update failed: Cannot activate lesson ID: {} without any tasks", id);
				throw new LessonException(LessonErrorCode.LESSON_CANNOT_BE_ACTIVATED_WITHOUT_TASKS);
			}
			lesson.setIsActive(statusReq.getIsActive());
			lessonRepository.save(lesson);
			log.info("Status for lesson ID: {} updated successfully to isActive={}", id, statusReq.getIsActive());
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Mono<Void> deleteLesson(Integer id) {
		return Mono.fromCallable(() -> {
			log.info("Deleting lesson ID: {}", id);
			return lessonRepository.findById(id).orElseThrow(() -> {
				log.warn("Delete failed: Lesson with ID: {} not found", id);
				return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
			});
		}).subscribeOn(Schedulers.boundedElastic()).flatMap(lesson -> Mono.fromCallable(() -> {
			lessonAttachmentService.deleteAttachmentsByLessonId(id);
			taskHintImageService.deleteHintImageFilesByLessonId(id);
			groupHasLessonRepository.deleteByLessonId(id);
			lessonRepository.delete(lesson);
			log.info("Lesson ID: {} deleted successfully", id);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic())).then();
	}

	private boolean hasAnyTask(Integer lessonId) {
		return !chooseTaskRepository.findByLessonId(lessonId).isEmpty()
				|| !writeTaskRepository.findByLessonId(lessonId).isEmpty()
				|| !scatterTaskRepository.findByLessonId(lessonId).isEmpty()
				|| !speakTaskRepository.findByLessonId(lessonId).isEmpty();
	}

	private List<Integer> resolveGroupIds(List<String> groupPublicIds) {
		return groupPublicIds.stream().map(userGroupPublicIdLookupService::getRequiredInternalId).toList();
	}
}
