package pl.freeedu.backend.user.exception;

public class UserException extends RuntimeException {

	private final UserErrorCode errorCode;

	public UserException(UserErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public UserErrorCode getErrorCode() {
		return errorCode;
	}
}
