/**
 * DEV.TO UPLOAD SCRIPT
 * --------------------
 * Usage: 
 * 1. Generate an API Key at https://dev.to/settings/extensions 
 * 2. Set the DEV_TO_API_KEY environment variable.
 * 3. Run: `node upload_devto.js`
 */

const fs = require('fs');
const path = require('path');

// Update this path to where your blog_post.md is stored if needed.
const blogPostPath = path.join(__dirname, 'artifacts', 'blog_post.md'); // Adjust this to point to the actual artifact path when you run it!

// Attempt to load from .env file directly if it exists
let envApiKey = process.env.DEV_TO_API_KEY;
const envPath = path.join(__dirname, '.env');
if (!envApiKey && fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const match = envFile.match(/^DEV_TO_API_KEY\s*=\s*["']?(.*?)["']?$/m);
  if (match) {
    envApiKey = match[1];
  }
}
const DEV_TO_API_KEY = envApiKey;

async function uploadToDevTo() {
  if (!DEV_TO_API_KEY) {
    console.error("❌ Error: DEV_TO_API_KEY environment variable is missing.");
    console.log("Please create an API key at https://dev.to/settings/extensions");
    console.log("Run the script via: DEV_TO_API_KEY='your_key' node upload_devto.js (Mac/Linux) or set the env var on Windows.");
    return;
  }

  // To run this easily, you can just paste the markdown directly below if you don't want to mess with file paths
  const markdownContent = `---
title: "Building 'The Endurance Log' 🏃‍♂️: A Full-Stack Next.js Strava Dashboard"
published: false
description: "A deep dive into the features and architecture of a robust running and gear tracking dashboard."
tags: "nextjs, react, webdev, database"
---

# Introduction: The Runner's Dilemma
If you're a passionate runner, you likely use Strava to track your activities. But what about tracking the wear and tear on your favorite shoes? Or visualizing your long-term milestones in a custom dashboard alongside your local weather? 

Enter **The Endurance Log**, a dynamic, full-stack application built to give you total control over your running analytics.

This article serves as both a **User Guide** (how the app works) and a **System Document** (how the app is built), breaking down the architecture choices and the underlying tech stack.

---

## Part 1: The User Guide 🚀

The Endurance Log is designed to be your pre- and post-run command center. Here are its core features:

### 1. Smart Dashboard & Strava Sync
The heart of the app automatically connects to your Strava account. By navigating through a seamless OAuth flow, the app continuously syncs your recent activities. It fetches exact distances, elevation gains, and activity times, displaying them in interactive user interfaces.

### 2. Gear & Shoe Tracker
Running shoes have a lifespan—usually around 300 to 500 miles. The Gear Tracker lets you input your current shoe roster, log their brand/model, set starting milage, and establish a "target lifespan". As you log kilometers (via Strava or manually), you can visualize the progressive wear-and-tear of your favorite pairs before they cause injuries.

### 3. Dynamic Weather & Route Visualization
Using the OpenWeather API, the application pulls live weather data directly into your dashboard, helping you decide whether to grab a windbreaker or sunscreen. 
Additionally, the Route Tracker converts complex Strava polyline data into beautiful, smooth SVG maps showing your favorite custom runs.

---

## Part 2: System Architecture 🛠️

Under the hood, **The Endurance Log** relies on a modern, robust JavaScript ecosystem. Let's look at the system architecture.

### The Technology Stack
* **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Lucide React (for iconography).
* **Backend:** Next.js API Routes handle server-side logic and third-party API communication.
* **Database & ORM:** PostgreSQL managed flawlessly by Prisma ORM (@prisma/client). 
* **3rd Party Integrations:** Strava API (OAuth 2.0 & Webhooks) and OpenWeatherMap, with mapping utilities by Mapbox (@mapbox/polyline).

### Data Models & Prisma Schema
The database architecture is centered around four main entities:
* **Activity**: Unifies synchronized Strava runs and manual entries. It avoids duplicates by enforcing unique constraints on the stravaId.
* **Gear**: Tracks shoe lifecycle, including images and default status.
* **Route**: Stores saved paths using encoded polyline strings. 
* **UserSettings**: Securely holds Strava OAuth tokens (Client ID, Secret, and Refresh Token) to maintain a persistent connection with the Strava API without forcing the user to log in daily.

### Strava OAuth Flow integration
Instead of storing sensitive User passwords, The Endurance Log redirects users to https://www.strava.com/settings/api. Once authorized, Strava returns a refresh token. The backend securely saves this inside the Postgres database, allowing background data syncing via Next.js server actions. 

---

## Conclusion
The Endurance Log isn't just a data wrapper—it’s a highly tailored dashboard bridging the gap between raw GPS data and actionable training insights. Whether you want to prevent overusing your shoes, map out your best routes, or simply admire your lifetime mileage, the system is built to scale alongside your fitness goals!

*Have you built fitness tech or integrated with Strava? Drop a comment below!*`;

  try {
    const response = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": DEV_TO_API_KEY
      },
      body: JSON.stringify({
        article: {
          title: "Building 'The Endurance Log' 🏃‍♂️: A Full-Stack Next.js Strava Dashboard",
          published: false,
          body_markdown: markdownContent,
          tags: ["nextjs", "react", "webdev", "database"]
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Successfully created draft post on Dev.to!");
      console.log("👉 Go to your dashboard to review and publish: ", data.url);
    } else {
      console.error("❌ Failed to create post.");
      console.error(await response.text());
    }
  } catch (error) {
    console.error("❌ Request Error: ", error);
  }
}

uploadToDevTo();
