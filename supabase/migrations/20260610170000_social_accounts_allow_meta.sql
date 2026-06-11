/*
  # social_accounts: allow the 'meta' platform

  Facebook and Instagram share a single Meta Login connection, so the Meta OAuth
  callback stores the connection under platform = 'meta' (the content cockpit maps
  facebook/instagram -> meta when checking what's connected). The original CHECK
  only allowed the four publish targets, which rejected the Meta connection with
  "social_accounts_platform_check". Add 'meta'.

  content_post_targets is left untouched: a target is always a concrete publish
  surface (facebook / instagram / tiktok / youtube), never the shared 'meta'.
*/
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'facebook', 'meta'));
