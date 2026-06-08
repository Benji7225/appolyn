/*
  # App Store Connect Integration

  1. New Tables
    - `asc_credentials` - App Store Connect API keys per user
      - id, user_id, key_id, issuer_id, private_key (p8 content), team_id, created_at, updated_at
    - `app_localizations` - Per-country metadata linked to apps
      - id, app_id, country_code, title, subtitle, keywords, description, promotional_text, version, is_current, created_at, updated_at

  2. Modified Tables
    - `apps`: add asc_app_id column (App Store Connect numeric app ID)

  3. Security
    - RLS on all new tables
    - Credentials only readable by owning user
*/

-- Add ASC app ID to apps table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'apps' AND column_name = 'asc_app_id'
  ) THEN
    ALTER TABLE apps ADD COLUMN asc_app_id text DEFAULT '';
  END IF;
END $$;

-- ASC Credentials table
CREATE TABLE IF NOT EXISTS asc_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_id text NOT NULL DEFAULT '',
  issuer_id text NOT NULL DEFAULT '',
  private_key text NOT NULL DEFAULT '',
  team_id text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- App Localizations table (per-country metadata)
CREATE TABLE IF NOT EXISTS app_localizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  country_code text NOT NULL DEFAULT 'us',
  title text DEFAULT '',
  subtitle text DEFAULT '',
  keywords text DEFAULT '',
  description text DEFAULT '',
  promotional_text text DEFAULT '',
  version text DEFAULT '',
  is_current boolean DEFAULT true,
  last_published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(app_id, country_code, is_current)
);

CREATE INDEX IF NOT EXISTS idx_asc_credentials_user_id ON asc_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_app_localizations_app_id ON app_localizations(app_id);
CREATE INDEX IF NOT EXISTS idx_app_localizations_country ON app_localizations(country_code);

-- Enable RLS
ALTER TABLE asc_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_localizations ENABLE ROW LEVEL SECURITY;

-- ASC Credentials policies
CREATE POLICY "Users can view own credentials"
  ON asc_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON asc_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON asc_credentials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
  ON asc_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- App Localizations policies
CREATE POLICY "Users can view localizations for own apps"
  ON app_localizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_localizations.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert localizations for own apps"
  ON app_localizations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_localizations.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update localizations for own apps"
  ON app_localizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_localizations.app_id AND apps.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_localizations.app_id AND apps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete localizations for own apps"
  ON app_localizations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM apps WHERE apps.id = app_localizations.app_id AND apps.user_id = auth.uid()
    )
  );
