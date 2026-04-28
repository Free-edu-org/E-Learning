package pl.freeedu.backend.logging;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import pl.freeedu.backend.config.logging.TechnicalLoggingFilter;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CorrelationIdPropagationTest {

	@BeforeAll
	static void setup() {
		new TechnicalLoggingFilter().init();
	}

	@Test
	void shouldPropagateCorrelationIdToMDC() {
		String correlationId = UUID.randomUUID().toString();

		// In a real flow, TechnicalLoggingFilter puts the ID into the context.
		// Hooks.enableAutomaticContextPropagation() then makes it available in MDC
		// during chain execution.
		Mono<String> result = Mono.defer(() -> {
			String mdcValue = MDC.get(TechnicalLoggingFilter.CORRELATION_ID_MDC_KEY);
			return Mono.just(mdcValue != null ? mdcValue : "MISSING");
		}).contextWrite(ctx -> ctx.put(TechnicalLoggingFilter.CORRELATION_ID_MDC_KEY, correlationId));

		StepVerifier.create(result).assertNext(val -> assertThat(val).isEqualTo(correlationId)).verifyComplete();
	}
}
