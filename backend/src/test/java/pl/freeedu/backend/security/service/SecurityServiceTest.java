package pl.freeedu.backend.security.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;

import pl.freeedu.backend.lesson.model.Lesson;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class SecurityServiceTest {

	@Mock
	private UserGroupRepository userGroupRepository;

	@Mock
	private LessonRepository lessonRepository;

	@Mock
	private UserInGroupRepository userInGroupRepository;

	@InjectMocks
	private SecurityService securityService;

	@Test
	void shouldReturnTrueForGroupOwnerWhenTeacherOwnsGroup() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "teacher", "pwd", Role.TEACHER);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());
		UserGroup group = UserGroup.builder().id(7).publicId("group-public-id").teacherId(10).build();
		when(userGroupRepository.findByPublicId("group-public-id")).thenReturn(Optional.of(group));

		// when
		boolean result = securityService.isGroupOwner(authentication, "group-public-id");

		// then
		assertTrue(result);
	}

	@Test
	void shouldReturnFalseForGroupOwnerWhenTeacherDoesNotOwnGroup() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "teacher", "pwd", Role.TEACHER);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());
		UserGroup group = UserGroup.builder().id(7).publicId("group-public-id").teacherId(99).build();
		when(userGroupRepository.findByPublicId("group-public-id")).thenReturn(Optional.of(group));

		// when
		boolean result = securityService.isGroupOwner(authentication, "group-public-id");

		// then
		assertFalse(result);
	}

	@Test
	void shouldReturnTrueForLessonOwnerWhenTeacherOwnsLesson() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "teacher", "pwd", Role.TEACHER);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());
		Lesson lesson = Lesson.builder().id(5).publicId("lesson-5").teacher(User.builder().id(10).build()).build();
		when(lessonRepository.findByPublicId("lesson-5")).thenReturn(Optional.of(lesson));

		// when
		boolean result = securityService.isLessonOwner(authentication, "lesson-5");

		// then
		assertTrue(result);
	}

	@Test
	void shouldReturnFalseWhenTeacherRoleCheckForStudentOwnershipIsNotTeacher() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "student", "pwd", Role.STUDENT);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());

		// when
		boolean result = securityService.isTeacherOfStudent(authentication, 50);

		// then
		assertFalse(result);
	}

	@Test
	void shouldReturnTrueForAdminRoleWhenAuthorityContainsRoleAdmin() {
		// given
		CustomUserDetails principal = new CustomUserDetails(1, "admin", "pwd", Role.ADMIN);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());

		// when
		boolean result = securityService.isAdmin(authentication);

		// then
		assertTrue(result);
	}

	@Test
	void shouldReturnCurrentUserIdFromContext() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "user", "pwd", Role.STUDENT);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());
		SecurityContext context = new SecurityContextImpl(authentication);

		// when
		Mono<Integer> result = securityService.getCurrentUserId()
				.contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(context)));

		// then
		StepVerifier.create(result).expectNext(10).verifyComplete();
	}

	@Test
	void shouldReturnCurrentUserFromContext() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "user", "pwd", Role.STUDENT);
		Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null,
				principal.getAuthorities());
		SecurityContext context = new SecurityContextImpl(authentication);

		// when
		Mono<CustomUserDetails> result = securityService.getCurrentUser()
				.contextWrite(ReactiveSecurityContextHolder.withSecurityContext(Mono.just(context)));

		// then
		StepVerifier.create(result).assertNext(u -> assertEquals(10, u.getId())).verifyComplete();
	}

	@Test
	void shouldCheckOwnerCorrectly() {
		// given
		CustomUserDetails principal = new CustomUserDetails(10, "user", "p", Role.STUDENT);
		Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

		// when
		boolean result1 = securityService.isOwner(auth, 10);
		boolean result2 = securityService.isOwner(auth, 99);
		boolean result3 = securityService.isOwner(null, 10);

		// then
		assertTrue(result1);
		assertFalse(result2);
		assertFalse(result3);
	}

	@Test
	void shouldCheckTeacherOfStudentCorrectly() {
		// given
		CustomUserDetails teacher = new CustomUserDetails(1, "t", "p", Role.TEACHER);
		Authentication auth = new UsernamePasswordAuthenticationToken(teacher, null, teacher.getAuthorities());

		// when
		when(userInGroupRepository.isStudentInTeachersGroup(10, 1)).thenReturn(true);
		boolean result1 = securityService.isTeacherOfStudent(auth, 10);

		when(userInGroupRepository.isStudentInTeachersGroup(11, 1)).thenReturn(false);
		boolean result2 = securityService.isTeacherOfStudent(auth, 11);

		// then
		assertTrue(result1);
		assertFalse(result2);
	}

	@Test
	void shouldCheckStudentAccessToLessonCorrectly() {
		// given
		CustomUserDetails student = new CustomUserDetails(10, "s", "p", Role.STUDENT);
		Authentication auth = new UsernamePasswordAuthenticationToken(student, null, student.getAuthorities());
		Lesson lesson = Lesson.builder().id(5).publicId("lesson-5").build();

		// when
		when(lessonRepository.findByPublicId("lesson-5")).thenReturn(Optional.of(lesson));
		when(userInGroupRepository.hasAccessToLesson(10, 5)).thenReturn(true);
		boolean result = securityService.hasStudentAccessToLesson(auth, "lesson-5");

		// then
		assertTrue(result);
	}

	private void assertEquals(Object expected, Object actual) {
		if (expected == null && actual == null)
			return;
		if (expected != null && expected.equals(actual))
			return;
		throw new AssertionError("Expected: " + expected + ", Actual: " + actual);
	}
}
