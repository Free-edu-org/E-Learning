package pl.freeedu.backend.usergroup.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum UserGroupErrorCode implements ErrorCode {
	USER_GROUP_NOT_FOUND("User group not found", HttpStatus.NOT_FOUND), GROUP_NAME_ALREADY_EXISTS(
			"Group with this name already exists",
			HttpStatus.CONFLICT), STUDENT_ALREADY_IN_GROUP("Student is already assigned to a group",
					HttpStatus.CONFLICT), INVALID_ROLE_FOR_GROUP("Only users with role STUDENT can be added to a group",
							HttpStatus.BAD_REQUEST), MEMBER_NOT_IN_GROUP("User is not a member of this group",
									HttpStatus.NOT_FOUND);

	private final String defaultMessage;
	private final HttpStatus status;

	UserGroupErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
