-- Historique quotidien des métriques d'un mot-clé suivi (rang réel de l'app +
-- popularité + difficulté). Un point par (recherche, jour) pour tracer l'évolution.
create table if not exists public.keyword_rank_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword_search_id uuid not null references public.keyword_searches(id) on delete cascade,
  app_id uuid references public.apps(id) on delete cascade,
  app_ranking int,
  popularity int,
  difficulty int,
  captured_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (keyword_search_id, captured_on)
);

alter table public.keyword_rank_history enable row level security;

drop policy if exists "own keyword_rank_history select" on public.keyword_rank_history;
create policy "own keyword_rank_history select" on public.keyword_rank_history for select using (auth.uid() = user_id);
drop policy if exists "own keyword_rank_history insert" on public.keyword_rank_history;
create policy "own keyword_rank_history insert" on public.keyword_rank_history for insert with check (auth.uid() = user_id);
drop policy if exists "own keyword_rank_history update" on public.keyword_rank_history;
create policy "own keyword_rank_history update" on public.keyword_rank_history for update using (auth.uid() = user_id);

create index if not exists idx_keyword_rank_history_search on public.keyword_rank_history(keyword_search_id, captured_on);
