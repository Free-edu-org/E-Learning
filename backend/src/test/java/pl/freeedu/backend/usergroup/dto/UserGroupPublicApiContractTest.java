package pl.freeedu.backend.usergroup.dto;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import pl.freeedu.backend.lesson.dto.GroupDto;
import pl.freeedu.backend.teacher.dto.TeacherStudentResponse;
import pl.freeedu.backend.admin.dto.AdminStudentResponse;

class UserGroupPublicApiContractTest {

	@Test
	void shouldExposePublicIdForGroupDtosInPublicApi() {
		Set<String> userGroupResponseFields = fieldNames(UserGroupResponse.class);
		Set<String> groupDtoFields = fieldNames(GroupDto.class);
		Set<String> teacherStudentResponseFields = fieldNames(TeacherStudentResponse.class);
		Set<String> adminStudentResponseFields = fieldNames(AdminStudentResponse.class);

		assertTrue(userGroupResponseFields.contains("publicId"));
		assertTrue(groupDtoFields.contains("publicId"));
		assertTrue(teacherStudentResponseFields.contains("groupPublicId"));
		assertTrue(adminStudentResponseFields.contains("groupPublicId"));
	}

	@Test
	void shouldNotExposeInternalGroupIdFieldsForPublicGroupReferences() {
		assertFalse(fieldNames(UserGroupResponse.class).contains("id"));
		assertFalse(fieldNames(GroupDto.class).contains("id"));
		assertFalse(fieldNames(TeacherStudentResponse.class).contains("groupId"));
		assertFalse(fieldNames(AdminStudentResponse.class).contains("groupId"));
	}

	private Set<String> fieldNames(Class<?> type) {
		return Arrays.stream(type.getDeclaredFields()).map(Field::getName).collect(Collectors.toSet());
	}
}
