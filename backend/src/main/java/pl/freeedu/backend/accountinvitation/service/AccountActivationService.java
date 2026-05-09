package pl.freeedu.backend.accountinvitation.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.accountinvitation.dto.ActivateAccountRequest;
import pl.freeedu.backend.accountinvitation.dto.InviteTokenInfoResponse;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationErrorCode;
import pl.freeedu.backend.accountinvitation.exception.AccountInvitationException;
import pl.freeedu.backend.accountinvitation.model.InvitationToken;
import pl.freeedu.backend.accountinvitation.repository.InvitationTokenRepository;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import org.springframework.dao.DataIntegrityViolationException;

@Slf4j
@Service
public class AccountActivationService {

	private static final int TOKEN_BYTES = 32;
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	private final UserRepository userRepository;
	private final InvitationTokenRepository invitationTokenRepository;
	private final AccountInvitationMailService mailService;
	private final PasswordEncoder passwordEncoder;
	private final TransactionTemplate transactionTemplate;

	@Value("${application.invitation.expiration-hours:72}")
	private long invitationExpirationHours;

	public AccountActivationService(UserRepository userRepository, InvitationTokenRepository invitationTokenRepository,
			AccountInvitationMailService mailService, PasswordEncoder passwordEncoder,
			TransactionTemplate transactionTemplate) {
		this.userRepository = userRepository;
		this.invitationTokenRepository = invitationTokenRepository;
		this.mailService = mailService;
		this.passwordEncoder = passwordEncoder;
		this.transactionTemplate = transactionTemplate;
	}

	public String createInvitedUser(String email) {
		return createInvitedUser(email, Role.STUDENT);
	}

	public String createInvitedUser(String email, Role role) {
		java.util.Optional<User> existing = userRepository.findByEmail(email);
		if (existing.isPresent()) {
			User existingUser = existing.get();
			if (existingUser.getStatus() != UserStatus.INVITED) {
				throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
			}
			invitationTokenRepository.invalidateActiveTokensForUser(existingUser.getId(), LocalDateTime.now());
			String token = generateAndPersistToken(existingUser.getId());
			log.info("New invitation token generated for existing invited user ID: {}", existingUser.getId());
			return token;
		}

		User invited = User.builder().email(email).status(UserStatus.INVITED).role(role).build();
		try {
			User saved = userRepository.save(invited);
			String token = generateAndPersistToken(saved.getId());
			log.info("Invited user created. User ID: {}", saved.getId());
			return token;
		} catch (DataIntegrityViolationException ex) {
			throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
		}
	}

	public String createInvitationTokenForExistingUser(User user) {
		if (user.getStatus() != UserStatus.INVITED) {
			throw new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_NOT_INVITED);
		}
		invitationTokenRepository.invalidateActiveTokensForUser(user.getId(), LocalDateTime.now());
		String token = generateAndPersistToken(user.getId());
		log.info("New invitation token generated for user ID: {}", user.getId());
		return token;
	}

	public void sendInvitationEmail(String email, String plainToken) {
		try {
			mailService.sendInvitationEmail(email, plainToken);
		} catch (Exception ex) {
			log.error("Failed to send invitation email to: {}", email, ex);
		}
	}

	public Mono<InviteTokenInfoResponse> validateToken(String plainToken) {
		return Mono.fromCallable(() -> {
			InvitationToken token = resolveToken(plainToken);
			User user = userRepository.findById(token.getUserId()).orElseThrow(
					() -> new AccountInvitationException(AccountInvitationErrorCode.INVITATION_TOKEN_INVALID));
			log.debug("Invitation token validated for user ID: {}", user.getId());
			return InviteTokenInfoResponse.builder().email(user.getEmail()).build();
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Void> activateAccount(Mono<ActivateAccountRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			transactionTemplate.execute(status -> {
				activateAccountTransactional(request);
				return null;
			});
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> resendInvite(Integer userId) {
		return Mono.fromCallable(() -> {
			User user = userRepository.findById(userId)
					.orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
			if (user.getStatus() != UserStatus.INVITED) {
				throw new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_ALREADY_ACTIVE);
			}
			String plainToken = createInvitationTokenForExistingUser(user);
			sendInvitationEmail(user.getEmail(), plainToken);
			log.info("Invitation resent for user ID: {}", userId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic());
	}

	private void activateAccountTransactional(ActivateAccountRequest request) {
		if (userRepository.findByUsername(request.getUsername()).filter(u -> u.getStatus() == UserStatus.ACTIVE)
				.isPresent()) {
			throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
		}

		InvitationToken token = resolveToken(request.getToken());

		User user = userRepository.findById(token.getUserId())
				.orElseThrow(() -> new AccountInvitationException(AccountInvitationErrorCode.INVITATION_TOKEN_INVALID));

		if (user.getStatus() == UserStatus.ACTIVE) {
			throw new AccountInvitationException(AccountInvitationErrorCode.ACCOUNT_ALREADY_ACTIVE);
		}

		if (userRepository.findByUsername(request.getUsername()).isPresent()) {
			throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
		}

		user.setUsername(request.getUsername());
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		user.setStatus(UserStatus.ACTIVE);
		userRepository.save(user);

		token.setUsedAt(LocalDateTime.now());
		invitationTokenRepository.save(token);

		log.info("Account activated for user ID: {}", user.getId());
	}

	private InvitationToken resolveToken(String plainToken) {
		String hash = hashToken(plainToken);
		InvitationToken token = invitationTokenRepository.findByTokenHash(hash)
				.orElseThrow(() -> new AccountInvitationException(AccountInvitationErrorCode.INVITATION_TOKEN_INVALID));

		if (token.getUsedAt() != null) {
			throw new AccountInvitationException(AccountInvitationErrorCode.INVITATION_TOKEN_USED);
		}
		if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new AccountInvitationException(AccountInvitationErrorCode.INVITATION_TOKEN_EXPIRED);
		}
		return token;
	}

	private String generateAndPersistToken(Integer userId) {
		String plainToken = generateSecureToken();
		InvitationToken record = InvitationToken.builder().userId(userId).tokenHash(hashToken(plainToken))
				.expiresAt(LocalDateTime.now().plusHours(invitationExpirationHours)).build();
		invitationTokenRepository.save(record);
		return plainToken;
	}

	private String generateSecureToken() {
		byte[] bytes = new byte[TOKEN_BYTES];
		SECURE_RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private String hashToken(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] raw = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			StringBuilder hex = new StringBuilder();
			for (byte b : raw) {
				hex.append(String.format("%02x", b));
			}
			return hex.toString();
		} catch (NoSuchAlgorithmException ex) {
			log.error("Failed to hash invitation token", ex);
			throw new IllegalStateException("Failed to hash invitation token", ex);
		}
	}
}
