package pl.freeedu.backend.emailverification.service;

import pl.freeedu.backend.user.model.User;

public interface EmailVerificationMailService {

	void sendEmailVerification(User user, String verificationToken);
}
