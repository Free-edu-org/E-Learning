ALTER TABLE choose_tasks ADD COLUMN hint_image_file_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE write_tasks ADD COLUMN hint_image_file_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE scatter_tasks ADD COLUMN hint_image_file_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE speak_tasks ADD COLUMN hint_image_file_name VARCHAR(255) DEFAULT NULL;
