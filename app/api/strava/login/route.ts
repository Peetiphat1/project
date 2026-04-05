import { redirect } from 'next/navigation'

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID

  if (!clientId) {
    return new Response('STRAVA_CLIENT_ID is not set in .env.local', { status: 503 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: 'http://localhost:3000/api/strava/callback',
    approval_prompt: 'force',
    scope: 'activity:read_all',
  })

  redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`)
}
