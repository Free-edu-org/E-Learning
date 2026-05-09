package pl.freeedu.backend.accountinvitation.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmtpAccountInvitationMailService implements AccountInvitationMailService {

	private final JavaMailSender mailSender;

	@Value("${application.mail.enabled:false}")
	private boolean mailEnabled;

	@Value("${application.mail.from-address}")
	private String fromAddress;

	@Value("${application.mail.from-name}")
	private String fromName;

	@Value("${application.frontend.base-url}")
	private String frontendBaseUrl;

	@Value("${application.invitation.expiration-hours:72}")
	private long invitationExpirationHours;

	public SmtpAccountInvitationMailService(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	@Override
	public void sendInvitationEmail(String toEmail, String inviteToken) {
		if (!mailEnabled) {
			log.warn("Invitation email delivery is disabled — skipping send to: {}", toEmail);
			return;
		}

		String activationUrl = frontendBaseUrl + "/activate?token=" + inviteToken;

		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(toEmail);
		message.setFrom(fromAddress);
		message.setSubject("FreeEdu - dokoncz tworzenie konta");
		message.setText(buildBody(toEmail, activationUrl));
		mailSender.send(message);
		log.info("Invitation email sent to: {}", toEmail);
	}

	private String buildBody(String email, String activationUrl) {
		return "Witaj!\n\n" + "Zostales zaproszony do platformy FreeEdu.\n"
				+ "Kliknij w link ponizej, aby dokonczyc tworzenie konta:\n\n" + activationUrl + "\n\n"
				+ "Link jest jednorazowy i wygasa po " + invitationExpirationHours + " godzinach.\n"
				+ "Jesli nie spodziewales sie tego zaproszenia, mozesz zignorowac ta wiadomosc.\n\n" + fromName;
	}
}
