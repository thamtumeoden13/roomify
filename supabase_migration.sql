-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_image_url TEXT NOT NULL,
    rendered_image_url TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the renders table
CREATE TABLE IF NOT EXISTS renders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    project_name TEXT,
    source_image_url TEXT NOT NULL,
    rendered_image_url TEXT,
    prediction_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    prompt TEXT,
    style_id TEXT,
    project_context TEXT,
    upscaled_image_url TEXT,
    upscale_prediction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set up Row Level Security (RLS) for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Set up Row Level Security (RLS) for renders
ALTER TABLE renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view renders" ON renders
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own renders" ON renders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own renders" ON renders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own renders" ON renders
    FOR DELETE USING (auth.uid() = user_id);
