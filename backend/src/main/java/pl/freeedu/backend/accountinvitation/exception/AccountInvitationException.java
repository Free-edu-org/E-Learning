package pl.freeedu.backend.accountinvitation.exception;

import lombok.Getter;

@Getter
public class AccountInvitationException extends RuntimeException {

	private final AccountInvitationErrorCode errorCode;

	public AccountInvitationException(AccountInvitationErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}
}
