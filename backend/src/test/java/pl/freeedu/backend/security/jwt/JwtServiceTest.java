package pl.freeedu.backend.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import pl.freeedu.backend.user.model.User;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

	private JwtService jwtService;

	// A sample 256-bit key in Base64 (32 bytes)
	private final String secretKey = Base64.getEncoder()
			.encodeToString("my-secret-key-must-be-at-least-32-bytes-long-1234567890".getBytes());

	@BeforeEach
	void setUp() {
		jwtService = new JwtService();
		ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
		ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L); // 1 hour
	}

	@Test
	void shouldGenerateAndValidateToken() {
		// given
		Integer userId = 123;
		User user = User.builder().id(userId).tokenVersion(4).build();

		// when
		String token = jwtService.generateToken(userId, 4);

		// then
		assertNotNull(token);
		assertEquals(userId, jwtService.extractUserId(token));
		assertEquals(4, jwtService.extractTokenVersion(token));
		assertTrue(jwtService.isTokenValid(token, user));
	}

	@Test
	void shouldReturnFalseForInvalidUser() {
		// given
		Integer userId = 123;
		String token = jwtService.generateToken(userId, 1);
		User user = User.builder().id(999).tokenVersion(1).build();

		// when
		boolean result = jwtService.isTokenValid(token, user);

		// then
		assertFalse(result);
	}

	@Test
	void shouldReturnFalseWhenTokenVersionDoesNotMatch() {
		String token = jwtService.generateToken(123, 1);
		User user = User.builder().id(123).tokenVersion(2).build();

		assertFalse(jwtService.isTokenValid(token, user));
	}

	@Test
	void shouldInvalidateOldJwtAfterPasswordResetIncrementsTokenVersion() {
		Integer userId = 123;
		Integer originalTokenVersion = 3;
		User userBeforeReset = User.builder().id(userId).tokenVersion(originalTokenVersion).build();
		String jwt = jwtService.generateToken(userId, originalTokenVersion);

		assertEquals(originalTokenVersion, jwtService.extractTokenVersion(jwt));
		assertTrue(jwtService.isTokenValid(jwt, userBeforeReset));

		User userAfterReset = User.builder().id(userId).tokenVersion(originalTokenVersion + 1).build();

		assertFalse(jwtService.isTokenValid(jwt, userAfterReset));
	}

	@Test
	void shouldReturnExpiredIfTokenIsOld() {
		// given
		ReflectionTestUtils.setField(jwtService, "jwtExpiration", -10000L); // Expired 10s ago
		String token = jwtService.generateToken(456);

		// when
		try {
			boolean isValid = jwtService.isTokenValid(token, 456);

			// then
			assertFalse(isValid, "Token should be invalid if expired");
		} catch (io.jsonwebtoken.ExpiredJwtException e) {
			// then (also valid)
			// This is also a valid way to signal expiration in simple implementations
		}
	}
}
