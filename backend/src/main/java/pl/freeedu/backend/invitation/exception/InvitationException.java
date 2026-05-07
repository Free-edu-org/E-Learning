package pl.freeedu.backend.invitation.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class InvitationException extends RuntimeException {

	private final ErrorCode errorCode;

	public InvitationException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}
}
