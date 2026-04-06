'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  Layers,
  Star,
  ChevronRight,
  BarChart2,
  Navigation,
  Activity,
  Heart,
  Flame,
  RefreshCw,
} from 'lucide-react'
import { ManualActivityModal } from '@/app/components/Modals'

// ── Types ──────────────────────────────────────────────────────────────────
interface StravaMap {
  summary_polyline: string
}

interface StravaActivity {
  id: number
  name: string
  type: string
  start_date_local: string   // ISO local time
  distance: number            // metres
  moving_time: number         // seconds
  elapsed_time: number        // seconds
  total_elevation_gain: number
  average_speed: number       // m/s
  max_speed: number           // m/s
  average_heartrate?: number
  max_heartrate?: number
  map: StravaMap
  achievement_count: number
  kudos_count: number
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDistance(m: number) {
  return (m / 1000).toFixed(2)
}

function fmtPace(mps: number): string {
  if (!mps || mps === 0) return '—'
  const secPerKm = 1000 / mps
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

/** Decode Strava encoded polyline → scaled SVG points string */
function decodePolylineToSVG(
  polyline: string,
  W: number,
  H: number,
  pad = 10
): { points: string; startX: number; startY: number; endX: number; endY: number } | null {
  if (!polyline) return null
  let coords: [number, number][] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    coords = require('@mapbox/polyline').decode(polyline)
  } catch {
    return null
  }
  if (coords.length < 2) return null

  const lats = coords.map(([lat]) => lat)
  const lngs = coords.map(([, lng]) => lng)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const rangeX = maxLng - minLng || 1
  const rangeY = maxLat - minLat || 1
  const scaleX = (W - pad * 2) / rangeX
  const scaleY = (H - pad * 2) / rangeY

  const toX = (lng: number) => pad + (lng - minLng) * scaleX
  const toY = (lat: number) => H - pad - (lat - minLat) * scaleY // flip Y

  const points = coords.map(([lat, lng]) => `${toX(lng).toFixed(1)},${toY(lat).toFixed(1)}`).join(' ')
  const startX = toX(lngs[0])
  const startY = toY(lats[0])
  const endX = toX(lngs.at(-1)!)
  const endY = toY(lats.at(-1)!)

  return { points, startX, startY, endX, endY }
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Compact polyline SVG used in the left-column cards */
function MiniPolyline({ polyline, routeName }: { polyline: string; routeName: string }) {
  const W = 230, H = 80
  const decoded = decodePolylineToSVG(polyline, W, H, 8)

  return (
    <div className="relative h-20 bg-slate-50 rounded-sm overflow-hidden">
      {/* grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {[20, 40, 60].map((y) => <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#94a3b8" strokeWidth="0.5" />)}
        {[46, 92, 138, 184].map((x) => <line key={x} x1={x} y1="0" x2={x} y2={H} stroke="#94a3b8" strokeWidth="0.5" />)}
      </svg>
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label={`Mini map for ${routeName}`} role="img">
        {decoded ? (
          <>
            <polyline points={decoded.points} stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={decoded.startX} cy={decoded.startY} r="3" fill="#22c55e" />
            <circle cx={decoded.endX} cy={decoded.endY} r="3" fill="#ef4444" />
          </>
        ) : (
          /* fallback wave when no polyline */
          <polyline points="15,60 50,45 85,55 120,35 155,48 185,30 215,40" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  )
}

/** Full-size polyline SVG for the detail panel */
function LargePolyline({ activity }: { activity: StravaActivity }) {
  const W = 570, H = 340
  const decoded = decodePolylineToSVG(activity.map?.summary_polyline, W, H, 24)

  return (
    <div
      className="relative bg-slate-100 rounded-sm overflow-hidden"
      style={{ height: '340px' }}
      role="img"
      aria-label={`Detailed map for ${activity.name}`}
    >
      {/* grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#64748b" strokeWidth="1" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#64748b" strokeWidth="1" />
        ))}
      </svg>

      {/* terrain blobs */}
      <div className="absolute top-12 left-16 w-24 h-24 rounded-full bg-green-100 opacity-40" aria-hidden="true" />
      <div className="absolute top-20 right-20 w-32 h-20 rounded-full bg-green-100 opacity-30" aria-hidden="true" />
      <div className="absolute bottom-16 left-32 w-20 h-16 rounded-full bg-slate-200 opacity-50" aria-hidden="true" />

      {decoded ? (
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* shadow */}
          <polyline points={decoded.points} stroke="rgba(0,0,0,0.1)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* main line */}
          <polyline points={decoded.points} stroke="#ea580c" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* dashes */}
          <polyline points={decoded.points} stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 12" opacity="0.6" />
          {/* start */}
          <circle cx={decoded.startX} cy={decoded.startY} r="7" fill="#22c55e" />
          <circle cx={decoded.startX} cy={decoded.startY} r="12" fill="#22c55e" fillOpacity="0.2" />
          {/* end */}
          <circle cx={decoded.endX} cy={decoded.endY} r="7" fill="#ef4444" />
          <circle cx={decoded.endX} cy={decoded.endY} r="12" fill="#ef4444" fillOpacity="0.2" />
        </svg>
      ) : (
        /* no polyline fallback */
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">No map data available</p>
        </div>
      )}

      {/* overlay badges */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-sm px-2 py-1 border border-slate-200">
        <span className="text-[10px] font-mono font-bold text-slate-600">
          {fmtDistance(activity.distance)} km · {Math.round(activity.total_elevation_gain)} m elev.
        </span>
      </div>
      <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-sm border border-slate-200 flex items-center justify-center">
        <Navigation className="w-4 h-4 text-slate-600" aria-label="North" />
      </div>
      <div className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm">
        STRAVA
      </div>
    </div>
  )
}

function StatBox({
  id, icon: Icon, label, value, sub,
}: {
  id: string; icon: React.ElementType; label: string; value: string; sub: string
}) {
  return (
    <div id={id} className="bg-[#F5F5F3] border border-slate-200 rounded-sm p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
      </div>
      <span className="font-mono text-xl font-bold text-slate-900 tabular-nums leading-tight">{value}</span>
      <span className="text-[10px] text-slate-500 tracking-wide">{sub}</span>
    </div>
  )
}

/** Left-column activity card */
function ActivityCard({
  activity,
  isSelected,
  onClick,
}: {
  activity: StravaActivity
  isSelected: boolean
  onClick: () => void
}) {
  const km = fmtDistance(activity.distance)
  const elev = Math.round(activity.total_elevation_gain)
  const dateStr = fmtDateShort(activity.start_date_local)
  const time = fmtTime(activity.moving_time)

  return (
    <article
      id={`activity-card-${activity.id}`}
      onClick={onClick}
      className={[
        'bg-white border rounded-sm p-4 cursor-pointer transition-all duration-150 hover:shadow-md',
        isSelected
          ? 'border-orange-500 shadow-md ring-1 ring-orange-200 bg-orange-50/30'
          : 'border-slate-200 shadow-sm hover:border-slate-300',
      ].join(' ')}
      aria-label={`Activity: ${activity.name}`}
      aria-selected={isSelected}
    >
      {/* header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{activity.name}</h3>
            {activity.achievement_count > 0 && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" aria-label="Achievement" />
            )}
          </div>
          <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {dateStr} · {time}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] font-bold tracking-wider bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-sm">
            {activity.type.toUpperCase()}
          </span>
          {isSelected && (
            <span className="text-[10px] font-bold tracking-wider bg-orange-600 text-white px-1.5 py-0.5 rounded-sm">
              FOCUS
            </span>
          )}
        </div>
      </div>

      {/* mini map */}
      <MiniPolyline polyline={activity.map?.summary_polyline} routeName={activity.name} />

      {/* quick stats */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Navigation, label: 'Dist', value: km, unit: 'km' },
          { icon: TrendingUp, label: 'Elev', value: String(elev), unit: 'm' },
          { icon: Zap, label: 'Pace', value: fmtPace(activity.average_speed), unit: '/km' },
        ].map(({ icon: Icon, label, value, unit }) => (
          <div key={label} className="flex flex-col">
            <span className="flex items-center gap-0.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              <Icon className="w-2.5 h-2.5" aria-hidden="true" />
              {label}
            </span>
            <span className="font-mono text-sm font-bold text-slate-800 tabular-nums leading-tight mt-0.5">
              {value}
              {unit && <span className="text-[10px] text-slate-400 ml-0.5">{unit}</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
          <Activity className="w-3 h-3" aria-hidden="true" />
          STRAVA SYNCED
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
      </div>
    </article>
  )
}

/** Skeleton card for loading state */
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-sm p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-slate-100 rounded w-2/3" />
          <div className="h-2.5 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-5 w-12 bg-slate-100 rounded ml-2" />
      </div>
      <div className="h-20 bg-slate-100 rounded-sm" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function RoutesPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null)
  const [isManualOpen, setIsManualOpen] = useState(false)

  async function fetchHistory() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/strava/history?per_page=50')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const data: StravaActivity[] = await res.json()
      setActivities(data)
      if (data.length > 0) setSelectedActivity(data[0])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Strava history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-1">
            Strava Activity History
          </p>
          <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl text-slate-900 leading-none">
            MY ROUTES
          </h1>
          <p className="mt-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            {isLoading ? 'Syncing…' : error ? 'Sync failed' : `${activities.length} Activities Synced`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="routes-refresh-btn"
            onClick={fetchHistory}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 bg-white rounded-sm hover:border-slate-300 transition-colors shadow-sm uppercase disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
          <button
            id="log-manual-activity-btn"
            onClick={() => setIsManualOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 bg-white rounded-sm hover:border-orange-400 hover:text-orange-600 transition-colors shadow-sm uppercase"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Log Manual
          </button>
          <a
            id="view-strava-btn"
            href="https://www.strava.com/athlete/training"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors shadow-sm uppercase"
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            View on Strava
          </a>
        </div>
      </header>

      {/* ── Error banner ──────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-sm px-4 py-3 flex items-start gap-2">
          <span className="text-red-500 font-bold text-xs mt-0.5">!</span>
          <div>
            <p className="text-xs font-bold text-red-700">Strava sync failed</p>
            <p className="text-[11px] text-red-500 mt-0.5">{error}</p>
            <p className="text-[11px] text-red-400 mt-1">
              Add <code className="bg-red-100 px-1 rounded">STRAVA_REFRESH_TOKEN</code> to your <code className="bg-red-100 px-1 rounded">.env</code> and visit{' '}
              <a href="/api/strava/login" className="underline font-bold">
                /api/strava/login
              </a>{' '}
              to authorize.
            </p>
          </div>
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

        {/* Left column — activity list */}
        <aside aria-label="Strava activity list" className="lg:sticky lg:top-20">
          <div
            id="routes-list"
            className="space-y-3 overflow-y-auto pr-1"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          >
            {isLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {!isLoading && !error && activities.length === 0 && (
              <div className="p-6 bg-white border border-slate-200 rounded-sm text-center">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No activities found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Make sure your Strava account has runs recorded.
                </p>
              </div>
            )}

            {activities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                isSelected={selectedActivity?.id === act.id}
                onClick={() => setSelectedActivity(act)}
              />
            ))}
          </div>
        </aside>

        {/* Right column — detail panel */}
        <section
          id="route-detail-panel"
          className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex flex-col gap-5"
        >
          {isLoading ? (
            /* Skeleton detail */
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-8 bg-slate-100 rounded w-1/2" />
              <div className="h-80 bg-slate-100 rounded-sm" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded" />)}
              </div>
            </div>
          ) : selectedActivity ? (
            <>
              {/* Detail header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">
                    Current Focus
                  </p>
                  <h2 className="font-extrabold text-2xl tracking-tight text-slate-900 mt-0.5">
                    {selectedActivity.name}
                  </h2>
                  <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {fmtDate(selectedActivity.start_date_local)} · {fmtTime(selectedActivity.moving_time)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.strava.com/activities/${selectedActivity.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Open in Strava
                  </a>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: selectedActivity.type, icon: Activity },
                  { label: `${fmtPace(selectedActivity.average_speed)} /km`, icon: Zap },
                  { label: `${Math.round(selectedActivity.total_elevation_gain)} m elev`, icon: TrendingUp },
                ].map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-sm"
                  >
                    <Icon className="w-3 h-3 text-slate-400" />
                    {label.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Large SVG map */}
              <LargePolyline activity={selectedActivity} />

              {/* Stat boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatBox
                  id="stat-elevation"
                  icon={TrendingUp}
                  label="Elevation Gain"
                  value={`${Math.round(selectedActivity.total_elevation_gain)} m`}
                  sub="Total climb"
                />
                <StatBox
                  id="stat-pace"
                  icon={Zap}
                  label="Avg Pace"
                  value={fmtPace(selectedActivity.average_speed)}
                  sub="min / km"
                />
                <StatBox
                  id="stat-heartrate"
                  icon={Heart}
                  label={selectedActivity.average_heartrate ? 'Avg HR' : 'Calories'}
                  value={
                    selectedActivity.average_heartrate
                      ? `${Math.round(selectedActivity.average_heartrate)} bpm`
                      : `~${Math.round(selectedActivity.distance / 1000 * 62)} kcal`
                  }
                  sub={
                    selectedActivity.max_heartrate
                      ? `Max ${Math.round(selectedActivity.max_heartrate)} bpm`
                      : 'Estimated'
                  }
                />
              </div>

              {/* Elevation delta section */}
              <div id="elevation-delta-section">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                      Activity Summary
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-orange-600">
                    +{Math.round(selectedActivity.total_elevation_gain)} m
                  </span>
                </div>

                {/* Summary info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-sm p-3">
                  {[
                    { icon: Navigation, label: 'Distance', value: `${fmtDistance(selectedActivity.distance)} km` },
                    { icon: Clock, label: 'Moving Time', value: fmtTime(selectedActivity.moving_time) },
                    { icon: Zap, label: 'Max Speed', value: `${fmtPace(selectedActivity.max_speed)} /km` },
                    { icon: Flame, label: 'Kudos', value: String(selectedActivity.kudos_count) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                        <Icon className="w-2.5 h-2.5" aria-hidden="true" />
                        {label}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-800 tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://www.strava.com/activities/${selectedActivity.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 rounded-sm hover:border-orange-500 hover:text-orange-600 uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3 h-3" />
                  Full Activity
                </a>
                <button
                  onClick={fetchHistory}
                  className="flex-1 py-2 text-xs font-bold tracking-widest bg-slate-900 text-white rounded-sm hover:bg-slate-700 uppercase transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync Again
                </button>
              </div>
            </>
          ) : (
            /* No selection yet (empty state) */
            <div className="py-20 text-center text-slate-400 flex flex-col items-center">
              <MapPin className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm font-bold">No activity selected</p>
              <p className="text-xs mt-1">Click an activity on the left to view its details.</p>
            </div>
          )}
        </section>
      </div>

      {isManualOpen && (
        <ManualActivityModal
          onClose={() => setIsManualOpen(false)}
          onSuccess={fetchHistory}
        />
      )}
    </div>
  )
}
