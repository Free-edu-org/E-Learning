package pl.freeedu.backend.task.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum TaskErrorCode implements ErrorCode {

	TASK_NOT_FOUND("Task not found", HttpStatus.NOT_FOUND), LESSON_NOT_FOUND("Lesson not found",
			HttpStatus.NOT_FOUND), NOT_LESSON_OWNER("Only the lesson owner can manage tasks",
					HttpStatus.FORBIDDEN), LESSON_ALREADY_COMPLETED("Lesson has already been completed",
							HttpStatus.FORBIDDEN), LESSON_NOT_STARTED("Lesson has not been started yet",
									HttpStatus.BAD_REQUEST), LESSON_NOT_ACCESSIBLE(
											"You do not have access to this lesson",
											HttpStatus.FORBIDDEN), INVALID_TASK_TYPE("Invalid task type",
													HttpStatus.BAD_REQUEST), ALREADY_SUBMITTED(
															"Answers have already been submitted for this lesson",
															HttpStatus.CONFLICT);

	private final String defaultMessage;
	private final HttpStatus status;

	TaskErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
