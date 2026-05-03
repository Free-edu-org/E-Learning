package pl.freeedu.backend.usergroup.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.model.UserGroup;

@Mapper(componentModel = "spring")
public abstract class UserGroupMapper {

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "publicId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "teacherId", ignore = true) // Will be set by service
	public abstract UserGroup toUserGroup(UserGroupRequest request);

	@Mapping(target = "studentCount", ignore = true)
	@Mapping(target = "teacherPublicId", ignore = true)
	public abstract UserGroupResponse toUserGroupResponse(UserGroup userGroup);
}
