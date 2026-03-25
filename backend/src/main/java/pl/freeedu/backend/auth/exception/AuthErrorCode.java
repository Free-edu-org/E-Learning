package pl.freeedu.backend.auth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum AuthErrorCode implements ErrorCode {
	INVALID_CREDENTIALS("Invalid username/email or password", HttpStatus.UNAUTHORIZED);

	private final String defaultMessage;
	private final HttpStatus status;

	AuthErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
