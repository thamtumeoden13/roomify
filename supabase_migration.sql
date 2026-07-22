-- ==========================================
-- 1. TẠO CÁC BẢNG DỮ LIỆU (TABLES)
-- ==========================================

-- Bảng Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
                                               id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    credits INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                                                                          );

-- Bảng Projects
CREATE TABLE IF NOT EXISTS public.projects (
                                               id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_image_url TEXT NOT NULL,
    rendered_image_url TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                             width INTEGER,
                             height INTEGER,
                             blurred_source_url TEXT
                             );

-- Bảng Renders
CREATE TABLE IF NOT EXISTS public.renders (
                                              id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name TEXT,
    source_image_url TEXT NOT NULL,
    rendered_image_url TEXT,
    prediction_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    prompt TEXT,
    style_id TEXT,
    project_context TEXT,
    flooring_id TEXT,
    lighting_id TEXT,
    view_id TEXT,
    custom_instructions TEXT,
    seed BIGINT,
    rating INTEGER,
    feedback INTEGER,
    error TEXT,
    upscaled_image_url TEXT,
    upscale_prediction_id TEXT,
    cloudinary_public_id TEXT,
    upscaled_cloudinary_public_id TEXT,
    drive_file_id TEXT,
    upscaled_drive_file_id TEXT,
    backup_url TEXT,
    upscaled_backup_url TEXT,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                       );

-- Bảng Showcase
CREATE TABLE IF NOT EXISTS public.showcase (
                                               id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    render_id UUID NOT NULL REFERENCES public.renders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin_approved BOOLEAN DEFAULT false,
    is_user_public BOOLEAN DEFAULT true,
    vote_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    trending_score FLOAT8 DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                                              );

-- Bảng Showcase Votes
CREATE TABLE IF NOT EXISTS public.showcase_votes (
                                                     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    showcase_id UUID NOT NULL REFERENCES public.showcase(id) ON DELETE CASCADE,
    CONSTRAINT showcase_votes_pkey PRIMARY KEY (user_id, showcase_id)
    );

-- ==========================================
-- 2. TẠO CHỈ MỤC (INDEXES)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_renders_last_viewed_at ON public.renders USING btree (last_viewed_at);

-- ==========================================
-- 3. CÁC HÀM LOGIC (FUNCTIONS)
-- ==========================================

-- Hàm trừ Credits
CREATE OR REPLACE FUNCTION public.decrement_credits(target_user_id uuid, amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
new_credits INTEGER;
BEGIN
UPDATE public.profiles
SET credits = credits - amount
WHERE id = target_user_id
    RETURNING credits INTO new_credits;
RETURN new_credits;
END;
$$;

-- Hàm tự động tạo profile khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
INSERT INTO public.profiles (id, role, credits)
VALUES (new.id, 'user', 10);
RETURN new;
END;
$$;

-- Hàm tăng view
CREATE OR REPLACE FUNCTION public.increment_showcase_view(target_showcase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
UPDATE public.showcase
SET view_count = view_count + 1
WHERE id = target_showcase_id;
END;
$$;

-- Hàm bầu chọn
CREATE OR REPLACE FUNCTION public.toggle_showcase_vote(target_showcase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
has_voted BOOLEAN;
    new_vote_count INT;
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
SELECT EXISTS (SELECT 1 FROM showcase_votes WHERE user_id = v_user_id AND showcase_id = target_showcase_id) INTO has_voted;
IF has_voted THEN
DELETE FROM showcase_votes WHERE user_id = v_user_id AND showcase_id = target_showcase_id;
UPDATE showcase SET vote_count = vote_count - 1 WHERE id = target_showcase_id RETURNING vote_count INTO new_vote_count;
RETURN jsonb_build_object('action', 'unvoted', 'vote_count', new_vote_count);
ELSE
        INSERT INTO public.showcase_votes (user_id, showcase_id) VALUES (v_user_id, target_showcase_id);
UPDATE showcase SET vote_count = vote_count + 1 WHERE id = target_showcase_id RETURNING vote_count INTO new_vote_count;
RETURN jsonb_build_object('action', 'voted', 'vote_count', new_vote_count);
END IF;
END;
$$;

-- Hàm cập nhật điểm trending cho trigger
CREATE OR REPLACE FUNCTION public.trigger_update_trending_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.trending_score = (NEW.vote_count * 2.0) + (NEW.view_count * 0.5);
RETURN NEW;
END;
$$;

-- Hàm cập nhật trending hàng loạt
CREATE OR REPLACE FUNCTION public.update_trending_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
UPDATE showcase SET trending_score = (vote_count * 2.0) + (view_count * 0.5);
END;
$$;

-- ==========================================
-- 4. THIẾT LẬP TRIGGERS
-- ==========================================

-- Trigger tạo profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger cập nhật điểm trending
DROP TRIGGER IF EXISTS on_showcase_update_score ON public.showcase;
CREATE TRIGGER on_showcase_update_score
    BEFORE UPDATE OF vote_count, view_count ON public.showcase
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_trending_score();

-- ==========================================
-- 5. BẢO MẬT (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_votes ENABLE ROW LEVEL SECURITY;

-- Policies (Rút gọn để chạy nhanh)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view renders" ON public.renders FOR SELECT USING (true);
CREATE POLICY "Users can insert their own renders" ON public.renders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own renders" ON public.renders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view showcase" ON public.showcase FOR SELECT USING (true);
CREATE POLICY "Users can insert their own showcase" ON public.showcase FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can moderate showcase" ON public.showcase FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ==========================================
-- 6. CẤU HÌNH REALTIME
-- ==========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.renders, public.profiles;
COMMIT;