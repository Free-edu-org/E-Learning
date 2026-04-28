package pl.freeedu.backend.config.logging;

import io.micrometer.context.ContextRegistry;
import io.micrometer.context.ThreadLocalAccessor;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TechnicalLoggingFilter implements WebFilter {

	public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
	public static final String CORRELATION_ID_MDC_KEY = "correlationId";
	private static final AtomicBoolean INITIALIZED = new AtomicBoolean(false);

	@PostConstruct
	public void init() {
		if (INITIALIZED.getAndSet(true)) {
			return;
		}
		// Enable automatic context propagation to MDC for Reactor (Spring Boot 3.2+)
		Hooks.enableAutomaticContextPropagation();

		// Register MDC accessor for micrometer-context-propagation
		ContextRegistry.getInstance().registerThreadLocalAccessor(new ThreadLocalAccessor<String>() {
			@Override
			public Object key() {
				return CORRELATION_ID_MDC_KEY;
			}

			@Override
			public String getValue() {
				return MDC.get(CORRELATION_ID_MDC_KEY);
			}

			@Override
			public void setValue(String value) {
				MDC.put(CORRELATION_ID_MDC_KEY, value);
			}

			@Override
			public void reset() {
				MDC.remove(CORRELATION_ID_MDC_KEY);
			}
		});
	}

	@Override
	public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
		ServerHttpRequest request = exchange.getRequest();

		String correlationId = request.getHeaders().getFirst(CORRELATION_ID_HEADER);
		if (correlationId == null || correlationId.isBlank() || !isValidCorrelationId(correlationId)) {
			correlationId = UUID.randomUUID().toString();
		}

		String finalCorrelationId = correlationId;
		exchange.getResponse().getHeaders().set(CORRELATION_ID_HEADER, finalCorrelationId);

		return chain.filter(exchange)
				// Put correlationId into the reactive context so it propagates to MDC via Hooks
				.contextWrite(ctx -> ctx.put(CORRELATION_ID_MDC_KEY, finalCorrelationId));
	}

	private boolean isValidCorrelationId(String id) {
		// Allow alphanumeric, hyphens and underscores, length 1-64
		// This prevents CRLF injection and excessive log size
		return id.length() <= 64 && id.matches("^[a-zA-Z0-9\\-_]+$");
	}

}
