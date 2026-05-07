package pl.freeedu.backend.achievement.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class AchievementException extends RuntimeException {

	private final ErrorCode errorCode;

	public AchievementException(AchievementErrorCode errorCode) {
		super(errorCode.getDefaultMessage());
		this.errorCode = errorCode;
	}

	public AchievementException(AchievementErrorCode errorCode, Throwable cause) {
		super(errorCode.getDefaultMessage(), cause);
		this.errorCode = errorCode;
	}
}
