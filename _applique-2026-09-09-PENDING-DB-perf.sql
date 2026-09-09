-- ─────────────────────────────────────────────────────────────────────────────
-- À APPLIQUER (Benji ou passage débloqué) — optimisations perf, 100% sûres.
-- Préparé le 2026-06-14 par le loop autonome. La migration via MCP a été bloquée
-- par le garde-fou auto-mode (3 tentatives), la base est restée INTACTE.
--
-- Contexte : advisors Supabase. SÉCURITÉ = aucun trou RLS sur les tables créées
-- cette session (sdk_clients / sdk_events / signal_links sont bien protégées).
-- PERF = 2 foreign keys sans index + policies RLS qui ré-évaluent auth.uid() par
-- ligne (lint auth_rls_initplan). Tout ci-dessous est équivalent en logique, juste
-- plus rapide à l'échelle. Aucun changement de comportement / d'accès.
--
-- Pour appliquer : Supabase Dashboard > SQL Editor, coller et exécuter. (Ou me
-- réautoriser apply_migration.)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Index de couverture pour les foreign keys signalées.
create index if not exists sdk_clients_attributed_link_id_idx on public.sdk_clients (attributed_link_id);
create index if not exists signal_links_user_id_idx on public.signal_links (user_id);

-- 2) RLS initplan : évaluer auth.uid() une fois par requête (sous-select) au lieu
--    d'une fois par ligne. Même logique exactement.
alter policy "owner reads sdk_clients" on public.sdk_clients
  using (app_id in (select id from public.apps where user_id = (select auth.uid())));

alter policy "owner reads sdk_events" on public.sdk_events
  using (app_id in (select id from public.apps where user_id = (select auth.uid())));

alter policy "clicks via own link" on public.signal_clicks
  using (exists (select 1 from public.signal_links l where l.id = signal_clicks.link_id and l.user_id = (select auth.uid())));

alter policy "own links select" on public.signal_links
  using ((select auth.uid()) = user_id);

alter policy "own links delete" on public.signal_links
  using ((select auth.uid()) = user_id);

alter policy "own links insert" on public.signal_links
  with check ((select auth.uid()) = user_id);
