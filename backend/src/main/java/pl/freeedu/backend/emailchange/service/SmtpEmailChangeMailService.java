package pl.freeedu.backend.emailchange.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.user.model.User;

@Slf4j
@Service
public class SmtpEmailChangeMailService implements EmailChangeMailService {

	private final JavaMailSender mailSender;

	@Value("${application.mail.enabled:false}")
	private boolean mailEnabled;

	@Value("${application.mail.from-address}")
	private String fromAddress;

	@Value("${application.mail.from-name}")
	private String fromName;

	@Value("${application.frontend.base-url}")
	private String frontendBaseUrl;

	@Value("${application.email-change.expiration-hours:24}")
	private long emailChangeExpirationHours;

	public SmtpEmailChangeMailService(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	@Override
	public void sendEmailChangeVerification(User user, String newEmail, String verificationToken) {
		if (!mailEnabled) {
			log.warn("Email change delivery is disabled. User ID: {}", user.getId());
			return;
		}

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(newEmail);
		message.setFrom(fromAddress);
		message.setSubject("FreeEdu - potwierdz zmiane adresu email");
		message.setText(buildBody(user, newEmail, verificationToken));
		mailSender.send(message);
		log.info("Email change verification message sent to new address for user ID: {}", user.getId());
	}

	private String buildBody(User user, String newEmail, String verificationToken) {
		String verificationUrl = sanitizeBaseUrl(frontendBaseUrl) + "/verify-email-change?token=" + verificationToken;
		String displayName = user.getUsername() == null || user.getUsername().isBlank()
				? user.getEmail()
				: user.getUsername();
		return "Czesc " + displayName + ",\n\n" + "Otrzymalismy prosbe o zmiane adresu email Twojego konta FreeEdu na: "
				+ newEmail + "\n" + "Kliknij w link ponizej, aby potwierdzic nowy adres email:\n\n" + verificationUrl
				+ "\n\n" + "Link jest jednorazowy i wygasa po " + emailChangeExpirationHours + " godzinach.\n"
				+ "Jesli to nie Ty prosiles o zmiane adresu email, zignoruj te wiadomosc.\n\n" + fromName;
	}

	static String sanitizeBaseUrl(String raw) {
		if (raw == null || raw.isBlank())
			return "";
		String[] parts = raw.split(",");
		String last = parts[parts.length - 1].trim();
		return last.endsWith("/") ? last.substring(0, last.length() - 1) : last;
	}
}
