package pl.freeedu.backend.usergroup.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;

@Service
public class UserGroupPublicIdLookupService {

	private final UserGroupRepository userGroupRepository;

	public UserGroupPublicIdLookupService(UserGroupRepository userGroupRepository) {
		this.userGroupRepository = userGroupRepository;
	}

	public UserGroup getRequiredGroup(String publicId) {
		return userGroupRepository.findByPublicId(publicId)
				.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
	}

	public Integer getRequiredInternalId(String publicId) {
		return getRequiredGroup(publicId).getId();
	}
}
