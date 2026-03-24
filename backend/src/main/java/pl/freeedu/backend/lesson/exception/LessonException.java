package pl.freeedu.backend.lesson.exception;

import lombok.Getter;
import pl.freeedu.backend.exception.ErrorCode;

@Getter
public class LessonException extends RuntimeException {
    private final ErrorCode errorCode;

    public LessonException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }
}