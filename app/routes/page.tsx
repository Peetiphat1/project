'use client'

import { useState, useEffect } from 'react'
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
  Pencil,
} from 'lucide-react'
import {
  AddRouteModal,
  EditRouteModal,
  type RouteRecord,
} from '@/app/components/Modals'

// ── Types ──────────────────────────────────────────────────────────────────
interface Route {
  id: string
  name: string
  location?: string
  distance: number
  elevation: number
  surface?: string
  terrain: string
  difficulty?: 'Easy' | 'Moderate' | 'Hard'
  lastRun?: string
  isFavorite: boolean
  pathPoints?: string
  color?: string
  notes?: string
}

// ── Helper components ──────────────────────────────────────────────────────
const difficultyStyles: Record<string, string> = {
  Easy: 'bg-green-50 text-green-700 border-green-200',
  Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-red-50 text-red-700 border-red-200',
}

function MiniMap({
  points = '15,80 50,60 85,75 120,55 150,65 185,50 210,60', // fallback
  color = '#3b82f6',
  routeName,
}: {
  points?: string
  color?: string
  routeName: string
}) {
  return (
    <div className="relative h-20 bg-slate-50 rounded-sm overflow-hidden">
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
        <circle cx={Number(points.split(' ')[0].split(',')[0])} cy={Number(points.split(' ')[0].split(',')[1])} r="3" fill="#22c55e" />
        <circle cx={Number(points.split(' ').at(-1)!.split(',')[0])} cy={Number(points.split(' ').at(-1)!.split(',')[1])} r="3" fill="#ef4444" />
      </svg>
    </div>
  )
}

function RouteCard({
  route,
  isSelected,
  onEdit,
}: {
  route: Route
  isSelected: boolean
  onEdit: (r: Route) => void
}) {
  const difficulty = route.difficulty || 'Moderate'
  const surface = route.surface || route.terrain || 'Mixed'

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
            {route.location || 'Local Route'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span
            className={`text-[10px] font-bold tracking-wider border px-1.5 py-0.5 rounded-sm ${difficultyStyles[difficulty]}`}
          >
            {difficulty.toUpperCase()}
          </span>
          {isSelected && (
            <span className="text-[10px] font-bold tracking-wider bg-orange-600 text-white px-1.5 py-0.5 rounded-sm">
              FOCUS
            </span>
          )}
          <button
            id={`edit-route-card-btn-${route.id}`}
            onClick={(e) => { e.stopPropagation(); onEdit(route) }}
            aria-label={`Edit ${route.name}`}
            className="p-1 rounded-sm text-slate-400 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all"
          >
            <Pencil className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      <MiniMap points={route.pathPoints} color={route.color} routeName={route.name} />

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Navigation, label: 'Dist', value: String(route.distance), unit: 'km' },
          { icon: TrendingUp, label: 'Elev', value: String(route.elevation), unit: 'm' },
          { icon: Clock, label: 'Last', value: route.lastRun || 'N/A', unit: '' },
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
          <Layers className="w-3 h-3" aria-hidden="true" />
          {surface.toUpperCase()}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
      </div>
    </article>
  )
}

function ElevationGraph() {
  const points = [
    [0, 85], [30, 72], [60, 80], [90, 55], [120, 65],
    [150, 38], [180, 52], [210, 28], [240, 40], [270, 60],
    [300, 45], [330, 30], [360, 20], [390, 35],
  ]
  const pathD = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
  const fillD = `${pathD} L 390 100 L 0 100 Z`

  return (
    <div className="relative h-28 bg-slate-50 rounded-sm overflow-hidden" role="img" aria-label="Elevation profile graph">
      <div className="absolute left-2 inset-y-0 flex flex-col justify-between py-2 pointer-events-none">
        {['Max', 'Mid', 'Avg', '0m'].map((label) => (
          <span key={label} className="text-[9px] font-mono text-slate-400 leading-none">{label}</span>
        ))}
      </div>
      <svg className="absolute inset-0 w-full h-full pl-8" viewBox="0 0 400 100" preserveAspectRatio="none">
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={fillD} fill="#fff7ed" />
        <path d={pathD} stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="210" cy="28" r="4" fill="#ea580c" />
        <circle cx="210" cy="28" r="7" fill="#ea580c" fillOpacity="0.2" />
      </svg>
    </div>
  )
}

function LargeMap({ route }: { route: Route }) {
  const points = '30,220 80,165 130,190 190,110 250,140 310,80 370,115 430,55 490,90 540,70'
  const routeColor = route.color || '#ea580c'

  return (
    <div className="relative bg-slate-100 rounded-sm overflow-hidden" style={{ height: '340px' }} role="img" aria-label={`Detailed map for ${route.name}`}>
      <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#64748b" strokeWidth="1" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#64748b" strokeWidth="1" />
        ))}
      </svg>
      <div className="absolute top-12 left-16 w-24 h-24 rounded-full bg-green-100 opacity-40" aria-hidden="true" />
      <div className="absolute top-20 right-20 w-32 h-20 rounded-full bg-green-100 opacity-30" aria-hidden="true" />
      <div className="absolute bottom-16 left-32 w-20 h-16 rounded-full bg-slate-200 opacity-50" aria-hidden="true" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 570 340" preserveAspectRatio="none">
        <polyline points={points} stroke="rgba(0,0,0,0.1)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} stroke={routeColor} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 12" opacity="0.6" />
        <circle cx="30" cy="220" r="7" fill="#22c55e" />
        <circle cx="30" cy="220" r="12" fill="#22c55e" fillOpacity="0.2" />
        <circle cx="540" cy="70" r="7" fill="#ef4444" />
        <circle cx="540" cy="70" r="12" fill="#ef4444" fillOpacity="0.2" />
        <circle cx="310" cy="80" r="5" fill="white" stroke={routeColor} strokeWidth="2" />
      </svg>
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-sm px-2 py-1 border border-slate-200">
        <span className="text-[10px] font-mono font-bold text-slate-600">{route.distance} km · {route.elevation} m elev.</span>
      </div>
      <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-sm border border-slate-200 flex items-center justify-center">
        <Navigation className="w-4 h-4 text-slate-600" aria-label="North" />
      </div>
    </div>
  )
}

function StatBox({ id, icon: Icon, label, value, sub }: { id: string; icon: React.ElementType; label: string; value: string; sub: string }) {
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

// ── Page ───────────────────────────────────────────────────────────────────
export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [focusRoute, setFocusRoute] = useState<Route | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RouteRecord | null>(null)

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/routes')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRoutes(data)
      if (data.length > 0 && (!focusRoute || !data.find((d: Route) => d.id === focusRoute.id))) {
        setFocusRoute(data[0])
      } else if (data.length === 0) {
        setFocusRoute(null)
      }
    } catch (err) {
      console.error('Failed to load routes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  function openEdit(route: Route) {
    setEditTarget({
      id: route.id,
      name: route.name,
      distance: String(route.distance),
      elevation: String(route.elevation),
      terrain: route.terrain,
    })
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEditTarget(null)
        fetchRoutes()
      }
    } catch {
      console.error('Failed to delete route')
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-1">
              Route Library
            </p>
            <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl text-slate-900 leading-none">
              MY ROUTES
            </h1>
            <p className="mt-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              {isLoading ? '...' : `${routes.length} Saved Entries`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="routes-filter-btn"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 bg-white rounded-sm hover:border-slate-300 transition-colors shadow-sm uppercase"
            >
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              Filter
            </button>
            <button
              id="create-route-btn"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors shadow-sm uppercase"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Create New Route
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside aria-label="Saved routes list" className="lg:sticky lg:top-20">
            <div
              id="routes-list"
              className="space-y-3 overflow-y-auto pr-1"
              style={{ maxHeight: 'calc(100vh - 160px)' }}
            >
              {isLoading && <p className="text-sm text-slate-500 animate-pulse">Loading routes...</p>}
              {!isLoading && routes.length === 0 && (
                <div className="p-4 bg-white border border-slate-200 rounded-sm text-center">
                  <p className="text-sm text-slate-500">No routes found.</p>
                </div>
              )}
              {routes.map((route) => (
                <div key={route.id} onClick={() => setFocusRoute(route)}>
                  <RouteCard
                    route={route}
                    isSelected={focusRoute?.id === route.id}
                    onEdit={openEdit}
                  />
                </div>
              ))}
            </div>
          </aside>

          <section
            id="route-detail-panel"
            className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 flex flex-col gap-5"
          >
            {focusRoute ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">
                      Current Focus
                    </p>
                    <h2 className="font-extrabold text-2xl tracking-tight text-slate-900 mt-0.5">
                      {focusRoute.name}
                    </h2>
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      {focusRoute.location || 'Local area'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors">
                      <Zap className="w-3.5 h-3.5" />
                      Start Run
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: focusRoute.surface || focusRoute.terrain, icon: Layers },
                    { label: focusRoute.difficulty || 'Moderate', icon: BarChart2 },
                  ].map(({ label, icon: Icon }) => (
                    <span key={label} className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-sm">
                      <Icon className="w-3 h-3 text-slate-400" />
                      {(label || '').toUpperCase()}
                    </span>
                  ))}
                </div>

                <LargeMap route={focusRoute} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatBox id="stat-incline" icon={TrendingUp} label="Peak Incline" value="18.4°" sub="Max gradient expected" />
                  <StatBox id="stat-ambient" icon={Thermometer} label="Ambient" value="27°C" sub="Usual temp" />
                  <StatBox id="stat-surface" icon={Layers} label="Surface" value={focusRoute.terrain} sub="Primary mix" />
                </div>

                <div id="elevation-delta-section">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-slate-400" />
                      <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase">Elevation Delta</h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-orange-600">{`+${focusRoute.elevation} m`}</span>
                  </div>
                  <ElevationGraph />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(focusRoute)}
                    className="flex-1 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 rounded-sm hover:border-orange-500 hover:text-orange-600 uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Route
                  </button>
                  <button className="flex-1 py-2 text-xs font-bold tracking-widest bg-slate-900 text-white rounded-sm hover:bg-slate-700 uppercase transition-colors">
                    Share Route
                  </button>
                </div>
              </>
            ) : (
               <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                 <MapPin className="w-12 h-12 mb-4 opacity-50" />
                 <p className="text-sm">Select a route or create a new one to view details.</p>
               </div>
            )}
          </section>
        </div>
      </div>

      {isAddOpen && (
        <AddRouteModal
          onClose={() => setIsAddOpen(false)}
          onSuccess={fetchRoutes}
        />
      )}

      {editTarget && (
        <EditRouteModal
          route={editTarget}
          onClose={() => setEditTarget(null)}
          onDelete={handleDelete}
          onSuccess={fetchRoutes}
        />
      )}
    </>
  )
}
