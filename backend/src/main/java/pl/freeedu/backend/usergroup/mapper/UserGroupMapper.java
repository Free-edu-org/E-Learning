package pl.freeedu.backend.usergroup.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class UserGroupMapper {

	@Autowired
	protected UserRepository userRepository;

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "publicId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "teacherId", ignore = true) // Will be set by service
	public abstract UserGroup toUserGroup(UserGroupRequest request);

	@Mapping(target = "studentCount", ignore = true)
	@Mapping(target = "teacherPublicId", expression = "java(getTeacherPublicId(userGroup.getTeacherId()))")
	public abstract UserGroupResponse toUserGroupResponse(UserGroup userGroup);

	protected String getTeacherPublicId(Integer teacherId) {
		if (teacherId == null)
			return null;
		return userRepository.findById(teacherId).map(user -> user.getPublicId()).orElse(null);
	}
}
