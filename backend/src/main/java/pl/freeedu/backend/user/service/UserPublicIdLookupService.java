package pl.freeedu.backend.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.user.exception.UserErrorCode;
import pl.freeedu.backend.user.exception.UserException;
import pl.freeedu.backend.user.repository.UserRepository;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPublicIdLookupService {
	private final UserRepository userRepository;

	public Mono<Integer> getInternalId(String publicId) {
		return Mono.fromCallable(
				() -> userRepository.findByPublicId(publicId).map(user -> user.getId()).orElseThrow(() -> {
					log.warn("Lookup failed: User with publicId: {} not found", publicId);
					return new UserException(UserErrorCode.USER_NOT_FOUND);
				})).subscribeOn(Schedulers.boundedElastic());
	}
}
