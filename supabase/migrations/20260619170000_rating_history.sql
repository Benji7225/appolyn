-- Historique quotidien de la note moyenne + volume d'avis d'une app, pour tracer
-- l'évolution de la réputation dans le temps. Un point par (app, jour).
create table if not exists public.rating_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  avg numeric,
  count int,
  captured_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (app_id, captured_on)
);

alter table public.rating_history enable row level security;

drop policy if exists "own rating_history select" on public.rating_history;
create policy "own rating_history select" on public.rating_history for select using (auth.uid() = user_id);
drop policy if exists "own rating_history insert" on public.rating_history;
create policy "own rating_history insert" on public.rating_history for insert with check (auth.uid() = user_id);
drop policy if exists "own rating_history update" on public.rating_history;
create policy "own rating_history update" on public.rating_history for update using (auth.uid() = user_id);

create index if not exists idx_rating_history_app on public.rating_history(app_id, captured_on);
