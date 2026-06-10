# TaskTrack

TaskTrack is a modern web application to manage tasks, deadlines, courses, projects, and meetings from one centralized workspace.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Create a `.env.local` file with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Project Structure

- `app/` — Next.js app routes for dashboard, tasks, meetings, courses, calendar, and auth
- `components/` — reusable UI components for pages
- `lib/` — Supabase client, utilities, and validation helpers
- `types/` — shared TypeScript definitions
- `database/` — PostgreSQL schema for Supabase

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
