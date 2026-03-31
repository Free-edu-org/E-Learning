package pl.freeedu.backend.security.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import java.util.Objects;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Mono;
import org.springframework.context.annotation.Lazy;

@Service("securityService")
public class SecurityService {

	private final UserGroupRepository userGroupRepository;
	private final LessonRepository lessonRepository;
	private final UserInGroupRepository userInGroupRepository;

	public SecurityService(@Lazy UserGroupRepository userGroupRepository, @Lazy LessonRepository lessonRepository,
			@Lazy UserInGroupRepository userInGroupRepository) {
		this.userGroupRepository = userGroupRepository;
		this.lessonRepository = lessonRepository;
		this.userInGroupRepository = userInGroupRepository;
	}

	public Mono<Integer> getCurrentUserId() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(Objects::nonNull).filter(Authentication::isAuthenticated).map(Authentication::getPrincipal)
				.ofType(CustomUserDetails.class).map(CustomUserDetails::getId);
	}

	public boolean isOwner(Authentication authentication, Integer targetUserId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		return userDetails.getId().equals(targetUserId);
	}

	public boolean isGroupOwner(Authentication authentication, Integer groupId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		return userGroupRepository.findById(groupId).map(group -> userDetails.getId().equals(group.getTeacherId()))
				.orElse(false);
	}

	public boolean isLessonOwner(Authentication authentication, Integer lessonId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		return lessonRepository.findById(lessonId)
				.map(lesson -> lesson.getTeacher() != null && userDetails.getId().equals(lesson.getTeacher().getId()))
				.orElse(false);
	}

	public boolean isAdmin(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		return authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
	}

	public boolean isTeacherOfStudent(Authentication authentication, Integer studentId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		if (userDetails.getRole() != Role.TEACHER) {
			return false;
		}

		return userInGroupRepository.isStudentInTeachersGroup(studentId, userDetails.getId());
	}

	public boolean hasStudentAccessToLesson(Authentication authentication, Integer lessonId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		return userInGroupRepository.hasAccessToLesson(userDetails.getId(), lessonId);
	}

	public Mono<CustomUserDetails> getCurrentUser() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(Objects::nonNull).filter(Authentication::isAuthenticated).map(Authentication::getPrincipal)
				.filter(principal -> principal instanceof CustomUserDetails).cast(CustomUserDetails.class);
	}
}
