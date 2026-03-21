-- Enforce: one student can be in at most one group
ALTER TABLE user_in_group ADD CONSTRAINT uq_user_in_group_user UNIQUE (user_id);
