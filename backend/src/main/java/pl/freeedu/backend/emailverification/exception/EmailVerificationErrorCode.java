package pl.freeedu.backend.emailverification.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum EmailVerificationErrorCode implements ErrorCode {

	EMAIL_VERIFICATION_TOKEN_INVALID("Email verification token is invalid.",
			HttpStatus.BAD_REQUEST), EMAIL_VERIFICATION_TOKEN_EXPIRED("Email verification token has expired.",
					HttpStatus.BAD_REQUEST), EMAIL_VERIFICATION_TOKEN_USED(
							"Email verification token has already been used.",
							HttpStatus.BAD_REQUEST), EMAIL_ALREADY_VERIFIED("Email has already been verified.",
									HttpStatus.CONFLICT), EMAIL_VERIFICATION_REQUIRED(
											"Email address has not been verified yet.",
											HttpStatus.UNAUTHORIZED), EMAIL_VERIFICATION_NOT_PENDING(
													"Account is not awaiting email verification.", HttpStatus.CONFLICT);

	private final String defaultMessage;
	private final HttpStatus status;

	EmailVerificationErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
