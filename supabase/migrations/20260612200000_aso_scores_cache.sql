-- Cache for the automatic AI ASO score, keyed by a content hash of the metadata
-- so the (paid) AI call only runs when a locale's metadata actually changes.
-- The score becomes the single, automatic number shown on the App Store Page.
create table if not exists public.aso_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  locale text not null,
  content_hash text not null,
  score int not null,
  verdict text not null default '',
  issues jsonb not null default '[]'::jsonb,
  keyword_suggestions jsonb not null default '[]'::jsonb,
  suggested_title text not null default '',
  suggested_subtitle text not null default '',
  suggested_keywords text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, locale, content_hash)
);

alter table public.aso_scores enable row level security;

drop policy if exists "own aso scores select" on public.aso_scores;
create policy "own aso scores select" on public.aso_scores for select using (auth.uid() = user_id);
drop policy if exists "own aso scores insert" on public.aso_scores;
create policy "own aso scores insert" on public.aso_scores for insert with check (auth.uid() = user_id);
drop policy if exists "own aso scores update" on public.aso_scores;
create policy "own aso scores update" on public.aso_scores for update using (auth.uid() = user_id);
