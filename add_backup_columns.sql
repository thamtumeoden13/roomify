-- Add backup URL columns to renders table
ALTER TABLE renders
    ADD COLUMN IF NOT EXISTS backup_url TEXT;
ALTER TABLE renders
    ADD COLUMN IF NOT EXISTS upscaled_backup_url TEXT;
