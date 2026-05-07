package pl.freeedu.backend.achievement;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AchievementMigrationContractTest {

	@Test
	void shouldKeepFinalAchievementCoreInInitialSchemaAndSeeds() throws Exception {
		String schema = Files.readString(Path.of("src/main/resources/db/migration/V1_1__initial_schema.sql"));
		String seed = Files.readString(Path.of("src/main/resources/db/seed/V2_1__seed_tables.sql"));

		assertTrue(schema.contains("CREATE TABLE achievements"));
		assertTrue(schema.contains("code        VARCHAR(64)  NOT NULL"));
		assertTrue(schema.contains("type        VARCHAR(64)  NOT NULL"));
		assertTrue(schema.contains("threshold   INT          DEFAULT NULL"));
		assertTrue(schema.contains("active      TINYINT(1)   NOT NULL DEFAULT 1"));
		assertTrue(schema.contains("sort_order  INT          DEFAULT NULL"));
		assertTrue(schema.contains("UNIQUE KEY uk_achievements_code (code)"));
		assertTrue(schema.contains("UNIQUE KEY uk_user_get_achievement_user_achievement (user_id, achievement_id)"));
		assertTrue(schema.contains("notification_seen_at TIMESTAMP NULL DEFAULT NULL"));
		assertTrue(schema.contains("CREATE TABLE group_invitations"));

		assertTrue(seed.contains("FIRST_LESSON"));
		assertTrue(seed.contains("LESSONS_COMPLETED"));
		assertTrue(seed.contains("AVATAR_CHANGED"));
		assertTrue(seed.contains("'AVATAR_CHANGED', NULL"));
		assertTrue(seed.contains("TEN_POINTS"));
		assertTrue(seed.contains("'POINTS', 10"));
	}
}
