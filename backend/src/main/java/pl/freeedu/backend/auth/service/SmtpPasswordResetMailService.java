package pl.freeedu.backend.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.user.model.User;

@Slf4j
@Service
public class SmtpPasswordResetMailService implements PasswordResetMailService {

	private final JavaMailSender mailSender;

	@Value("${application.mail.enabled:false}")
	private boolean mailEnabled;

	@Value("${application.mail.from-address}")
	private String fromAddress;

	@Value("${application.mail.from-name}")
	private String fromName;

	@Value("${application.frontend.base-url}")
	private String frontendBaseUrl;

	public SmtpPasswordResetMailService(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	@Override
	public void sendPasswordResetEmail(User user, String resetToken) {
		String subject = "FreeEdu - reset hasla";
		String body = buildBody(user, buildResetUrl(resetToken));

		if (!mailEnabled) {
			log.warn("Password reset email delivery is disabled. User ID: {}", user.getId());
			return;
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(user.getEmail());
		message.setFrom(fromAddress);
		message.setSubject(subject);
		message.setText(body);
		mailSender.send(message);
		log.info("Password reset email sent for user ID: {}", user.getId());
	}

	private String buildResetUrl(String resetToken) {
		return frontendBaseUrl + "/reset-password?token=" + resetToken;
	}

	private String buildBody(User user, String resetUrl) {
		return "Czesc " + user.getUsername() + ",\n\n" + "otrzymalismy prosbe o zresetowanie hasla do konta FreeEdu.\n"
				+ "Kliknij w link ponizej, aby ustawic nowe haslo:\n\n" + resetUrl + "\n\n"
				+ "Link wygasa po 30 minutach.\n" + "Jesli to nie Ty prosiles o reset, zignoruj te wiadomosc.\n\n"
				+ fromName;
	}
}
