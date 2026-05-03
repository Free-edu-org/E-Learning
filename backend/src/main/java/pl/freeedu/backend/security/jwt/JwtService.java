package pl.freeedu.backend.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.user.model.User;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class JwtService {

	private static final String TOKEN_VERSION_CLAIM = "tokenVersion";

	@Value("${application.security.jwt.secret-key}")
	private String secretKey;

	@Value("${application.security.jwt.expiration:86400000}")
	private long jwtExpiration;

	public String extractUserPublicId(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public Integer extractTokenVersion(String token) {
		return Optional.ofNullable(extractClaim(token, claims -> claims.get(TOKEN_VERSION_CLAIM, Integer.class)))
				.orElse(0);
	}

	public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	public String generateToken(String userPublicId, Integer tokenVersion) {
		Map<String, Object> extraClaims = new HashMap<>();
		extraClaims.put(TOKEN_VERSION_CLAIM, tokenVersion);
		return generateToken(extraClaims, userPublicId);
	}

	public String generateToken(String userPublicId) {
		return generateToken(userPublicId, 0);
	}

	public String generateToken(Map<String, Object> extraClaims, String userPublicId) {
		return buildToken(extraClaims, userPublicId, jwtExpiration);
	}

	private String buildToken(Map<String, Object> extraClaims, String subject, long expiration) {
		return Jwts.builder().claims(extraClaims).subject(subject).issuedAt(new Date(System.currentTimeMillis()))
				.expiration(new Date(System.currentTimeMillis() + expiration)).signWith(getSignInKey(), Jwts.SIG.HS256)
				.compact();
	}

	public boolean isTokenValid(String token, User user) {
		final String userPublicId = extractUserPublicId(token);
		final Integer tokenVersion = extractTokenVersion(token);
		return userPublicId.equals(user.getPublicId())
				&& tokenVersion.equals(Optional.ofNullable(user.getTokenVersion()).orElse(0)) && !isTokenExpired(token);
	}

	public boolean isTokenValidForPublicId(String token, String targetUserPublicId) {
		final String userPublicId = extractUserPublicId(token);
		return userPublicId.equals(targetUserPublicId) && !isTokenExpired(token);
	}

	private boolean isTokenExpired(String token) {
		return extractExpiration(token).before(new Date());
	}

	private Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	private Claims extractAllClaims(String token) {
		try {
			return Jwts.parser().verifyWith(getSignInKey()).build().parseSignedClaims(token).getPayload();
		} catch (Exception e) {
			log.debug("Failed to extract claims from JWT (redacted: {})", e.getClass().getSimpleName());
			throw e;
		}
	}

	private SecretKey getSignInKey() {
		byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secretKey);
		return Keys.hmacShaKeyFor(keyBytes);
	}
}
