# Ink & Tasks

A beautifully crafted to-do list app for creative professionals, built with a dark Art Nouveau aesthetic.

## Features

- Create tasks with due dates, priority levels (high / medium / low), and optional notes
- Mark tasks complete or delete them
- Data persists across sessions via Supabase
- User accounts with Row Level Security — your tasks are private to you
- Sign in with email/password or Google
- Anonymous sign-in lets you start immediately, no account required

## Tech Stack

- **Frontend**: Vite (vanilla JS), Google Fonts, Phosphor Icons
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Hosting**: Netlify (auto-deploys on push to `main`)

## Local Development

1. Clone the repo
   ```bash
   git clone https://github.com/your-username/ink-and-tasks.git
   cd ink-and-tasks
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase **Project URL** and **anon public key** from the Supabase dashboard under Project Settings → API.

4. Run the dev server
   ```bash
   npm run dev
   ```

## Database

Migrations live in `supabase/migrations/`. To apply them to your Supabase project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Deployment

The app deploys automatically via Netlify on every push to `main`.

In the Netlify dashboard, set the following environment variables under **Site configuration → Environment variables**:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

## Agent Skills

The project includes five specialized AI agent skills under `.cursor/skills/` that audit and test different layers of the app:

| Skill | What it does |
|---|---|
| `ux-reviewer` | Full UX audit across accessibility, interaction flows, visual consistency, and copy |
| `db-auditor` | Reviews Supabase schema, RLS policies, storage rules, and frontend query patterns |
| `a11y-tester` | Focused WCAG 2.2 AA accessibility audit with criterion references |
| `adhd-ux-specialist` | Evaluates cognitive load, friction scores, object permanence, and dopamine design |
| `vue-reviewer` | Reviews Vue component quality, reactivity, composables, and style isolation |

You can invoke any of them by asking things like "run a database audit", "check accessibility", "how ADHD-friendly is this?", or "review my Vue components." When you're ready to orchestrate them later (e.g., a "pre-deploy" meta-skill that runs all five in sequence), the consistent report format will make it easy to aggregate findings.
