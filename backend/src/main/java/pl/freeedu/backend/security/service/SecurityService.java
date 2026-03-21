package pl.freeedu.backend.security.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import reactor.core.publisher.Mono;

@Service("securityService")
public class SecurityService {

	public Mono<Integer> getCurrentUserId() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(java.util.Objects::nonNull).filter(Authentication::isAuthenticated)
				.map(Authentication::getPrincipal).ofType(CustomUserDetails.class).map(CustomUserDetails::getId);
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
