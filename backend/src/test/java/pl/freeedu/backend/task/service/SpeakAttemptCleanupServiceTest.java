package pl.freeedu.backend.task.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.freeedu.backend.task.repository.SpeakAttemptRepository;

@ExtendWith(MockitoExtension.class)
class SpeakAttemptCleanupServiceTest {

	@Mock
	private SpeakAttemptRepository speakAttemptRepository;

	private SpeakAttemptCleanupService cleanupService;

	@BeforeEach
	void setUp() {
		Clock fixedClock = Clock.fixed(Instant.parse("2026-05-17T10:15:30Z"), ZoneId.of("Europe/Warsaw"));
		cleanupService = new SpeakAttemptCleanupService(speakAttemptRepository, 14, fixedClock);
	}

	@Test
	void shouldDeleteOnlyOldUnusedAttempts() {
		when(speakAttemptRepository.deleteBySubmittedAtIsNullAndCreatedAtBefore(any(LocalDateTime.class)))
				.thenReturn(7L);

		cleanupService.cleanupOldUnusedAttempts();

		verify(speakAttemptRepository)
				.deleteBySubmittedAtIsNullAndCreatedAtBefore(LocalDateTime.of(2026, 5, 3, 12, 15, 30));
	}

	@Test
	void shouldKeepUsedAttemptsByUsingSubmittedAtNullQueryOnly() {
		when(speakAttemptRepository.deleteBySubmittedAtIsNullAndCreatedAtBefore(any(LocalDateTime.class)))
				.thenReturn(0L);

		cleanupService.cleanupOldUnusedAttempts();

		verify(speakAttemptRepository)
				.deleteBySubmittedAtIsNullAndCreatedAtBefore(LocalDateTime.of(2026, 5, 3, 12, 15, 30));
	}
}
