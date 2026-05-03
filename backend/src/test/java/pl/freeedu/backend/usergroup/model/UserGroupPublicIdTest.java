package pl.freeedu.backend.usergroup.model;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class UserGroupPublicIdTest {

	@Test
	void shouldGenerateUniqueUuidPublicIdsWhenNewGroupsAreCreated() {
		// given
		UserGroup firstGroup = UserGroup.builder().id(10).name("Group 1").description("Desc 1").build();
		UserGroup secondGroup = UserGroup.builder().id(11).name("Group 2").description("Desc 2").build();

		// when
		firstGroup.ensurePublicId();
		secondGroup.ensurePublicId();

		// then
		assertNotNull(firstGroup.getPublicId());
		assertNotNull(secondGroup.getPublicId());
		assertFalse(firstGroup.getPublicId().isBlank());
		assertFalse(secondGroup.getPublicId().isBlank());
		assertDoesNotThrow(() -> UUID.fromString(firstGroup.getPublicId()));
		assertDoesNotThrow(() -> UUID.fromString(secondGroup.getPublicId()));
		assertNotEquals(firstGroup.getPublicId(), secondGroup.getPublicId());
		assertNotEquals(String.valueOf(firstGroup.getId()), firstGroup.getPublicId());
		assertNotEquals(String.valueOf(secondGroup.getId()), secondGroup.getPublicId());
	}

	@Test
	void shouldKeepExistingPublicIdWhenAlreadyProvided() {
		// given
		String existingPublicId = "11111111-1111-1111-1111-111111111111";
		UserGroup group = UserGroup.builder().id(22).publicId(existingPublicId).name("Group").description("Desc")
				.build();

		// when
		group.ensurePublicId();

		// then
		org.junit.jupiter.api.Assertions.assertEquals(existingPublicId, group.getPublicId());
		assertNotEquals(String.valueOf(group.getId()), group.getPublicId());
		assertNotNull(group.getPublicId());
		assertNotEquals("", group.getPublicId());
		assertNotEquals(" ", group.getPublicId());
	}
}
