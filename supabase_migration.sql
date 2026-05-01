-- Create the renders table
CREATE TABLE IF NOT EXISTS renders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    project_name TEXT,
    source_image_url TEXT NOT NULL,
    rendered_image_url TEXT,
    prediction_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    prompt TEXT,
    style_id TEXT,
    upscaled_image_url TEXT,
    upscale_prediction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security (RLS)
ALTER TABLE renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own renders" ON renders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own renders" ON renders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own renders" ON renders
    FOR UPDATE USING (auth.uid() = user_id);
