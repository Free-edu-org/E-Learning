package pl.freeedu.backend.invitation.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.auth.dto.MessageResponse;
import pl.freeedu.backend.emailverification.service.EmailVerificationService;
import pl.freeedu.backend.invitation.dto.CreateInvitationRequest;
import pl.freeedu.backend.invitation.dto.InvitationInfoResponse;
import pl.freeedu.backend.invitation.dto.InvitationResponse;
import pl.freeedu.backend.invitation.dto.RegisterWithInvitationRequest;
import pl.freeedu.backend.invitation.exception.InvitationErrorCode;
import pl.freeedu.backend.invitation.exception.InvitationException;
import pl.freeedu.backend.invitation.model.GroupInvitation;
import pl.freeedu.backend.invitation.repository.GroupInvitationRepository;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.model.UserStatus;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class InvitationService {

	private final GroupInvitationRepository invitationRepository;
	private final UserGroupRepository userGroupRepository;
	private final UserRepository userRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final SecurityService securityService;
	private final PasswordEncoder passwordEncoder;
	private final EmailVerificationService emailVerificationService;
	private final TransactionTemplate transactionTemplate;

	public InvitationService(GroupInvitationRepository invitationRepository, UserGroupRepository userGroupRepository,
			UserRepository userRepository, UserInGroupRepository userInGroupRepository, SecurityService securityService,
			PasswordEncoder passwordEncoder, EmailVerificationService emailVerificationService,
			TransactionTemplate transactionTemplate) {
		this.invitationRepository = invitationRepository;
		this.userGroupRepository = userGroupRepository;
		this.userRepository = userRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.securityService = securityService;
		this.passwordEncoder = passwordEncoder;
		this.emailVerificationService = emailVerificationService;
		this.transactionTemplate = transactionTemplate;
	}

	public Mono<InvitationResponse> createInvitation(String groupPublicId, Mono<CreateInvitationRequest> requestMono) {
		return requestMono
				.flatMap(request -> securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
					log.info("Creating invitation for group: {}, by user ID: {}", groupPublicId, userId);
					UserGroup group = userGroupRepository.findByPublicId(groupPublicId)
							.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));

					GroupInvitation invitation = GroupInvitation.builder().groupId(group.getId()).createdBy(userId)
							.maxUses(request.getMaxUses()).expiresAt(request.getExpiresAt()).build();
					GroupInvitation saved = invitationRepository.save(invitation);
					log.info("Invitation created. Token: {}, Group ID: {}", saved.getToken(), group.getId());
					return toResponse(saved, group);
				}).subscribeOn(Schedulers.boundedElastic())));
	}

	public Flux<InvitationResponse> getInvitations(String groupPublicId) {
		return securityService.getCurrentUserId().flatMapMany(userId -> Mono.fromCallable(() -> {
			log.debug("Fetching invitations for group: {}", groupPublicId);
			UserGroup group = userGroupRepository.findByPublicId(groupPublicId)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			List<GroupInvitation> invitations = invitationRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());
			return invitations.stream().map(inv -> toResponse(inv, group)).toList();
		}).subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable));
	}

	public Mono<Void> deactivateInvitation(String groupPublicId, String token) {
		return securityService.getCurrentUserId().flatMap(userId -> Mono.fromCallable(() -> {
			log.info("Deactivating invitation token: {} in group: {}", token, groupPublicId);
			UserGroup group = userGroupRepository.findByPublicId(groupPublicId)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			GroupInvitation invitation = invitationRepository.findByToken(token)
					.orElseThrow(() -> new InvitationException(InvitationErrorCode.INVITATION_NOT_FOUND));
			if (!invitation.getGroupId().equals(group.getId())) {
				throw new InvitationException(InvitationErrorCode.INVITATION_NOT_FOUND);
			}
			invitation.setIsActive(false);
			invitationRepository.save(invitation);
			log.info("Invitation token: {} deactivated successfully", token);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic())).then();
	}

	public Mono<InvitationInfoResponse> getInvitationInfo(String token) {
		return Mono.fromCallable(() -> {
			log.debug("Fetching public info for invitation token: {}", token);
			GroupInvitation invitation = invitationRepository.findByToken(token)
					.orElseThrow(() -> new InvitationException(InvitationErrorCode.INVITATION_NOT_FOUND));
			validateInvitation(invitation);
			UserGroup group = userGroupRepository.findById(invitation.getGroupId())
					.orElseThrow(() -> new InvitationException(InvitationErrorCode.INVITATION_NOT_FOUND));
			return InvitationInfoResponse.builder().token(invitation.getToken()).groupName(group.getName())
					.maxUses(invitation.getMaxUses()).usedCount(invitation.getUsedCount()).build();
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<MessageResponse> registerWithInvitation(Mono<RegisterWithInvitationRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			log.info("Student registration via invitation token: {}", request.getToken());
			User createdStudent = transactionTemplate.execute(status -> {
				GroupInvitation invitation = invitationRepository.findByToken(request.getToken())
						.orElseThrow(() -> new InvitationException(InvitationErrorCode.INVITATION_NOT_FOUND));
				validateInvitation(invitation);

				if (userRepository.existsByEmail(request.getEmail())) {
					log.warn("Registration via invitation failed: Email already taken");
					throw new UserException(UserErrorCode.EMAIL_ALREADY_TAKEN);
				}
				if (userRepository.existsByUsername(request.getUsername())) {
					log.warn("Registration via invitation failed: Username already taken");
					throw new UserException(UserErrorCode.USERNAME_ALREADY_TAKEN);
				}

				User student = User.builder().email(request.getEmail()).username(request.getUsername())
						.password(passwordEncoder.encode(request.getPassword())).role(Role.STUDENT)
						.status(UserStatus.EMAIL_VERIFICATION_PENDING).build();
				userRepository.save(student);

				userInGroupRepository
						.save(UserInGroup.builder().userId(student.getId()).groupId(invitation.getGroupId()).build());

				invitationRepository.incrementUsedCount(invitation.getId());
				log.info("Student registered via invitation. User ID: {}, Group ID: {}", student.getId(),
						invitation.getGroupId());
				return student;
			});
			String verificationToken = emailVerificationService.createVerificationForUser(createdStudent);
			emailVerificationService.sendVerificationEmail(createdStudent, verificationToken);
			return MessageResponse.builder().message("Email verification required.").build();
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	private void validateInvitation(GroupInvitation invitation) {
		if (!invitation.getIsActive()) {
			throw new InvitationException(InvitationErrorCode.INVITATION_INACTIVE);
		}
		if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new InvitationException(InvitationErrorCode.INVITATION_EXPIRED);
		}
		if (invitation.getUsedCount() >= invitation.getMaxUses()) {
			throw new InvitationException(InvitationErrorCode.INVITATION_LIMIT_REACHED);
		}
	}

	private InvitationResponse toResponse(GroupInvitation invitation, UserGroup group) {
		return InvitationResponse.builder().token(invitation.getToken()).groupPublicId(group.getPublicId())
				.groupName(group.getName()).maxUses(invitation.getMaxUses()).usedCount(invitation.getUsedCount())
				.expiresAt(invitation.getExpiresAt()).isActive(invitation.getIsActive())
				.createdAt(invitation.getCreatedAt()).build();
	}
}
