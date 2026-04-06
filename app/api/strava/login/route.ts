export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getStravaCredentials } from '@/lib/strava'

export async function GET(req: Request) {
  // Prefer DB-stored clientId, fall back to env
  const creds = await getStravaCredentials()
  const clientId = creds?.clientId || process.env.STRAVA_CLIENT_ID

  if (!clientId) {
    return new Response(
      'STRAVA_CLIENT_ID is not configured. Add it to .env or connect via the Settings modal.',
      { status: 503 }
    )
  }

  const baseUrl = new URL(req.url).origin
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: `${baseUrl}/api/strava/callback`,
    approval_prompt: 'force',
    scope: 'activity:read_all',
  })

  redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`)
}
