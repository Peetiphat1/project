# The Endurance Log

A dynamic, full-stack Next.js application designed to track your running progress, monitor your gear (shoe) mileage, and sync seamlessly with your Strava activities and local weather.

## Features
- **Strava Integration**: Automatically fetches your most recent activities and weekly training volume directly from Strava.
- **Gear Tracker**: Manage your running shoe roster, automatically track wear & tear based on a target lifespan, and set a "default" pair. Image uploads supported.
- **Dynamic Weather**: Gives you a quick overview of the current weather based on OpenWeather API.
- **Interactive Milestones**: Track your lifetime miles or short-term training goals visually.
- **Route Tracking**: Store your favorite routes and see your Strava tracks drawn as beautiful polyline SVGs.

---

## Prerequisites
Before you start, ensure you have the following installed on your machine (Applies to both **Windows** and **Mac**):
- **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
- **[PostgreSQL](https://www.postgresql.org/)**: Installed locally, or running via Docker, or use a hosted service like Supabase/Neon.
- **A Strava Account**: You will need to create an API Application in your Strava settings to get your API keys.
- **OpenWeatherMap Account (Optional)**: For live weather data.

---

## AI Auto-Setup (Recommended)

If you are using an AI coding assistant like **Antigravity**, you can skip all manual steps! Just copy the `agent.md` file into the chat, and the agent will automatically parse the requirements, prompt you for API keys, sync the database, and spin up the development server for you.

---

## Manual Setup Guide

### 1. Clone & Install Dependencies
First, clone the project and install the required npm packages:
```bash
git clone <your-repo-url>
cd project
npm install
```

### 2. Environment Variables
Create a file named `.env.local` (or modify `.env`) in the root of the project. You will need to define the following variables:

```env
# --- DATABASE (PostgreSQL) ---
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:password@localhost:5432/endurance_log"

# --- STRAVA API ---
# Get these by going to https://www.strava.com/settings/api
STRAVA_CLIENT_ID="your_client_id"
STRAVA_CLIENT_SECRET="your_client_secret"
# You will get the refresh token in Step 4
STRAVA_REFRESH_TOKEN=""

# --- WEATHER API (Optional) ---
# Get a free key at https://openweathermap.org/api
NEXT_PUBLIC_WEATHER_API_KEY="your_openweather_api_key"
```

### 3. Database Setup (Prisma)
Ensure your PostgreSQL server is running. Then, sync your Prisma schema to your database.

```bash
# Push the schema to your database
npx prisma db push

# Generate the Prisma Client
npx prisma generate
```

### 4. Setting up Strava Authentication
To fetch your personal running data, the app needs a Strava Refresh Token.

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   [http://localhost:3000/api/strava/login](http://localhost:3000/api/strava/login)
3. You will be redirected to Strava to authorize the app. Click **Authorize**.
4. You will then be redirected back to the app, and you will see a screen displaying your **Refresh Token**.
5. Copy that Refresh Token and paste it into your `.env.local` file:
   ```env
   STRAVA_REFRESH_TOKEN="paste_your_token_here"
   ```

### 5. Start the App!
Once everything is configured, run the development server:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your dashboard in action!

---

## Common Issues (Windows & Mac)

- **Database Connection Refused**:
  - **Mac**: Make sure Postgres is running via Postgres.app, Homebrew (`brew services start postgresql`), or Docker.
  - **Windows**: Make sure the PostgreSQL background service is running in `services.msc` or via pgAdmin. Check that your user/password strictly matches the `DATABASE_URL`.
- **Zod Validation Errors on Gear Upload**:
  - Image uploads via the UI use Base64 conversion. Ensure your local environment does not have heavy payloads disabled.
- **Prisma Client not found**:
  - If you see an error related to `@prisma/client`, kill the dev server and run `npx prisma generate` again.
- **Invalid Strava Token**:
  - Ensure the OAuth app created at Strava belongs to your own account, and you checked the `activity:read_all` permission when authorizing.
