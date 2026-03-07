package pl.freeedu.backend.security.jwt;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class JwtAuthenticationFilter implements WebFilter {

	private final JwtService jwtService;
	private final UserRepository userRepository;

	public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
		this.jwtService = jwtService;
		this.userRepository = userRepository;
	}

	@Override
	public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
		String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			return chain.filter(exchange);
		}

		String jwt = authHeader.substring(7);
		try {
			Integer userId = jwtService.extractUserId(jwt);
			if (userId != null) {
				return Mono.fromCallable(() -> userRepository.findById(userId)).subscribeOn(Schedulers.boundedElastic())
						.flatMap(optionalUser -> {
							if (optionalUser.isPresent() && jwtService.isTokenValid(jwt, optionalUser.get().getId())) {
								var user = optionalUser.get();
								var userDetails = new CustomUserDetails(user.getId(), user.getUsername(),
										user.getPassword(), user.getRole());
								var authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
										userDetails.getAuthorities());
								return chain.filter(exchange)
										.contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
							} else {
								return chain.filter(exchange);
							}
						});
			}
		} catch (Exception e) {
			// Token invalid or expired
			return chain.filter(exchange);
		}

		return chain.filter(exchange);
	}
}
