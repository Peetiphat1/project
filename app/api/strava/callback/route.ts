export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { saveStravaCredentials } from '@/lib/strava'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/?strava_error=${encodeURIComponent(error ?? 'no_code')}`, req.url)
    )
  }

  // Client ID + Secret — try DB first, then env
  // (The user must have set them in .env or previously via the UI)
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/?strava_error=credentials_missing', req.url)
    )
  }

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[strava/callback] token exchange failed:', body)
      return NextResponse.redirect(
        new URL('/?strava_error=token_exchange_failed', req.url)
      )
    }

    const data = await tokenRes.json()
    const refreshToken: string = data.refresh_token
    const athleteId: string = String(data.athlete?.id ?? '')
    const athleteName: string = data.athlete?.firstname ?? 'Athlete'

    // 💾 Save to database — no more manual .env editing!
    await saveStravaCredentials({
      refreshToken,
      athleteId,
      athleteName,
      clientId,
      clientSecret,
    })

    // Redirect back to dashboard with success flag
    return NextResponse.redirect(
      new URL(`/?strava_connected=${encodeURIComponent(athleteName)}`, req.url)
    )
  } catch (err) {
    console.error('[strava/callback] error:', err)
    return NextResponse.redirect(
      new URL('/?strava_error=internal_error', req.url)
    )
  }
}
