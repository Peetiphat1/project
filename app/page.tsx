import type { Metadata } from 'next'
import {
  Sun,
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
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Stat block used inside run cards */
function RunStat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
          {value}
        </span>
        <span className="text-xs text-slate-500 font-mono">{unit}</span>
      </div>
    </div>
  )
}

/** A single recent performance card */
function PerformanceCard({
  id,
  title,
  date,
  distance,
  time,
  pace,
  elevation,
  calories,
  badge,
}: {
  id: string
  title: string
  date: string
  distance: string
  time: string
  pace: string
  elevation: string
  calories: string
  badge?: string
}) {
  return (
    <article
      id={id}
      className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
      aria-label={`${title} on ${date}`}
    >
      {/* Map placeholder */}
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        {/* Simulated topographic lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-slate-400"
              style={{ top: `${12 + i * 12}%` }}
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full border-l border-slate-400"
              style={{ left: `${10 + i * 16}%` }}
            />
          ))}
        </div>
        {/* Route line mockup */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 320 144"
          fill="none"
          aria-hidden="true"
        >
          <polyline
            points="20,110 60,85 100,95 130,60 170,70 210,45 260,55 300,30"
            stroke="#ea580c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="110" r="4" fill="#22c55e" />
          <circle cx="300" cy="30" r="4" fill="#ef4444" />
        </svg>
        {/* Activity type badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm shadow-sm">
          <Activity className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase">
            Strava Run
          </span>
        </div>
        {badge && (
          <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm">
            {badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{title}</h3>
            <p className="text-[11px] text-slate-400 tracking-wide mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {date}
            </p>
          </div>
          <button
            aria-label={`View details for ${title}`}
            className="p-1.5 rounded-sm text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <RunStat label="Distance" value={distance} unit="km" />
          <RunStat label="Time" value={time} unit="min" />
          <RunStat label="Pace" value={pace} unit="/km" />
        </div>

        {/* Secondary row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <TrendingUp className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span className="font-mono">{elevation}m</span>
              <span className="text-slate-400">elev.</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Flame className="w-3 h-3 text-orange-400" aria-hidden="true" />
              <span className="font-mono">{calories}</span>
              <span className="text-slate-400">kcal</span>
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-sm">
            SYNCED
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
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
            <span className="font-bold text-slate-700 uppercase tracking-wide">
              Keep the momentum.
            </span>{' '}
            You&apos;re 3 runs into your weekly target. Your long run is scheduled
            for Sunday. Stay consistent.
          </p>

          {/* Quick stats bar */}
          <div
            id="weekly-stats"
            className="mt-6 grid grid-cols-3 gap-3"
            aria-label="This week's quick stats"
          >
            {[
              { icon: Footprints, label: 'Weekly KM', value: '48.2', unit: 'km' },
              { icon: Zap, label: 'Avg Pace', value: '4:52', unit: '/km' },
              { icon: BarChart2, label: 'Runs', value: '3', unit: 'of 5' },
            ].map(({ icon: Icon, label, value, unit }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                    {value}
                  </span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-sm flex items-center justify-center">
                  <Sun className="w-7 h-7 text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-slate-900">
                    28°<span className="text-lg text-slate-400">C</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold tracking-wide">
                    Sunny
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Wind className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span className="font-mono">12 km/h</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span className="font-mono">62%</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Phuket</span>
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 rounded-sm px-2 py-1 font-bold tracking-wide">
              ⚠ High heat — hydrate aggressively
            </p>
          </article>

          {/* Next Milestone card */}
          <article
            id="next-milestone-card"
            className="bg-slate-900 border border-slate-800 rounded-sm shadow-sm p-4 text-white"
            aria-label="Next milestone"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Next Milestone
              </p>
              <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
            </div>
            <p className="font-extrabold text-lg tracking-tight leading-tight text-white">
              500 km
              <br />
              <span className="text-slate-400 text-sm font-bold">Lifetime Total</span>
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Progress
                </span>
                <span className="font-mono text-xs text-orange-400 font-bold">
                  432 / 500 km
                </span>
              </div>
              <div
                className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={86}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="500km milestone progress"
              >
                <div
                  className="h-full bg-orange-600 rounded-full transition-all duration-500"
                  style={{ width: '86%' }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 tracking-wide">
                68 km remaining
              </p>
            </div>

            <button
              id="milestone-view-btn"
              className="mt-4 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-orange-400 hover:text-orange-300 transition-colors uppercase"
            >
              View all milestones
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </article>
        </div>
      </section>

      {/* ── Recent Performance ─────────────────────────────────── */}
      <section id="recent-performance" aria-labelledby="perf-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">
              Activity Feed
            </p>
            <h2
              id="perf-heading"
              className="font-extrabold text-xl tracking-tight text-slate-900"
            >
              RECENT PERFORMANCE
            </h2>
          </div>
          <button
            id="view-all-runs-btn"
            className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-500 hover:text-orange-600 uppercase transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          <PerformanceCard
            id="run-card-1"
            title="Rawai Seafront Morning Run"
            date="Today, 06:15 AM"
            distance="12.4"
            time="60:32"
            pace="4:53"
            elevation="48"
            calories="628"
            badge="PR PACE"
          />
          <PerformanceCard
            id="run-card-2"
            title="Chalong Temple Loop"
            date="Yesterday, 05:50 AM"
            distance="8.7"
            time="43:11"
            pace="4:58"
            elevation="62"
            calories="441"
          />
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
              <p className="text-xs text-slate-400 mt-0.5">
                Manually add or sync from Strava
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gear Health ───────────────────────────────────────────── */}
      <section
        id="gear-health"
        aria-labelledby="gear-heading"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Gear Health card */}
        <article
          className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 lg:col-span-1"
          aria-label="Gear health overview"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">
                Equipment
              </p>
              <h2
                id="gear-heading"
                className="font-extrabold text-lg tracking-tight text-slate-900"
              >
                GEAR HEALTH
              </h2>
            </div>
            <Footprints className="w-5 h-5 text-slate-400" aria-hidden="true" />
          </div>

          {/* Primary gear item */}
          <div className="space-y-4">
            <div id="gear-primary-shoe">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Nike Vaporfly 3 (Primary)
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    563 km used
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                  WORN
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>Tread wear</span>
                <span className="text-amber-600 font-bold">56%</span>
              </div>
              <div
                className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden"
                role="progressbar"
                aria-valuenow={56}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Shoe tread wear 56%"
              >
                {/* Textured progress fill */}
                <div
                  className="h-full bg-orange-500 rounded-sm relative overflow-hidden transition-all duration-500"
                  style={{ width: '56%' }}
                >
                  {/* Tread texture pattern */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-orange-700/30"
                      style={{ left: `${(i + 1) * 12.5}%` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 tracking-wide">
                Estimated 437 km remaining
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4" id="gear-secondary-shoe">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    ASICS Gel-Nimbus 26
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    210 km used
                  </p>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-sm">
                  GOOD
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>Tread wear</span>
                <span className="text-green-600 font-bold">21%</span>
              </div>
              <div
                className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden"
                role="progressbar"
                aria-valuenow={21}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Secondary shoe tread wear 21%"
              >
                <div
                  className="h-full bg-green-500 rounded-sm transition-all duration-500"
                  style={{ width: '21%' }}
                />
              </div>
            </div>
          </div>

          <button
            id="manage-gear-btn"
            className="mt-5 w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-sm text-xs font-bold tracking-widest text-slate-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 uppercase transition-all duration-150"
          >
            Manage gear
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </article>

        {/* Training Insights card */}
        <article
          id="training-insights"
          className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 lg:col-span-2"
          aria-label="Training insights and recommendations"
        >
          <div className="mb-4">
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">
              Analytics
            </p>
            <h2 className="font-extrabold text-lg tracking-tight text-slate-900">
              TRAINING INSIGHTS
            </h2>
          </div>

          {/* Intensity distribution bars */}
          <div className="mb-5">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
              Weekly Intensity Distribution
            </p>
            <div className="flex items-end gap-1.5 h-20">
              {[
                { day: 'M', pct: 55, active: false },
                { day: 'T', pct: 80, active: false },
                { day: 'W', pct: 40, active: false },
                { day: 'T', pct: 65, active: false },
                { day: 'F', pct: 90, active: true },
                { day: 'S', pct: 30, active: false },
                { day: 'S', pct: 0, active: false },
              ].map(({ day, pct, active }, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '64px' }}>
                    <div
                      className={[
                        'w-full rounded-sm transition-all duration-300',
                        active ? 'bg-orange-500' : pct === 0 ? 'bg-slate-100' : 'bg-slate-200',
                      ].join(' ')}
                      style={{ height: `${pct}%` }}
                      role="img"
                      aria-label={`${day}: ${pct}% intensity`}
                    />
                  </div>
                  <span
                    className={[
                      'text-[10px] font-bold',
                      active ? 'text-orange-600' : 'text-slate-400',
                    ].join(' ')}
                  >
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Insight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-sm p-3 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 bg-orange-100 rounded-sm flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-orange-600" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Pace trending up</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Your average pace improved by 8 sec/km over the last 30 days.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-sm p-3 flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 bg-blue-50 rounded-sm flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue-500" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Recovery day recommended</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  High load this week. Consider a rest day tomorrow before your long run.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
