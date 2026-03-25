package pl.freeedu.backend.exception;

import org.springframework.http.HttpStatus;

public interface ErrorCode {
	String name();

	String getDefaultMessage();

	HttpStatus getStatus();
}
