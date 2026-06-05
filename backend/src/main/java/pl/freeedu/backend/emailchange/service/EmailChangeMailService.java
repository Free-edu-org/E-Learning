package pl.freeedu.backend.emailchange.service;

import pl.freeedu.backend.user.model.User;

public interface EmailChangeMailService {

	void sendEmailChangeVerification(User user, String newEmail, String verificationToken);
}
