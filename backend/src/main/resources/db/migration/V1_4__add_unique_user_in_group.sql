-- Enforce: one student can be in at most one group
-- Cleanup: keep the row with the smallest id for each user_id, delete any additional duplicates
DELETE FROM user_in_group
WHERE id NOT IN (
    SELECT MIN(id)
    FROM (
        SELECT MIN(id) as id
        FROM user_in_group
        GROUP BY user_id
    ) AS keep
);

-- Add UNIQUE constraint on user_id to enforce one user = one group at DB level
ALTER TABLE user_in_group ADD CONSTRAINT uq_user_in_group_user UNIQUE (user_id);

-- Drop the old redundant UNIQUE constraint on (user_id, group_id)
-- since UNIQUE(user_id) now prevents multiple groups per user anyway
ALTER TABLE user_in_group DROP CONSTRAINT uq_user_in_group_user_group;
