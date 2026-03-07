package pl.freeedu.backend.security.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import reactor.core.publisher.Mono;

@Component
public class SecurityUtils {

	public static Mono<Integer> getCurrentUserId() {
		return ReactiveSecurityContextHolder.getContext().map(SecurityContext::getAuthentication)
				.filter(Authentication::isAuthenticated).map(Authentication::getPrincipal)
				.ofType(CustomUserDetails.class).map(CustomUserDetails::getId);
	}
}
