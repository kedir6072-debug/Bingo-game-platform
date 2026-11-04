# Real-Time Multiplayer Bingo Platform

Production-ready real-time multiplayer Bingo web app built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth / Postgres / Realtime
- Vercel deployment

## Getting Started

1. Copy env
```bash
cp .env.example .env.local
```

2. Fill in Supabase credentials

3. Run dev server
```bash
npm run dev
```

## Database
Run migrations in Supabase SQL Editor:
- `database/schema.sql`
- `database/rls-policies.sql`

## Project Structure
- `src/lib/supabase` - clients
- `src/lib/game-engine` - card generation, pattern detection
- `src/app` - Next.js routes

## Roadmap
See planning docs.
