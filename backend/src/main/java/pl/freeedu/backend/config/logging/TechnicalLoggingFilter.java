package pl.freeedu.backend.config.logging;

import io.micrometer.context.ContextRegistry;
import io.micrometer.context.ThreadLocalAccessor;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Hooks;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TechnicalLoggingFilter implements WebFilter {

	public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
	public static final String CORRELATION_ID_MDC_KEY = "correlationId";

	@PostConstruct
	public void init() {
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
		long startTime = System.currentTimeMillis();
		ServerHttpRequest request = exchange.getRequest();

		String correlationId = request.getHeaders().getFirst(CORRELATION_ID_HEADER);
		if (correlationId == null || correlationId.isBlank()) {
			correlationId = UUID.randomUUID().toString();
		}

		String finalCorrelationId = correlationId;
		exchange.getResponse().getHeaders().add(CORRELATION_ID_HEADER, finalCorrelationId);

		return chain.filter(exchange)
				// Put correlationId into the reactive context so it propagates to MDC via Hooks
				.contextWrite(ctx -> ctx.put(CORRELATION_ID_MDC_KEY, finalCorrelationId))
				.doFinally(signalType -> logRequest(exchange, finalCorrelationId, startTime));
	}

	private void logRequest(ServerWebExchange exchange, String correlationId, long startTime) {
		long duration = System.currentTimeMillis() - startTime;
		ServerHttpRequest request = exchange.getRequest();
		ServerHttpResponse response = exchange.getResponse();

		String method = request.getMethod().name();
		String path = request.getPath().value();
		int status = response.getStatusCode() != null ? response.getStatusCode().value() : 0;
		String clientIp = getClientIp(request);
		String userAgent = request.getHeaders().getFirst(HttpHeaders.USER_AGENT);

		// Manually set MDC for this log entry just in case the context propagation
		// didn't reach this point yet
		try (var _ = MDC.putCloseable(CORRELATION_ID_MDC_KEY, correlationId)) {
			log.info("HTTP {} {} | Status: {} | Duration: {}ms | IP: {} | UA: {}", method, path, status, duration,
					clientIp, userAgent);
		}
	}

	private String getClientIp(ServerHttpRequest request) {
		String ip = "unknown";
		String xfHeader = request.getHeaders().getFirst("X-Forwarded-For");
		if (xfHeader != null && !xfHeader.isBlank()) {
			ip = xfHeader.split(",")[0].trim();
		} else if (request.getRemoteAddress() != null) {
			ip = request.getRemoteAddress().getAddress().getHostAddress();
		}
		return anonymizeIp(ip);
	}

	private String anonymizeIp(String ip) {
		if (ip == null || "unknown".equals(ip) || "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
			return ip;
		}
		if (ip.contains(".")) {
			// IPv4: 192.168.1.1 -> 192.168.1.xxx
			int lastDot = ip.lastIndexOf('.');
			return (lastDot > 0) ? ip.substring(0, lastDot) + ".xxx" : ip;
		} else if (ip.contains(":")) {
			// IPv6: simple mask
			int lastColon = ip.lastIndexOf(':');
			return (lastColon > 0) ? ip.substring(0, lastColon) + ":xxxx" : ip;
		}
		return ip;
	}
}
