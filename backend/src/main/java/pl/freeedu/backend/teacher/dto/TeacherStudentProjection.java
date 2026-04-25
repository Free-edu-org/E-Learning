package pl.freeedu.backend.teacher.dto;

import pl.freeedu.backend.user.model.Role;

import java.time.LocalDateTime;

public interface TeacherStudentProjection {
	Integer getId();
	String getUsername();
	String getEmail();
	Role getRole();
	LocalDateTime getCreatedAt();
	Integer getGroupId();
	String getAvatarUrl();
}
