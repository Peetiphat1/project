'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Droplets,
  MapPin,
  ArrowRight,
  Trophy,
  Activity,
  Footprints,
  Zap,
  TrendingUp,
  Clock,
  BarChart2,
  Flame,
  ChevronRight,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface WeatherData {
  temp: number
  description: string
  wind: number
  humidity: number
  city: string
  icon: string
}

interface GearData {
  id: string
  brandModel: string
  startingMileage: number
  targetLifespan: number
  status: string
  isDefault: boolean
}

interface RouteData {
  id: string
  name: string
  distance: number
  elevation: number
  terrain: string
  createdAt: string
}

interface StravaActivity {
  id: number
  name: string
  start_date_local: string
  distance: number        // metres
  moving_time: number     // seconds
  total_elevation_gain: number
  average_speed: number   // m/s
  type: string
  map: { summary_polyline: string }
}

interface WeeklyStats {
  weeklyKm: string
  avgPace: string
  runCount: number
}

interface Milestone {
  id: string
  title: string
  targetKm: number
  currentKm: number
}

interface ActivityRecord {
  id: string
  name: string
  distanceKm: number
  durationSec: number
  elevationM: number
  date: string
  isManual: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDistance(metres: number) {
  return (metres / 1000).toFixed(2)
}

function formatMovingTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function calcPace(metres: number, seconds: number) {
  if (metres === 0) return '—'
  const secPerKm = seconds / (metres / 1000)
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Decodes a Strava summary_polyline and renders it as a scaled SVG path */
function PolylineMap({ polyline }: { polyline: string }) {
  if (!polyline) {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 144" fill="none" aria-hidden="true">
        <polyline points="20,110 60,85 100,95 130,60 170,70 210,45 260,55 300,30"
          stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="110" r="4" fill="#22c55e" />
        <circle cx="300" cy="30" r="4" fill="#ef4444" />
      </svg>
    )
  }

  // Lazy-import polyline decoder only in browser
  let coords: number[][] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const polylineLib = require('@mapbox/polyline')
    coords = polylineLib.decode(polyline) // [[lat,lng], ...]
  } catch {
    coords = []
  }

  if (coords.length < 2) {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 144" fill="none" aria-hidden="true">
        <polyline points="20,110 60,85 100,95 130,60 170,70 210,45 260,55 300,30"
          stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="110" r="4" fill="#22c55e" />
        <circle cx="300" cy="30" r="4" fill="#ef4444" />
      </svg>
    )
  }

  // Note: Strava [lat, lng] — use lng as X, lat as Y (flip Y for SVG)
  const lngs = coords.map(([, lng]) => lng)
  const lats = coords.map(([lat]) => lat)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const W = 320, H = 144, PAD = 12
  const scaleX = (maxLng - minLng) === 0 ? 1 : (W - PAD * 2) / (maxLng - minLng)
  const scaleY = (maxLat - minLat) === 0 ? 1 : (H - PAD * 2) / (maxLat - minLat)

  const points = coords
    .map(([lat, lng]) => [
      PAD + (lng - minLng) * scaleX,
      H - PAD - (lat - minLat) * scaleY, // flip Y
    ])
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  const [startX, startY] = [PAD + (lngs[0] - minLng) * scaleX, H - PAD - (lats[0] - minLat) * scaleY]
  const [endX, endY] = [PAD + (lngs.at(-1)! - minLng) * scaleX, H - PAD - (lats.at(-1)! - minLat) * scaleY]

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true">
      <polyline points={points} stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={startX} cy={startY} r="4" fill="#22c55e" />
      <circle cx={endX} cy={endY} r="4" fill="#ef4444" />
    </svg>
  )
}

function RunStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{value}</span>
        <span className="text-xs text-slate-500 font-mono">{unit}</span>
      </div>
    </div>
  )
}

function StravaCard({ activity, index }: { activity: StravaActivity; index: number }) {
  const km = formatDistance(activity.distance)
  const time = formatMovingTime(activity.moving_time)
  const pace = calcPace(activity.distance, activity.moving_time)
  const date = formatDate(activity.start_date_local)
  const elev = Math.round(activity.total_elevation_gain)
  const kcal = Math.round(activity.distance / 1000 * 62)

  return (
    <article
      id={`strava-card-${index + 1}`}
      className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      aria-label={`${activity.name} Strava run`}
    >
      {/* Polyline Map */}
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-full border-t border-slate-400" style={{ top: `${12 + i * 12}%` }} />
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute h-full border-l border-slate-400" style={{ left: `${10 + i * 16}%` }} />
          ))}
        </div>
        <PolylineMap polyline={activity.map?.summary_polyline ?? ''} />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm shadow-sm">
          <Activity className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">Strava {activity.type}</span>
        </div>
        <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm">
          SYNCED
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{activity.name}</h3>
            <p className="text-[11px] text-slate-400 tracking-wide mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {date}
            </p>
          </div>
          <button aria-label={`View details for ${activity.name}`} className="p-1.5 rounded-sm text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <RunStat label="Distance" value={km} unit="km" />
          <RunStat label="Time" value={time} unit="" />
          <RunStat label="Pace" value={pace} unit="/km" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span className="font-mono">{elev}m</span>
              <span className="text-slate-400">elev.</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Flame className="w-3 h-3 text-orange-400" aria-hidden="true" />
              <span className="font-mono">{kcal}</span>
              <span className="text-slate-400">kcal</span>
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-sm">
            STRAVA
          </span>
        </div>
      </div>
    </article>
  )
}

function WeatherIcon({ icon }: { icon: string }) {
  if (icon.startsWith('09') || icon.startsWith('10')) return <CloudRain className="w-7 h-7 text-blue-400" />
  if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04')) return <Cloud className="w-7 h-7 text-slate-400" />
  return <Sun className="w-7 h-7 text-amber-400" />
}

function PerformanceCard({ route, index }: { route: RouteData; index: number }) {
  const dateStr = new Date(route.createdAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  // Estimate a rough pace from distance (placeholder until real run data)
  const estMinutes = Math.round(route.distance * 5.2)
  const paceMin = Math.floor(estMinutes / route.distance)
  const paceSec = Math.round(((estMinutes / route.distance) - paceMin) * 60)
  const pace = `${paceMin}:${paceSec.toString().padStart(2, '0')}`

  return (
    <article
      id={`run-card-${index + 1}`}
      className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      aria-label={`${route.name} route`}
    >
      {/* Map placeholder */}
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-full border-t border-slate-400" style={{ top: `${12 + i * 12}%` }} />
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute h-full border-l border-slate-400" style={{ left: `${10 + i * 16}%` }} />
          ))}
        </div>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 144" fill="none" aria-hidden="true">
          <polyline
            points="20,110 60,85 100,95 130,60 170,70 210,45 260,55 300,30"
            stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="20" cy="110" r="4" fill="#22c55e" />
          <circle cx="300" cy="30" r="4" fill="#ef4444" />
        </svg>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm shadow-sm">
          <Activity className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">{route.terrain}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{route.name}</h3>
            <p className="text-[11px] text-slate-400 tracking-wide mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {dateStr}
            </p>
          </div>
          <button aria-label={`View details for ${route.name}`} className="p-1.5 rounded-sm text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <RunStat label="Distance" value={route.distance.toFixed(1)} unit="km" />
          <RunStat label="Elevation" value={route.elevation.toString()} unit="m" />
          <RunStat label="Est. Pace" value={pace} unit="/km" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span className="font-mono">{route.elevation}m</span>
              <span className="text-slate-400">elev.</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Flame className="w-3 h-3 text-orange-400" aria-hidden="true" />
              <span className="font-mono">{Math.round(route.distance * 62)}</span>
              <span className="text-slate-400">kcal</span>
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-sm">
            SAVED ROUTE
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [defaultGear, setDefaultGear] = useState<GearData | null>(null)
  const [recentRoutes, setRecentRoutes] = useState<RouteData[]>([])
  const [stravaActivities, setStravaActivities] = useState<StravaActivity[] | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [stravaLoading, setStravaLoading] = useState(true)
  const [analyticsActivities, setAnalyticsActivities] = useState<ActivityRecord[]>([])
  const [syncing, setSyncing] = useState(false)

  // ── Milestone (DB) ──────────────────────────────────────────────
  const [milestone, setMilestone] = useState<Milestone>({
    id: '', title: 'Lifetime Total', targetKm: 500, currentKm: 0,
  })
  const [milestoneEditing, setMilestoneEditing] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({ title: '', targetKm: '' })

  function openMilestoneEdit() {
    setMilestoneForm({ title: milestone.title, targetKm: String(milestone.targetKm) })
    setMilestoneEditing(true)
  }
  async function saveMilestone() {
    try {
      const res = await fetch('/api/milestone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestoneForm.title || milestone.title,
          targetKm: Number(milestoneForm.targetKm) || milestone.targetKm,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMilestone(data)
      }
    } catch { /* noop */ }
    setMilestoneEditing(false)
  }

  useEffect(() => {
    // Fetch weather
    fetch('/api/weather').then(r => r.json()).then(setWeather).catch(() => {})

    // Fetch default gear
    fetch('/api/gear')
      .then(r => r.json())
      .then((gear: GearData[]) => {
        const def = gear.find(g => g.isDefault) ?? gear[0] ?? null
        setDefaultGear(def)
      })
      .catch(() => {})

    // Fetch 2 most recent routes (fallback)
    fetch('/api/routes')
      .then(r => r.json())
      .then((routes: RouteData[]) => setRecentRoutes(routes.slice(0, 2)))
      .catch(() => {})

    // Fetch Strava activities + weekly stats
    fetch('/api/strava')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { activities: StravaActivity[]; weeklyStats: WeeklyStats }) => {
        setStravaActivities(data.activities)
        setWeeklyStats(data.weeklyStats)
      })
      .catch(() => { setStravaActivities([]); setWeeklyStats(null) })
      .finally(() => setStravaLoading(false))

    // Fetch activities for analytics chart
    fetch('/api/activities')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { activities: ActivityRecord[] }) => setAnalyticsActivities(data.activities))
      .catch(() => {})

    // Fetch milestone from DB
    fetch('/api/milestone')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Milestone) => setMilestone(data))
      .catch(() => {})
  }, [])

  // ── Handle Strava Sync button ───────────────────────────────────────
  async function handleStravaSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      if (res.ok) {
        // Refresh gear and milestone after sync
        const [gearRes, msRes, actRes] = await Promise.all([
          fetch('/api/gear').then(r => r.json()),
          fetch('/api/milestone').then(r => r.json()),
          fetch('/api/activities').then(r => r.json()),
        ])
        const def = (gearRes as GearData[]).find(g => g.isDefault) ?? (gearRes as GearData[])[0] ?? null
        setDefaultGear(def)
        setMilestone(msRes as Milestone)
        setAnalyticsActivities((actRes as { activities: ActivityRecord[] }).activities)
      }
    } catch { /* noop */ } finally { setSyncing(false) }
  }

  const gearPct = defaultGear
    ? Math.min(100, Math.round((defaultGear.startingMileage / defaultGear.targetLifespan) * 100))
    : 0
  const gearRemaining = defaultGear
    ? Math.max(0, defaultGear.targetLifespan - defaultGear.startingMileage)
    : 0

  const isHighHeat = weather && weather.temp >= 28
  const isRainy = weather && (weather.icon.startsWith('09') || weather.icon.startsWith('10'))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Hero header + top widgets ─────────────────────────── */}
      <section
        id="dashboard-hero"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        aria-labelledby="hero-heading"
      >
        {/* Left: Hero copy */}
        <div className="lg:col-span-2">
          <p className="text-[11px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-2">
            Week 18 · Training Block 3
          </p>
          <h1
            id="hero-heading"
            className="font-extrabold tracking-tight text-slate-900 leading-none text-5xl sm:text-6xl lg:text-7xl"
          >
            FOCUS
            <br />
            <span className="text-slate-300">PHASE</span>
          </h1>
          <p className="mt-4 text-slate-500 text-base max-w-lg leading-relaxed">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Keep the momentum.</span>{' '}
            You&apos;re 3 runs into your weekly target. Your long run is scheduled for Sunday. Stay consistent.
          </p>

          {/* Quick stats bar */}
          <div id="weekly-stats" className="mt-6 grid grid-cols-3 gap-3" aria-label="This week's quick stats">
            {[
              { icon: Footprints, label: 'Weekly KM', value: weeklyStats ? weeklyStats.weeklyKm : '—', unit: 'km' },
              { icon: Zap, label: 'Avg Pace', value: weeklyStats ? weeklyStats.avgPace : '—', unit: '/km' },
              { icon: BarChart2, label: 'Runs', value: weeklyStats ? String(weeklyStats.runCount) : '—', unit: 'this wk' },
            ].map(({ icon: Icon, label, value, unit }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">{value}</span>
                  <span className="text-xs text-slate-400 font-mono">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Widgets column */}
        <div className="flex flex-col gap-4">
          {/* Weather Widget */}
          <article
            id="weather-widget"
            className="bg-white border border-slate-200 rounded-sm shadow-sm p-4"
            aria-label="Current weather conditions"
          >
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
              Conditions Today
            </p>
            {weather ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-sm flex items-center justify-center">
                      <WeatherIcon icon={weather.icon} />
                    </div>
                    <div>
                      <div className="font-mono text-3xl font-bold text-slate-900">
                        {weather.temp}°<span className="text-lg text-slate-400">C</span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold tracking-wide capitalize">{weather.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span className="font-mono">{weather.wind} km/h</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                      <span className="font-mono">{weather.humidity}%</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>{weather.city}</span>
                    </span>
                  </div>
                </div>
                {isHighHeat && (
                  <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 rounded-sm px-2 py-1 font-bold tracking-wide">
                    ⚠ High heat — hydrate aggressively
                  </p>
                )}
                {isRainy && (
                  <p className="mt-3 text-[11px] text-blue-600 bg-blue-50 rounded-sm px-2 py-1 font-bold tracking-wide">
                    🌧 Rain expected — trail conditions may be slippery
                  </p>
                )}
              </>
            ) : (
              <div className="h-16 bg-slate-100 rounded-sm animate-pulse" />
            )}
          </article>

          {/* Next Milestone card */}
          <article
            id="next-milestone-card"
            className="bg-slate-900 border border-slate-800 rounded-sm shadow-sm p-4 text-white"
            aria-label="Next milestone"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Next Milestone</p>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <button
                  id="milestone-edit-btn"
                  onClick={openMilestoneEdit}
                  aria-label="Edit milestone"
                  className="p-1 rounded-sm text-slate-500 hover:text-orange-400 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {milestoneEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  id="milestone-title-input"
                  className="bg-slate-800 border border-slate-700 rounded-sm px-2 py-1.5 text-white text-xs font-bold w-full outline-none focus:border-orange-500"
                  placeholder="Goal title"
                  value={milestoneForm.title}
                  onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                />
                <input
                  id="milestone-target-input"
                  type="number"
                  className="bg-slate-800 border border-slate-700 rounded-sm px-2 py-1.5 text-white text-xs font-mono w-full outline-none focus:border-orange-500"
                  placeholder="Target km"
                  value={milestoneForm.targetKm}
                  onChange={e => setMilestoneForm(f => ({ ...f, targetKm: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button id="milestone-save-btn" onClick={saveMilestone} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold tracking-widest rounded-sm uppercase transition-colors">
                    <Check className="w-3 h-3" />Save
                  </button>
                  <button id="milestone-cancel-btn" onClick={() => setMilestoneEditing(false)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold tracking-widest rounded-sm uppercase transition-colors">
                    <X className="w-3 h-3" />Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-extrabold text-lg tracking-tight leading-tight text-white">
                  {milestone.targetKm} km<br />
                  <span className="text-slate-400 text-sm font-bold">{milestone.title}</span>
                </p>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Progress</span>
                    <span className="font-mono text-xs text-orange-400 font-bold">{milestone.currentKm} / {milestone.targetKm} km</span>
                  </div>
                  <div
                    className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round((milestone.currentKm / milestone.targetKm) * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Milestone progress"
                  >
                    <div
                      className="h-full bg-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((milestone.currentKm / milestone.targetKm) * 100))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 tracking-wide">
                    {Math.max(0, milestone.targetKm - milestone.currentKm)} km remaining
                  </p>
                </div>
              </>
            )}
          </article>
        </div>
      </section>

      {/* ── Recent Performance (Strava) ───────────────────────── */}
      <section id="recent-performance" aria-labelledby="perf-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">Activity Feed</p>
            <h2 id="perf-heading" className="font-extrabold text-xl tracking-tight text-slate-900">
              RECENT PERFORMANCE
            </h2>
          </div>
          <a
            href="https://www.strava.com/athlete/training"
            target="_blank"
            rel="noopener noreferrer"
            id="view-all-runs-btn"
            className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-500 hover:text-orange-600 uppercase transition-colors"
          >
            View on Strava
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {stravaLoading ? (
            // Skeleton loaders
            <>
              {[1, 2].map(i => (
                <div key={i} className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden animate-pulse">
                  <div className="h-36 bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                      <div className="h-8 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : stravaActivities && stravaActivities.length > 0 ? (
            stravaActivities.map((act, i) => <StravaCard key={act.id} activity={act} index={i} />)
          ) : (
            // Fallback: show DB routes if Strava not connected
            recentRoutes.length > 0 ? (
              recentRoutes.map((route, i) => <PerformanceCard key={route.id} route={route} index={i} />)
            ) : (
              <div className="col-span-2 bg-white border border-dashed border-slate-200 rounded-sm p-8 text-center">
                <p className="text-sm font-bold text-slate-500">No Strava activities found</p>
                <p className="text-[11px] text-slate-400 mt-1">Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET and STRAVA_REFRESH_TOKEN to .env.local to connect.</p>
              </div>
            )
          )}

          {/* Log workout CTA */}
          <div
            id="run-card-cta"
            className="bg-white border-2 border-dashed border-slate-200 rounded-sm flex flex-col items-center justify-center p-8 gap-3 hover:border-orange-300 hover:bg-orange-50/30 transition-all duration-200 cursor-pointer group"
            role="button"
            aria-label="Log a new workout"
            tabIndex={0}
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <Activity className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 text-sm">Log a workout</p>
              <p className="text-xs text-slate-400 mt-0.5">Manually add or sync from Strava</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gear Health ───────────────────────────────────────────── */}
      <section id="gear-health" aria-labelledby="gear-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gear Health card */}
        <article className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 lg:col-span-1" aria-label="Gear health overview">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">Equipment</p>
              <h2 id="gear-heading" className="font-extrabold text-lg tracking-tight text-slate-900">GEAR HEALTH</h2>
            </div>
            <Footprints className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </div>

          {defaultGear ? (
            <div id="gear-primary-shoe">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{defaultGear.brandModel}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{defaultGear.startingMileage} km used</p>
                </div>
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm ${
                  gearPct > 80
                    ? 'text-red-700 bg-red-50 border border-red-200'
                    : gearPct > 60
                    ? 'text-amber-600 bg-amber-50 border border-amber-200'
                    : 'text-green-700 bg-green-50 border border-green-200'
                }`}>
                  {gearPct > 80 ? 'REPLACE SOON' : gearPct > 60 ? 'WORN' : 'GOOD'}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>Tread wear</span>
                <span className={`font-bold ${gearPct > 60 ? 'text-amber-600' : 'text-green-600'}`}>{gearPct}%</span>
              </div>
              <div
                className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden"
                role="progressbar"
                aria-valuenow={gearPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Shoe tread wear ${gearPct}%`}
              >
                <div
                  className={`h-full rounded-sm relative overflow-hidden transition-all duration-500 ${gearPct > 80 ? 'bg-red-500' : gearPct > 60 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${gearPct}%` }}
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: `${(i + 1) * 12.5}%` }} aria-hidden="true" />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 tracking-wide">
                Estimated {gearRemaining} km remaining
              </p>
              {gearPct > 75 && (
                <div className="mt-3 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-sm p-2">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-[10px] text-amber-700 font-bold">Consider replacing soon to avoid injury risk.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-24 bg-slate-100 rounded-sm animate-pulse" />
          )}

          <Link
            href="/gear"
            id="manage-gear-btn"
            className="mt-5 w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-sm text-xs font-bold tracking-widest text-slate-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 uppercase transition-all duration-150"
          >
            Manage gear
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </article>

        {/* Training Insights card */}
        <article id="training-insights" className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 lg:col-span-2" aria-label="Training insights and recommendations">
          <div className="mb-4">
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">Analytics</p>
            <h2 className="font-extrabold text-lg tracking-tight text-slate-900">TRAINING INSIGHTS</h2>
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Weekly Intensity Distribution</p>
            <div className="flex items-end gap-1.5 h-20">
              {(() => {
                // Build last-7-days buckets from analyticsActivities
                const today = new Date()
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(today)
                  d.setDate(today.getDate() - (6 - i))
                  return d
                })
                const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                const buckets = days.map((d) => {
                  const key = d.toISOString().slice(0, 10)
                  const total = analyticsActivities
                    .filter((a) => a.date.slice(0, 10) === key)
                    .reduce((s, a) => s + a.distanceKm, 0)
                  return { day: dayLabels[d.getDay()], km: total, date: key }
                })
                const maxKm = Math.max(...buckets.map((b) => b.km), 1)
                const todayKey = today.toISOString().slice(0, 10)
                return buckets.map(({ day, km, date }, i) => {
                  const pct = Math.round((km / maxKm) * 100)
                  const isToday = date === todayKey
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${km.toFixed(1)} km`}>
                      <div className="w-full flex flex-col justify-end" style={{ height: '64px' }}>
                        <div
                          className={['w-full rounded-sm transition-all duration-300', isToday ? 'bg-orange-500' : pct === 0 ? 'bg-slate-100' : 'bg-slate-200'].join(' ')}
                          style={{ height: `${Math.max(pct, pct > 0 ? 8 : 0)}%` }}
                          role="img"
                          aria-label={`${day}: ${km.toFixed(1)} km`}
                        />
                      </div>
                      <span className={['text-[10px] font-bold', isToday ? 'text-orange-600' : 'text-slate-400'].join(' ')}>{day}</span>
                    </div>
                  )
                })
              })()}
            </div>
            {analyticsActivities.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center mt-2">Sync Strava or log a manual activity to populate this chart.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-sm p-3 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 bg-orange-100 rounded-sm flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Total Distance Logged</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {analyticsActivities.length > 0
                    ? `${analyticsActivities.reduce((s, a) => s + a.distanceKm, 0).toFixed(1)} km across ${analyticsActivities.length} activities (Strava + manual).`
                    : 'No activities logged yet. Sync Strava or add a manual run.'}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-sm p-3 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 bg-blue-50 rounded-sm flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Sync Strava History</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Pull your latest runs and update gear mileage automatically.
                </p>
                <button
                  id="sync-strava-btn"
                  onClick={handleStravaSync}
                  disabled={syncing}
                  className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-orange-600 hover:text-orange-700 uppercase disabled:opacity-50 transition-colors"
                >
                  <Activity className="w-3 h-3" />
                  {syncing ? 'Syncing…' : 'Sync Now'}
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
