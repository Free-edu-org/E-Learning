package pl.freeedu.backend.emailverification.exception;

public class EmailVerificationException extends RuntimeException {

	private final EmailVerificationErrorCode errorCode;

	public EmailVerificationException(EmailVerificationErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public EmailVerificationErrorCode getErrorCode() {
		return errorCode;
	}
}
