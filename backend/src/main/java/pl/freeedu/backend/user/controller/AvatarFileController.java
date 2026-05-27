package pl.freeedu.backend.user.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import pl.freeedu.backend.user.service.UserService;
import reactor.core.publisher.Mono;

@RestController
public class AvatarFileController {

	private final UserService userService;

	public AvatarFileController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/uploads/avatars/{fileName:.+}")
	public Mono<ResponseEntity<Resource>> getAvatarFile(@PathVariable String fileName) {
		return userService.getAvatarFile(fileName);
	}
}
