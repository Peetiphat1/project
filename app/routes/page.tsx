import type { Metadata } from 'next'
import {
  Plus,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  Thermometer,
  Layers,
  Star,
  ChevronRight,
  BarChart2,
  Navigation,
  Bookmark,
  Filter,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'My Routes',
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Route {
  id: string
  name: string
  location: string
  distance: string
  elevation: string
  surface: string
  difficulty: 'Easy' | 'Moderate' | 'Hard'
  lastRun: string
  isFavorite: boolean
  isActive: boolean
  // SVG path points for mini-map preview
  pathPoints: string
  color: string
}

// ── Static data ────────────────────────────────────────────────────────────
const routes: Route[] = [
  {
    id: 'kathu-trail',
    name: 'Kathu Trail Loop',
    location: 'Kathu, Phuket',
    distance: '14.2',
    elevation: '312',
    surface: 'Trail',
    difficulty: 'Hard',
    lastRun: '2 days ago',
    isFavorite: true,
    isActive: true,
    pathPoints: '15,95 40,70 65,80 90,45 120,60 145,35 170,50 195,25 215,40',
    color: '#ea580c',
  },
  {
    id: 'saphan-hin-loop',
    name: 'Saphan Hin Loop',
    location: 'Phuket City',
    distance: '6.8',
    elevation: '28',
    surface: 'Pavement',
    difficulty: 'Easy',
    lastRun: 'Yesterday',
    isFavorite: false,
    isActive: true,
    pathPoints: '15,80 50,60 85,75 120,55 150,65 185,50 210,60',
    color: '#3b82f6',
  },
  {
    id: 'rawai-seafront',
    name: 'Rawai Seafront Run',
    location: 'Rawai, Phuket',
    distance: '10.5',
    elevation: '45',
    surface: 'Pavement',
    difficulty: 'Moderate',
    lastRun: '4 days ago',
    isFavorite: true,
    isActive: false,
    pathPoints: '15,70 55,60 95,65 130,50 165,55 200,45 220,50',
    color: '#22c55e',
  },
  {
    id: 'nai-harn-hills',
    name: 'Nai Harn Hills',
    location: 'Nai Harn, Phuket',
    distance: '18.3',
    elevation: '487',
    surface: 'Mixed',
    difficulty: 'Hard',
    lastRun: '1 week ago',
    isFavorite: false,
    isActive: false,
    pathPoints: '15,90 35,65 60,75 85,40 110,55 140,30 165,45 190,20 215,35',
    color: '#a855f7',
  },
  {
    id: 'chalong-temple',
    name: 'Chalong Temple Circuit',
    location: 'Chalong, Phuket',
    distance: '8.7',
    elevation: '62',
    surface: 'Pavement',
    difficulty: 'Easy',
    lastRun: '3 days ago',
    isFavorite: false,
    isActive: false,
    pathPoints: '15,75 50,65 85,70 120,58 150,62 185,55 215,60',
    color: '#f59e0b',
  },
]

const focusRoute = routes[0]

// ── Helper components ──────────────────────────────────────────────────────
const difficultyStyles: Record<Route['difficulty'], string> = {
  Easy: 'bg-green-50 text-green-700 border-green-200',
  Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-red-50 text-red-700 border-red-200',
}

function MiniMap({
  points,
  color,
  routeName,
}: {
  points: string
  color: string
  routeName: string
}) {
  return (
    <div className="relative h-20 bg-slate-50 rounded-sm overflow-hidden">
      {/* Grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 230 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" y1={y} x2="230" y2={y} stroke="#94a3b8" strokeWidth="0.5" />
        ))}
        {[46, 92, 138, 184].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#94a3b8" strokeWidth="0.5" />
        ))}
      </svg>
      {/* Route line */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 230 100"
        preserveAspectRatio="none"
        aria-label={`Mini map for ${routeName}`}
        role="img"
      >
        <polyline
          points={points}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start dot */}
        <circle cx={Number(points.split(' ')[0].split(',')[0])} cy={Number(points.split(' ')[0].split(',')[1])} r="3" fill="#22c55e" />
        {/* End dot */}
        <circle cx={Number(points.split(' ').at(-1)!.split(',')[0])} cy={Number(points.split(' ').at(-1)!.split(',')[1])} r="3" fill="#ef4444" />
      </svg>
    </div>
  )
}

function RouteCard({ route, isSelected }: { route: Route; isSelected: boolean }) {
  return (
    <article
      id={`route-card-${route.id}`}
      className={[
        'bg-white border rounded-sm p-4 cursor-pointer transition-all duration-150 hover:shadow-md',
        isSelected
          ? 'border-orange-500 shadow-md ring-1 ring-orange-200'
          : 'border-slate-200 shadow-sm hover:border-slate-300',
      ].join(' ')}
      aria-label={`Route: ${route.name}`}
      aria-selected={isSelected}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm truncate">{route.name}</h3>
            {route.isFavorite && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" aria-label="Favourite" />
            )}
          </div>
          <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {route.location}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span
            className={`text-[10px] font-bold tracking-wider border px-1.5 py-0.5 rounded-sm ${difficultyStyles[route.difficulty]}`}
          >
            {route.difficulty.toUpperCase()}
          </span>
          {isSelected && (
            <span className="text-[10px] font-bold tracking-wider bg-orange-600 text-white px-1.5 py-0.5 rounded-sm">
              FOCUS
            </span>
          )}
        </div>
      </div>

      {/* Mini map */}
      <MiniMap points={route.pathPoints} color={route.color} routeName={route.name} />

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Navigation, label: 'Dist', value: route.distance, unit: 'km' },
          { icon: TrendingUp, label: 'Elev', value: route.elevation, unit: 'm' },
          { icon: Clock, label: 'Last', value: route.lastRun, unit: '' },
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

      {/* Surface chip */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
          <Layers className="w-3 h-3" aria-hidden="true" />
          {route.surface.toUpperCase()}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
      </div>
    </article>
  )
}

// ── Elevation graph placeholder ────────────────────────────────────────────
function ElevationGraph() {
  // Generate a smooth elevation profile
  const points = [
    [0, 85], [30, 72], [60, 80], [90, 55], [120, 65],
    [150, 38], [180, 52], [210, 28], [240, 40], [270, 60],
    [300, 45], [330, 30], [360, 20], [390, 35],
  ]

  const pathD = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ')

  const fillD = `${pathD} L 390 100 L 0 100 Z`

  return (
    <div
      className="relative h-28 bg-slate-50 rounded-sm overflow-hidden"
      role="img"
      aria-label="Elevation profile graph for Kathu Trail Loop"
    >
      {/* Y-axis labels */}
      <div className="absolute left-2 inset-y-0 flex flex-col justify-between py-2 pointer-events-none">
        {['487m', '350m', '200m', '0m'].map((label) => (
          <span key={label} className="text-[9px] font-mono text-slate-400 leading-none">
            {label}
          </span>
        ))}
      </div>

      {/* SVG graph */}
      <svg
        className="absolute inset-0 w-full h-full pl-8"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {/* Fill area */}
        <path d={fillD} fill="#fff7ed" />
        {/* Elevation line */}
        <path d={pathD} stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current position dot */}
        <circle cx="210" cy="28" r="4" fill="#ea580c" />
        <circle cx="210" cy="28" r="7" fill="#ea580c" fillOpacity="0.2" />
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-1 left-8 right-0 flex justify-between px-2 pointer-events-none">
        {['0 km', '3.5', '7.1', '10.6', '14.2'].map((label) => (
          <span key={label} className="text-[9px] font-mono text-slate-400 leading-none">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Large map placeholder ──────────────────────────────────────────────────
function LargeMap({ route }: { route: Route }) {
  const points =
    '30,220 80,165 130,190 190,110 250,140 310,80 370,115 430,55 490,90 540,70'

  return (
    <div
      className="relative bg-slate-100 rounded-sm overflow-hidden"
      style={{ height: '340px' }}
      role="img"
      aria-label={`Detailed map for ${route.name}`}
    >
      {/* Topo grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#64748b" strokeWidth="1" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#64748b" strokeWidth="1" />
        ))}
      </svg>

      {/* Terrain zones (decorative) */}
      <div className="absolute top-12 left-16 w-24 h-24 rounded-full bg-green-100 opacity-40" aria-hidden="true" />
      <div className="absolute top-20 right-20 w-32 h-20 rounded-full bg-green-100 opacity-30" aria-hidden="true" />
      <div className="absolute bottom-16 left-32 w-20 h-16 rounded-full bg-slate-200 opacity-50" aria-hidden="true" />

      {/* Route SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 570 340" preserveAspectRatio="none">
        {/* Shadow line */}
        <polyline
          points={points}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Main route line */}
        <polyline
          points={points}
          stroke={route.color}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dashes for style */}
        <polyline
          points={points}
          stroke="white"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 12"
          opacity="0.6"
        />
        {/* Start marker */}
        <circle cx="30" cy="220" r="7" fill="#22c55e" />
        <circle cx="30" cy="220" r="12" fill="#22c55e" fillOpacity="0.2" />
        {/* End marker */}
        <circle cx="540" cy="70" r="7" fill="#ef4444" />
        <circle cx="540" cy="70" r="12" fill="#ef4444" fillOpacity="0.2" />
        {/* Mid-waypoint */}
        <circle cx="310" cy="80" r="5" fill="white" stroke={route.color} strokeWidth="2" />
      </svg>

      {/* Distance markers */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-sm px-2 py-1 border border-slate-200">
        <span className="text-[10px] font-mono font-bold text-slate-600">
          {route.distance} km · {route.elevation} m elev.
        </span>
      </div>

      {/* Compass rose */}
      <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-sm border border-slate-200 flex items-center justify-center">
        <Navigation className="w-4 h-4 text-slate-600" aria-label="North" />
      </div>

      {/* Scale bar */}
      <div className="absolute bottom-3 left-3 flex items-end gap-1">
        <div className="w-16 h-1.5 bg-slate-700 rounded-sm" aria-hidden="true" />
        <span className="text-[9px] font-mono text-slate-600">2 km</span>
      </div>
    </div>
  )
}

// ── Stat box ───────────────────────────────────────────────────────────────
function StatBox({
  id,
  icon: Icon,
  label,
  value,
  sub,
}: {
  id: string
  icon: React.ElementType
  label: string
  value: string
  sub: string
}) {
  return (
    <div
      id={id}
      className="bg-[#F5F5F3] border border-slate-200 rounded-sm p-3 flex flex-col gap-1"
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {label}
        </span>
      </div>
      <span className="font-mono text-xl font-bold text-slate-900 tabular-nums leading-tight">
        {value}
      </span>
      <span className="text-[10px] text-slate-500 tracking-wide">{sub}</span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function RoutesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Page header ─────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-1">
            Route Library
          </p>
          <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl text-slate-900 leading-none">
            MY ROUTES
          </h1>
          <p className="mt-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            32 Saved Entries · 8 Favourites
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Filter */}
          <button
            id="routes-filter-btn"
            aria-label="Filter routes"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 bg-white rounded-sm hover:border-slate-300 hover:text-slate-900 uppercase transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            Filter
          </button>
          {/* Create */}
          <button
            id="create-route-btn"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Create New Route
          </button>
        </div>
      </header>

      {/* ── Two-column grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">

        {/* ── Left: Scrollable route list ─────────────────── */}
        <aside
          aria-label="Saved routes list"
          className="lg:sticky lg:top-20"
        >
          {/* Scroll container */}
          <div
            id="routes-list"
            className="space-y-3 overflow-y-auto pr-1"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          >
            {routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={route.id === 'kathu-trail'}
              />
            ))}
          </div>
        </aside>

        {/* ── Right: Detail / focus view ───────────────────── */}
        <section
          id="route-detail-panel"
          aria-labelledby="current-focus-heading"
          className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex flex-col gap-5"
        >
          {/* Detail header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">
                Current Focus
              </p>
              <h2
                id="current-focus-heading"
                className="font-extrabold text-2xl tracking-tight text-slate-900 mt-0.5"
              >
                {focusRoute.name}
              </h2>
              <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {focusRoute.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="bookmark-route-btn"
                aria-label="Bookmark this route"
                className="p-2 rounded-sm border border-slate-200 text-slate-400 hover:text-amber-400 hover:border-amber-300 transition-colors"
              >
                <Bookmark className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                id="run-route-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors"
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                Start Run
              </button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: focusRoute.surface, icon: Layers },
              { label: focusRoute.difficulty, icon: BarChart2 },
              { label: `Last run: ${focusRoute.lastRun}`, icon: Clock },
            ].map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-sm"
              >
                <Icon className="w-3 h-3 text-slate-400" aria-hidden="true" />
                {label.toUpperCase()}
              </span>
            ))}
          </div>

          {/* Large map */}
          <LargeMap route={focusRoute} />

          {/* Three stat boxes */}
          <div
            id="route-stat-boxes"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            aria-label="Route conditions"
          >
            <StatBox
              id="stat-incline"
              icon={TrendingUp}
              label="Peak Incline"
              value="18.4°"
              sub="Max gradient on ascent"
            />
            <StatBox
              id="stat-ambient"
              icon={Thermometer}
              label="Ambient Temp"
              value="27°C"
              sub="Avg at last run • Humid"
            />
            <StatBox
              id="stat-surface"
              icon={Layers}
              label="Surface Mix"
              value="60/40"
              sub="Trail vs. packed dirt"
            />
          </div>

          {/* Elevation delta graph */}
          <div id="elevation-delta-section">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                  Elevation Delta
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600">
                +312 / −298 m
              </span>
            </div>
            <ElevationGraph />
            <div className="flex justify-between mt-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                Start · 48m
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                End · 52m
                <div className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <button
              id="edit-route-btn"
              className="flex-1 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 rounded-sm hover:border-orange-500 hover:text-orange-600 uppercase transition-all"
            >
              Edit Route
            </button>
            <button
              id="export-route-btn"
              className="flex-1 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 rounded-sm hover:border-slate-300 hover:text-slate-900 uppercase transition-all"
            >
              Export GPX
            </button>
            <button
              id="share-route-btn"
              className="flex-1 py-2 text-xs font-bold tracking-widest bg-slate-900 text-white rounded-sm hover:bg-slate-700 uppercase transition-colors"
            >
              Share Route
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
