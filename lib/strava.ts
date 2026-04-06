/**
 * lib/strava.ts
 *
 * Shared helper that resolves Strava OAuth credentials from two sources,
 * with priority:
 *   1. UserSettings row in the database (saved via the web auth flow)
 *   2. Environment variables (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN)
 *
 * This lets the app work without a server restart after re-authorising via /api/strava/login.
 */

import prisma from '@/lib/prisma'

export interface StravaCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

/**
 * Loads Strava credentials exclusively from the UserSettings DB record.
 * Returns null if the record is missing or any required field is blank.
 * Configure credentials via the System Settings modal in the UI.
 */
export async function getStravaCredentials(): Promise<StravaCredentials | null> {
  try {
    const settings = await prisma.userSettings.findFirst()
    const clientId     = settings?.stravaClientId?.trim()     ?? ''
    const clientSecret = settings?.stravaClientSecret?.trim() ?? ''
    const refreshToken = settings?.stravaRefreshToken?.trim() ?? ''
    if (!clientId || !clientSecret || !refreshToken) return null
    return { clientId, clientSecret, refreshToken }
  } catch {
    return null
  }
}

/**
 * Exchanges credentials for a short-lived access token.
 */
export async function getAccessToken(creds: StravaCredentials): Promise<string> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed: ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

/**
 * Saves (upserts) Strava credentials to the UserSettings singleton row.
 * clientId/clientSecret may be omitted if already stored in DB.
 */
export async function saveStravaCredentials(opts: {
  refreshToken: string
  athleteId?: string
  athleteName?: string
  clientId?: string
  clientSecret?: string
}) {
  const existing = await prisma.userSettings.findFirst()
  const data = {
    stravaRefreshToken: opts.refreshToken,
    ...(opts.athleteId && { stravaAthleteId: opts.athleteId }),
    ...(opts.athleteName && { stravaAthleteName: opts.athleteName }),
    ...(opts.clientId && { stravaClientId: opts.clientId }),
    ...(opts.clientSecret && { stravaClientSecret: opts.clientSecret }),
  }
  if (existing) {
    await prisma.userSettings.update({ where: { id: existing.id }, data })
  } else {
    await prisma.userSettings.create({ data })
  }
}
