package pl.freeedu.backend.lesson.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum LessonErrorCode implements ErrorCode {
	LESSON_NOT_FOUND("Lesson not found", HttpStatus.NOT_FOUND), NOT_LESSON_OWNER(
			"Only owner teacher can edit/delete this lesson", HttpStatus.FORBIDDEN), ATTACHMENT_NOT_FOUND(
					"Attachment not found", HttpStatus.NOT_FOUND), ATTACHMENT_INVALID_FILE_TYPE(
							"Only PDF, TXT, DOCX, DOC and ODT files are allowed",
							HttpStatus.BAD_REQUEST), ATTACHMENT_FILE_TOO_LARGE(
									"File is too large. Maximum size is 10 MB.",
									HttpStatus.BAD_REQUEST), ATTACHMENT_LIMIT_REACHED(
											"Maximum number of attachments (5) reached for this lesson.",
											HttpStatus.BAD_REQUEST);

	private final String defaultMessage;
	private final HttpStatus status;

	LessonErrorCode(String defaultMessage, HttpStatus status) {
		this.defaultMessage = defaultMessage;
		this.status = status;
	}
}
