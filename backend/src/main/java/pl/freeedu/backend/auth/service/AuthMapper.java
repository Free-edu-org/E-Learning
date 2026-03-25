package pl.freeedu.backend.auth.service;

import org.mapstruct.Mapper;
import pl.freeedu.backend.auth.dto.AuthResponse;
import pl.freeedu.backend.user.model.Role;

@Mapper(componentModel = "spring")
public interface AuthMapper {

	AuthResponse toAuthResponse(String token, Role role);
}
