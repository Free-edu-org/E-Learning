package pl.freeedu.backend.achievement.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum AchievementErrorCode implements ErrorCode {
	ACHIEVEMENT_NOT_FOUND("Achievement not found", HttpStatus.NOT_FOUND), ACHIEVEMENT_CODE_ALREADY_EXISTS(
			"Achievement code already exists", HttpStatus.CONFLICT), INVALID_ACHIEVEMENT_RULE(
					"Achievement rule configuration is invalid", HttpStatus.BAD_REQUEST);

	private final String defaultMessage;
	private final HttpStatus status;

	AchievementErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
