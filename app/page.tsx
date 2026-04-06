'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
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
  RotateCcw,
  Link2,
  Link2Off,
  Trash2,
  Settings,
} from 'lucide-react'
import { ManualActivityModal, SettingsModal } from '@/app/components/Modals'
import { useLanguage } from '@/lib/i18n'

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

/**
 * Normalised entry used only for analytics/chart aggregation.
 * distanceKm is already in km, durationSec in seconds.
 */
interface NormalisedEntry {
  dateISO: string  // YYYY-MM-DD in GMT+7
  distanceKm: number
  durationSec: number  // 0 if unknown
}

/** Unified card item for Recent Performance — covers both Strava and DB routes */
interface RecentItem {
  _key: string
  _src: 'strava' | 'manual'
  _date: string          // ISO for sort
  _km: number
  name: string
  typeLabel: string
  elev: number           // metres
  time?: number          // seconds (Strava only)
  pace?: number          // m/s   (Strava only)
  kcal: number
  polyline?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000 // GMT+7 (Phuket)

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

/**
 * Returns the ISO date string (YYYY-MM-DD) of an ISO timestamp
 * shifted into GMT+7 (Phuket) local time.
 */
function toLocalDateISO(iso: string): string {
  return new Date(new Date(iso).getTime() + TZ_OFFSET_MS)
    .toISOString().slice(0, 10)
}

/**
 * Returns Mon 00:00:00 UTC of the current GMT+7 week.
 * All week boundaries are computed in GMT+7 so they align
 * with how the server (`/api/activities`) calculates them.
 */
function getWeekStartUTC(): Date {
  const nowLocal = Date.now() + TZ_OFFSET_MS
  const dow = new Date(nowLocal).getUTCDay()          // 0=Sun
  const daysSinceMon = dow === 0 ? 6 : dow - 1
  const monMidnightLocal =
    Math.floor((nowLocal - daysSinceMon * 86_400_000) / 86_400_000) * 86_400_000
  return new Date(monMidnightLocal - TZ_OFFSET_MS)   // back to UTC
}

/**
 * Compute unified weekly stats from pre-normalised entries.
 * Returns weeklyKm, avgPace (weighted by distance), runCount.
 */
function computeWeeklyStats(entries: NormalisedEntry[]): WeeklyStats {
  const weekStart = getWeekStartUTC()
  const weekEnd   = new Date(weekStart.getTime() + 7 * 86_400_000)

  const thisWeek = entries.filter(e => {
    const t = new Date(e.dateISO).getTime()  // midnight GMT+7 converted back to UTC
    return t >= weekStart.getTime() && t < weekEnd.getTime()
  })

  const totalKm  = thisWeek.reduce((s, e) => s + e.distanceKm, 0)
  const totalSec = thisWeek.reduce((s, e) => s + e.durationSec, 0)

  let avgPace = '—'
  if (totalKm > 0 && totalSec > 0) {
    const secPerKm = totalSec / totalKm
    const min = Math.floor(secPerKm / 60)
    const sec = Math.round(secPerKm % 60)
    avgPace = `${min}:${sec.toString().padStart(2, '0')}`
  }

  return {
    weeklyKm: totalKm.toFixed(1),
    avgPace,
    runCount: thisWeek.length,
  }
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
      <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{unit}</span>
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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      aria-label={`${activity.name} Strava run`}
    >
      <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-full border-t border-slate-400" style={{ top: `${12 + i * 12}%` }} />
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute h-full border-l border-slate-400" style={{ left: `${10 + i * 16}%` }} />
          ))}
        </div>
        <PolylineMap polyline={activity.map?.summary_polyline ?? ''} />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-sm shadow-sm">
          <Activity className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-200 uppercase">Strava {activity.type}</span>
        </div>
        <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm">
          SYNCED
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{activity.name}</h3>
            <p className="text-[11px] text-slate-400 tracking-wide mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {date}
            </p>
          </div>
          <button aria-label={`View details for ${activity.name}`} className="p-1.5 rounded-sm text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors">
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <RunStat label="Distance" value={km} unit="km" />
          <RunStat label="Time" value={time} unit="" />
          <RunStat label="Pace" value={pace} unit="/km" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span className="font-mono">{elev}m</span>
              <span className="text-slate-400">elev.</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Flame className="w-3 h-3 text-orange-400" aria-hidden="true" />
              <span className="font-mono">{kcal}</span>
              <span className="text-slate-400">kcal</span>
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-green-700 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 px-2 py-0.5 rounded-sm">
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

/** Single unified card for Recent Performance — works for both Strava and manual DB entries */
function UnifiedPerfCard({ item, index }: { item: RecentItem; index: number }) {
  const isStrava = item._src === 'strava'
  const dateStr = new Date(item._date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const timeStr = item.time ? formatMovingTime(item.time) : null

  // Strava: pace field = average_speed (m/s) → convert via distance + time
  // Manual: pace field = sec/km → format directly
  let paceStr: string | null = null
  if (isStrava && item.pace && item.time) {
    // average_speed is m/s; metres = km * 1000, time already in seconds
    paceStr = calcPace(item._km * 1000, item.time)
  } else if (!isStrava && item.pace) {
    // pace is sec/km
    const min = Math.floor(item.pace / 60)
    const sec = Math.round(item.pace % 60)
    paceStr = `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <article
      id={`run-card-${index + 1}`}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      aria-label={`${item.name} ${isStrava ? 'Strava run' : 'manual log'}`}
    >
      <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-full border-t border-slate-400" style={{ top: `${12 + i * 12}%` }} />
          ))}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute h-full border-l border-slate-400" style={{ left: `${10 + i * 16}%` }} />
          ))}
        </div>
        <PolylineMap polyline={item.polyline ?? ''} />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-sm shadow-sm">
          <Activity className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-200 uppercase">
            {isStrava ? `Strava ${item.typeLabel}` : item.typeLabel}
          </span>
        </div>
        {isStrava && (
          <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm">SYNCED</div>
        )}
        {!isStrava && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm">MANUAL</div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{item.name}</h3>
            <p className="text-[11px] text-slate-400 tracking-wide mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {dateStr}
            </p>
          </div>
          <button aria-label={`View details for ${item.name}`} className="p-1.5 rounded-sm text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors">
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <RunStat label="Distance" value={item._km.toFixed(2)} unit="km" />
          {timeStr
            ? <RunStat label="Time" value={timeStr} unit="" />
            : <RunStat label="Elevation" value={String(item.elev)} unit="m" />
          }
          {paceStr
            ? <RunStat label="Pace" value={paceStr} unit="/km" />
            : <RunStat label="Est. Calories" value={String(item.kcal)} unit="kcal" />
          }
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span className="font-mono">{item.elev}m</span>
              <span className="text-slate-400">elev.</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Flame className="w-3 h-3 text-orange-400" aria-hidden="true" />
              <span className="font-mono">{item.kcal}</span>
              <span className="text-slate-400">kcal</span>
            </span>
          </div>
          <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm ${
            isStrava ? 'text-green-700 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900' : 'text-blue-700 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900'
          }`}>
            {isStrava ? 'STRAVA' : 'MANUAL'}
          </span>
        </div>
      </div>
    </article>
  )
}

import { Suspense } from 'react'

// ── Page ───────────────────────────────────────────────────────────────────

function DashboardInner() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [defaultGear, setDefaultGear] = useState<GearData | null>(null)
  const [recentUnified, setRecentUnified] = useState<RecentItem[]>([])
  const [recentLoading, setRecentLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  /** All entries normalised for the 7-day intensity chart — includes Strava + manual */
  const [chartEntries, setChartEntries] = useState<NormalisedEntry[]>([])
  const [syncing, setSyncing] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)

  // ── Settings modal ────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** true once we know keys are present; false = show "pending" banner */
  const [stravaConfigured, setStravaConfigured] = useState<boolean | null>(null)
  const settingsChecked = useRef(false)

  // ── Strava connection status ─────────────────────────────────────
  const [stravaStatus, setStravaStatus] = useState<{
    connected: boolean
    athleteName: string | null
  }>({ connected: false, athleteName: null })
  const [stravaBanner, setStravaBanner] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const searchParams = useSearchParams()

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

  /** Reset progress to 0 by wiping all Activity rows, then open edit mode for new goal */
  const [resetting, setResetting] = useState(false)
  async function resetMilestone() {
    if (!window.confirm('Reset all activity progress to 0? This will delete all logged activities from the database.'))
      return
    setResetting(true)
    try {
      const res = await fetch('/api/milestone', { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        setMilestone(data)   // currentKm is now 0
        setChartEntries([])  // clear chart
        setWeeklyStats(null)
        setRecentUnified([])
        // Open edit so the user can immediately set a new goal
        setMilestoneForm({ title: data.title, targetKm: String(data.targetKm) })
        setMilestoneEditing(true)
      }
    } catch { /* noop */ } finally { setResetting(false) }
  }

  /**
   * Fetch Strava + manual DB activities in parallel.
   *
   * After loading:
   *   • Builds a unified Recent Performance list (top 4, newest first)
   *   • Computes unified weekly stats (Mon–Sun, GMT+7) across both sources
   *   • Builds a NormalisedEntry[] for the 7-day intensity chart
   */
  async function fetchRecentPerformance() {
    setRecentLoading(true)
    try {
      const [stravaRes, actRes] = await Promise.all([
        fetch('/api/strava', { cache: 'no-store' }).catch(() => null),
        fetch('/api/activities', { cache: 'no-store' }).catch(() => null),
      ])

      const items: RecentItem[] = []
      const normalised: NormalisedEntry[] = []

      // ── 1. Strava activities ─────────────────────────────────────
      let stravaActivities: StravaActivity[] = []
      if (stravaRes?.ok) {
        const data: { activities: StravaActivity[]; weeklyStats: WeeklyStats } =
          await stravaRes.json()
        stravaActivities = data.activities

        for (const a of stravaActivities) {
          const km = a.distance / 1000

          // Normalised entry for chart + weekly stats
          normalised.push({
            dateISO: toLocalDateISO(a.start_date_local),
            distanceKm: km,
            durationSec: a.moving_time,
          })

          // Recent Performance card
          items.push({
            _key: `strava-${a.id}`,
            _src: 'strava',
            _date: a.start_date_local,
            _km: km,
            name: a.name,
            typeLabel: a.type,
            elev: Math.round(a.total_elevation_gain),
            time: a.moving_time,
            // Store as sec/km so UnifiedPerfCard's calcPace(pace*km*1000, time) works:
            // actual: calcPace needs metres + seconds → pass metres directly via time
            pace: a.average_speed,  // m/s — kept for calcPace(m/s * km * 1000, time)
            kcal: Math.round(km * 62),
            polyline: a.map?.summary_polyline,
          })
        }
      }

      // ── 2. Manual DB activities ──────────────────────────────────
      let manualActivities: ActivityRecord[] = []
      if (actRes?.ok) {
        const data: { activities: ActivityRecord[] } = await actRes.json()
        manualActivities = data.activities.filter(a => a.isManual)

        for (const m of manualActivities) {
          // Normalised entry for chart + weekly stats
          normalised.push({
            dateISO: toLocalDateISO(m.date),
            distanceKm: m.distanceKm,
            durationSec: m.durationSec,
          })

          // Recent Performance card
          items.push({
            _key: `manual-${m.id}`,
            _src: 'manual',
            _date: m.date,
            _km: m.distanceKm,
            name: m.name,
            typeLabel: 'Manual Run',
            elev: Math.round(m.elevationM || 0),
            time: m.durationSec > 0 ? m.durationSec : undefined,
            // pace stored as secPerKm so UnifiedPerfCard renders correctly
            pace: m.durationSec > 0 && m.distanceKm > 0
              ? m.durationSec / m.distanceKm   // sec/km
              : undefined,
            kcal: Math.round(m.distanceKm * 62),
          })
        }
      }

      // ── 3. Compute unified weekly stats ─────────────────────────
      setWeeklyStats(computeWeeklyStats(normalised))

      // ── 4. Feed the 7-day chart ──────────────────────────────────
      setChartEntries(normalised)

      // ── 5. Sort + limit Recent Performance ──────────────────────
      items.sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime())
      setRecentUnified(items.slice(0, 4))
    } catch { /* noop */ } finally {
      setRecentLoading(false)
    }
  }

  // ── Check settings once on initial load ──────────────────────────
  useEffect(() => {
    if (settingsChecked.current) return
    settingsChecked.current = true

    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then((data: { stravaClientId?: string; stravaRefreshToken?: string } | null) => {
        const configured =
          !!data?.stravaClientId?.trim() && !!data?.stravaRefreshToken?.trim()
        setStravaConfigured(configured)
        if (!configured) setSettingsOpen(true)
      })
      .catch(() => setStravaConfigured(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Fetch weather
    fetch('/api/weather').then(r => r.json()).then(setWeather).catch(() => {})

    // Fetch default gear
    fetch('/api/gear', { cache: 'no-store' })
      .then(r => r.json())
      .then((gear: GearData[]) => {
        const def = gear.find(g => g.isDefault) ?? gear[0] ?? null
        setDefaultGear(def)
      })
      .catch(() => {})

    // Fetch milestone from DB
    fetch('/api/milestone', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Milestone) => setMilestone(data))
      .catch(() => {})

    // Fetch Strava connection status
    fetch('/api/strava/status')
      .then(r => r.ok ? r.json() : { connected: false, athleteName: null })
      .then((s: { connected: boolean; athleteName?: string | null }) =>
        setStravaStatus({ connected: s.connected, athleteName: s.athleteName ?? null })
      )
      .catch(() => {})

    // Unified recent performance fetch
    fetchRecentPerformance()

    // ── Listen for Settings Save to Auto-Refresh Dashboard ────────────────
    const onSettingsSaved = () => {
      setStravaConfigured(true)
      
      // Re-fetch Strava connection status
      fetch('/api/strava/status')
        .then(r => r.ok ? r.json() : { connected: false, athleteName: null })
        .then((s: { connected: boolean; athleteName?: string | null }) =>
          setStravaStatus({ connected: s.connected, athleteName: s.athleteName ?? null })
        )
        .catch(() => {})

      // Re-fetch activities from Strava & DB
      fetchRecentPerformance()
    }
    window.addEventListener('settings-saved', onSettingsSaved)
    return () => window.removeEventListener('settings-saved', onSettingsSaved)
  }, [])

  // ── Read OAuth redirect params ───────────────────────────────────────
  useEffect(() => {
    const connected = searchParams.get('strava_connected')
    const errParam  = searchParams.get('strava_error')
    if (connected) {
      setStravaStatus({ connected: true, athleteName: connected })
      setStravaBanner({ type: 'success', message: `✅ Strava connected as ${connected}! Your activities will now sync.` })
      // Remove query params without reload
      window.history.replaceState({}, '', '/')
      fetchRecentPerformance()
    } else if (errParam) {
      const msg: Record<string, string> = {
        credentials_missing: 'STRAVA_CLIENT_ID / SECRET are not set in .env.',
        token_exchange_failed: 'Strava token exchange failed. Try connecting again.',
        no_code: 'Strava authorization was cancelled.',
        internal_error: 'An internal error occurred during Strava auth.',
      }
      setStravaBanner({ type: 'error', message: `❌ ${msg[errParam] ?? errParam}` })
      window.history.replaceState({}, '', '/')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // ── Handle Strava Disconnect ────────────────────────────────────────
  async function handleDisconnectStrava() {
    if (!window.confirm('Disconnect your Strava account? You will need to log in again to sync new activities.')) return
    
    try {
      const res = await fetch('/api/strava/status', { method: 'DELETE' })
      if (res.ok) {
        setStravaStatus({ connected: false, athleteName: null })
        setStravaBanner({ type: 'success', message: 'Strava disconnected successfully.' })
        // Clear Strava items from recent
        setRecentUnified(prev => prev.filter(item => item._src !== 'strava'))
      }
    } catch { /* noop */ }
  }

  // ── Handle Strava Sync button ───────────────────────────────────────
  async function handleStravaSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      if (res.ok) {
        const [gearRes, msRes] = await Promise.all([
          fetch('/api/gear', { cache: 'no-store' }).then(r => r.json()),
          fetch('/api/milestone', { cache: 'no-store' }).then(r => r.json()),
        ])
        const def = (gearRes as GearData[]).find(g => g.isDefault) ?? (gearRes as GearData[])[0] ?? null
        setDefaultGear(def)
        setMilestone(msRes as Milestone)
        await fetchRecentPerformance()
      }
    } catch { /* noop */ } finally { setSyncing(false) }
  }

  const gearPct = defaultGear
    ? Math.min(100, Math.round((defaultGear.startingMileage / defaultGear.targetLifespan) * 100))
    : 0
  const gearRemaining = defaultGear
    ? Math.max(0, defaultGear.targetLifespan - defaultGear.startingMileage)
    : 0

  const { t } = useLanguage()
  const isHighHeat = weather && weather.temp >= 28
  const isRainy = weather && (weather.icon.startsWith('09') || weather.icon.startsWith('10'))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Settings modal ────────────────────────────────────────── */}
      {settingsOpen && (
        <SettingsModal
          onClose={() => {
            setSettingsOpen(false)
            // Re-check whether the user just saved valid keys
            fetch('/api/settings')
              .then(r => r.ok ? r.json() : null)
              .then((data: { stravaClientId?: string; stravaRefreshToken?: string } | null) => {
                const configured =
                  !!data?.stravaClientId?.trim() && !!data?.stravaRefreshToken?.trim()
                setStravaConfigured(configured)
                if (configured) fetchRecentPerformance()
              })
              .catch(() => {})
          }}
        />
      )}

      {/* ── Pending configuration banner ─────────────────────────── */}
      {stravaConfigured === false && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm border bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-bold"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tracking-wide">
              PENDING CONFIGURATION — Strava API keys are not set.{' '}
              <button
                onClick={() => setSettingsOpen(true)}
                className="underline underline-offset-2 hover:no-underline transition-all"
              >
                Open Settings
              </button>
              {' '}to connect your account.
            </span>
          </div>
          <button
            onClick={() => setStravaConfigured(null)}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Strava connection banner (success / error) ─────────── */}
      {stravaBanner && (
        <div
          role="alert"
          className={[
            'flex items-center justify-between gap-3 px-4 py-3 rounded-sm border text-sm font-bold',
            stravaBanner.type === 'success'
              ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300',
          ].join(' ')}
        >
          <span>{stravaBanner.message}</span>
          <button
            onClick={() => setStravaBanner(null)}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* ── Hero header + top widgets ─────────────────────────── */}
      <section
        id="dashboard-hero"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
        aria-labelledby="hero-heading"
      >
        {/* Left: Hero copy */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-2">
              Week 18 · Training Block 3
            </p>
            {/* Manual settings trigger on dashboard */}
            <button
              id="dashboard-settings-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open system settings"
              title="System Settings & API Integrations"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-sm hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase"
            >
              <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              Settings
            </button>
          </div>
          <h1
            id="hero-heading"
            className="font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-none text-5xl sm:text-6xl lg:text-7xl"
          >
            FOCUS
            <br />
            <span className="text-slate-300 dark:text-slate-600">PHASE</span>
          </h1>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-base max-w-lg leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Keep the momentum.</span>{' '}
            You&apos;re 3 runs into your weekly target. Your long run is scheduled for Sunday. Stay consistent.
          </p>

          {/* Quick stats bar */}
          <div id="weekly-stats" className="mt-6 grid grid-cols-3 gap-3" aria-label="This week's quick stats">
            {[
              { icon: Footprints, label: t('weeklyKm'), value: weeklyStats ? weeklyStats.weeklyKm : '—', unit: 'km' },
              { icon: Zap, label: t('avgPace'), value: weeklyStats ? weeklyStats.avgPace : '—', unit: '/km' },
              { icon: BarChart2, label: t('runs'), value: weeklyStats ? String(weeklyStats.runCount) : '—', unit: t('thisWeek') },
            ].map(({ icon: Icon, label, value, unit }) => (
              <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-3 shadow-sm flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">{label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</span>
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
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-4"
            aria-label="Current weather conditions"
          >
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
              {t('conditionsToday')}
            </p>
            {weather ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950 rounded-sm flex items-center justify-center">
                      <WeatherIcon icon={weather.icon} />
                    </div>
                    <div>
                      <div className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {weather.temp}°<span className="text-lg text-slate-400">C</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide capitalize">{weather.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span className="font-mono">{weather.wind} km/h</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                      <span className="font-mono">{weather.humidity}%</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>{weather.city}</span>
                    </span>
                  </div>
                </div>
                {isHighHeat && (
                  <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950 rounded-sm px-2 py-1 font-bold tracking-wide">
                    ⚠ High heat — hydrate aggressively
                  </p>
                )}
                {isRainy && (
                  <p className="mt-3 text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950 rounded-sm px-2 py-1 font-bold tracking-wide">
                    🌧 Rain expected — trail conditions may be slippery
                  </p>
                )}
              </>
            ) : (
              <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-sm animate-pulse" />
            )}
          </article>

          <article
            id="next-milestone-card"
            className="bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-sm shadow-sm p-4 text-white"
            aria-label="Next milestone"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('nextMilestone')}</p>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <button
                  id="milestone-reset-btn"
                  onClick={resetMilestone}
                  disabled={resetting}
                  aria-label="Reset milestone progress"
                  title="Reset all progress to 0"
                  className="p-1 rounded-sm text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
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
                  className="bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 rounded-sm px-2 py-1.5 text-white text-xs font-bold w-full outline-none focus:border-orange-500"
                  placeholder="Goal title"
                  value={milestoneForm.title}
                  onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                />
                <input
                  id="milestone-target-input"
                  type="number"
                  className="bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 rounded-sm px-2 py-1.5 text-white text-xs font-mono w-full outline-none focus:border-orange-500"
                  placeholder="Target km"
                  value={milestoneForm.targetKm}
                  onChange={e => setMilestoneForm(f => ({ ...f, targetKm: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button id="milestone-save-btn" onClick={saveMilestone} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold tracking-widest rounded-sm uppercase transition-colors">
                    <Check className="w-3 h-3" />{t('save')}
                  </button>
                  <button id="milestone-cancel-btn" onClick={() => setMilestoneEditing(false)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-slate-400 text-[10px] font-bold tracking-widest rounded-sm uppercase transition-colors">
                    <X className="w-3 h-3" />{t('cancel')}
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
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('progress')}</span>
                    <span className="font-mono text-xs text-orange-400 font-bold">{milestone.currentKm} / {milestone.targetKm} km</span>
                  </div>
                  <div
                    className="w-full h-2 bg-slate-800 dark:bg-slate-600 rounded-full overflow-hidden"
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
                    {Math.max(0, milestone.targetKm - milestone.currentKm)} {t('kmRemaining')}
                  </p>
                </div>
              </>
            )}
          </article>
        </div>
      </section>

      {/* ── Recent Performance (Unified) ─────────────────────── */}
      <section id="recent-performance" aria-labelledby="perf-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">{t('activityFeed')}</p>
            <h2 id="perf-heading" className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
              {t('recentPerformance').toUpperCase()}
            </h2>
          </div>
          <div className="flex items-center gap-3">
              {/* Strava connection status */}
              {stravaStatus.connected ? (
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 px-2 py-1 rounded-sm">
                    <Link2 className="w-3 h-3" />
                    {stravaStatus.athleteName ?? 'Strava'} {t('stravaConnected')}
                  </span>
                  <button
                    onClick={handleDisconnectStrava}
                    title={t('disconnectStrava')}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-sm transition-colors"
                  >
                    <Link2Off className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="connect-strava-btn"
                  onClick={() => window.dispatchEvent(new Event('open-settings'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  {t('connectStrava')}
                </button>
              )}
              <button
                id="dashboard-log-manual-btn"
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 hover:text-orange-600 uppercase transition-colors"
              >
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                {t('logManual')}
              </button>
              <a
                href="https://www.strava.com/athlete/training"
                target="_blank"
                rel="noopener noreferrer"
                id="view-all-runs-btn"
                className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 hover:text-orange-600 uppercase transition-colors"
              >
                {t('viewOnStrava')}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {recentLoading ? (
            <>
              {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden animate-pulse">
                  <div className="h-36 bg-slate-100 dark:bg-slate-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : recentUnified.length > 0 ? (
            recentUnified.map((item, i) => <UnifiedPerfCard key={item._key} item={item} index={i} />)
          ) : (
            <div className="col-span-2 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('noActivities')}</p>
              {stravaStatus.connected ? (
                <p className="text-[11px] text-slate-400 mt-1">Log a manual activity or click &ldquo;Sync Now&rdquo; below to pull from Strava.</p>
              ) : (
                <button
                  type="button"
                  id="empty-connect-strava-btn"
                  onClick={() => window.dispatchEvent(new Event('open-settings'))}
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors"
                >
                  <Link2 className="w-3 h-3" />
                  {t('connectStrava')}
                </button>
              )}
            </div>
          )}

          {/* Log workout CTA */}
          <div
            id="run-card-cta"
            onClick={() => setShowManualModal(true)}
            className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm flex flex-col items-center justify-center p-8 gap-3 hover:border-orange-300 hover:bg-orange-50/30 dark:hover:bg-orange-950/30 transition-all duration-200 cursor-pointer group"
            role="button"
            aria-label="Log a new workout"
            tabIndex={0}
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900 transition-colors">
              <Activity className="w-5 h-5 text-orange-600" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Log a workout</p>
              <p className="text-xs text-slate-400 mt-0.5">Manually add or sync from Strava</p>
            </div>
          </div>
        </div>
      </section>

      {showManualModal && (
        <ManualActivityModal
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false)
            fetchRecentPerformance()
          }}
        />
      )}


      {/* ── Gear Health ───────────────────────────────────────────── */}
      <section id="gear-health" aria-labelledby="gear-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gear Health card */}
        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-5 lg:col-span-1" aria-label="Gear health overview">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">Equipment</p>
              <h2 id="gear-heading" className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">GEAR HEALTH</h2>
            </div>
            <Footprints className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </div>

          {defaultGear ? (
            <div id="gear-primary-shoe">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{defaultGear.brandModel}</p>
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
                className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden"
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
            className="mt-5 w-full flex items-center justify-center gap-2 py-2 border border-slate-200 dark:border-slate-700 rounded-sm text-xs font-bold tracking-widest text-slate-600 dark:text-slate-400 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 uppercase transition-all duration-150"
          >
            Manage gear
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </article>

        {/* Training Insights card */}
        <article id="training-insights" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm p-5 lg:col-span-2" aria-label="Training insights and recommendations">
          <div className="mb-4">
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">Analytics</p>
            <h2 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">{t('trainingInsights').toUpperCase()}</h2>
          </div>

          <div className="mb-5">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Weekly Intensity Distribution</p>
            <div className="flex items-end gap-1.5 h-20">
              {(() => {
                // Rolling 7-day window ending TODAY (today = index 6)
                // All date maths in GMT+7 (Phuket) to match weekly stats
                const TZ_OFFSET_MS = 7 * 60 * 60 * 1000
                const nowLocalMs = Date.now() + TZ_OFFSET_MS

                const buckets = Array.from({ length: 7 }, (_, i) => {
                  // i=0 → 6 days ago, i=6 → today
                  const offsetDays = i - 6
                  const dayMs = nowLocalMs + offsetDays * 86_400_000
                  const dayDate = new Date(dayMs)

                  // 3-letter label from actual date — unambiguous (Mon, Tue, Wed…)
                  const label = dayDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    timeZone: 'UTC', // dayMs is already shifted, treat as UTC
                  }).slice(0, 3) // 'Monday' → 'Mon' (en-US gives abbreviated already)

                  const key = dayDate.toISOString().slice(0, 10) // YYYY-MM-DD

                  // chartEntries.dateISO is already the GMT+7 local date — compare directly
                  const total = chartEntries
                    .filter((e: NormalisedEntry) => e.dateISO === key)
                    .reduce((s: number, e: NormalisedEntry) => s + e.distanceKm, 0)

                  return { label, km: total, isToday: offsetDays === 0, key }
                })

                const maxKm = Math.max(...buckets.map((b) => b.km), 1)

                return buckets.map(({ label, km, isToday }, i) => {
                  const pct = Math.round((km / maxKm) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${label}: ${km.toFixed(1)} km`}>
                      <div className="w-full flex flex-col justify-end" style={{ height: '64px' }}>
                        <div
                          className={['w-full rounded-sm transition-all duration-300',
                            isToday ? 'bg-orange-500' : pct === 0 ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-200 dark:bg-slate-700',
                          ].join(' ')}
                          style={{ height: `${Math.max(pct, pct > 0 ? 8 : 0)}%` }}
                          role="img"
                          aria-label={`${label}: ${km.toFixed(1)} km`}
                        />
                      </div>
                      <span className={['text-[9px] font-bold',
                        isToday ? 'text-orange-600' : 'text-slate-400',
                      ].join(' ')}>{label}</span>
                    </div>
                  )
                })
              })()}
            </div>
            {chartEntries.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center mt-2">Sync Strava or log a manual activity to populate this chart.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-sm p-3 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 bg-orange-100 dark:bg-orange-950 rounded-sm flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Distance Logged</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {chartEntries.length > 0
                    ? `${chartEntries.reduce((s: number, e: NormalisedEntry) => s + e.distanceKm, 0).toFixed(1)} km across ${chartEntries.length} activities (Strava + manual).`
                    : 'No activities logged yet. Sync Strava or add a manual run.'}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-sm p-3 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 bg-blue-50 dark:bg-blue-950 rounded-sm flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Sync Strava History</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Pull your latest runs and update gear mileage automatically.
                </p>
                <button
                  id="sync-strava-btn"
                  onClick={handleStravaSync}
                  disabled={syncing}
                  className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider text-orange-600 hover:text-orange-700 uppercase disabled:opacity-50 transition-colors"
                >
                  <Activity className="w-3 h-3" />
                  {syncing ? t('syncing') : t('syncNow')}
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

// Wrap in Suspense so useSearchParams() works without a static-render error
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  )
}
