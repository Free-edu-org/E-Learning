package pl.freeedu.backend.security.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import org.springframework.context.annotation.Lazy;

@Service("securityService")
public class SecurityService {

	private final UserRepository userRepository;
	private final UserGroupRepository userGroupRepository;

	public SecurityService(@Lazy UserRepository userRepository, @Lazy UserGroupRepository userGroupRepository) {
		this.userRepository = userRepository;
		this.userGroupRepository = userGroupRepository;
	}

	public Mono<Integer> getCurrentUserId() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(java.util.Objects::nonNull).filter(Authentication::isAuthenticated)
				.map(Authentication::getPrincipal).ofType(CustomUserDetails.class).map(CustomUserDetails::getId);
	}

	public Mono<Boolean> isOwner(Integer targetUserId) {
		return getCurrentUserId().map(id -> id.equals(targetUserId)).defaultIfEmpty(false);
	}

	public Mono<Boolean> isStudent(Integer targetUserId) {
		return Mono
				.fromCallable(
						() -> userRepository.findById(targetUserId).map(u -> u.getRole() == Role.STUDENT).orElse(false))
				.subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Boolean> isGroupOwner(Integer groupId) {
		return getCurrentUserId().zipWith(Mono.fromCallable(() -> userGroupRepository.findById(groupId).orElse(null))
				.subscribeOn(Schedulers.boundedElastic())).map(tuple -> {
					Integer currentUserId = tuple.getT1();
					pl.freeedu.backend.usergroup.model.UserGroup group = tuple.getT2();
					return group != null && currentUserId.equals(group.getTeacherId());
				}).defaultIfEmpty(false);
	}

	public Mono<Boolean> isOwnerOrAdmin(Integer targetUserId) {
		return getCurrentUserId().map(id -> id.equals(targetUserId)).defaultIfEmpty(false).flatMap(isOwner -> {
			if (isOwner) {
				return Mono.just(true);
			}
			return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
					.filter(java.util.Objects::nonNull).filter(Authentication::isAuthenticated)
					.map(authentication -> authentication.getAuthorities().stream()
							.anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")))
					.defaultIfEmpty(false);
		});
	}

	public Mono<CustomUserDetails> getCurrentUser() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(java.util.Objects::nonNull).filter(Authentication::isAuthenticated)
				.map(Authentication::getPrincipal).filter(principal -> principal instanceof CustomUserDetails)
				.cast(CustomUserDetails.class);
	}
}
