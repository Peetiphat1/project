export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export interface StravaActivity {
  id: number
  name: string
  start_date: string        // UTC ISO
  start_date_local: string
  distance: number          // metres
  moving_time: number       // seconds
  total_elevation_gain: number
  average_speed: number     // m/s
  type: string
  map: { summary_polyline: string }
}

interface WeeklyStats {
  weeklyKm: string
  avgPace: string
  runCount: number
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // start Monday
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function calcWeeklyStats(activities: StravaActivity[]): WeeklyStats {
  const weekStart = getWeekStart()
  const thisWeek = activities.filter(
    (a) => a.type === 'Run' && new Date(a.start_date) >= weekStart
  )

  const totalMetres = thisWeek.reduce((s, a) => s + a.distance, 0)
  const totalSecs = thisWeek.reduce((s, a) => s + a.moving_time, 0)
  const weeklyKm = (totalMetres / 1000).toFixed(1)

  let avgPace = '—'
  if (totalMetres > 0) {
    const secPerKm = totalSecs / (totalMetres / 1000)
    const min = Math.floor(secPerKm / 60)
    const sec = Math.round(secPerKm % 60)
    avgPace = `${min}:${sec.toString().padStart(2, '0')}`
  }

  return { weeklyKm, avgPace, runCount: thisWeek.length }
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
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
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

export async function GET(req: Request) {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ error: 'Strava credentials not configured' }, { status: 503 })
  }

  const url = new URL(req.url)
  const mode = url.searchParams.get('mode') // 'recent' | 'weekly' | undefined

  try {
    const access_token = await getAccessToken(clientId, clientSecret, refreshToken)

    // Fetch enough activities to cover current week + 2 display cards
    const perPage = mode === 'weekly' ? 30 : 10
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (!activitiesRes.ok) throw new Error(`Activities fetch failed: ${activitiesRes.status}`)

    const activities: StravaActivity[] = await activitiesRes.json()
    const weeklyStats = calcWeeklyStats(activities)
    const recent = activities.slice(0, 2)

    return NextResponse.json({ activities: recent, weeklyStats }, { status: 200 })
  } catch (err) {
    console.error('Strava API error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
