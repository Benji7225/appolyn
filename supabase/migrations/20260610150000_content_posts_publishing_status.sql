/*
  # content_posts: allow the transient "publishing" status

  The scheduled-publish cron claims a due post by flipping its status from
  'scheduled' to 'publishing' (so two runs can't double-post it), then to
  'published' / 'partial'. Add 'publishing' to the allowed values.
*/
ALTER TABLE content_posts DROP CONSTRAINT IF EXISTS content_posts_status_check;
ALTER TABLE content_posts ADD CONSTRAINT content_posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partial'));
