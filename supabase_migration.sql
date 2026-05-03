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
    flooring_id TEXT,
    lighting_id TEXT,
    rating INTEGER,
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

-- Create the showcase table
CREATE TABLE IF NOT EXISTS showcase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id UUID NOT NULL REFERENCES renders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin_approved BOOLEAN DEFAULT false,
    is_user_public BOOLEAN DEFAULT true,
    vote_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    trending_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    credits INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, credits)
  VALUES (new.id, 'user', 10);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Set up Row Level Security (RLS) for showcase
ALTER TABLE showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view showcase" ON showcase
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own showcase" ON showcase
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update anything in showcase" ON showcase
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can update their own is_user_public" ON showcase
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own showcase" ON showcase
    FOR DELETE USING (auth.uid() = user_id);

-- Create a table for tracking user votes to prevent multiple votes
CREATE TABLE IF NOT EXISTS showcase_votes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    showcase_id UUID REFERENCES showcase(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, showcase_id)
);

ALTER TABLE showcase_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own votes" ON showcase_votes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can vote" ON showcase_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unvote" ON showcase_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Function to toggle vote
CREATE OR REPLACE FUNCTION toggle_showcase_vote(target_showcase_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_voted BOOLEAN;
    new_vote_count INT;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM showcase_votes 
        WHERE user_id = v_user_id AND showcase_id = target_showcase_id
    ) INTO has_voted;

    IF has_voted THEN
        DELETE FROM showcase_votes 
        WHERE user_id = v_user_id AND showcase_id = target_showcase_id;
        
        UPDATE showcase 
        SET vote_count = vote_count - 1 
        WHERE id = target_showcase_id
        RETURNING vote_count INTO new_vote_count;
        
        RETURN jsonb_build_object('action', 'unvoted', 'vote_count', new_vote_count);
    ELSE
        INSERT INTO showcase_votes (user_id, showcase_id)
        VALUES (v_user_id, target_showcase_id);
        
        UPDATE showcase 
        SET vote_count = vote_count + 1 
        WHERE id = target_showcase_id
        RETURNING vote_count INTO new_vote_count;
        
        RETURN jsonb_build_object('action', 'voted', 'vote_count', new_vote_count);
    END IF;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_showcase_view(target_showcase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE showcase 
    SET view_count = view_count + 1 
    WHERE id = target_showcase_id;
END;
$$;

-- Function to update trending scores
-- Score = (votes * 2) + (views * 0.5)
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE showcase
    SET trending_score = (vote_count * 2.0) + (view_count * 0.5);
END;
$$;

-- Automatically update trending scores on vote or view
CREATE OR REPLACE FUNCTION trigger_update_trending_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trending_score = (NEW.vote_count * 2.0) + (NEW.view_count * 0.5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_showcase_update_score
    BEFORE UPDATE OF vote_count, view_count ON showcase
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_trending_score();

-- Function to decrement credits
CREATE OR REPLACE FUNCTION decrement_credits(target_user_id UUID, amount INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_credits INTEGER;
BEGIN
    UPDATE profiles
    SET credits = credits - amount
    WHERE id = target_user_id
    RETURNING credits INTO new_credits;
    
    RETURN new_credits;
END;
$$;
