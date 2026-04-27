--  TaskFlow AI — Supabase schema (v1)
--  ------------------------------------------------------------------
--  Run this once in your Supabase SQL editor:
--    https://supabase.com/dashboard/project/<project-ref>/sql/new
--
--  Behaviour:
--   - Drops any pre-existing taskflow tables/types and recreates everything
--   - Inserts a deterministic demo workspace + 5 users + 3 projects + 10 tasks
--   - Enables RLS with permissive policies so the public anon key can
--     read/write during development. Replace these with auth.uid()-based
--     policies before going to production.
--  ------------------------------------------------------------------

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ── Drop existing (idempotent) ─────────────────────────────────────
drop table if exists public.task_labels      cascade;
drop table if exists public.labels           cascade;
drop table if exists public.comments         cascade;
drop table if exists public.notifications    cascade;
drop table if exists public.event_outbox     cascade;
drop table if exists public.ai_usage         cascade;
drop table if exists public.tasks            cascade;
drop table if exists public.projects         cascade;
drop table if exists public.memberships      cascade;
drop table if exists public.workspaces       cascade;
drop table if exists public.users            cascade;
drop type  if exists public.task_status      cascade;
drop type  if exists public.task_priority    cascade;
drop type  if exists public.workspace_role   cascade;

-- ── Types ──────────────────────────────────────────────────────────
create type public.workspace_role as enum ('OWNER','ADMIN','MEMBER','VIEWER');
create type public.task_status    as enum ('TODO','IN_PROGRESS','BLOCKED','DONE');
create type public.task_priority  as enum ('P0','P1','P2','P3');

-- ── Tables ─────────────────────────────────────────────────────────
create table public.users (
  id              uuid primary key default gen_random_uuid(),
  email           citext unique not null,
  password_hash   text not null default 'demo',  -- swap for Supabase Auth in prod
  display_name    varchar(60) not null,
  avatar_url      text,
  token_version   int not null default 0,
  created_at      timestamptz not null default now(),
  disabled_at     timestamptz
);

create table public.workspaces (
  id           uuid primary key default gen_random_uuid(),
  name         varchar(80) not null,
  slug         varchar(80) unique not null,
  timezone     varchar(64) not null default 'UTC',
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create table public.memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role         workspace_role not null,
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         varchar(120) not null,
  emoji        varchar(8),
  description  text,
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  parent_id    uuid references public.tasks(id) on delete cascade,
  title        varchar(200) not null,
  description  text,
  status       task_status not null default 'TODO',
  priority     task_priority not null default 'P2',
  assignee_id  uuid references public.users(id),
  due_date     date,
  position     double precision not null,
  version      int not null default 0,
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index idx_tasks_project_status
  on public.tasks(project_id, status) where deleted_at is null;
create index idx_tasks_assignee
  on public.tasks(assignee_id) where deleted_at is null;

create table public.labels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         varchar(40) not null,
  color        char(7) not null,
  unique (workspace_id, name)
);

create table public.task_labels (
  task_id  uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  author_id  uuid not null references public.users(id),
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       varchar(40) not null,
  payload    jsonb not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ── RLS — permissive demo policies ─────────────────────────────────
-- Replace with auth.uid()-based predicates before production. See
-- https://supabase.com/docs/guides/auth/row-level-security
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'users','workspaces','memberships','projects','tasks',
      'labels','task_labels','comments','notifications'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo_all" on public.%I', t);
    execute format(
      'create policy "demo_all" on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ── Seed data ──────────────────────────────────────────────────────
-- Stable UUIDs make foreign-key references deterministic.
insert into public.users (id, email, display_name) values
  ('00000000-0000-0000-0000-000000000001', 'priya@taskflow.ai', 'Priya Iyer'),
  ('00000000-0000-0000-0000-000000000002', 'marco@taskflow.ai', 'Marco Bianchi'),
  ('00000000-0000-0000-0000-000000000003', 'amara@taskflow.ai', 'Amara Okafor'),
  ('00000000-0000-0000-0000-000000000004', 'lin@taskflow.ai',   'Lin Wei'),
  ('00000000-0000-0000-0000-000000000005', 'sam@taskflow.ai',   'Sam Hartley');

insert into public.workspaces (id, name, slug, timezone) values
  ('10000000-0000-0000-0000-000000000001', 'Atelier', 'atelier', 'Europe/London');

insert into public.memberships (workspace_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'OWNER'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'ADMIN'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'MEMBER'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'MEMBER'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'VIEWER');

insert into public.projects (id, workspace_id, name, emoji, description, created_by, created_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'Q2 Product Launch', '🚀',
   'Public launch of the v2 platform across web and partner channels.',
   '00000000-0000-0000-0000-000000000001', now() - interval '21 days'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   'Brand Refresh', '🎨',
   'New identity system, typography, and component library.',
   '00000000-0000-0000-0000-000000000001', now() - interval '12 days'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
   'User Research', '🔍',
   'Qualitative interviews with 12 power users.',
   '00000000-0000-0000-0000-000000000001', now() - interval '6 days');

insert into public.labels (id, workspace_id, name, color) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'frontend', '#22FF99'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'backend',  '#22D3EE'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'design',   '#A78BFA'),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'research', '#FBBF24'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'blocker',  '#F43F5E');

-- Tasks (10 across 3 projects)
insert into public.tasks (id, project_id, title, description, status, priority, assignee_id, due_date, position, created_by, created_at, updated_at) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Draft launch announcement',
   '300-word announcement for the blog and email list. Include the three flagship capabilities.',
   'IN_PROGRESS', 'P1', '00000000-0000-0000-0000-000000000001',
   (now() + interval '2 days')::date, 1024,
   '00000000-0000-0000-0000-000000000001', now() - interval '4 days', now() - interval '1 day'),

  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   'Coordinate press embargo',
   'Reach out to TechCrunch, The Verge, and Stratechery one week before launch.',
   'TODO', 'P0', '00000000-0000-0000-0000-000000000002',
   (now() + interval '5 days')::date, 2048,
   '00000000-0000-0000-0000-000000000002', now() - interval '3 days', now() - interval '3 days'),

  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   'Ship pricing page A/B test',
   'Variant B uses social proof above the fold.',
   'BLOCKED', 'P1', '00000000-0000-0000-0000-000000000003',
   (now() + interval '1 day')::date, 3072,
   '00000000-0000-0000-0000-000000000002', now() - interval '6 days', now()),

  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   'Stress test signup flow at 5x load',
   null,
   'TODO', 'P2', '00000000-0000-0000-0000-000000000004',
   (now() + interval '7 days')::date, 4096,
   '00000000-0000-0000-0000-000000000004', now() - interval '2 days', now() - interval '2 days'),

  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001',
   'Final design review with leadership',
   null,
   'DONE', 'P2', '00000000-0000-0000-0000-000000000001',
   (now() - interval '2 days')::date, 5120,
   '00000000-0000-0000-0000-000000000001', now() - interval '10 days', now() - interval '2 days'),

  ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001',
   'Update onboarding screencasts',
   null,
   'TODO', 'P3', null,
   (now() + interval '10 days')::date, 6144,
   '00000000-0000-0000-0000-000000000001', now() - interval '1 day', now() - interval '1 day'),

  ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002',
   'Lock in display typeface',
   'Down to Söhne vs. Tiempos. Recommend Tiempos for editorial warmth.',
   'IN_PROGRESS', 'P1', '00000000-0000-0000-0000-000000000001',
   (now() + interval '3 days')::date, 7168,
   '00000000-0000-0000-0000-000000000001', now() - interval '7 days', now() - interval '1 day'),

  ('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002',
   'Audit colour contrast for WCAG AA',
   null,
   'TODO', 'P1', '00000000-0000-0000-0000-000000000003',
   (now() + interval '4 days')::date, 8192,
   '00000000-0000-0000-0000-000000000001', now() - interval '5 days', now() - interval '5 days'),

  ('40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003',
   'Recruit 12 power users for interviews',
   null,
   'IN_PROGRESS', 'P1', '00000000-0000-0000-0000-000000000002',
   (now() + interval '6 days')::date, 9216,
   '00000000-0000-0000-0000-000000000002', now() - interval '3 days', now() - interval '1 day'),

  ('40000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000003',
   'Synthesise findings into themes',
   null,
   'TODO', 'P2', '00000000-0000-0000-0000-000000000001',
   (now() + interval '14 days')::date, 10240,
   '00000000-0000-0000-0000-000000000001', now() - interval '2 days', now() - interval '2 days');

-- task_labels
insert into public.task_labels (task_id, label_id) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000004'),
  ('40000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000004');

insert into public.comments (id, task_id, author_id, body, created_at) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000003',
   'Blocked on legal sign-off for the social proof testimonials. @marco can you ping them?',
   now() - interval '1 day'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000002',
   'Pinged. Expecting an answer by EOD tomorrow.',
   now()),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002',
   'Read the draft — the second paragraph buries the AI angle. Lift it up?',
   now());

insert into public.notifications (id, user_id, type, payload, read_at, created_at) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'MENTIONED',
   '{"taskId":"40000000-0000-0000-0000-000000000003","message":"Amara mentioned you on Ship pricing page A/B test","actorId":"00000000-0000-0000-0000-000000000003","projectId":"20000000-0000-0000-0000-000000000001"}'::jsonb,
   null, now() - interval '1 day'),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'COMMENTED',
   '{"taskId":"40000000-0000-0000-0000-000000000001","message":"Marco commented on Draft launch announcement","actorId":"00000000-0000-0000-0000-000000000002","projectId":"20000000-0000-0000-0000-000000000001"}'::jsonb,
   null, now()),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'STATUS_BLOCKED',
   '{"taskId":"40000000-0000-0000-0000-000000000003","message":"Ship pricing page A/B test is blocked","projectId":"20000000-0000-0000-0000-000000000001"}'::jsonb,
   now(), now()),
  ('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'AI_SUGGESTION',
   '{"projectId":"20000000-0000-0000-0000-000000000001","message":"5 new task suggestions are ready for Q2 Product Launch"}'::jsonb,
   null, now());

-- Done.
select 'TaskFlow AI schema installed.' as status,
       (select count(*) from public.users)        as users,
       (select count(*) from public.projects)     as projects,
       (select count(*) from public.tasks)        as tasks;
