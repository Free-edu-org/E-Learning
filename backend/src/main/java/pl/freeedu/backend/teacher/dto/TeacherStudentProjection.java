package pl.freeedu.backend.teacher.dto;

import pl.freeedu.backend.user.model.Role;

import java.time.LocalDateTime;

public interface TeacherStudentProjection {
	String getPublicId();
	String getUsername();
	String getEmail();
	Role getRole();
	LocalDateTime getCreatedAt();
	String getGroupPublicId();
	String getAvatarUrl();
}
