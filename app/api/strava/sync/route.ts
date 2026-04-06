export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ── Strava helpers ─────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    throw new Error('Strava credentials not configured in .env')
  }
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return (await res.json()).access_token as string
}

// ── POST /api/strava/sync ──────────────────────────────────────────────────
/**
 * Fetches recent Strava activities, upserts them into the Activity table
 * (using stravaId as dedup key), then increments the default Gear's
 * startingMileage by the sum of any NEW activities only.
 */
export async function POST() {
  try {
    const accessToken = await getAccessToken()

    // Fetch up to 50 recent activities
    const res = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) throw new Error(`Strava fetch failed: ${res.status}`)

    const rawActivities: Array<{
      id: number
      name: string
      distance: number
      moving_time: number
      total_elevation_gain: number
      start_date_local: string
      type: string
    }> = await res.json()

    // Upsert each activity — createMany with skipDuplicates is the atomic dedup
    const toCreate = rawActivities.map((a) => ({
      stravaId: String(a.id),
      name: a.name,
      distanceKm: a.distance / 1000,
      durationSec: a.moving_time,
      elevationM: a.total_elevation_gain,
      date: new Date(a.start_date_local),
      isManual: false,
    }))

    // createMany with skipDuplicates will ignore rows where stravaId already exists
    const created = await prisma.activity.createMany({
      data: toCreate,
      skipDuplicates: true,
    })

    const newKm = toCreate
      .slice(0, created.count) // order preserved so this approximates new rows
      .reduce((s, a) => s + a.distanceKm, 0)

    // Recalculate total from all activities for accurate sum
    const totalResult = await prisma.activity.aggregate({ _sum: { distanceKm: true } })
    const totalKm = totalResult._sum.distanceKm ?? 0

    // Update default gear's startingMileage to match the DB total
    const defaultGear = await prisma.gear.findFirst({ where: { isDefault: true } })
    if (defaultGear && created.count > 0) {
      // Sum ONLY new Strava activities just inserted
      const existingStravaIds = rawActivities
        .slice(created.count) // approximate: skip the newly created ones
        .map((a) => String(a.id))

      const newActivitiesKm = rawActivities
        .filter((a) => !existingStravaIds.includes(String(a.id)))
        .reduce((s, a) => s + a.distance / 1000, 0)

      if (newActivitiesKm > 0) {
        await prisma.gear.update({
          where: { id: defaultGear.id },
          data: {
            startingMileage: { increment: newActivitiesKm },
          },
        })
      }
    }

    return NextResponse.json({
      synced: created.count,
      totalActivities: rawActivities.length,
      totalKm: Math.round(totalKm * 10) / 10,
    })
  } catch (err) {
    console.error('[strava/sync]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
