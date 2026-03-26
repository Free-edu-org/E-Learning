package pl.freeedu.backend.admin.controller.v1;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Dashboard", description = "Endpoints dedicated for Admin's Dashboard BFF")
public class AdminDashboardController {

	// TODO: Replace with AdminService and real DTO mappings
	@Operation(summary = "Get global system stats")
	@GetMapping("/stats")
	@PreAuthorize("hasRole('ADMIN')")
	@ResponseStatus(HttpStatus.OK)
	public Mono<String> getGlobalStats() {
		return Mono.just("System stats placeholder (e.g. total users, total classes)");
	}
}
