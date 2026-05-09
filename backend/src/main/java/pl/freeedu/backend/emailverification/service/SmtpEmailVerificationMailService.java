package pl.freeedu.backend.emailverification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.user.model.User;

@Slf4j
@Service
public class SmtpEmailVerificationMailService implements EmailVerificationMailService {

	private final JavaMailSender mailSender;

	@Value("${application.mail.enabled:false}")
	private boolean mailEnabled;

	@Value("${application.mail.from-address}")
	private String fromAddress;

	@Value("${application.mail.from-name}")
	private String fromName;

	@Value("${application.frontend.base-url}")
	private String frontendBaseUrl;

	@Value("${application.email-verification.expiration-hours:24}")
	private long emailVerificationExpirationHours;

	public SmtpEmailVerificationMailService(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	@Override
	public void sendEmailVerification(User user, String verificationToken) {
		if (!mailEnabled) {
			log.warn("Email verification delivery is disabled. User ID: {}", user.getId());
			return;
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(user.getEmail());
		message.setFrom(fromAddress);
		message.setSubject("FreeEdu - potwierdz adres email");
		message.setText(buildBody(user, verificationToken));
		mailSender.send(message);
		log.info("Email verification message sent for user ID: {}", user.getId());
	}

	private String buildBody(User user, String verificationToken) {
		String verificationUrl = frontendBaseUrl + "/verify-email?token=" + verificationToken;
		String displayName = user.getUsername() == null || user.getUsername().isBlank()
				? user.getEmail()
				: user.getUsername();
		return "Czesc " + displayName + ",\n\n" + "Twoje konto ucznia w FreeEdu zostalo utworzone.\n"
				+ "Kliknij w link ponizej, aby potwierdzic adres email i aktywowac konto:\n\n" + verificationUrl
				+ "\n\n" + "Link jest jednorazowy i wygasa po " + emailVerificationExpirationHours + " godzinach.\n"
				+ "Jesli to nie Ty tworzysz konto, zignoruj te wiadomosc.\n\n" + fromName;
	}
}
