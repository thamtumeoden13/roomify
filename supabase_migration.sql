-- Create the renders table
CREATE TABLE IF NOT EXISTS renders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT,
    source_image_url TEXT NOT NULL,
    rendered_image_url TEXT,
    prediction_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security (RLS)
-- For development, we can allow all access, but in production you'd want to restrict this.
ALTER TABLE renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON renders
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON renders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON renders
    FOR UPDATE USING (true);
