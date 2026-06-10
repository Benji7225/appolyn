/*
  # Appolyn - Content cockpit (cross-posting)

  1. New Tables
    - `social_accounts` - A connected social platform account, one row per (user, platform).
      Access/refresh tokens are stored ENCRYPTED at rest (AES-256-GCM, same scheme as
      asc_credentials). The browser never decrypts them; only the edge function does.
    - `content_posts` - The master content item (script source + media + schedule).
    - `content_post_targets` - Per-platform render of a post (adapted caption + hashtags
      + publish status + the platform's returned post id / error).

  2. Security
    - RLS enabled on all tables.
    - social_accounts and content_posts are owned directly via user_id.
    - content_post_targets inherit ownership through their parent post.
    - Token columns are ciphertext at rest, so even a SELECT returns no usable secret.
*/

-- ── social_accounts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'facebook')),
  account_name text DEFAULT '',
  external_id text DEFAULT '',           -- platform account / channel / page id
  access_token text DEFAULT '',          -- encrypted at rest (v1:...)
  refresh_token text DEFAULT '',         -- encrypted at rest (v1:...)
  token_expires_at timestamptz,
  scopes text DEFAULT '',
  meta jsonb DEFAULT '{}'::jsonb,         -- non-secret extras (e.g. page id, ig business id)
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'error')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- ── content_posts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  script text DEFAULT '',                -- source idea / script (often from Notion)
  media_url text DEFAULT '',             -- public Supabase Storage URL of the video/image
  media_type text DEFAULT 'video' CHECK (media_type IN ('video', 'image', 'none')),
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'partial')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── content_post_targets ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_post_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'facebook')),
  caption text DEFAULT '',
  hashtags text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  platform_post_id text DEFAULT '',      -- id returned by the platform once published
  platform_url text DEFAULT '',          -- public URL of the published post, if any
  error text DEFAULT '',
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, platform)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_user_id ON content_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled_at ON content_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_post_targets_post_id ON content_post_targets(post_id);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_targets ENABLE ROW LEVEL SECURITY;

-- social_accounts policies (owned directly)
CREATE POLICY "Users can view own social accounts"
  ON social_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own social accounts"
  ON social_accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own social accounts"
  ON social_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own social accounts"
  ON social_accounts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- content_posts policies (owned directly)
CREATE POLICY "Users can view own content posts"
  ON content_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content posts"
  ON content_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content posts"
  ON content_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own content posts"
  ON content_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- content_post_targets policies (ownership via parent post)
CREATE POLICY "Users can view targets for own posts"
  ON content_post_targets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM content_posts p WHERE p.id = content_post_targets.post_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert targets for own posts"
  ON content_post_targets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM content_posts p WHERE p.id = content_post_targets.post_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update targets for own posts"
  ON content_post_targets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM content_posts p WHERE p.id = content_post_targets.post_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM content_posts p WHERE p.id = content_post_targets.post_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete targets for own posts"
  ON content_post_targets FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM content_posts p WHERE p.id = content_post_targets.post_id AND p.user_id = auth.uid()));
