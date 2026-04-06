export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  return data.access_token as string
}

export async function GET(req: Request) {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: 'Strava credentials not configured in .env' },
      { status: 503 }
    )
  }

  const url = new URL(req.url)
  const perPage = url.searchParams.get('per_page') ?? '50'
  const page = url.searchParams.get('page') ?? '1'

  try {
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken)

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
