package pl.freeedu.backend.accountinvitation.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum AccountInvitationErrorCode implements ErrorCode {
	INVITATION_TOKEN_INVALID("Invitation token is invalid.", HttpStatus.BAD_REQUEST), INVITATION_TOKEN_EXPIRED(
			"Invitation token has expired.", HttpStatus.BAD_REQUEST), INVITATION_TOKEN_USED(
					"Invitation token has already been used.", HttpStatus.BAD_REQUEST), ACCOUNT_ALREADY_ACTIVE(
							"This account is already active.", HttpStatus.CONFLICT), ACCOUNT_NOT_INVITED(
									"Account is not in invited state.", HttpStatus.CONFLICT), ACCOUNT_NOT_ACTIVE(
											"Account is not yet activated. Please check your invitation email.",
											HttpStatus.UNAUTHORIZED);

	private final String defaultMessage;
	private final HttpStatus status;

	AccountInvitationErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
