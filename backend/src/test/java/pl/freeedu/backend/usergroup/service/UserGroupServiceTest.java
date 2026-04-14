package pl.freeedu.backend.usergroup.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.freeedu.backend.security.principal.CustomUserDetails;
import pl.freeedu.backend.security.service.SecurityService;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.mapper.UserGroupMapper;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserGroupServiceTest {

	@Mock
	private UserGroupRepository userGroupRepository;
	@Mock
	private UserInGroupRepository userInGroupRepository;
	@Mock
	private UserRepository userRepository;
	@Mock
	private UserGroupMapper userGroupMapper;
	@Mock
	private SecurityService securityService;

	@InjectMocks
	private UserGroupService userGroupService;

	@Test
	void shouldCreateGroupSucceed() {
		// given
		UserGroupRequest req = new UserGroupRequest("G1", "D1", 10);
		CustomUserDetails admin = new CustomUserDetails(1, "a", "p", Role.ADMIN);
		User teacher = User.builder().id(10).role(Role.TEACHER).build();

		when(securityService.getCurrentUser()).thenReturn(Mono.just(admin));
		when(userGroupRepository.existsByName("G1")).thenReturn(false);
		when(userGroupMapper.toUserGroup(req)).thenReturn(UserGroup.builder().name("G1").build());
		when(userRepository.findById(10)).thenReturn(Optional.of(teacher));
		when(userGroupRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userGroupMapper.toUserGroupResponse(any())).thenReturn(UserGroupResponse.builder().name("G1").build());

		// when
		Mono<UserGroupResponse> result = userGroupService.create(Mono.just(req));

		// then
		StepVerifier.create(result).assertNext(resp -> assertEquals("G1", resp.getName())).verifyComplete();
	}

	@Test
	void shouldThrowWhenGroupNameExistsInCreate() {
		// given
		UserGroupRequest req = new UserGroupRequest("Exists", null, null);
		when(securityService.getCurrentUser()).thenReturn(Mono.just(new CustomUserDetails(1, "u", "p", Role.ADMIN)));
		when(userGroupRepository.existsByName("Exists")).thenReturn(true);

		// when
		Mono<UserGroupResponse> result = userGroupService.create(Mono.just(req));

		// then
		StepVerifier.create(result).expectError(UserGroupException.class).verify();
	}

	@Test
	void shouldGetById() {
		// given
		UserGroup group = UserGroup.builder().id(1).name("G1").build();
		when(userGroupRepository.findById(1)).thenReturn(Optional.of(group));
		when(userGroupMapper.toUserGroupResponse(group)).thenReturn(UserGroupResponse.builder().id(1).build());

		// when
		Mono<UserGroupResponse> result = userGroupService.getById(1);

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals(1, r.getId())).verifyComplete();
	}

	@Test
	void shouldThrowWhenGroupNotFoundInGetById() {
		// given
		when(userGroupRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<UserGroupResponse> result = userGroupService.getById(1);

		// then
		StepVerifier.create(result).expectError(UserGroupException.class).verify();
	}

	@Test
	void shouldGetAllGroupsWithCounts() {
		// given
		UserGroup g1 = UserGroup.builder().id(1).build();
		when(userGroupRepository.findAll()).thenReturn(List.of(g1));
		when(userInGroupRepository.countAllByGroupId())
				.thenReturn(List.of(new UserInGroupRepository.GroupCountProjection() {
					@Override
					public Integer getGroupId() {
						return 1;
					}

					@Override
					public Long getCount() {
						return 5L;
					}
				}));
		when(userGroupMapper.toUserGroupResponse(g1)).thenReturn(UserGroupResponse.builder().id(1).build());

		// when
		Flux<UserGroupResponse> result = userGroupService.getAll();

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals(5, r.getStudentCount())).verifyComplete();
	}

	@Test
	void shouldGetVisibleGroupsForAdmin() {
		// given
		CustomUserDetails admin = new CustomUserDetails(1, "a", "p", Role.ADMIN);
		when(securityService.getCurrentUser()).thenReturn(Mono.just(admin));
		when(userGroupRepository.findAll()).thenReturn(List.of());

		// when
		Flux<UserGroupResponse> result = userGroupService.getVisibleGroups();

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userGroupRepository).findAll();
	}

	@Test
	void shouldGetVisibleGroupsForTeacher() {
		// given
		CustomUserDetails teacher = new CustomUserDetails(10, "t", "p", Role.TEACHER);
		when(securityService.getCurrentUser()).thenReturn(Mono.just(teacher));
		when(userGroupRepository.findByTeacherId(10)).thenReturn(List.of());

		// when
		Flux<UserGroupResponse> result = userGroupService.getVisibleGroups();

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userGroupRepository).findByTeacherId(10);
	}

	@Test
	void shouldUpdateGroup() {
		// given
		UserGroupRequest req = new UserGroupRequest("NewName", null, null);
		UserGroup group = UserGroup.builder().id(1).name("OldName").build();
		CustomUserDetails admin = new CustomUserDetails(1, "a", "p", Role.ADMIN);

		when(securityService.getCurrentUser()).thenReturn(Mono.just(admin));
		when(userGroupRepository.findById(1)).thenReturn(Optional.of(group));
		when(userGroupRepository.existsByName("NewName")).thenReturn(false);
		when(userGroupRepository.save(any())).thenReturn(group);
		when(userGroupMapper.toUserGroupResponse(group))
				.thenReturn(UserGroupResponse.builder().name("NewName").build());

		// when
		Mono<UserGroupResponse> result = userGroupService.update(1, Mono.just(req));

		// then
		StepVerifier.create(result).assertNext(r -> assertEquals("NewName", r.getName())).verifyComplete();
	}

	@Test
	void shouldDeleteGroup() {
		// given
		UserGroup group = UserGroup.builder().id(1).build();
		when(userGroupRepository.findById(1)).thenReturn(Optional.of(group));

		// when
		Mono<Void> result = userGroupService.delete(1);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userGroupRepository).delete(group);
	}

	@Test
	void shouldThrowWhenGroupNotFoundInDelete() {
		// given
		when(userGroupRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = userGroupService.delete(1);

		// then
		StepVerifier.create(result).expectError(UserGroupException.class).verify();
	}

	@Test
	void shouldAddMemberSucceed() {
		// given
		when(userGroupRepository.existsById(1)).thenReturn(true);
		when(userRepository.findById(10)).thenReturn(Optional.of(User.builder().id(10).role(Role.STUDENT).build()));
		when(userInGroupRepository.existsByUserId(10)).thenReturn(false);

		// when
		Mono<Void> result = userGroupService.addMember(1, 10);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userInGroupRepository).save(any());
	}

	@Test
	void shouldThrowWhenStudentAlreadyInGroupInAddMember() {
		// given
		when(userGroupRepository.existsById(1)).thenReturn(true);
		when(userRepository.findById(10)).thenReturn(Optional.of(User.builder().id(10).role(Role.STUDENT).build()));
		when(userInGroupRepository.existsByUserId(10)).thenReturn(true);

		// when
		Mono<Void> result = userGroupService.addMember(1, 10);

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertEquals(UserGroupErrorCode.STUDENT_ALREADY_IN_GROUP, ((UserGroupException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectAddMemberNonStudent() {
		// given
		when(userGroupRepository.existsById(1)).thenReturn(true);
		when(userRepository.findById(10)).thenReturn(Optional.of(User.builder().id(10).role(Role.TEACHER).build()));

		// when
		Mono<Void> result = userGroupService.addMember(1, 10);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof UserGroupException);
			assertEquals(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP, ((UserGroupException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRemoveMember() {
		// given
		when(userGroupRepository.existsById(1)).thenReturn(true);
		UserInGroup membership = UserInGroup.builder().build();
		when(userInGroupRepository.findByUserIdAndGroupId(10, 1)).thenReturn(Optional.of(membership));

		// when
		Mono<Void> result = userGroupService.removeMember(1, 10);

		// then
		StepVerifier.create(result).verifyComplete();
		verify(userInGroupRepository).delete(membership);
	}

	@Test
	void shouldThrowWhenMemberNotInGroupInRemoveMember() {
		// given
		when(userGroupRepository.existsById(1)).thenReturn(true);
		when(userInGroupRepository.findByUserIdAndGroupId(10, 1)).thenReturn(Optional.empty());

		// when
		Mono<Void> result = userGroupService.removeMember(1, 10);

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertEquals(UserGroupErrorCode.MEMBER_NOT_IN_GROUP, ((UserGroupException) err).getErrorCode());
		}).verify();
	}
}