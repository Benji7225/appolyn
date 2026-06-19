-- Per-app launch checklist state. Each row = one ticked task for one app.
-- Drives the guided "Lancement" page (préparation / jour J / croissance).
create table if not exists public.launch_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  task_key text not null,
  done boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (app_id, task_key)
);

alter table public.launch_checklist enable row level security;

drop policy if exists "own launch_checklist select" on public.launch_checklist;
create policy "own launch_checklist select" on public.launch_checklist for select using (auth.uid() = user_id);
drop policy if exists "own launch_checklist insert" on public.launch_checklist;
create policy "own launch_checklist insert" on public.launch_checklist for insert with check (auth.uid() = user_id);
drop policy if exists "own launch_checklist update" on public.launch_checklist;
create policy "own launch_checklist update" on public.launch_checklist for update using (auth.uid() = user_id);
drop policy if exists "own launch_checklist delete" on public.launch_checklist;
create policy "own launch_checklist delete" on public.launch_checklist for delete using (auth.uid() = user_id);

create index if not exists idx_launch_checklist_app on public.launch_checklist(app_id);
