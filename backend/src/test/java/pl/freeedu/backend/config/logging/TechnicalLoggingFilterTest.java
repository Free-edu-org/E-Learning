package pl.freeedu.backend.config.logging;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static pl.freeedu.backend.config.logging.TechnicalLoggingFilter.CORRELATION_ID_HEADER;

class TechnicalLoggingFilterTest {

	private TechnicalLoggingFilter filter;
	private WebFilterChain filterChain;

	@BeforeEach
	void setUp() {
		filter = new TechnicalLoggingFilter();
		filterChain = mock(WebFilterChain.class);
		when(filterChain.filter(any())).thenReturn(Mono.empty());
	}

	@Test
	void shouldPreserveValidCorrelationId() {
		String validId = "custom-id-123";
		MockServerWebExchange exchange = MockServerWebExchange
				.from(MockServerHttpRequest.get("/test").header(CORRELATION_ID_HEADER, validId).build());

		StepVerifier.create(filter.filter(exchange, filterChain)).verifyComplete();

		String responseId = exchange.getResponse().getHeaders().getFirst(CORRELATION_ID_HEADER);
		assertThat(responseId).isEqualTo(validId);
	}

	@Test
	void shouldGenerateNewIdIfHeaderIsMissing() {
		MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/test").build());

		StepVerifier.create(filter.filter(exchange, filterChain)).verifyComplete();

		String responseId = exchange.getResponse().getHeaders().getFirst(CORRELATION_ID_HEADER);
		assertThat(responseId).isNotNull();
		assertThat(UUID.fromString(responseId)).isNotNull(); // Check if it's a valid UUID
	}

	@Test
	void shouldReplaceInvalidCorrelationId() {
		String invalidId = "bad id with spaces and <script>";
		MockServerWebExchange exchange = MockServerWebExchange
				.from(MockServerHttpRequest.get("/test").header(CORRELATION_ID_HEADER, invalidId).build());

		StepVerifier.create(filter.filter(exchange, filterChain)).verifyComplete();

		String responseId = exchange.getResponse().getHeaders().getFirst(CORRELATION_ID_HEADER);
		assertThat(responseId).isNotNull();
		assertThat(responseId).isNotEqualTo(invalidId);
		assertThat(UUID.fromString(responseId)).isNotNull();
	}

	@Test
	void shouldReplaceTooLongCorrelationId() {
		String longId = "a".repeat(65);
		MockServerWebExchange exchange = MockServerWebExchange
				.from(MockServerHttpRequest.get("/test").header(CORRELATION_ID_HEADER, longId).build());

		StepVerifier.create(filter.filter(exchange, filterChain)).verifyComplete();

		String responseId = exchange.getResponse().getHeaders().getFirst(CORRELATION_ID_HEADER);
		assertThat(responseId).hasSize(36); // UUID size
		assertThat(responseId).isNotEqualTo(longId);
	}
}
