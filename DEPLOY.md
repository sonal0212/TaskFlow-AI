# Deploying TaskFlow AI to Netlify

The frontend deploys as a standard Next.js site. The database stays on
your hosted Supabase project — Netlify only serves the app.

## 1. Push to GitHub

```bash
cd "TaskFlow AI"
git init
git add .
git commit -m "Initial commit"
gh repo create taskflow-ai --private --source=. --push
```

(`.gitignore` already excludes `.env`, `.env.local`, `node_modules/`,
`.next/`, and the Gradle build dirs.)

## 2. Connect on Netlify

1. Sign in at <https://app.netlify.com> with your GitHub account
   (free Starter plan, no card required).
2. **Add new site → Import an existing project → GitHub → choose `taskflow-ai`**.
3. Netlify reads [`netlify.toml`](netlify.toml) and pre-fills:
   - **Base directory**: `frontend`
   - **Build command**: `pnpm build`
   - **Publish directory**: `frontend/.next`
   - **Node version**: `20`
   - The `@netlify/plugin-nextjs` plugin

   Leave everything as-is.

## 3. Add environment variables

Under **Site configuration → Environment variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yrxzasjsxrqxvkagnjfk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_sKnNWEPRrnHD0szQ_VrEZg_XFOOWENg` |

Apply scope: **All deploy contexts** (Production, Deploy previews, Branch
deploys).

## 4. Deploy

Click **Deploy site**. First build takes ~2 minutes.

You get a `https://<random-name>.netlify.app` URL. Every push to `main`
auto-redeploys; PRs get isolated preview URLs.

## 5. Before sharing publicly — tighten Supabase RLS

The current schema uses a permissive `"demo_all" using (true)` policy, so
anyone with the deployed URL can read or write your data. Either:

- **Lock the URL** with Netlify's password protection
  (Site configuration → Access control), or
- **Replace the demo policies** with real ones — migrate the fake login
  to Supabase Auth and use `auth.uid()` predicates per table.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with `lockfile is missing` | Confirm `pnpm-lock.yaml` is committed inside `frontend/`. |
| App boots but every page says "Supabase not reachable" | Env vars not set, or set on the wrong site. They must start with `NEXT_PUBLIC_` to reach the browser. |
| 404 on every route | Check that the `@netlify/plugin-nextjs` plugin loaded — see the build log. |
| `EPERM .next/trace` warning | Cosmetic Windows-only warning from local dev; never appears on Netlify Linux runners. |
