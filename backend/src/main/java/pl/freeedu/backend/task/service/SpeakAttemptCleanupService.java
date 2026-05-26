package pl.freeedu.backend.task.service;

import java.time.Clock;
import java.time.LocalDateTime;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.freeedu.backend.task.repository.SpeakAttemptRepository;

@Slf4j
@Service
public class SpeakAttemptCleanupService {

	private final SpeakAttemptRepository speakAttemptRepository;
	private final Clock clock;
	private final int retentionDays;

	@Autowired
	public SpeakAttemptCleanupService(SpeakAttemptRepository speakAttemptRepository,
			@Value("${application.stt.cleanup.retention-days:14}") int retentionDays) {
		this(speakAttemptRepository, retentionDays, Clock.systemDefaultZone());
	}

	SpeakAttemptCleanupService(SpeakAttemptRepository speakAttemptRepository, int retentionDays, Clock clock) {
		this.speakAttemptRepository = speakAttemptRepository;
		this.clock = clock;
		this.retentionDays = retentionDays;
	}

	@Scheduled(cron = "${application.stt.cleanup.cron:0 0 3 * * *}")
	@Transactional
	public void cleanupOldUnusedAttempts() {
		LocalDateTime cutoff = LocalDateTime.now(clock).minusDays(retentionDays);
		long deletedCount = speakAttemptRepository.deleteBySubmittedAtIsNullAndCreatedAtBefore(cutoff);
		log.info("Speak attempt cleanup finished. Deleted {} unused attempts older than {} days.", deletedCount,
				retentionDays);
	}
}
