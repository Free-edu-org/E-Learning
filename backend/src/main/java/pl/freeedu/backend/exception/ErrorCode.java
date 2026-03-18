package pl.freeedu.backend.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {
	INVALID_CREDENTIALS("Invalid email or password"), EMAIL_ALREADY_TAKEN("Email is already taken"), USER_NOT_FOUND(
			"User not found"), USER_GROUP_NOT_FOUND("User group not found"), VALIDATION_FAILED(
					"Validation failed"), INTERNAL_SERVER_ERROR("An unexpected error occurred");

	private final String defaultMessage;

	ErrorCode(String defaultMessage) {
		this.defaultMessage = defaultMessage;
	}
}
