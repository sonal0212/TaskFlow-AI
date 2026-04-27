# TaskFlow AI

> A task manager that thinks alongside you.

A full-stack, AI-augmented task management platform. Built to the
[BRD v1.0](#) — Spring Boot 3.3 + Next.js 14 + Supabase Postgres + Redis +
Spring AI / GPT-4o-mini, with STOMP-over-WebSocket realtime and a Claude-inspired
editorial UI.

## What's in here

```
TaskFlow AI/
├── frontend/             Next.js 14 app — App Router, Tailwind, Radix, shadcn-style UI
│   ├── app/              Pages (auth, dashboard, projects, AI, inbox, settings)
│   ├── components/       UI primitives + board + AI panel + app shell
│   └── lib/              Types, zustand store, AI mock, utils, seed data
├── backend/              Spring Boot 3.3 — Java 21
│   └── src/main/
│       ├── java/com/taskflow/
│       │   ├── auth/         FR-1.* signup/login/refresh/logout
│       │   ├── task/         FR-3.* CRUD with optimistic concurrency
│       │   ├── ai/           FR-5.* AI controller + Spring AI wiring
│       │   ├── realtime/     STOMP auth interceptor + outbox publisher
│       │   ├── security/     JwtService, RefreshTokenService, JwtFilter
│       │   ├── domain/       JPA entities + repositories
│       │   ├── common/       Error envelope + Me endpoint
│       │   └── config/       Security / WebSocket / AppProperties
│       └── resources/
│           ├── application.yml      Supabase + Redis + Spring AI config
│           ├── db/migration/        Flyway DDL (BRD §10.2)
│           └── prompts/v1/          Versioned LLM prompt templates
├── docker-compose.yml    Redis (always); Postgres (offline profile)
├── .env.example          Required env vars
└── README.md
```

## Quick start (Supabase-backed)

The frontend reads and writes through your Supabase Postgres directly.
Three steps:

### 1. Install the schema in Supabase

Open your project's SQL editor:
**https://supabase.com/dashboard/project/<your-project-ref>/sql/new**

Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click
**Run**. The script:
- Drops any prior taskflow tables (idempotent)
- Creates `users`, `workspaces`, `memberships`, `projects`, `tasks`, `labels`,
  `task_labels`, `comments`, `notifications`, plus the `task_status` /
  `task_priority` / `workspace_role` enums
- Enables RLS on every table with a permissive demo policy so the public
  anon key can read/write (replace these with `auth.uid()`-based policies
  before going to production)
- Seeds **Atelier** workspace · 5 users · 3 projects · 5 labels · 10 tasks ·
  3 comments · 4 notifications

### 2. Configure env

`frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-anon-key>
```

### 3. Run

```bash
cd frontend
pnpm install
pnpm dev   # → http://localhost:3002
```

Sign in with any seed email — `priya@taskflow.ai`, `marco@taskflow.ai`,
`amara@taskflow.ai`, `lin@taskflow.ai`, or `sam@taskflow.ai`. Mutations
(create task, drag across columns, comment, mark notification read) write
through to Supabase; reload the page and the state is still there.

What works in demo mode:

- Landing page + auth flow (login/signup, password strength validation)
- Dashboard with AI-generated daily standup, stats, my-tasks, blockers
- Project board: kanban with drag-drop, optimistic updates, drawer for editing,
  comments, presence avatars
- AI co-pilot panel: suggest 5 tasks, propose backlog priorities (with diff
  preview before any write), parse natural-language sentence → structured task
- Inbox with mentions/assignments/AI nudges, mark-read
- Settings: profile, workspace, members, danger zone
- Light & dark mode

## Production mode (with backend)

### 1. Provision Supabase

1. Create a free Supabase project (https://supabase.com).
2. From **Project Settings → Database → Connection string**, grab the
   **Session pooler** URL (port 6543) for the app and the **Direct** URL
   (port 5432) for migrations.
3. The Flyway migration in `backend/src/main/resources/db/migration/V1__init.sql`
   creates everything per BRD §10.2 (`pgcrypto` and `citext` are enabled by
   default on Supabase).

### 2. Configure env

```bash
cp .env.example .env
# fill in: SUPABASE_DB_URL, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD,
#         JWT_SECRET, BCRYPT_PEPPER, OPENAI_API_KEY
```

### 3. Run

```bash
docker compose up -d                # Redis
cd backend  && ./gradlew bootRun     # Spring Boot on :8080
cd frontend && pnpm dev              # Next.js on :3000
```

OpenAPI docs: http://localhost:8080/api/v1/docs

## Architecture (BRD §9)

```
Next.js 14 (App Router, TS, Tailwind, Radix, SWR-ready)
    │  HTTPS / WSS
    ▼
Spring Boot 3.3 (Java 21)
    ├─► Supabase Postgres (JPA + Flyway, citext + pgcrypto)
    ├─► Redis 7 (cache + token blacklist + STOMP relay + rate limit)
    └─► OpenAI gpt-4o-mini (via Spring AI, structured outputs, prompt v1 templates)
```

### Why Supabase Postgres?

- Managed, region-pinned Postgres 15 with `pgcrypto` and `citext` pre-enabled —
  matches the BRD DDL verbatim.
- Connection pooler (port 6543) handles the spiky read load implied by NFR-1.
- Daily logical backups (NFR-14) are managed for us.
- We **don't** lean on Supabase Auth or Realtime — JWT + STOMP are intentional
  per BRD §9.4 and §9.6 (refresh-token rotation, jti reuse detection,
  WebSocket fan-out via Redis pub/sub).

## Status by phase (BRD §14)

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundations: skeletons, healthcheck, error envelope | ✅ |
| 1 | Auth & workspaces (FR-1.1–1.4, FR-2.1, FR-2.2) | ✅ controllers; invite-by-email pending |
| 2 | Tasks CRUD (FR-3.1–3.3) with optimistic concurrency | ✅ |
| 3 | Realtime (STOMP, outbox publisher) | ⏳ scaffold; outbox SQL TODO |
| 4 | AI (FR-5.1, FR-5.3) with structured outputs | ⏳ controller wired; prompt → ChatClient TODO |
| 5 | Notifications + polish | ⏳ |
| 6 | v1.0 GA | ⏳ |

The **frontend covers Phases 0-5 in demo mode** (mocked AI, in-memory data).
Backend is a runnable skeleton that compiles, boots, and answers `/api/v1/me`,
`/api/v1/auth/*`, and `/api/v1/projects/{id}/tasks` against Supabase.

## Tech stack (BRD §12)

| Layer | Choice |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Radix, lucide-react, dnd-kit, zustand |
| Backend | Spring Boot 3.3, Java 21, Spring Security, Spring Data JPA, Spring AI |
| Database | **Supabase Postgres 15** (managed) |
| Cache / pub-sub | Redis 7 |
| AI | OpenAI `gpt-4o-mini` via Spring AI |
| Auth | JWT (HS256, 15 min access / 7 d refresh, rotation, Redis blacklist) |
| Build | Gradle (BE) · pnpm (FE) |

## Design

The UI takes editorial cues from the Claude assistant aesthetic — warm
cream/charcoal surfaces (no pure white/black), a single coral accent, an
Instrument Serif display face paired with Inter body. Tokens live in
`frontend/app/globals.css`; everything else composes from there.

## License

All rights reserved (placeholder). Replace before public release.
