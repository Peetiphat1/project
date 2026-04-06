export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { systemSettingsSchema } from '@/lib/validations'

/**
 * GET /api/settings
 * Returns the current UserSettings singleton for pre-populating the modal.
 */
export async function GET() {
  try {
    const settings = await prisma.userSettings.findFirst()
    return NextResponse.json({
      stravaClientId:     settings?.stravaClientId     ?? '',
      stravaClientSecret: settings?.stravaClientSecret ?? '',
      stravaRefreshToken: settings?.stravaRefreshToken ?? '',
      autoSync:           settings?.autoSync           ?? true,
      currentAthleteId:   settings?.currentAthleteId  ?? null,
      stravaAthleteName:  settings?.stravaAthleteName  ?? null,
    })
  } catch (err) {
    console.error('[GET /api/settings]', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

/**
 * POST /api/settings
 * 1. Validates credentials (Zod).
 * 2. Verifies them live against Strava's token endpoint.
 * 3. Fetches the athlete profile to get the real athlete.id.
 * 4. Upserts UserSettings with all fields + currentAthleteId.
 * Returns { saved: true, athleteName, athleteId } on success.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = systemSettingsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { stravaClientId, stravaClientSecret, stravaRefreshToken, autoSync } = result.data

    if (!stravaRefreshToken) {
      // User hasn't completed OAuth yet — just store their IDs so /api/strava/login can use them
      const existing = await prisma.userSettings.findFirst()
      const data = { stravaClientId, stravaClientSecret, autoSync }
      if (existing) {
        await prisma.userSettings.update({ where: { id: existing.id }, data })
      } else {
        await prisma.userSettings.create({ data })
      }
      return NextResponse.json({ saved: true, needsAuth: true })
    }

    // ── Step 1: Verify credentials with Strava ──────────────────────────────
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     stravaClientId,
        client_secret: stravaClientSecret,
        refresh_token: stravaRefreshToken,
        grant_type:    'refresh_token',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      console.error('[POST /api/settings] Strava token error:', errBody)
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Strava rejected these credentials. Check your Client ID, Secret, and Refresh Token.' },
        { status: 400 }
      )
    }

    const tokenData = await tokenRes.json()
    const accessToken: string  = tokenData.access_token
    const freshRefreshToken: string = tokenData.refresh_token ?? stravaRefreshToken

    // ── Step 2: Fetch athlete profile ───────────────────────────────────────
    const athleteRes = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    let athleteId: string   = ''
    let athleteName: string = 'Athlete'

    if (athleteRes.ok) {
      const athlete = await athleteRes.json()
      athleteId   = String(athlete.id ?? '')
      athleteName = athlete.firstname ?? 'Athlete'
    }

    // ── Step 3: Upsert settings ─────────────────────────────────────────────
    const existing = await prisma.userSettings.findFirst()
    const data = {
      stravaClientId,
      stravaClientSecret,
      stravaRefreshToken:  freshRefreshToken,
      autoSync,
      currentAthleteId:    athleteId   || null,
      stravaAthleteId:     athleteId   || null,
      stravaAthleteName:   athleteName || null,
    }

    if (existing) {
      await prisma.userSettings.update({ where: { id: existing.id }, data })
    } else {
      await prisma.userSettings.create({ data })
    }

    return NextResponse.json({ saved: true, athleteName, athleteId })
  } catch (err) {
    console.error('[POST /api/settings]', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
