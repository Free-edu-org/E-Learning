-- =============================================================================
-- Flyway history reset — run once after pulling the migration consolidation
--
-- When to use:
--   Your local database already has migrations V1_1 through V1_17 (+ V2_1 seed)
--   applied. After the consolidation those files are gone and replaced by a
--   single V1_1__initial_schema.sql.  Flyway would reject the start because it
--   sees unknown checksums in its history.  This script clears the old records
--   and inserts a single baseline row so Flyway treats the existing schema as
--   already up-to-date.
--
-- How to run (once, on your local machine):
--   docker exec -i freeedu-mysql mysql -u root -proot_pass freeedu < reset_flyway_history.sql
--
-- Safe to run:  touches ONLY flyway_schema_history, never your data tables.
-- =============================================================================

DELETE FROM flyway_schema_history;

-- Baseline row: tells Flyway "V1_1 is already applied, start from here"
INSERT INTO flyway_schema_history
    (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES
    (1, '1.1', 'initial schema', 'SQL', 'V1_1__initial_schema.sql', NULL, 'root', NOW(), 0, 1);

-- Re-insert the seed row so Flyway knows V2_1 is also already applied
INSERT INTO flyway_schema_history
    (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES
    (2, '2.1', 'seed tables', 'SQL', 'V2_1__seed_tables.sql', NULL, 'root', NOW(), 0, 1);
