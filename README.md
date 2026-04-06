# The Endurance Log

A Brutalist-themed running dashboard synced dynamically with the Strava API. Track your miles, monitor activities, and maintain a log of your endurance journey in high contrast.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database:** Prisma ORM with local SQLite
- **Styling:** Tailwind CSS (with `next-themes` for dark mode)
- **Integrations:** Strava API v3

## Local Installation Guide

Follow these steps to get the project running locally on your machine:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENWEATHER_API_KEY="your_openweather_api_key_placeholder"
   ```
   > **🛑 Important Strava Setup Note:** Do NOT put your Strava API keys in the `.env` file. This application is configured to store API keys dynamically.

3. **Initialize the Database**
   Run the following commands to generate the Prisma client and sync the schema to your local SQLite database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Configure Strava API Keys in the UI**
   Once the app is running, open it in your browser locally (`http://localhost:3000`). Wait for the **Settings Modal** to appear, and enter your Strava **Client ID**, **Client Secret**, and **Refresh Token** directly via the UI. The application will store them in the database for dynamic retrieval.
