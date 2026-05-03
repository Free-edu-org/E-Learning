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
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import org.springframework.context.annotation.Lazy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service("securityService")
public class SecurityService {

	private final UserGroupRepository userGroupRepository;
	private final LessonRepository lessonRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final UserRepository userRepository;

	public SecurityService(@Lazy UserGroupRepository userGroupRepository, @Lazy LessonRepository lessonRepository,
			@Lazy UserInGroupRepository userInGroupRepository, @Lazy UserRepository userRepository) {
		this.userGroupRepository = userGroupRepository;
		this.lessonRepository = lessonRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.userRepository = userRepository;
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
		boolean result = userDetails.getId().equals(targetUserId);
		if (!result) {
			log.debug("Ownership check failed: Principal ID: {} is not the owner of target user ID: {}",
					userDetails.getId(), targetUserId);
		}
		return result;
	}

	public boolean isOwnerByPublicId(Authentication authentication, String publicId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		boolean result = userRepository.findByPublicId(publicId).map(user -> userDetails.getId().equals(user.getId()))
				.orElse(false);
		if (!result) {
			log.debug("Ownership check failed: Principal ID: {} is not the owner of target user public ID: {}",
					userDetails.getId(), publicId);
		}
		return result;
	}

	public boolean isGroupOwner(Authentication authentication, String groupPublicId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		boolean result = userGroupRepository.findByPublicId(groupPublicId)
				.map(group -> userDetails.getId().equals(group.getTeacherId())).orElse(false);
		if (!result) {
			log.debug("Group ownership check failed: Principal ID: {} is not the owner of group public ID: {}",
					userDetails.getId(), groupPublicId);
		}
		return result;
	}

	public boolean isLessonOwner(Authentication authentication, String lessonPublicId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		boolean result = lessonRepository.findByPublicId(lessonPublicId)
				.map(lesson -> lesson.getTeacher() != null && userDetails.getId().equals(lesson.getTeacher().getId()))
				.orElse(false);
		if (!result) {
			log.debug("Lesson ownership check failed: Principal ID: {} is not the owner of lesson public ID: {}",
					userDetails.getId(), lessonPublicId);
		}
		return result;
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

	public boolean isTeacherOfStudentByPublicId(Authentication authentication, String studentPublicId) {
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

		return userRepository.findByPublicId(studentPublicId)
				.map(student -> userInGroupRepository.isStudentInTeachersGroup(student.getId(), userDetails.getId()))
				.orElse(false);
	}

	public boolean hasStudentAccessToLesson(Authentication authentication, String lessonPublicId) {
		if (authentication == null || !authentication.isAuthenticated()) {
			return false;
		}
		Object principal = authentication.getPrincipal();
		if (!(principal instanceof CustomUserDetails userDetails)) {
			return false;
		}
		boolean result = lessonRepository.findByPublicId(lessonPublicId)
				.map(lesson -> userInGroupRepository.hasAccessToLesson(userDetails.getId(), lesson.getId()))
				.orElse(false);
		if (!result) {
			log.debug("Student access check failed: Student ID: {} has no access to lesson public ID: {}",
					userDetails.getId(), lessonPublicId);
		}
		return result;
	}

	public Mono<CustomUserDetails> getCurrentUser() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(Objects::nonNull).filter(Authentication::isAuthenticated).map(Authentication::getPrincipal)
				.filter(principal -> principal instanceof CustomUserDetails).cast(CustomUserDetails.class);
	}
}
