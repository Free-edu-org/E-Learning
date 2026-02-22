package pl.freeedu.backend.auth.service;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.auth.dto.RegisterRequest;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;

@Mapper(componentModel = "spring")
public interface AuthMapper {

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "password", source = "encodedPassword")
	User toUser(RegisterRequest request, String encodedPassword);

	AuthResponse toAuthResponse(String token, Role role);
}
