package pl.freeedu.backend.usergroup.service;

import org.springframework.stereotype.Service;
import pl.freeedu.backend.exception.ErrorCode;
import pl.freeedu.backend.usergroup.dto.UserGroupRequest;
import pl.freeedu.backend.usergroup.dto.UserGroupResponse;
import pl.freeedu.backend.usergroup.exception.UserGroupException;
import pl.freeedu.backend.usergroup.mapper.UserGroupMapper;
import pl.freeedu.backend.usergroup.model.UserGroup;
import pl.freeedu.backend.usergroup.repository.UserGroupRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class UserGroupService {

	private final UserGroupRepository userGroupRepository;
	private final UserGroupMapper userGroupMapper;

	public UserGroupService(UserGroupRepository userGroupRepository, UserGroupMapper userGroupMapper) {
		this.userGroupRepository = userGroupRepository;
		this.userGroupMapper = userGroupMapper;
	}

	public Mono<UserGroupResponse> create(Mono<UserGroupRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			UserGroup userGroup = userGroupMapper.toUserGroup(request);
			return userGroupRepository.save(userGroup);
		}).subscribeOn(Schedulers.boundedElastic()).map(userGroupMapper::toUserGroupResponse));
	}

	public Mono<UserGroupResponse> getById(Integer id) {
		return Mono.fromCallable(() -> userGroupRepository.findById(id)).subscribeOn(Schedulers.boundedElastic())
				.flatMap(optionalUserGroup -> optionalUserGroup
						.map(userGroup -> Mono.just(userGroupMapper.toUserGroupResponse(userGroup)))
						.orElseGet(() -> Mono.error(new UserGroupException(ErrorCode.USER_GROUP_NOT_FOUND))));
	}

	public Flux<UserGroupResponse> getAll() {
		return Mono.fromCallable(userGroupRepository::findAll).subscribeOn(Schedulers.boundedElastic())
				.flatMapMany(Flux::fromIterable).map(userGroupMapper::toUserGroupResponse);
	}

	public Mono<UserGroupResponse> update(Integer id, Mono<UserGroupRequest> requestMono) {
		return requestMono.flatMap(request -> Mono.fromCallable(() -> {
			UserGroup userGroup = userGroupRepository.findById(id)
					.orElseThrow(() -> new UserGroupException(ErrorCode.USER_GROUP_NOT_FOUND));
			userGroup.setName(request.getName());
			userGroup.setDescription(request.getDescription());
			return userGroupRepository.save(userGroup);
		}).subscribeOn(Schedulers.boundedElastic()).map(userGroupMapper::toUserGroupResponse));
	}

	public Mono<Void> delete(Integer id) {
		return Mono.fromCallable(() -> {
			if (!userGroupRepository.existsById(id)) {
				throw new UserGroupException(ErrorCode.USER_GROUP_NOT_FOUND);
			}
			userGroupRepository.deleteById(id);
			return null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}
}
