package pl.freeedu.backend.user.model;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ADMIN,
    STUDENT;

    @Override
    public String getAuthority() {
        return "ROLE_" + name();
    }
}
