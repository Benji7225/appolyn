/*
  # Appolyn - ASO Analytics Platform Schema

  1. New Tables
    - `apps` - Mobile apps owned by users
      - id, user_id, name, bundle_id, platform, icon_url, store_url, created_at, updated_at
    - `aso_metrics` - Daily metrics per app
      - id, app_id, date, downloads, revenue, rating, review_count, created_at
    - `app_metadata` - App Store metadata (current + history)
      - id, app_id, title, subtitle, keywords, description, version, is_current, created_at, updated_at
    - `keyword_searches` - Saved keyword research
      - id, user_id, app_id, keyword, country_code, popularity_score, difficulty_score, app_ranking, created_at

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - app_id foreign keys cascade to user ownership checks
*/

-- Apps table
CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bundle_id text NOT NULL,
  platform text NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios', 'android', 'both')),
  icon_url text DEFAULT '',
  store_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ASO Metrics table
CREATE TABLE IF NOT EXISTS aso_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  date date NOT NULL,
  downloads integer DEFAULT 0,
  revenue numeric(12, 2) DEFAULT 0,
  rating numeric(3, 2) DEFAULT 0,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(app_id, date)
);

-- App Metadata table
CREATE TABLE IF NOT EXISTS app_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  keywords text DEFAULT '',
  description text DEFAULT '',
  version text DEFAULT '',
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Keyword Searches table
CREATE TABLE IF NOT EXISTS keyword_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id uuid REFERENCES apps(id) ON DELETE SET NULL,
  keyword text NOT NULL,
  country_code text NOT NULL DEFAULT 'us',
  popularity_score integer DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  difficulty_score integer DEFAULT 0 CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  app_ranking integer,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_apps_user_id ON apps(user_id);
CREATE INDEX IF NOT EXISTS idx_aso_metrics_app_id ON aso_metrics(app_id);
CREATE INDEX IF NOT EXISTS idx_aso_metrics_date ON aso_metrics(date);
CREATE INDEX IF NOT EXISTS idx_app_metadata_app_id ON app_metadata(app_id);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_user_id ON keyword_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_app_id ON keyword_searches(app_id);

-- Enable RLS
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE aso_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;

-- Apps policies
CREATE POLICY "Users can view own apps"
  ON apps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own apps"
  ON apps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own apps"
  ON apps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own apps"
  ON apps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ASO Metrics policies (access via app ownership)
CREATE POLICY "Users can view metrics for own apps"
  ON aso_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = aso_metrics.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metrics for own apps"
  ON aso_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = aso_metrics.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metrics for own apps"
  ON aso_metrics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = aso_metrics.app_id AND apps.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = aso_metrics.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metrics for own apps"
  ON aso_metrics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = aso_metrics.app_id AND apps.user_id = auth.uid()
    )
  );

-- App Metadata policies
CREATE POLICY "Users can view metadata for own apps"
  ON app_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_metadata.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metadata for own apps"
  ON app_metadata FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_metadata.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metadata for own apps"
  ON app_metadata FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_metadata.app_id AND apps.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_metadata.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metadata for own apps"
  ON app_metadata FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_metadata.app_id AND apps.user_id = auth.uid()
    )
  );

-- Keyword Searches policies
CREATE POLICY "Users can view own keyword searches"
  ON keyword_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keyword searches"
  ON keyword_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keyword searches"
  ON keyword_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keyword searches"
  ON keyword_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
