# AI Agent System Prompt: The Endurance Log

When updating, debugging, or extending this codebase, you MUST adhere to the following rules:

## Architecture
- **Framework:** Next.js App Router exclusively.
- **Components:** Prefer Server Components wherever possible. Use Client Components (`"use client"`) only when interactivity, state, or client-side hooks are absolutely necessary.

## Database
- **Provider & ORM:** Prisma with **SQLite**.
- **Constraint:** NEVER change the database provider to PostgreSQL, MySQL, or any other database engine. Stick strictly to local SQLite (`DATABASE_URL="file:./dev.db"`).

## Authentication & API Configurations
- **Strava Data:** All Strava credentials (Client ID, Secret, Refresh Token) are fetched dynamically from the `SystemSettings` Prisma model. 
- **Constraint:** Do NOT attempt to read Strava keys from `process.env`. They are purely database-driven. Do not modify the application to store or expect them in `.env` files.

## Design System
- **Theme:** Brutalist UI, high contrast, stark layouts.
- **Styling Rules:** 
  - Must constantly support and include `dark:` Tailwind variants alongside standard styling (e.g., `dark:bg-slate-950`, `dark:text-slate-100`).
  - **Colors:** Primary light mode colors are off-white, navy slate, and burnt-orange, with their appropriate dark mode counterparts. Keep designs bold and sharp without unnecessary fluff.

## Execution Requirements
- If you need to test the app or initialize the environment, execute the following standard terminal commands:
  - `npm install` (to install dependencies)
  - `npx prisma db push` (to sync the database schema)
  - `npm run dev` (to start the local development server)
