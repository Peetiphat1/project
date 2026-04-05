export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY ?? process.env.NEXT_PUBLIC_WEATHER_API_KEY
  const city = 'Kathu,TH'

  if (!apiKey) {
    // Return sensible fallback so UI doesn't break without a key
    return NextResponse.json({
      temp: 29,
      description: 'Partly Cloudy',
      wind: 14,
      humidity: 72,
      city: 'Kathu',
      icon: '02d',
    })
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
      { next: { revalidate: 1800 } } // cache 30 min
    )
    if (!res.ok) throw new Error(`OpenWeather ${res.status}`)
    const data = await res.json()
    return NextResponse.json({
      temp: Math.round(data.main.temp),
      description: data.weather[0]?.description ?? 'Clear',
      wind: Math.round(data.wind.speed * 3.6), // m/s → km/h
      humidity: data.main.humidity,
      city: data.name,
      icon: data.weather[0]?.icon ?? '01d',
    })
  } catch (err) {
    console.error('Weather API error:', err)
    return NextResponse.json({
      temp: 29,
      description: 'Partly Cloudy',
      wind: 14,
      humidity: 72,
      city: 'Kathu',
      icon: '02d',
    })
  }
}
