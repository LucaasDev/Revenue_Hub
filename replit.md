# Avenue — Personal Finance App

A personal finance management app built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Architecture

- **Frontend**: React 18 + Vite SPA (pure client-side, no custom backend)
- **Auth & Database**: Supabase (hosted — `muuvbeackiwenubmjlid.supabase.co`)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **State**: TanStack Query for server state, React Context for auth
- **Routing**: React Router v6

## Key Directories

- `src/pages/` — top-level route pages (Dashboard, Transactions, Accounts, Goals, etc.)
- `src/components/` — shared UI components and dialogs
- `src/hooks/` — data hooks (`useSupabaseData.ts`, `useFamilyData.ts`)
- `src/contexts/` — React contexts (`AuthContext.tsx`)
- `src/integrations/supabase/` — Supabase client + generated TypeScript types
- `supabase/migrations/` — SQL migrations for the Supabase project

## Running the App

```bash
npm run dev     # Start dev server on port 5000
npm run build   # Production build
```

## Environment Variables

Set in Replit Secrets/Env Vars (shared):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (public, safe to expose)
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

## Features

- User authentication (login, invite-based registration)
- Accounts management (checking, wallet, investment)
- Transaction tracking (income/expense, recurring)
- Credit card tracking
- Financial goals with progress
- Category management
- Reports/charts
- Family group sharing with role-based access (admin, editor, viewer)
