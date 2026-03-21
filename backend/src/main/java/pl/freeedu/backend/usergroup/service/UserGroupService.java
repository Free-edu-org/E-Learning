package pl.freeedu.backend.usergroup.service;

import org.springframework.stereotype.Service;
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
import reactor.core.scheduler.Schedulers;

@Service
public class UserGroupService {

	private final UserGroupRepository userGroupRepository;
	private final UserInGroupRepository userInGroupRepository;
	private final UserRepository userRepository;
	private final UserGroupMapper userGroupMapper;

	public UserGroupService(UserGroupRepository userGroupRepository, UserInGroupRepository userInGroupRepository,
			UserRepository userRepository, UserGroupMapper userGroupMapper) {
		this.userGroupRepository = userGroupRepository;
		this.userInGroupRepository = userInGroupRepository;
		this.userRepository = userRepository;
		this.userGroupMapper = userGroupMapper;
	}

	public Mono<UserGroupResponse> create(Mono<UserGroupRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			if (userGroupRepository.existsByName(request.getName())) {
				throw new UserGroupException(UserGroupErrorCode.GROUP_NAME_ALREADY_EXISTS);
			}
			UserGroup userGroup = userGroupMapper.toUserGroup(request);
			UserGroup saved = userGroupRepository.save(userGroup);
			return toResponseWithCount(saved);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<UserGroupResponse> getById(Integer id) {
		return Mono.fromCallable(() -> {
			UserGroup group = userGroupRepository.findById(id)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			return toResponseWithCount(group);
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Flux<UserGroupResponse> getAll() {
		return Mono.fromCallable(() -> userGroupRepository.findAll().stream().map(this::toResponseWithCount).toList())
				.subscribeOn(Schedulers.boundedElastic()).flatMapMany(Flux::fromIterable);
	}

	public Mono<UserGroupResponse> update(Integer id, Mono<UserGroupRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			UserGroup group = userGroupRepository.findById(id)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			if (!group.getName().equals(request.getName()) && userGroupRepository.existsByName(request.getName())) {
				throw new UserGroupException(UserGroupErrorCode.GROUP_NAME_ALREADY_EXISTS);
			}
			group.setName(request.getName());
			group.setDescription(request.getDescription());
			UserGroup saved = userGroupRepository.save(group);
			return toResponseWithCount(saved);
		}).subscribeOn(Schedulers.boundedElastic()));
	}

	public Mono<Void> delete(Integer id) {
		return Mono.fromCallable(() -> {
			UserGroup group = userGroupRepository.findById(id)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND));
			userGroupRepository.delete(group);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	public Mono<Void> addMember(Integer groupId, Integer userId) {
		return Mono.fromCallable(() -> {
			if (!userGroupRepository.existsById(groupId)) {
				throw new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND);
			}
			User user = userRepository.findById(userId)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP));
			if (user.getRole() != Role.STUDENT) {
				throw new UserGroupException(UserGroupErrorCode.INVALID_ROLE_FOR_GROUP);
			}
			if (userInGroupRepository.existsByUserId(userId)) {
				throw new UserGroupException(UserGroupErrorCode.STUDENT_ALREADY_IN_GROUP);
			}
			userInGroupRepository.save(UserInGroup.builder().userId(userId).groupId(groupId).build());
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	public Mono<Void> removeMember(Integer groupId, Integer userId) {
		return Mono.fromCallable(() -> {
			if (!userGroupRepository.existsById(groupId)) {
				throw new UserGroupException(UserGroupErrorCode.USER_GROUP_NOT_FOUND);
			}
			UserInGroup membership = userInGroupRepository.findByUserIdAndGroupId(userId, groupId)
					.orElseThrow(() -> new UserGroupException(UserGroupErrorCode.MEMBER_NOT_IN_GROUP));
			userInGroupRepository.delete(membership);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	private UserGroupResponse toResponseWithCount(UserGroup group) {
		UserGroupResponse response = userGroupMapper.toUserGroupResponse(group);
		response.setStudentCount(userInGroupRepository.countByGroupId(group.getId()));
		return response;
	}
}
