package pl.freeedu.backend.auth.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum AuthErrorCode implements ErrorCode {
	INVALID_CREDENTIALS("Invalid username/email or password", HttpStatus.UNAUTHORIZED), INVALID_OLD_PASSWORD(
			"Obecne haslo jest nieprawidlowe.", HttpStatus.UNAUTHORIZED), PASSWORD_CONFIRMATION_MISMATCH(
					"New password and confirmation password must match.",
					HttpStatus.BAD_REQUEST), PASSWORD_RESET_TOKEN_INVALID("Password reset token is invalid.",
							HttpStatus.BAD_REQUEST), PASSWORD_RESET_TOKEN_EXPIRED("Password reset token has expired.",
									HttpStatus.BAD_REQUEST), PASSWORD_RESET_TOKEN_USED(
											"Password reset token has already been used.", HttpStatus.BAD_REQUEST);

	private final String defaultMessage;
	private final HttpStatus status;

	AuthErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
