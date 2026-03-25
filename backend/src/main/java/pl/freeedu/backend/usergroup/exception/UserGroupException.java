package pl.freeedu.backend.usergroup.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class UserGroupException extends RuntimeException {
	private final ErrorCode errorCode;

	public UserGroupException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}
}
