package pl.freeedu.backend.emailchange.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum EmailChangeErrorCode implements ErrorCode {

	EMAIL_CHANGE_TOKEN_INVALID("Email change token is invalid.", HttpStatus.BAD_REQUEST), EMAIL_CHANGE_TOKEN_EXPIRED(
			"Email change token has expired.", HttpStatus.BAD_REQUEST), EMAIL_CHANGE_TOKEN_USED(
					"Email change token has already been used.", HttpStatus.BAD_REQUEST), EMAIL_CHANGE_NEW_EMAIL_TAKEN(
							"The new email address is already taken.", HttpStatus.CONFLICT);

	private final String defaultMessage;
	private final HttpStatus status;

	EmailChangeErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
