ALTER TABLE lesson_attachments DROP FOREIGN KEY fk_lesson_attachment_lesson;
ALTER TABLE lesson_attachments DROP INDEX uq_lesson_attachment_lesson;
ALTER TABLE lesson_attachments ADD INDEX idx_lesson_attachment_lesson (lesson_id);
ALTER TABLE lesson_attachments ADD CONSTRAINT fk_lesson_attachment_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE;
