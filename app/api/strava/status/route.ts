export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStravaCredentials } from '@/lib/strava'

/**
 * GET /api/strava/status
 * Returns whether Strava is connected and the athlete name if so.
 */
export async function GET() {
  const creds = await getStravaCredentials()
  if (!creds) {
    return NextResponse.json({ connected: false })
  }

  const settings = await prisma.userSettings.findFirst()
  return NextResponse.json({
    connected: true,
    athleteName: settings?.stravaAthleteName ?? null,
    source: settings?.stravaRefreshToken ? 'database' : 'env',
  })
}

/**
 * DELETE /api/strava/status
 * Disconnects Strava by clearing the DB token.
 * (Falls back to .env until the server restarts, by design.)
 */
export async function DELETE() {
  try {
    const settings = await prisma.userSettings.findFirst()
    if (settings) {
      await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          stravaRefreshToken: null,
          stravaAthleteId: null,
          stravaAthleteName: null,
        },
      })
    }
    return NextResponse.json({ disconnected: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
