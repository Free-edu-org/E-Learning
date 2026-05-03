package pl.freeedu.backend.usergroup.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;

@ExtendWith(MockitoExtension.class)
class UserGroupPublicIdLookupServiceTest {

	@Mock
	private UserGroupRepository userGroupRepository;

	@InjectMocks
	private UserGroupPublicIdLookupService userGroupPublicIdLookupService;

	@Test
	void shouldReturnInternalIdWhenGroupExistsForPublicId() {
		// given
		UserGroup group = UserGroup.builder().id(15).publicId("group-public-id").build();
		when(userGroupRepository.findByPublicId("group-public-id")).thenReturn(Optional.of(group));

		// when
		Integer internalId = userGroupPublicIdLookupService.getRequiredInternalId("group-public-id");

		// then
		assertEquals(15, internalId);
		verify(userGroupRepository).findByPublicId("group-public-id");
	}

	@Test
	void shouldReturnGroupWhenGroupExistsForPublicId() {
		// given
		UserGroup group = UserGroup.builder().id(18).publicId("group-public-id").build();
		when(userGroupRepository.findByPublicId("group-public-id")).thenReturn(Optional.of(group));

		// when
		UserGroup foundGroup = userGroupPublicIdLookupService.getRequiredGroup("group-public-id");

		// then
		assertSame(group, foundGroup);
		verify(userGroupRepository).findByPublicId("group-public-id");
	}

	@Test
	void shouldThrowGroupNotFoundWhenPublicIdDoesNotExist() {
		// given
		when(userGroupRepository.findByPublicId("missing-group-public-id")).thenReturn(Optional.empty());

		// when
		UserGroupException exception = assertThrows(UserGroupException.class,
				() -> userGroupPublicIdLookupService.getRequiredInternalId("missing-group-public-id"));

		// then
		assertEquals(UserGroupErrorCode.USER_GROUP_NOT_FOUND, exception.getErrorCode());
		verify(userGroupRepository).findByPublicId("missing-group-public-id");
	}

	@Test
	void shouldNotFallbackToInternalIntegerIdWhenPathVariableLooksNumeric() {
		// given
		when(userGroupRepository.findByPublicId("15")).thenReturn(Optional.empty());

		// when
		UserGroupException exception = assertThrows(UserGroupException.class,
				() -> userGroupPublicIdLookupService.getRequiredInternalId("15"));

		// then
		assertEquals(UserGroupErrorCode.USER_GROUP_NOT_FOUND, exception.getErrorCode());
		verify(userGroupRepository).findByPublicId("15");
	}
}
