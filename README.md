# Roel Dingle — Portfolio

A React and TypeScript portfolio website with a Supabase-powered admin area. The public site presents profile information, roles, skills, projects, and an AI portfolio assistant. The admin area manages portfolio content, learning notes, and courses with modules and lessons.

**Live site:** <https://roeldingle.github.io/>  
**GitHub repository:** <https://github.com/roeldingle/roeldingle.github.io>

## Features

- Public portfolio with profile, roles, skills, and published projects.
- Project cards with optional GitHub and live demo links.
- AI assistant for questions about the portfolio and projects.
- Admin dashboard with content counts, learning progress, and recent activity.
- Content management for profile, roles, skills, and projects.
- Notes with Markdown, code examples, and copy controls.
- Learning courses with modules, lessons, and progress tracking.
- Responsive layouts for desktop, tablet, and mobile.

## Technology

- React 19 and TypeScript
- Vite
- Supabase Auth and Postgres
- GitHub Actions and GitHub Pages

## Run locally

Install [Node.js 24](https://nodejs.org/) and npm, then open a terminal in the `frontend` folder:

```powershell
cd frontend
npm ci
```

Create `frontend/.env.local` and add the Supabase project settings:

```dotenv
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Use the URL and publishable key from your Supabase project settings. These values are used by the browser app. **Never put a Supabase service-role key or other secret in a `VITE_` variable**, because Vite includes those values in the public frontend build.

Start the local development server:

```powershell
npm run dev
```

Vite prints a local address, usually <http://localhost:5173/>.

## Common commands

Run these from the `frontend` folder:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Check the frontend source with ESLint. |
| `npm run build` | Type-check and create the production site in `frontend/dist`. |
| `npm run preview` | Preview the production build locally. |

## Supabase setup

The app reads and writes portfolio and learning data in Supabase. Its tables and admin access policies must exist in the project used by the app.

This repository includes these migrations, in order:

1. `supabase/migrations/20261103000000_portfolio_cms_schema.sql` — creates the portfolio profile, roles, skills, projects, and admin allowlist tables, plus the admin-check function.
2. `supabase/migrations/20261103000001_portfolio_cms_policies.sql` — allows public reads of portfolio content and published projects only.
3. `supabase/migrations/20261103000002_portfolio_admin_policies.sql` — allows approved admins to manage portfolio content.
4. `supabase/migrations/20261103000003_assign_portfolio_admin.sql` — adds a guarded function for existing admins to grant or revoke admin access.
5. `supabase/migrations/20261103000004_grant_portfolio_table_permissions.sql` — grants the database permissions required by the public site and admin UI.
6. `supabase/migrations/20261104000000_create_portfolio_notes.sql` — creates the admin-managed notes table.
7. `supabase/migrations/20261104000001_add_note_content.sql` — adds Markdown note content.
8. `supabase/migrations/20261104000002_remove_note_status.sql` — removes the notes status column.
9. `supabase/migrations/20261104000003_create_admin_activity_logs.sql` — creates the admin activity feed table.

The `Add_columns_date_reference` item from the screenshot is intentionally omitted: the current app has no `date_reference` column or feature that uses it.

These baseline portfolio migrations are reconstructed from the current frontend, not a database export. Apply them to a new Supabase project in order. If your Supabase project already has tables or policies, back it up and compare its schema before applying these migrations; `create table if not exists` will not reconcile an existing table with a different structure.

After applying the migrations, bootstrap the first admin from the Supabase SQL Editor. Replace the email with the exact email of the user already created in Supabase Auth:

```sql
insert into public.portfolio_admins (user_id)
select id
from auth.users
where email = 'your-admin@example.com'
on conflict (user_id) do nothing;
```

Only the first admin should be bootstrapped this way. Once signed in, existing admins can use the `set_portfolio_admin(target_user_id, should_be_admin)` database function to grant or revoke admin access; the last admin cannot be removed.

The app also uses the existing `knowledge_courses`, `knowledge_modules`, `knowledge_lessons`, and `knowledge_reading_progress` tables. Their schemas are not present in the screenshot’s migration list and are not created by the portfolio migrations above, so ensure those tables and their access policies already exist in your Supabase project.

Sign in to the Admin area using an account that has been granted portfolio administrator access:

```text
https://roeldingle.github.io/#/admin
```

## Deployment

The workflow in `.github/workflows/deploy.yml` runs when changes are pushed to `master`, or when manually started from the repository's **Actions** tab. It installs dependencies, runs lint and the production build, then deploys `frontend/dist` to GitHub Pages.

Configure these **repository Actions variables** in GitHub under **Settings → Secrets and variables → Actions → Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

After a workflow run succeeds, visit the **Actions** tab to confirm deployment. A local change is not live until it has been pushed and the deployment workflow has completed successfully.

## Project structure

```text
.
├── .github/workflows/deploy.yml   # Build and deploy to GitHub Pages
├── frontend/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── admin-v3/              # Admin dashboard and editors
│   │   ├── lib/                   # Supabase client and data services
│   │   └── v3/                    # Public portfolio interface
│   └── package.json               # Frontend scripts and dependencies
└── supabase/migrations/           # Database migrations included in this repo
```
