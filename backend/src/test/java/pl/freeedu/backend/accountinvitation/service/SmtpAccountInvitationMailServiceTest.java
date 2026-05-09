package pl.freeedu.backend.accountinvitation.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SmtpAccountInvitationMailServiceTest {

	@Mock
	private JavaMailSender mailSender;

	@InjectMocks
	private SmtpAccountInvitationMailService smtpAccountInvitationMailService;

	@Test
	void shouldSendInvitationEmailWithActivationLinkWhenMailEnabled() {
		// given
		ReflectionTestUtils.setField(smtpAccountInvitationMailService, "mailEnabled", true);
		ReflectionTestUtils.setField(smtpAccountInvitationMailService, "fromAddress", "noreply@freeedu.pl");
		ReflectionTestUtils.setField(smtpAccountInvitationMailService, "fromName", "FreeEdu Team");
		ReflectionTestUtils.setField(smtpAccountInvitationMailService, "frontendBaseUrl", "https://app.freeedu.pl");
		ReflectionTestUtils.setField(smtpAccountInvitationMailService, "invitationExpirationHours", 72L);

		// when
		smtpAccountInvitationMailService.sendInvitationEmail("teacher@example.com", "plain-token");

		// then
		ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
		verify(mailSender).send(messageCaptor.capture());
		SimpleMailMessage message = messageCaptor.getValue();
		assertTrue(message.getText().contains("https://app.freeedu.pl/activate?token=plain-token"));
		assertTrue(message.getText().contains("Zostales zaproszony do platformy FreeEdu."));
		assertFalse(message.getText().contains("jako uczen"));
	}

	@Test
	void shouldSkipSendingInvitationEmailWhenMailDisabled() {
		// given
		ReflectionTestUtils.setField(smtpAccountInvitationMailService, "mailEnabled", false);

		// when
		smtpAccountInvitationMailService.sendInvitationEmail("teacher@example.com", "plain-token");

		// then
		verify(mailSender, never()).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));
	}
}