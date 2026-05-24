# Taskloom Kanban

A production-shaped realtime collaborative Kanban platform built with Next.js 15, Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Tailwind CSS, shadcn-style primitives, Framer Motion, Zustand, dnd-kit, React Hook Form/Zod patterns, Lucide icons, and next-themes.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.

3. Copy environment variables:

```bash
cp .env.example .env.local
```

4. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Start the app:

```bash
npm run dev
```

New signups automatically receive a seeded workspace, board, labels, columns, and tasks.

## Deployment

Deploy to Vercel, set the same environment variables, and ensure Supabase Auth redirect URLs include:

- `http://localhost:3000/auth/callback`
- `https://your-domain.com/auth/callback`

## Architecture

- `app/` contains App Router routes, protected layouts, server actions, API routes, loading and error states.
- `components/` contains reusable UI primitives, auth UI, shell layout, board UI, task modal, notifications, and theme controls.
- `lib/` contains Supabase clients, typed data fetchers, validation schemas, utilities, and domain types.
- `store/` contains Zustand state for optimistic Kanban interactions.
- `supabase/schema.sql` contains PostgreSQL tables, indexes, RLS policies, triggers, defaults, audit logging, and realtime publication.
