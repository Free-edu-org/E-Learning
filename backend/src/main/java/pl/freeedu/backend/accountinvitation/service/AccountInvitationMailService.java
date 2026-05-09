package pl.freeedu.backend.accountinvitation.service;

public interface AccountInvitationMailService {

	void sendInvitationEmail(String toEmail, String inviteToken);
}
