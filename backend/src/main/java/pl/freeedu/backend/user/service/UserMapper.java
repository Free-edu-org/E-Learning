package pl.freeedu.backend.user.service;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import pl.freeedu.backend.user.dto.RegisterUserRequest;
import pl.freeedu.backend.user.dto.UpdateUserRequest;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.model.User;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

	UserResponse toUserResponse(User user);

	@Mapping(target = "role", constant = "ADMIN")
	@Mapping(target = "password", source = "encodedPassword")
	User toAdminUser(RegisterUserRequest request, String encodedPassword);

	@Mapping(target = "role", constant = "STUDENT")
	@Mapping(target = "password", source = "encodedPassword")
	User toStudentUser(RegisterUserRequest request, String encodedPassword);

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "password", ignore = true)
	@Mapping(target = "role", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	void updateUserFromRequest(UpdateUserRequest request, @MappingTarget User user);
}
