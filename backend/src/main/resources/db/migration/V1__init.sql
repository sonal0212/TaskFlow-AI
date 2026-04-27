-- TaskFlow AI · initial schema
-- Mirrors BRD §10.2 verbatim. Runs against Supabase Postgres or local Postgres 15+.
-- Supabase note: gen_random_uuid() lives in pgcrypto; CITEXT lives in citext.
-- Both extensions are enabled by default on Supabase projects.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ── Users ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  display_name    VARCHAR(60) NOT NULL,
  avatar_url      TEXT,
  token_version   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  disabled_at     TIMESTAMPTZ
);

-- ── Workspaces & memberships ───────────────────────────────────────────
CREATE TABLE workspaces (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(80) NOT NULL,
  slug         VARCHAR(80) UNIQUE NOT NULL,
  timezone     VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

CREATE TYPE role AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER');

CREATE TABLE memberships (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         role NOT NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ── Projects ───────────────────────────────────────────────────────────
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(120) NOT NULL,
  emoji        VARCHAR(8),
  description  TEXT,
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

-- ── Tasks ──────────────────────────────────────────────────────────────
CREATE TYPE task_status   AS ENUM ('TODO','IN_PROGRESS','BLOCKED','DONE');
CREATE TYPE task_priority AS ENUM ('P0','P1','P2','P3');

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  status       task_status NOT NULL DEFAULT 'TODO',
  priority     task_priority NOT NULL DEFAULT 'P2',
  assignee_id  UUID REFERENCES users(id),
  due_date     DATE,
  position     DOUBLE PRECISION NOT NULL,
  version      INT NOT NULL DEFAULT 0,
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_tasks_project_status
  ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee
  ON tasks(assignee_id) WHERE deleted_at IS NULL;

-- ── Comments ───────────────────────────────────────────────────────────
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Labels ─────────────────────────────────────────────────────────────
CREATE TABLE labels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(40) NOT NULL,
  color        CHAR(7) NOT NULL,
  UNIQUE (workspace_id, name)
);

CREATE TABLE task_labels (
  task_id  UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- ── Notifications ──────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(40) NOT NULL,
  payload    JSONB NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Outbox + AI usage ──────────────────────────────────────────────────
CREATE TABLE event_outbox (
  id           BIGSERIAL PRIMARY KEY,
  topic        VARCHAR(120) NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_unpublished ON event_outbox(id) WHERE published_at IS NULL;

CREATE TABLE ai_usage (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID NOT NULL,
  feature           VARCHAR(40) NOT NULL,
  prompt_tokens     INT NOT NULL,
  completion_tokens INT NOT NULL,
  cost_cents        NUMERIC(10,4) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
