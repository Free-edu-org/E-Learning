package pl.freeedu.backend.task.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class TaskException extends RuntimeException {

	private final ErrorCode errorCode;

	public TaskException(ErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}
}
