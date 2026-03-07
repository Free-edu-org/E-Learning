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
						.flatMap(optionalUser -> optionalUser.map(Mono::just).orElseGet(Mono::empty))
						.filter(user -> jwtService.isTokenValid(jwt, user.getId())).map(user -> {
							var userDetails = new CustomUserDetails(user.getId(), user.getUsername(),
									user.getPassword(), user.getRole());
							return new UsernamePasswordAuthenticationToken(userDetails, null,
									userDetails.getAuthorities());
						})
						.flatMap(authentication -> chain.filter(exchange)
								.contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication))
								.then(Mono.just(true)))
						.switchIfEmpty(Mono.defer(() -> chain.filter(exchange).then(Mono.just(true)))).then();
			}
		} catch (Exception e) {
			// Token invalid or expired
			return chain.filter(exchange);
		}

		return chain.filter(exchange);
	}
}
