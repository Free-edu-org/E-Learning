package pl.freeedu.backend.teacher.dto;

import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.UserStatus;

import java.time.LocalDateTime;

public interface TeacherStudentProjection {
	String getPublicId();
	String getUsername();
	String getEmail();
	Role getRole();
	UserStatus getStatus();
	LocalDateTime getCreatedAt();
	String getGroupPublicId();
	String getAvatarUrl();
}
