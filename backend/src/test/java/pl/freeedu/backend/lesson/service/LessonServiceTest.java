package pl.freeedu.backend.lesson.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.lesson.dto.LessonRequest;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.dto.LessonStatusRequest;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.mapper.LessonMapper;
import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.GroupHasLessonRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.service.SecurityService;import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonServiceTest {

	@Mock
	private LessonRepository lessonRepository;

	@Mock
	private GroupHasLessonRepository groupHasLessonRepository;

	@Mock
	private LessonMapper lessonMapper;

	@Mock
	private SecurityService securityService;

	@InjectMocks
	private LessonService lessonService;

	@Test
	void shouldReturnLessonsFilteredAndSorted() {
		// given
		Lesson lesson1 = Lesson.builder().id(1).title("A").isActive(true).createdAt(LocalDateTime.now().minusDays(1))
				.build();
		Lesson lesson2 = Lesson.builder().id(2).title("B").isActive(false).createdAt(LocalDateTime.now()).build();
		when(lessonRepository.findAll()).thenReturn(List.of(lesson1, lesson2));
		when(lessonMapper.toResponse(lesson1))
				.thenReturn(LessonResponse.builder().id(1).teacherAvatarUrl("preset:avatar_1").build());
		when(lessonMapper.toResponse(lesson2))
				.thenReturn(LessonResponse.builder().id(2).teacherAvatarUrl("preset:avatar_2").build());
		when(groupHasLessonRepository.findGroupsForLesson(1)).thenReturn(List.of());
		when(groupHasLessonRepository.findGroupsForLesson(2)).thenReturn(List.of());

		// when
		// (Aggregation of test cases below)

		// then

		// 1. Search A, Status true, sort name_asc
		// when
		Flux<LessonResponse> result1 = lessonService.getLessons("A", null, true, "name_asc");
		// then
		StepVerifier.create(result1.collectList()).assertNext(list -> {
			assertEquals(1, list.size());
			assertEquals(1, list.get(0).getId());
			assertEquals("preset:avatar_1", list.get(0).getTeacherAvatarUrl());
		}).verifyComplete();

		// 2. No filters, sort name_desc
		// when
		Flux<LessonResponse> result2 = lessonService.getLessons(null, null, null, "name_desc");
		// then
		StepVerifier.create(result2.collectList()).assertNext(list -> {
			assertEquals(2, list.size());
			assertEquals(2, list.get(0).getId());
			assertEquals(1, list.get(1).getId());
		}).verifyComplete();

		// 3. Filter by groupId
		// when
		when(groupHasLessonRepository.findLessonIdsByGroupId(10)).thenReturn(List.of(2));
		Flux<LessonResponse> result3 = lessonService.getLessons(null, 10, null, null);
		// then
		StepVerifier.create(result3.collectList()).assertNext(list -> {
			assertEquals(1, list.size());
			assertEquals(2, list.get(0).getId());
		}).verifyComplete();

		// 4. Sort by date_asc
		// when
		Flux<LessonResponse> result4 = lessonService.getLessons(null, null, null, "date_asc");
		// then
		StepVerifier.create(result4.collectList()).assertNext(list -> {
			assertEquals(2, list.size());
			assertEquals(1, list.get(0).getId());
			assertEquals(2, list.get(1).getId());
		}).verifyComplete();
	}

	@Test
	void shouldCreateLessonProperly() {
		// given
		LessonRequest request = LessonRequest.builder().title("Title").theme("Theme").groupIds(List.of(1, 2)).build();
		when(securityService.getCurrentUserId()).thenReturn(Mono.just(10));
		when(lessonRepository.save(any())).thenAnswer(inv -> {
			Lesson l = inv.getArgument(0);
			l.setId(99);
			return l;
		});
		when(lessonMapper.toResponse(any()))
				.thenReturn(LessonResponse.builder().id(99).teacherAvatarUrl("preset:avatar_1").build());
		when(groupHasLessonRepository.findGroupsForLesson(99)).thenReturn(List.of());

		// when
		Mono<LessonResponse> result = lessonService.createLesson(Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(99, resp.getId());
			assertEquals("preset:avatar_1", resp.getTeacherAvatarUrl());
			verify(groupHasLessonRepository, times(1)).saveAll(any());
		}).verifyComplete();
	}

	@Test
	void shouldUpdateLessonProperly() {
		// given
		LessonRequest request = LessonRequest.builder().title("New").theme("Theme").groupIds(List.of(3)).build();
		Lesson lesson = Lesson.builder().id(10).title("Old").build();

		when(lessonRepository.findById(10)).thenReturn(Optional.of(lesson));
		when(lessonRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(lessonMapper.toResponse(any())).thenReturn(LessonResponse.builder().id(10).build());

		// when
		Mono<LessonResponse> result = lessonService.updateLesson(10, Mono.just(request));

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals(10, resp.getId());
			verify(groupHasLessonRepository, times(1)).deleteByLessonId(10);
			verify(groupHasLessonRepository, times(1)).saveAll(any());
			assertEquals("New", lesson.getTitle());
		}).verifyComplete();
	}

	@Test
	void shouldReturnErrorWhenLessonNotFoundInUpdate() {
		// given
		when(lessonRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<LessonResponse> result = lessonService.updateLesson(1, Mono.just(LessonRequest.builder().build()));

		// then
		StepVerifier.create(result).expectError(LessonException.class).verify();
	}

	@Test
	void shouldUpdateLessonStatusProperly() {
		// given
		LessonStatusRequest req = new LessonStatusRequest();
		req.setIsActive(true);
		Lesson lesson = Lesson.builder().id(10).isActive(false).build();

		when(lessonRepository.findById(10)).thenReturn(Optional.of(lesson));
		when(lessonRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

		// when
		Mono<Void> result = lessonService.updateLessonStatus(10, Mono.just(req));

		// then
		StepVerifier.create(result).verifyComplete();
		assertTrue(lesson.getIsActive());
		verify(lessonRepository, times(1)).save(lesson);
	}

	@Test
	void shouldReturnErrorWhenLessonNotFoundInStatusUpdate() {
		// given
		when(lessonRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = lessonService.updateLessonStatus(1, Mono.just(new LessonStatusRequest()));

		// then
		StepVerifier.create(result).expectError(LessonException.class).verify();
	}

	@Test
	void shouldDeleteLessonProperly() {
		// given
		Lesson lesson = Lesson.builder().id(10).build();

		when(lessonRepository.findById(10)).thenReturn(Optional.of(lesson));

		// when
		Mono<Void> result = lessonService.deleteLesson(10);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(groupHasLessonRepository, times(1)).deleteByLessonId(10);
		verify(lessonRepository, times(1)).delete(lesson);
	}

	@Test
	void shouldReturnErrorWhenLessonNotFoundInDelete() {
		// given
		when(lessonRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = lessonService.deleteLesson(1);

		// then
		StepVerifier.create(result).expectError(LessonException.class).verify();
	}
}
