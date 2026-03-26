package pl.freeedu.backend.user.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum UserErrorCode implements ErrorCode {
	USER_NOT_FOUND("User not found", HttpStatus.NOT_FOUND), EMAIL_ALREADY_TAKEN("Email is already taken",
			HttpStatus.CONFLICT), USERNAME_ALREADY_TAKEN("Username is already taken",
					HttpStatus.CONFLICT), INVALID_TEACHER_ASSIGNMENT("Selected teacher must have role TEACHER",
							HttpStatus.BAD_REQUEST);

	private final String defaultMessage;
	private final HttpStatus status;

	UserErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
