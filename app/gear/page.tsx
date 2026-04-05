'use client'

import { useState } from 'react'
import {
  Plus,
  Star,
  AlertTriangle,
  CheckCircle,
  Archive,
  TrendingDown,
  Footprints,
  Calendar,
  BarChart2,
  Zap,
  ChevronRight,
  Award,
  Pencil,
} from 'lucide-react'
import {
  AddGearModal,
  EditGearModal,
  type GearRecord,
} from '@/app/components/Modals'

// ── Types ──────────────────────────────────────────────────────────────────
type GearStatus = 'Active' | 'Default' | 'Retiring Soon'

interface Shoe {
  id: string
  brand: string
  model: string
  colorway: string
  distanceLogged: number
  maxDistance: number
  treadWear: number
  status: GearStatus
  addedDate: string
  lastUsed: string
  bestFor: string
  accentColor: string
  brandInitial: string
}

interface RetiredShoe {
  id: string
  brand: string
  model: string
  totalDistance: number
  retiredDate: string
  seasons: string
}

// ── Static data ────────────────────────────────────────────────────────────
const activeShoes: Shoe[] = [
  {
    id: 'vaporfly-3',
    brand: 'Nike',
    model: 'Vaporfly 3',
    colorway: 'Volt / Black',
    distanceLogged: 563,
    maxDistance: 1000,
    treadWear: 56,
    status: 'Default',
    addedDate: 'Sep 2025',
    lastUsed: 'Today',
    bestFor: 'Race / Speed Work',
    accentColor: '#ea580c',
    brandInitial: 'N',
  },
  {
    id: 'alphafly-3',
    brand: 'Nike',
    model: 'Alphafly 3',
    colorway: 'Blue Ribbon / Volt',
    distanceLogged: 221,
    maxDistance: 800,
    treadWear: 28,
    status: 'Active',
    addedDate: 'Jan 2026',
    lastUsed: '3 days ago',
    bestFor: 'Marathon / Long Run',
    accentColor: '#3b82f6',
    brandInitial: 'N',
  },
  {
    id: 'gel-nimbus-26',
    brand: 'ASICS',
    model: 'Gel-Nimbus 26',
    colorway: 'Midnight / White',
    distanceLogged: 788,
    maxDistance: 900,
    treadWear: 88,
    status: 'Retiring Soon',
    addedDate: 'May 2025',
    lastUsed: '1 week ago',
    bestFor: 'Recovery / Easy Runs',
    accentColor: '#a855f7',
    brandInitial: 'A',
  },
]

const retiredShoes: RetiredShoe[] = [
  { id: 'vaporfly-2-ret', brand: 'Nike', model: 'Vaporfly 2', totalDistance: 1024, retiredDate: 'Aug 2025', seasons: '14 months' },
  { id: 'pegasus-39-ret', brand: 'Nike', model: 'Pegasus 39', totalDistance: 892, retiredDate: 'Mar 2025', seasons: '11 months' },
  { id: 'superblast-ret', brand: 'ASICS', model: 'Superblast', totalDistance: 756, retiredDate: 'Oct 2024', seasons: '9 months' },
]

// ── Helper: map UI Shoe to the GearRecord shape expected by EditGearModal ──
function shoeToGearRecord(shoe: Shoe): GearRecord {
  return {
    id: shoe.id,
    brand: shoe.brand.toLowerCase(),
    model: shoe.model,
    // Convert display date (e.g. "Sep 2025") to ISO for the date input
    dateAcquired: '',          // TODO: store ISO date in data
    targetLifespan: shoe.maxDistance,
    mileage: shoe.distanceLogged,
    status:
      shoe.status === 'Default'        ? 'default'   :
      shoe.status === 'Retiring Soon'  ? 'retiring'  :
                                         'active',
  }
}

// ── Helper components ──────────────────────────────────────────────────────
function StatusTag({ status }: { status: GearStatus }) {
  if (status === 'Default') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded-sm">
        <Star className="w-2.5 h-2.5 fill-white" aria-hidden="true" />
        DEFAULT
      </span>
    )
  }
  if (status === 'Retiring Soon') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-sm">
        <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
        RETIRING SOON
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-sm">
      <CheckCircle className="w-2.5 h-2.5" aria-hidden="true" />
      ACTIVE
    </span>
  )
}

function WearBar({ pct, status }: { pct: number; status: GearStatus }) {
  const barColor =
    status === 'Retiring Soon' ? 'bg-red-500' :
    status === 'Default'       ? 'bg-orange-500' :
                                 'bg-blue-500'
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Tread Wear</span>
        <span className={`font-mono text-xs font-bold ${status === 'Retiring Soon' ? 'text-red-500' : 'text-slate-700'}`}>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Tread wear: ${pct}%`}>
        <div className={`h-full ${barColor} rounded-sm relative overflow-hidden transition-all duration-700`} style={{ width: `${pct}%` }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: `${(i + 1) * 10}%` }} aria-hidden="true" />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-slate-400">0 km</span>
        <span className="text-[9px] font-mono text-slate-400">WORN</span>
      </div>
    </div>
  )
}

function ShoeIllustration({ initial, color }: { initial: string; color: string }) {
  return (
    <div className="relative w-full h-36 rounded-sm overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${color}0f` }} aria-hidden="true">
      <svg viewBox="0 0 200 100" className="w-48 h-24 opacity-80" aria-hidden="true">
        <ellipse cx="100" cy="88" rx="88" ry="10" fill={`${color}30`} />
        <path d="M 20 85 Q 18 55 40 50 L 110 42 Q 140 38 160 48 Q 180 55 185 70 L 188 85 Z" fill={color} opacity="0.85" />
        <path d="M 18 85 Q 18 92 30 93 L 180 93 Q 192 92 188 85 Z" fill={`${color}60`} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={62 + i * 18} y1={52 + i * 5} x2={62 + i * 18 + 14} y2={50 + i * 5} stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        ))}
        <text x="155" y="78" fontSize="20" fontWeight="bold" fill="white" opacity="0.5" fontFamily="sans-serif">{initial}</text>
      </svg>
      <div className="absolute top-3 right-3 w-9 h-9">
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(94.2 * 0.56).toFixed(0)} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        </svg>
      </div>
    </div>
  )
}

/** GearCard now accepts onEdit callback */
function GearCard({ shoe, onEdit }: { shoe: Shoe; onEdit: (s: Shoe) => void }) {
  const pctUsed = Math.round((shoe.distanceLogged / shoe.maxDistance) * 100)
  const remaining = shoe.maxDistance - shoe.distanceLogged

  return (
    <article
      id={`gear-card-${shoe.id}`}
      className={[
        'bg-white border rounded-sm shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md',
        shoe.status === 'Default' ? 'border-orange-300 ring-1 ring-orange-100' : 'border-slate-200',
      ].join(' ')}
      aria-label={`${shoe.brand} ${shoe.model}`}
    >
      {/* Illustration with edit button overlay */}
      <div className="relative">
        <ShoeIllustration initial={shoe.brandInitial} color={shoe.accentColor} />
        {/* ── Edit icon overlay ── */}
        <button
          id={`edit-gear-btn-${shoe.id}`}
          onClick={() => onEdit(shoe)}
          aria-label={`Edit ${shoe.model}`}
          className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-sm border border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-300 transition-all shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{shoe.brand}</p>
            <h2 className="font-extrabold text-slate-900 text-base leading-tight">{shoe.model}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{shoe.colorway}</p>
          </div>
          <StatusTag status={shoe.status} />
        </div>

        {/* Distance stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F5F5F3] rounded-sm p-2.5 flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              <Footprints className="w-2.5 h-2.5" aria-hidden="true" />
              Logged
            </span>
            <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
              {shoe.distanceLogged}<span className="text-xs text-slate-400 ml-0.5">km</span>
            </span>
          </div>
          <div className="bg-[#F5F5F3] rounded-sm p-2.5 flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              <BarChart2 className="w-2.5 h-2.5" aria-hidden="true" />
              Remaining
            </span>
            <span className={`font-mono text-lg font-bold tabular-nums ${shoe.status === 'Retiring Soon' ? 'text-red-600' : 'text-slate-900'}`}>
              {remaining}<span className="text-xs text-slate-400 ml-0.5">km</span>
            </span>
          </div>
        </div>

        {/* Usage progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Usage</span>
            <span className="font-mono text-xs text-slate-600 font-bold">{shoe.distanceLogged} / {shoe.maxDistance} km</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pctUsed} aria-valuemin={0} aria-valuemax={100} aria-label={`Usage: ${pctUsed}%`}>
            <div className={`h-full rounded-full transition-all duration-700 ${shoe.status === 'Retiring Soon' ? 'bg-red-500' : 'bg-slate-400'}`} style={{ width: `${pctUsed}%` }} />
          </div>
        </div>

        <WearBar pct={shoe.treadWear} status={shoe.status} />

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" />Added {shoe.addedDate}</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" aria-hidden="true" />{shoe.lastUsed}</span>
        </div>

        <p className="text-[10px] font-bold tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-sm px-2 py-1">
          BEST FOR: <span className="text-slate-700">{shoe.bestFor}</span>
        </p>

        <div className="flex flex-col gap-2 mt-auto pt-1">
          {shoe.status === 'Default' ? (
            <button id={`btn-default-${shoe.id}`} disabled className="w-full py-2 text-xs font-bold tracking-widest bg-orange-50 text-orange-600 border border-orange-200 rounded-sm uppercase cursor-default flex items-center justify-center gap-1.5" aria-label={`${shoe.model} is the default shoe`}>
              <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" aria-hidden="true" />
              Current Default
            </button>
          ) : (
            <button id={`btn-set-default-${shoe.id}`} className="w-full py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors flex items-center justify-center gap-1.5" aria-label={`Set ${shoe.model} as the default shoe`}>
              <Star className="w-3.5 h-3.5" aria-hidden="true" />
              Set as Default
            </button>
          )}
          <button
            id={`btn-retire-${shoe.id}`}
            className={['w-full py-2 text-xs font-bold tracking-widest rounded-sm border uppercase transition-all flex items-center justify-center gap-1.5',
              shoe.status === 'Retiring Soon' ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'text-slate-500 border-slate-200 hover:border-red-400 hover:text-red-500'].join(' ')}
            aria-label={`Retire ${shoe.model}`}
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            {shoe.status === 'Retiring Soon' ? 'Retire Gear Now' : 'Retire Gear'}
          </button>
        </div>
      </div>
    </article>
  )
}

function RetiredCard({ shoe }: { shoe: RetiredShoe }) {
  return (
    <article id={`retired-card-${shoe.id}`} className="bg-white/60 border border-slate-200/70 rounded-sm p-4 flex items-center gap-4 opacity-70 hover:opacity-90 transition-opacity" aria-label={`Retired: ${shoe.brand} ${shoe.model}`}>
      <div className="w-20 h-14 bg-slate-100 rounded-sm flex items-center justify-center shrink-0 overflow-hidden" aria-hidden="true">
        <svg viewBox="0 0 200 100" className="w-16 h-10">
          <path d="M 20 85 Q 18 55 40 50 L 110 42 Q 140 38 160 48 Q 180 55 185 70 L 188 85 Z" fill="#94a3b8" opacity="0.5" />
          <path d="M 18 85 Q 18 92 30 93 L 180 93 Q 192 92 188 85 Z" fill="#cbd5e1" opacity="0.5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{shoe.brand}</p>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
            <Archive className="w-2.5 h-2.5" aria-hidden="true" />
            RETIRED {shoe.retiredDate}
          </span>
        </div>
        <h3 className="font-bold text-slate-500 text-sm mt-0.5">{shoe.model}</h3>
        <div className="flex items-center gap-4 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400"><Footprints className="w-3 h-3" aria-hidden="true" />{shoe.totalDistance} km lifetime</span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400"><Calendar className="w-3 h-3" aria-hidden="true" />{shoe.seasons}</span>
        </div>
      </div>
      <div className="w-24 shrink-0 hidden sm:block">
        <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mb-1">Final Wear</p>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100} aria-label="Fully worn">
          <div className="h-full bg-slate-300 rounded-full w-full" />
        </div>
        <p className="text-[9px] font-mono text-slate-400 mt-0.5">Fully retired</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
    </article>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function GearPage() {
  const totalKm = activeShoes.reduce((s, sh) => s + sh.distanceLogged, 0)

  // ── Modal state ──────────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<GearRecord | null>(null)

  function openEdit(shoe: Shoe) {
    setEditTarget(shoeToGearRecord(shoe))
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Page header ─────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-1">Equipment Manager</p>
            <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl text-slate-900 leading-none">MY GEAR</h1>
            <p className="mt-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              {activeShoes.length} Active Pairs · <span className="font-mono">{totalKm.toLocaleString()}</span> km Logged This Year
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* ── Opens Add Gear modal ── */}
            <button
              id="add-gear-btn"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add New Gear
            </button>
          </div>
        </header>

        {/* ── Summary strip ───────────────────────────────────── */}
        <div id="gear-summary-strip" className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Gear summary">
          {[
            { icon: Footprints, label: 'Total Pairs', value: `${activeShoes.length}`, sub: 'Active' },
            { icon: TrendingDown, label: 'Avg Wear', value: `${Math.round(activeShoes.reduce((s, sh) => s + sh.treadWear, 0) / activeShoes.length)}%`, sub: 'Tread remaining spent' },
            { icon: BarChart2, label: 'Total KM', value: totalKm.toLocaleString(), sub: 'Across all active gear' },
            { icon: Award, label: 'Retiring Soon', value: `${activeShoes.filter(s => s.status === 'Retiring Soon').length}`, sub: 'Pair needs replacement' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">{value}</span>
              <span className="text-[10px] text-slate-400">{sub}</span>
            </div>
          ))}
        </div>

        {/* ── Active gear grid ─────────────────────────────────── */}
        <section id="active-gear-section" aria-labelledby="active-gear-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase">Currently Active</p>
              <h2 id="active-gear-heading" className="font-extrabold text-xl tracking-tight text-slate-900">PERFORMANCE ROSTER</h2>
            </div>
            <button id="compare-gear-btn" className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-500 hover:text-orange-600 uppercase transition-colors">
              Compare<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeShoes.map((shoe) => (
              <GearCard key={shoe.id} shoe={shoe} onEdit={openEdit} />
            ))}
          </div>
        </section>

        {/* ── Retiring soon alert banner ───────────────────────── */}
        {activeShoes.some((s) => s.status === 'Retiring Soon') && (
          <aside id="retiring-soon-banner" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-sm p-4" role="alert">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">
                {activeShoes.filter((s) => s.status === 'Retiring Soon').map((s) => s.model).join(', ')} — approaching end of lifespan
              </p>
              <p className="text-xs text-red-500 mt-0.5">Replace within the next few runs to avoid injury risk from degraded cushioning.</p>
            </div>
            <button id="shop-replacement-btn" className="shrink-0 px-3 py-1.5 text-xs font-bold tracking-widest bg-red-600 text-white rounded-sm hover:bg-red-700 uppercase transition-colors">
              Shop Replacement
            </button>
          </aside>
        )}

        {/* ── Retired Vault ────────────────────────────────────── */}
        <section id="retired-gear-section" aria-labelledby="retired-vault-heading" className="border-t border-slate-200 pt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-1">Archive</p>
              <h2 id="retired-vault-heading" className="font-extrabold text-xl tracking-tight text-slate-400">RETIRED PERFORMANCE VAULT</h2>
              <p className="text-[11px] text-slate-400 mt-1 tracking-wide">
                {retiredShoes.length} pairs honourably discharged · <span className="font-mono">{retiredShoes.reduce((s, sh) => s + sh.totalDistance, 0).toLocaleString()}</span> km served
              </p>
            </div>
            <Archive className="w-5 h-5 text-slate-300" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            {retiredShoes.map((shoe) => (
              <RetiredCard key={shoe.id} shoe={shoe} />
            ))}
          </div>

          <button id="view-full-archive-btn" className="mt-4 w-full py-3 text-xs font-bold tracking-widest text-slate-400 border border-dashed border-slate-200 rounded-sm hover:border-slate-300 hover:text-slate-600 uppercase transition-all">
            View Full Archive →
          </button>
        </section>
      </div>

      {/* ── MODALS ── */}

      {isAddOpen && (
        <AddGearModal onClose={() => setIsAddOpen(false)} />
      )}

      {editTarget && (
        <EditGearModal
          gear={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  )
}
