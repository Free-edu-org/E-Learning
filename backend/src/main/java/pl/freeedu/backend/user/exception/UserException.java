package pl.freeedu.backend.user.exception;

public class UserException extends RuntimeException {

	private final UserErrorCode errorCode;

	public UserException(UserErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public UserException(UserErrorCode errorCode, Throwable cause) {
		super(errorCode.getDefaultMessage(), cause);
		this.errorCode = errorCode;
	}

	public UserErrorCode getErrorCode() {
		return errorCode;
	}
}
