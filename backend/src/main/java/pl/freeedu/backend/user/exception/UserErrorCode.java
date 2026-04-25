package pl.freeedu.backend.user.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum UserErrorCode implements ErrorCode {
	USER_NOT_FOUND("User not found", HttpStatus.NOT_FOUND), EMAIL_ALREADY_TAKEN("Email is already taken",
			HttpStatus.CONFLICT), USERNAME_ALREADY_TAKEN("Username is already taken",
					HttpStatus.CONFLICT), INVALID_TEACHER_ASSIGNMENT("Selected teacher must have role TEACHER",
							HttpStatus.BAD_REQUEST), INVALID_STUDENT_ASSIGNMENT("Selected user must have role STUDENT",
									HttpStatus.BAD_REQUEST), AVATAR_INVALID_FILE_TYPE(
											"Niedozwolony typ pliku. Dozwolone formaty: JPEG, PNG.",
											HttpStatus.BAD_REQUEST), AVATAR_FILE_TOO_LARGE(
													"Plik jest za duży. Maksymalny rozmiar to 2 MB.",
													HttpStatus.BAD_REQUEST), AVATAR_INVALID_PRESET(
															"Wybrany preset awatara jest nieprawidłowy.",
															HttpStatus.BAD_REQUEST);

	private final String defaultMessage;
	private final HttpStatus status;

	UserErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
