# shaunak.github.io

Personal website and playground app(s), including:

- Home page (`/#/`)
- Blog (`/#/blog`)
- DenLoop auth/profile flow (`/#/denLoop`)

The React app lives in `web-ui/` and is deployed to GitHub Pages.

## Tech stack

- React + TypeScript (Create React App)
- React Router (`HashRouter`)
- Supabase (Auth + Postgres)
- `gh-pages` for deployment

## Project structure

- `web-ui/` - frontend app source, build, and deploy scripts
- `supabase/` - local Supabase CLI config and project files

## Local development

From the `web-ui/` directory:

```bash
npm install
npm start
```

App runs at `http://localhost:3000`.

## Environment variables

Create `web-ui/.env.local` (or `.env`) with:

```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

These are required for any Supabase-backed route/feature.

## Deploy to production (GitHub Pages)

This repo uses the `gh-pages` flow (same general approach as [`react-gh-pages`](https://github.com/gitname/react-gh-pages)).

From `web-ui/`:

```bash
npm run deploy
```

What happens:

1. `predeploy` runs `npm run build`
2. `deploy` publishes `build/` to the `gh-pages` branch
3. GitHub Pages serves the latest published build

Production URL: `https://shaunak.github.io`

## How Supabase works in this app

### 1) Shared Supabase env config

Most Supabase clients are initialized with:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### 2) DenLoop auth + profile flow

Files:

- `web-ui/src/DenLoop.tsx`
- `web-ui/src/ProfileSetup.tsx`
- `web-ui/src/YourLoopsCard.tsx`

Behavior:

- Uses `supabase.auth.signUp`, `signInWithPassword`, and `signOut`
- On auth state/session changes, fetches the current user's profile from `profiles`
- New users complete profile setup (insert/update on `profiles`)
- "Your Loops" joins `profilesongroups` -> `groups` to show group memberships

Tables currently referenced in frontend code:

- `profiles`
- `profilesongroups`
- `groups`

### 3) Blog auth is intentionally isolated

Files:

- `web-ui/src/blogSupabaseClient.ts`
- `web-ui/src/Blog.tsx`

The blog uses a dedicated Supabase client with `auth.storageKey = "sb-blog-auth"` so blog auth state does not overwrite DenLoop auth state in local storage.  
`Blog.tsx` reads posts from `posts` and uses Supabase auth to unlock protected content.

Table referenced:

- `posts`

## Notes

- If deploy fails with SSH/remote issues, verify your git remote and GitHub auth setup.
- Build warnings do not always block deploy, but fix lint issues for cleaner CI and safer releases.
