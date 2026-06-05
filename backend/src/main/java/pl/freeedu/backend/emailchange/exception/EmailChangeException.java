package pl.freeedu.backend.emailchange.exception;

public class EmailChangeException extends RuntimeException {

	private final EmailChangeErrorCode errorCode;

	public EmailChangeException(EmailChangeErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public EmailChangeErrorCode getErrorCode() {
		return errorCode;
	}
}
