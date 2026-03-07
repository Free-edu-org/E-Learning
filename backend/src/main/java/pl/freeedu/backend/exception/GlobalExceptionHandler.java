package pl.freeedu.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import pl.freeedu.backend.auth.exception.AuthException;
import pl.freeedu.backend.user.exception.UserException;
import reactor.core.publisher.Mono;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import org.springframework.dao.DataIntegrityViolationException;

import java.net.URI;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(AuthException.class)
	public Mono<ProblemDetail> handleAuthException(AuthException ex, ServerWebExchange exchange) {
		return buildProblemDetail(ex.getErrorCode().getStatus(), ex.getMessage(), ex.getErrorCode().name(), exchange);
	}

	@ExceptionHandler(UserException.class)
	public Mono<ProblemDetail> handleUserException(UserException ex, ServerWebExchange exchange) {
		return buildProblemDetail(ex.getErrorCode().getStatus(), ex.getMessage(), ex.getErrorCode().name(), exchange);
	}

	@ExceptionHandler(WebExchangeBindException.class)
	public Mono<ProblemDetail> handleValidationException(WebExchangeBindException ex, ServerWebExchange exchange) {
		String errors = ex.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getField() + ": " + error.getDefaultMessage()).collect(Collectors.joining(", "));
		return buildProblemDetail(GlobalErrorCode.VALIDATION_FAILED.getStatus(), "Validation failed: " + errors,
				GlobalErrorCode.VALIDATION_FAILED.name(), exchange);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public Mono<ProblemDetail> handleAccessDeniedException(AccessDeniedException ex, ServerWebExchange exchange) {
		return buildProblemDetail(HttpStatus.FORBIDDEN, "Access Denied", "FORBIDDEN", exchange);
	}

	@ExceptionHandler(AuthenticationException.class)
	public Mono<ProblemDetail> handleAuthenticationException(AuthenticationException ex, ServerWebExchange exchange) {
		return buildProblemDetail(HttpStatus.UNAUTHORIZED, "Unauthorized", "UNAUTHORIZED", exchange);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public Mono<ProblemDetail> handleDataIntegrityViolationException(DataIntegrityViolationException ex,
			ServerWebExchange exchange) {
		return buildProblemDetail(HttpStatus.CONFLICT, "Data integrity violation: possibly duplicate entry", "CONFLICT",
				exchange);
	}

	@ExceptionHandler(Exception.class)
	public Mono<ProblemDetail> handleGenericException(Exception ex, ServerWebExchange exchange) {
		ex.printStackTrace();
		return buildProblemDetail(GlobalErrorCode.INTERNAL_SERVER_ERROR.getStatus(), "An unexpected error occurred",
				GlobalErrorCode.INTERNAL_SERVER_ERROR.name(), exchange);
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
