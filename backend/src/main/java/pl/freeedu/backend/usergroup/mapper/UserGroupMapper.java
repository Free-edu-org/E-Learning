package pl.freeedu.backend.usergroup.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.model.UserGroup;

@Mapper(componentModel = "spring")
public interface UserGroupMapper {

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	UserGroup toUserGroup(UserGroupRequest request);

	@Mapping(target = "studentCount", ignore = true)
	UserGroupResponse toUserGroupResponse(UserGroup userGroup);
}
