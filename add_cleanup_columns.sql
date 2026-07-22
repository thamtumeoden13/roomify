-- Add last_viewed_at, cloudinary public_id, and drive file id columns to renders table
ALTER TABLE renders ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE renders ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
ALTER TABLE renders ADD COLUMN IF NOT EXISTS upscaled_cloudinary_public_id TEXT;
ALTER TABLE renders ADD COLUMN IF NOT EXISTS drive_file_id TEXT;
ALTER TABLE renders ADD COLUMN IF NOT EXISTS upscaled_drive_file_id TEXT;

-- Index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_renders_last_viewed_at ON renders(last_viewed_at);
