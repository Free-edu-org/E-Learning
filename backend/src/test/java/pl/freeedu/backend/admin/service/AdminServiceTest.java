package pl.freeedu.backend.admin.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import pl.freeedu.backend.admin.dto.*;
import pl.freeedu.backend.user.dto.UserResponse;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.model.Role;
import pl.freeedu.backend.user.model.User;
import pl.freeedu.backend.user.repository.UserRepository;
import pl.freeedu.backend.user.service.UserMapper;
import pl.freeedu.backend.usergroup.exception.UserGroupErrorCode;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.model.UserInGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import pl.freeedu.backend.usergroup.repository.UserInGroupRepository;
import pl.freeedu.backend.usergroup.service.UserGroupPublicIdLookupService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

	@Mock
	private UserRepository userRepository;
	@Mock
	private UserGroupRepository userGroupRepository;
	@Mock
	private UserInGroupRepository userInGroupRepository;
	@Mock
	private UserMapper userMapper;
	@Mock
	private PasswordEncoder passwordEncoder;
	@Mock
	private TransactionTemplate transactionTemplate;

	@Mock
	private UserGroupPublicIdLookupService userGroupPublicIdLookupService;

	@InjectMocks
	private AdminService adminService;

	@BeforeEach
	void setUp() {
		// Mock TransactionTemplate to execute the callback immediately
		lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
			TransactionCallback<?> callback = invocation.getArgument(0);
			return callback.doInTransaction(mock(TransactionStatus.class));
		});
	}

	@Test
	void shouldReturnAdminStats() {
		// given
		when(userRepository.count()).thenReturn(10L);
		when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);
		when(userRepository.countByRole(Role.TEACHER)).thenReturn(2L);
		when(userRepository.countByRole(Role.STUDENT)).thenReturn(7L);
		when(userGroupRepository.count()).thenReturn(3L);

		// when
		Mono<AdminStatsResponse> result = adminService.getStats();

		// then
		StepVerifier.create(result).assertNext(stats -> {
			assertEquals(10L, stats.getTotalUsers());
			assertEquals(1L, stats.getTotalAdmins());
			assertEquals(3L, stats.getTotalGroups());
		}).verifyComplete();
	}

	@Test
	void shouldGetTeachers() {
		// given
		User teacher = User.builder().publicId("pub-" + 1).username("T1").role(Role.TEACHER).build();
		when(userRepository.findByRoleOrderByCreatedAtDesc(Role.TEACHER)).thenReturn(List.of(teacher));
		when(userMapper.toUserResponse(teacher)).thenReturn(UserResponse.builder().publicId("pub-" + 1).build());

		// when
		Flux<UserResponse> result = adminService.getTeachers();

		// then
		StepVerifier.create(result).assertNext(resp -> assertEquals("pub-1", resp.getPublicId())).verifyComplete();
	}

	@Test
	void shouldGetStudentsWithGroupInfo() {
		// given
		User student = User.builder().publicId("pub-" + 1).username("S1").role(Role.STUDENT).build();
		UserGroup group = UserGroup.builder().publicId("pub-" + 10).publicId("group-public-id").name("G1").build();

		when(userGroupRepository.findAll()).thenReturn(List.of(group));
		when(userInGroupRepository.findAllMemberships())
				.thenReturn(List.of(new UserInGroupRepository.UserMembershipProjection() {
					@Override
					public Integer getUserId() {
						return 1;
					}

					@Override
					public Integer getGroupId() {
						return 10;
					}
				}));
		when(userRepository.findByRoleOrderByCreatedAtDesc(Role.STUDENT)).thenReturn(List.of(student));

		// when
		Flux<AdminStudentResponse> result = adminService.getStudents();

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("pub-1", resp.getPublicId());
			assertEquals("G1", resp.getGroupName());
			assertEquals("group-public-id", resp.getGroupPublicId());
		}).verifyComplete();
	}

	@Test
	void shouldCreateStudentSucceed() {
		// given
		AdminCreateStudentRequest req = AdminCreateStudentRequest.builder().email("s@e.com").username("s1")
				.password("p").groupPublicId("group-public-id").build();
		UserGroup group = UserGroup.builder().publicId("pub-" + 10).publicId("group-public-id").name("G1").build();

		when(userRepository.existsByEmail(req.getEmail())).thenReturn(false);
		when(userRepository.existsByUsername(req.getUsername())).thenReturn(false);
		when(userGroupPublicIdLookupService.getRequiredGroup("group-public-id")).thenReturn(group);
		when(passwordEncoder.encode("p")).thenReturn("encoded");
		when(userRepository.save(any())).thenAnswer(inv -> {
			User u = inv.getArgument(0);
			u.setId(1);
			return u;
		});

		// when
		Mono<AdminStudentResponse> result = adminService.createStudent(req);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("pub-1", resp.getPublicId());
			assertEquals("group-public-id", resp.getGroupPublicId());
			verify(userInGroupRepository).save(any());
		}).verifyComplete();
	}

	@Test
	void shouldRejectCreateStudentWhenEmailTaken() {
		// given
		AdminCreateStudentRequest req = AdminCreateStudentRequest.builder().email("s@e.com").build();
		when(userRepository.existsByEmail(req.getEmail())).thenReturn(true);

		// when
		Mono<AdminStudentResponse> result = adminService.createStudent(req);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof UserException);
			assertEquals(UserErrorCode.EMAIL_ALREADY_TAKEN, ((UserException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectCreateStudentWhenUsernameTaken() {
		// given
		AdminCreateStudentRequest req = AdminCreateStudentRequest.builder().username("s1").build();
		when(userRepository.existsByEmail(any())).thenReturn(false);
		when(userRepository.existsByUsername("s1")).thenReturn(true);

		// when
		Mono<AdminStudentResponse> result = adminService.createStudent(req);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof UserException);
			assertEquals(UserErrorCode.USERNAME_ALREADY_TAKEN, ((UserException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldUpdateStudentSucceed() {
		// given
		AdminUpdateStudentRequest req = AdminUpdateStudentRequest.builder().email("new@e.com").username("new")
				.groupPublicId("new-group-public-id").build();
		User student = User.builder().publicId("pub-" + 1).email("old@e.com").username("old").role(Role.STUDENT)
				.build();
		UserGroup newGroup = UserGroup.builder().publicId("pub-" + 11).publicId("new-group-public-id").name("NG")
				.build();

		when(userRepository.findById(1)).thenReturn(Optional.of(student));
		when(userRepository.existsByEmail("new@e.com")).thenReturn(false);
		when(userRepository.existsByUsername("new")).thenReturn(false);
		when(userGroupPublicIdLookupService.getRequiredGroup("new-group-public-id")).thenReturn(newGroup);
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userInGroupRepository.findByUserId(1)).thenReturn(Optional.empty());

		// when
		Mono<AdminStudentResponse> result = adminService.updateStudent(1, req);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertEquals("new", resp.getUsername());
			assertEquals("new-group-public-id", resp.getGroupPublicId());
			verify(userInGroupRepository).save(any());
		}).verifyComplete();
	}

	@Test
	void shouldUpdateStudentRemovingGroup() {
		// given
		AdminUpdateStudentRequest req = AdminUpdateStudentRequest.builder().email("old@e.com").username("old")
				.groupPublicId(null).build();
		User student = User.builder().publicId("pub-" + 1).email("old@e.com").username("old").role(Role.STUDENT)
				.build();
		UserInGroup membership = UserInGroup.builder().userId(1).groupId(10).build();

		when(userRepository.findById(1)).thenReturn(Optional.of(student));
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userInGroupRepository.findByUserId(1)).thenReturn(Optional.of(membership));

		// when
		Mono<AdminStudentResponse> result = adminService.updateStudent(1, req);

		// then
		StepVerifier.create(result).assertNext(resp -> {
			assertNull(resp.getGroupPublicId());
			verify(userInGroupRepository).delete(membership);
		}).verifyComplete();
	}

	@Test
	void shouldRejectUpdateUserNotFound() {
		// given
		when(userRepository.findById(1)).thenReturn(Optional.empty());

		// when
		Mono<AdminStudentResponse> result = adminService.updateStudent(1, new AdminUpdateStudentRequest());

		// then
		StepVerifier.create(result).expectError(UserException.class).verify();
	}

	@Test
	void shouldRejectUpdateUsernameTaken() {
		// given
		AdminUpdateStudentRequest req = AdminUpdateStudentRequest.builder().username("taken").email("old@e.com")
				.build();
		User student = User.builder().publicId("pub-" + 1).email("old@e.com").username("old").role(Role.STUDENT)
				.build();

		when(userRepository.findById(1)).thenReturn(Optional.of(student));
		when(userRepository.existsByUsername("taken")).thenReturn(true);

		// when
		Mono<AdminStudentResponse> result = adminService.updateStudent(1, req);

		// then
		StepVerifier.create(result).expectErrorSatisfies(err -> {
			assertEquals(UserErrorCode.USERNAME_ALREADY_TAKEN, ((UserException) err).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectUpdateNonStudent() {
		// given
		User admin = User.builder().publicId("pub-" + 1).role(Role.ADMIN).build();
		when(userRepository.findById(1)).thenReturn(Optional.of(admin));

		// when
		Mono<AdminStudentResponse> result = adminService.updateStudent(1, new AdminUpdateStudentRequest());

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof UserException);
			assertEquals(UserErrorCode.INVALID_STUDENT_ASSIGNMENT, ((UserException) error).getErrorCode());
		}).verify();
	}

	@Test
	void shouldRejectCreateStudentWhenGroupNotFound() {
		// given
		AdminCreateStudentRequest req = AdminCreateStudentRequest.builder().groupPublicId("missing-group").build();
		when(userGroupPublicIdLookupService.getRequiredGroup("missing-group"))
				.thenThrow(new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));

		// when
		Mono<AdminStudentResponse> result = adminService.createStudent(req);

		// then
		StepVerifier.create(result).expectErrorSatisfies(error -> {
			assertTrue(error instanceof UserGroupException);
			assertEquals(UserGroupErrorCode.USER_GROUP_NOT_FOUND, ((UserGroupException) error).getErrorCode());
		}).verify();
	}
}
