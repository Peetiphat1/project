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
 * Fetches the 20 most recent Strava activities (enough to catch anything
 * since the last sync), upserts them into the Activity table using stravaId
 * as a dedup key, then increments the default Gear's startingMileage by
 * the distance of newly-inserted activities only.
 *
 * After updating mileage, auto-retires gear whose wear has hit 100%.
 */
export async function POST() {
  try {
    const accessToken = await getAccessToken()

    // Fetch only the 20 most recent — efficient and avoids re-processing old data
    const res = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=20',
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

    if (!rawActivities.length) {
      return NextResponse.json({ synced: 0, totalActivities: 0, totalKm: 0 })
    }

    // Determine which of the incoming stravaIds already exist in the DB
    const incomingIds = rawActivities.map((a) => String(a.id))
    const existing = await prisma.activity.findMany({
      where: { stravaId: { in: incomingIds } },
      select: { stravaId: true },
    })
    const existingSet = new Set(existing.map((e) => e.stravaId))

    // Only create the new ones
    const toCreate = rawActivities
      .filter((a) => !existingSet.has(String(a.id)))
      .map((a) => ({
        stravaId: String(a.id),
        name: a.name,
        distanceKm: a.distance / 1000,
        durationSec: a.moving_time,
        elevationM: a.total_elevation_gain,
        date: new Date(a.start_date_local),
        isManual: false,
      }))

    let syncedCount = 0
    if (toCreate.length > 0) {
      const created = await prisma.activity.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
      syncedCount = created.count
    }

    // Increment default gear's mileage by the sum of genuinely new activities
    if (syncedCount > 0) {
      const newKm = toCreate.reduce((s, a) => s + a.distanceKm, 0)
      const defaultGear = await prisma.gear.findFirst({ where: { isDefault: true } })

      if (defaultGear && newKm > 0) {
        const updatedMileage = defaultGear.startingMileage + newKm
        const shouldRetire = updatedMileage >= defaultGear.targetLifespan

        await prisma.gear.update({
          where: { id: defaultGear.id },
          data: {
            startingMileage: updatedMileage,
            // Auto-retire if lifespan is exceeded
            ...(shouldRetire ? { status: 'Retired' } : {}),
          },
        })
      }
    }

    // Recalculate total from all activities
    const totalResult = await prisma.activity.aggregate({ _sum: { distanceKm: true } })
    const totalKm = totalResult._sum.distanceKm ?? 0

    return NextResponse.json({
      synced: syncedCount,
      totalActivities: rawActivities.length,
      totalKm: Math.round(totalKm * 10) / 10,
    })
  } catch (err) {
    console.error('[strava/sync]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
