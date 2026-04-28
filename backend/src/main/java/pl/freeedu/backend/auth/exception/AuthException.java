package pl.freeedu.backend.auth.exception;

import lombok.Getter;

@Getter
public class AuthException extends RuntimeException {
	private final AuthErrorCode errorCode;

	public AuthException(AuthErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public AuthException(AuthErrorCode errorCode, Throwable cause) {
		super(errorCode.getDefaultMessage(), cause);
		this.errorCode = errorCode;
	}
}
