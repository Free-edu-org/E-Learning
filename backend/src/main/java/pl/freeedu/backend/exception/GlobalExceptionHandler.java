package pl.freeedu.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import pl.freeedu.backend.auth.exception.AuthException;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(AuthException.class)
	public Mono<ProblemDetail> handleAuthException(AuthException ex, ServerWebExchange exchange) {
		return buildProblemDetail(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getErrorCode().name(), exchange);
	}

	@ExceptionHandler(WebExchangeBindException.class)
	public Mono<ProblemDetail> handleValidationException(WebExchangeBindException ex, ServerWebExchange exchange) {
		String errors = ex.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getField() + ": " + error.getDefaultMessage()).collect(Collectors.joining(", "));
		return buildProblemDetail(HttpStatus.BAD_REQUEST, "Validation failed: " + errors,
				ErrorCode.VALIDATION_FAILED.name(), exchange);
	}

	@ExceptionHandler(Exception.class)
	public Mono<ProblemDetail> handleGenericException(Exception ex, ServerWebExchange exchange) {
		return buildProblemDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred",
				ErrorCode.INTERNAL_SERVER_ERROR.name(), exchange);
	}

	private Mono<ProblemDetail> buildProblemDetail(HttpStatus status, String message, String code,
			ServerWebExchange exchange) {
		ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, message);
		problemDetail.setTitle(status.getReasonPhrase());
		problemDetail.setProperty("code", code);
		problemDetail.setType(URI.create(exchange.getRequest().getPath().value()));
		return Mono.just(problemDetail);
	}
}
