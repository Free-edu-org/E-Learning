package pl.freeedu.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum GlobalErrorCode implements ErrorCode {
	VALIDATION_FAILED("Validation failed", HttpStatus.BAD_REQUEST), INTERNAL_SERVER_ERROR(
			"An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);

	private final String defaultMessage;
	private final HttpStatus status;

	GlobalErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
