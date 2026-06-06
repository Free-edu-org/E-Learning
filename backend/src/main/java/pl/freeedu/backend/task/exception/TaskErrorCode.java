package pl.freeedu.backend.task.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum TaskErrorCode implements ErrorCode {

	TASK_NOT_FOUND("Task not found", HttpStatus.NOT_FOUND), INVALID_TASK_ANSWERS(
			"Task must define at least one unique valid correct answer",
			HttpStatus.BAD_REQUEST), LESSON_ALREADY_COMPLETED("Lesson has already been completed",
					HttpStatus.FORBIDDEN), LESSON_NOT_STARTED("Lesson has not been started yet",
							HttpStatus.BAD_REQUEST), STUDENT_NO_ACCESS("Student does not have access to this lesson",
									HttpStatus.FORBIDDEN), LESSON_NOT_ACTIVE("Lesson is not active",
											HttpStatus.FORBIDDEN), INVALID_TASK_TYPE("Invalid task type",
													HttpStatus.BAD_REQUEST), STT_AUDIO_REQUIRED(
															"Audio file is required",
															HttpStatus.BAD_REQUEST), STT_SERVICE_UNAVAILABLE(
																	"Speech-to-text service is unavailable",
																	HttpStatus.SERVICE_UNAVAILABLE), STT_RECOGNITION_FAILED(
																			"Speech could not be recognized",
																			HttpStatus.BAD_REQUEST), TASK_EDIT_LOCKED_AFTER_USE(
																					"Task cannot be edited from task bank after it has been used in student results",
																					HttpStatus.CONFLICT), SPEAK_ATTEMPT_REQUIRED(
																							"Speak attemptId is required for speaking tasks",
																							HttpStatus.BAD_REQUEST), SPEAK_ATTEMPT_NOT_FOUND(
																									"Speak attempt not found",
																									HttpStatus.NOT_FOUND), SPEAK_ATTEMPT_INVALID(
																											"Speak attempt does not belong to the current user, lesson or task",
																											HttpStatus.BAD_REQUEST), SPEAK_ATTEMPT_LIMIT_EXCEEDED(
																													"Speak attempt limit exceeded for this task",
																													HttpStatus.TOO_MANY_REQUESTS), LESSON_NOT_FOUND(
																															"Lesson not found",
																															HttpStatus.NOT_FOUND), LESSON_RESULT_NOT_FOUND(
																																	"Lesson result not found",
																																	HttpStatus.NOT_FOUND), TASK_ANSWER_NOT_FOUND(
																																			"Task answer not found for this student and lesson",
																																			HttpStatus.NOT_FOUND), HINT_IMAGE_INVALID_FILE_TYPE(
																																					"Only JPEG, PNG, WebP and GIF images are allowed",
																																					HttpStatus.BAD_REQUEST), HINT_IMAGE_FILE_TOO_LARGE(
																																							"Hint image must be smaller than 5 MB",
																																							HttpStatus.BAD_REQUEST), HINT_IMAGE_NOT_FOUND(
																																									"Hint image not found",
																																									HttpStatus.NOT_FOUND);

	private final String defaultMessage;
	private final HttpStatus status;

	TaskErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
