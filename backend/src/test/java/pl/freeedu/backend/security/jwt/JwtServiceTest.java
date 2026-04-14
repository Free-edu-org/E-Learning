package pl.freeedu.backend.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

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

		// when
		String token = jwtService.generateToken(userId);

		// then
		assertNotNull(token);
		assertEquals(userId, jwtService.extractUserId(token));
		assertTrue(jwtService.isTokenValid(token, userId));
	}

	@Test
	void shouldReturnFalseForInvalidUser() {
		// given
		Integer userId = 123;
		String token = jwtService.generateToken(userId);

		// when
		boolean result = jwtService.isTokenValid(token, 999);

		// then
		assertFalse(result);
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
