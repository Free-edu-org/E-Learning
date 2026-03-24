package pl.freeedu.backend.lesson.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public enum LessonErrorCode implements ErrorCode {
    LESSON_NOT_FOUND("Lesson not found", HttpStatus.NOT_FOUND),
    NOT_LESSON_OWNER("Only owner teacher can edit/delete this lesson", HttpStatus.FORBIDDEN);

    private final String defaultMessage;
    private final HttpStatus status;

    LessonErrorCode(String defaultMessage, HttpStatus status) {
        this.defaultMessage = defaultMessage;
        this.status = status;
    }
}