-- Create blog posts table for admin-managed blog content
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Full MDX content
  author TEXT NOT NULL,
  cover_image TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_time TEXT,
  featured BOOLEAN DEFAULT FALSE,
  -- Metadata for SEO
  meta_description TEXT,
  meta_keywords TEXT[]
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);

-- Create index on published_at for sorting
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);

-- Create index on user_id for author filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON public.blog_posts(user_id);

-- Create index on categories for filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_categories ON public.blog_posts USING GIN(categories);

-- Create index on tags for filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read published posts
CREATE POLICY "Published posts are viewable by everyone"
  ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Authenticated users can view their own drafts
CREATE POLICY "Users can view their own posts"
  ON public.blog_posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON public.blog_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON public.blog_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- Function to auto-generate slug from title if not provided
CREATE OR REPLACE FUNCTION public.generate_blog_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      lower(trim(NEW.title)),
      '[^a-z0-9]+',
      '-',
      'g'
    );
    -- Remove leading/trailing hyphens
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE TRIGGER generate_blog_post_slug
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_blog_post_slug();

-- Function to calculate read time from content
CREATE OR REPLACE FUNCTION public.calculate_read_time(content_text TEXT)
RETURNS TEXT AS $$
DECLARE
  word_count INTEGER;
  minutes INTEGER;
BEGIN
  -- Count words (rough estimate)
  word_count := array_length(regexp_split_to_array(content_text, '\s+'), 1);

  -- Average reading speed: 200 words per minute
  minutes := GREATEST(1, ROUND(word_count / 200.0));

  RETURN minutes || ' min read';
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE public.blog_posts IS 'Stores blog posts created through the admin interface';
COMMENT ON COLUMN public.blog_posts.content IS 'Full MDX content with frontmatter-style metadata';
COMMENT ON COLUMN public.blog_posts.status IS 'Post status: draft, published, or archived';
