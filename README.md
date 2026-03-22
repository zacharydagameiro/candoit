# CanDoIt

Supplier discovery and outreach workspace built with React, Vite, and Supabase.

## Stack
- React + TypeScript + Vite
- Tailwind + shadcn/ui
- Supabase (Postgres + Edge Functions)

## Prerequisites
- Node.js 20+
- npm
- Supabase CLI
- A Supabase project

## Local Setup
1. Install deps:
```bash
npm ci
```

2. Create local env file:
```bash
cp .env.example .env.local
```

3. Add values to `.env.local`:
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

4. Run app:
```bash
npm run dev
```

## Database Migrations
Apply migrations to your linked Supabase project:
```bash
supabase db push --linked --include-all
```

## Edge Functions
Functions live under `supabase/functions/`.

Deploy all functions:
```bash
supabase functions deploy --project-ref <your-project-ref>
```

If you only want one function:
```bash
supabase functions deploy contact-suppliers-headless --project-ref <your-project-ref>
```

## Contact Automation Notes
`contact-suppliers-headless` uses a remote browser endpoint.

Set secret:
```bash
supabase secrets set BROWSER_WS_ENDPOINT='wss://...'
```

Important: quote the value to avoid shell parsing issues.

## Build
```bash
npm run build
```

## GitHub Pages Deployment
This repo is configured to deploy from `main` via GitHub Actions:
- Workflow: `.github/workflows/deploy-pages.yml`
- Vite base path is auto-set in CI for repo pages.

### Required GitHub Actions Variables
Set these in:
`Settings -> Secrets and variables -> Actions -> Variables`

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

Note: `VITE_*` values are embedded in frontend bundles by design.

### Enable Pages
In GitHub:
`Settings -> Pages -> Build and deployment -> Source: GitHub Actions`

After that, pushes to `main` will trigger deployment.

## Useful Commands
```bash
npm run dev          # start local app
npm run build        # production build
npm run preview      # preview production build locally
```
