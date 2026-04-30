package pl.freeedu.backend.auth.service;

import pl.freeedu.backend.user.model.User;

public interface PasswordResetMailService {

	void sendPasswordResetEmail(User user, String resetToken);
}
