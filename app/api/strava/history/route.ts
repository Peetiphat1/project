export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getStravaCredentials, getAccessToken } from '@/lib/strava'

export async function GET(req: Request) {
  const creds = await getStravaCredentials()
  if (!creds) {
    return NextResponse.json(
      { error: 'Strava not connected', notConnected: true },
      { status: 503 }
    )
  }

  const url = new URL(req.url)
  const perPage = url.searchParams.get('per_page') ?? '50'
  const page = url.searchParams.get('page') ?? '1'

  try {
    const accessToken = await getAccessToken(creds)

    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!activitiesRes.ok) {
      throw new Error(`Strava activities fetch failed: ${activitiesRes.status}`)
    }

    const activities = await activitiesRes.json()
    return NextResponse.json(activities, { status: 200 })
  } catch (err) {
    console.error('[strava/history] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
