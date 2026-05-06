package pl.freeedu.backend.invitation.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum InvitationErrorCode implements ErrorCode {

	INVITATION_NOT_FOUND("Invitation not found.", HttpStatus.NOT_FOUND), INVITATION_EXPIRED(
			"This invitation link has expired.", HttpStatus.GONE), INVITATION_LIMIT_REACHED(
					"This invitation link has reached its usage limit.", HttpStatus.GONE), INVITATION_INACTIVE(
							"This invitation link is no longer active.", HttpStatus.GONE), INVITATION_ACCESS_DENIED(
									"You do not have access to this invitation.", HttpStatus.FORBIDDEN);

	private final String defaultMessage;
	private final HttpStatus status;

	InvitationErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
