package pl.freeedu.backend.auth.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class AuthException extends RuntimeException {
	private final ErrorCode errorCode;

	public AuthException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}
}
