package pl.freeedu.backend.emailverification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import pl.freeedu.backend.user.model.User;

@ExtendWith(MockitoExtension.class)
class SmtpEmailVerificationMailServiceTest {

	@Mock
	private JavaMailSender mailSender;

	@InjectMocks
	private SmtpEmailVerificationMailService service;

	private User userWithUsername(String username, String email) {
		User user = new User();
		user.setId(1);
		user.setUsername(username);
		user.setEmail(email);
		return user;
	}

	@Test
	void shouldSendVerificationEmailWithSingleCorrectLink() {
		// given
		ReflectionTestUtils.setField(service, "mailEnabled", true);
		ReflectionTestUtils.setField(service, "fromAddress", "noreply@freeedu.pl");
		ReflectionTestUtils.setField(service, "fromName", "FreeEdu");
		ReflectionTestUtils.setField(service, "frontendBaseUrl", "https://freeedu-system.pl");
		ReflectionTestUtils.setField(service, "emailVerificationExpirationHours", 24L);
		User user = userWithUsername("jan", "jan@example.com");

		// when
		service.sendEmailVerification(user, "test-token");

		// then
		ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
		verify(mailSender).send(captor.capture());
		String body = captor.getValue().getText();
		String expectedUrl = "https://freeedu-system.pl/verify-email?token=test-token";
		assertTrue(body.contains(expectedUrl), "Body must contain correct verification URL");
		assertFalse(expectedUrl.contains(","), "Verification URL itself must not contain a comma");
	}

	@Test
	void shouldExtractLastUrlWhenFrontendBaseUrlContainsMultipleCommaSeparatedValues() {
		// given — simulates misconfigured FRONTEND_BASE_URL in production
		ReflectionTestUtils.setField(service, "mailEnabled", true);
		ReflectionTestUtils.setField(service, "fromAddress", "noreply@freeedu.pl");
		ReflectionTestUtils.setField(service, "fromName", "FreeEdu");
		ReflectionTestUtils.setField(service, "frontendBaseUrl",
				"https://freeedu-frontend.bravemoss-3358a893.polandcentral.azurecontainerapps.io,https://freeedu-system.pl");
		ReflectionTestUtils.setField(service, "emailVerificationExpirationHours", 24L);
		User user = userWithUsername("anna", "anna@example.com");

		// when
		service.sendEmailVerification(user, "abc123");

		// then
		ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
		verify(mailSender).send(captor.capture());
		String body = captor.getValue().getText();
		assertTrue(body.contains("https://freeedu-system.pl/verify-email?token=abc123"),
				"Should use the last (production) URL");
		assertFalse(body.contains("bravemoss"), "Old Azure URL must not appear in the email");
		assertFalse(body.contains("https://freeedu-frontend"), "Old Azure domain must not appear in the URL");
	}

	@Test
	void shouldSkipSendingWhenMailDisabled() {
		// given
		ReflectionTestUtils.setField(service, "mailEnabled", false);
		User user = userWithUsername("piotr", "piotr@example.com");

		// when
		service.sendEmailVerification(user, "some-token");

		// then
		verify(mailSender, never()).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));
	}

	// ── sanitizeBaseUrl unit tests ─────────────────────────────────────────────

	@Test
	void sanitizeBaseUrl_shouldReturnSingleUrlUnchanged() {
		assertEquals("https://freeedu-system.pl",
				SmtpEmailVerificationMailService.sanitizeBaseUrl("https://freeedu-system.pl"));
	}

	@Test
	void sanitizeBaseUrl_shouldStripTrailingSlash() {
		assertEquals("https://freeedu-system.pl",
				SmtpEmailVerificationMailService.sanitizeBaseUrl("https://freeedu-system.pl/"));
	}

	@Test
	void sanitizeBaseUrl_shouldReturnLastUrlFromCommaSeparatedList() {
		assertEquals("https://freeedu-system.pl", SmtpEmailVerificationMailService
				.sanitizeBaseUrl("https://old-azure.example.com,https://freeedu-system.pl"));
	}

	@Test
	void sanitizeBaseUrl_shouldHandleWhitespaceAroundUrls() {
		assertEquals("https://freeedu-system.pl", SmtpEmailVerificationMailService
				.sanitizeBaseUrl("https://old-azure.example.com , https://freeedu-system.pl "));
	}

	@Test
	void sanitizeBaseUrl_shouldReturnEmptyStringForNullInput() {
		assertEquals("", SmtpEmailVerificationMailService.sanitizeBaseUrl(null));
	}

	@Test
	void sanitizeBaseUrl_shouldReturnEmptyStringForBlankInput() {
		assertEquals("", SmtpEmailVerificationMailService.sanitizeBaseUrl("   "));
	}
}
