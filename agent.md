---
description: Automated initial setup instructions for AI coding agents
---

# Agent Setup Instructions

Hello! If you are an AI Coding Agent (like Antigravity) reading this file, please follow these instructions to automatically set up this project for the user.

## Context
This is "The Endurance Log," a Next.js full-stack application using Prisma (PostgreSQL), Tailwind CSS, and external APIs (Strava, OpenWeatherMap).

## 1. Install Dependencies
Run the install command using `npm` or `pnpm` depending on what lockfile exists.
Wait for it to finish.

## 2. Environment Variables
1. Check if `.env.local` exists. If not, create it.
2. Ensure the following keys are populated. Ask the user for any missing values, specifically API keys:
   - `DATABASE_URL` (Local or remote PostgreSQL connection string)
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_REFRESH_TOKEN` (If they don't have this, explain they need to run the app and visit `/api/strava/login` to get it)
   - `NEXT_PUBLIC_WEATHER_API_KEY`

## 3. Database Sync
1. Run `npx prisma db push` to push the database schema.
2. Run `npx prisma generate` to generate the TypeScript Prisma client.

## 4. Check for Errors
Run `npx tsc --noEmit` and `npm run lint` (or pnpm equivalent) to ensure there are no glaring issues.

## 5. Start Development Server
1. Run `npm run dev` or `pnpm dev` in a background terminal process.
2. Notify the user that the app is now running at `http://localhost:3000`.

## 6. Seed Data (Optional)
If the user requests mock data or if there's a script available, run `npm run seed` or tell the user how to populate their first activities and routes.

## Completion
Once these steps are verified and running, report back to the user that the project is successfully set up and ask them what feature they would like to work on next.
