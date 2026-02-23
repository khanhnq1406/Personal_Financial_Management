-- Add file_formats column to user_template table
-- Migration: add_file_formats_to_user_template
-- Date: 2026-02-12

ALTER TABLE user_template
ADD COLUMN file_formats JSON AFTER currency;

-- Set default value for existing records
UPDATE user_template
SET file_formats = JSON_ARRAY('csv')
WHERE file_formats IS NULL;
