import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    return new NextResponse(
      `<html><body style="font-family:monospace;padding:2rem;background:#1e293b;color:#f87171;">
        <h2>❌ Strava Authorization Failed</h2>
        <p>Error: <strong>${error ?? 'No authorization code received'}</strong></p>
        <p>Close this tab and try <a href="/api/strava/login" style="color:#fb923c">logging in again</a>.</p>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return new NextResponse(
      `<html><body style="font-family:monospace;padding:2rem;">STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET not set.</body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html' } }
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
      return new NextResponse(
        `<html><body style="font-family:monospace;padding:2rem;background:#1e293b;color:#f87171;">
          <h2>❌ Token Exchange Failed</h2>
          <pre>${body}</pre>
        </body></html>`,
        { status: 502, headers: { 'Content-Type': 'text/html' } }
      )
    }

    const data = await tokenRes.json()
    const refreshToken: string = data.refresh_token
    const athleteName: string = data.athlete?.firstname ?? 'Athlete'

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Strava Connected — The Endurance Log</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F5F5F3;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2.5rem;
      max-width: 640px;
      width: 100%;
    }
    .eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #ea580c;
      margin-bottom: 0.5rem;
    }
    h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
    .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    .token-box {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 4px;
      padding: 1rem 1.25rem;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      color: #fb923c;
      word-break: break-all;
      letter-spacing: 0.02em;
      margin-bottom: 1rem;
    }
    .copy-btn {
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      background: #ea580c;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.6rem 1.25rem;
      margin-bottom: 1.5rem;
      transition: background 0.15s;
    }
    .copy-btn:hover { background: #c2410c; }
    .instructions {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 4px;
      padding: 1rem 1.25rem;
      font-size: 0.8125rem;
      color: #9a3412;
      line-height: 1.6;
    }
    .instructions strong { font-weight: 700; }
    code {
      background: #ffedd5;
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
    }
    .back-link {
      display: inline-block;
      margin-top: 1.5rem;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #ea580c;
      text-decoration: none;
    }
    .back-link:hover { color: #c2410c; }
  </style>
</head>
<body>
  <div class="card">
    <p class="eyebrow">Strava OAuth · The Endurance Log</p>
    <h1>✓ Connected, ${athleteName}!</h1>
    <p class="subtitle">Your Strava account is authorized. Copy the refresh token below and add it to your environment file.</p>

    <p class="label">Your Refresh Token</p>
    <div class="token-box" id="token">${refreshToken}</div>

    <button class="copy-btn" onclick="navigator.clipboard.writeText('${refreshToken}').then(()=>{this.textContent='✓ Copied!';setTimeout(()=>this.textContent='Copy Token',2000)})">
      Copy Token
    </button>

    <div class="instructions">
      <strong>Next step:</strong> Open your <code>.env</code> file and add (or update) this line:
      <br /><br />
      <code>STRAVA_REFRESH_TOKEN=${refreshToken}</code>
      <br /><br />
      Then <strong>restart your dev server</strong> (<code>npm run dev</code>) so the new token is picked up. Your dashboard will now display real Strava activities.
    </div>

    <a class="back-link" href="/">← Back to Dashboard</a>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (err) {
    console.error('Strava callback error:', err)
    return new NextResponse(
      `<html><body style="font-family:monospace;padding:2rem;">Internal error during token exchange.</body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}
