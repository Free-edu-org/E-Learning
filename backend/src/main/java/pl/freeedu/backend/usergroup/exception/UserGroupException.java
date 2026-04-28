package pl.freeedu.backend.usergroup.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class UserGroupException extends RuntimeException {
	private final ErrorCode errorCode;

	public UserGroupException(UserGroupErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public UserGroupException(UserGroupErrorCode errorCode, Throwable cause) {
		super(errorCode.getDefaultMessage(), cause);
		this.errorCode = errorCode;
	}
}
