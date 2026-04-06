'use client'

import { useState, useEffect } from 'react'
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
import { useLanguage } from '@/lib/i18n'

// ── Types ──────────────────────────────────────────────────────────────────
type GearStatus = 'Active' | 'Default' | 'Retiring Soon' | 'Retired'

interface Shoe {
  id: string
  brandModel: string
  dateAcquired: string
  startingMileage: number
  targetLifespan: number
  status: string
  isDefault: boolean
  imageUrl?: string | null
  mileage?: number
}

function StatusTag({ status, isDefault }: { status: string; isDefault: boolean }) {
  if (isDefault) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded-sm">
        <Star className="w-2.5 h-2.5 fill-white" aria-hidden="true" />
        DEFAULT
      </span>
    )
  }
  if (status.toLowerCase() === 'retiring soon') {
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
      {status.toUpperCase()}
    </span>
  )
}

function WearBar({ pct, isDefault, status }: { pct: number; isDefault: boolean; status: string }) {
  const isRetiring = status.toLowerCase() === 'retiring soon'
  const barColor = isRetiring ? 'bg-red-500' : isDefault ? 'bg-orange-500' : 'bg-blue-500'
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Tread Wear</span>
        <span className={`font-mono text-xs font-bold ${isRetiring ? 'text-red-500' : 'text-slate-700'}`}>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${barColor} rounded-sm relative overflow-hidden transition-all duration-700`} style={{ width: `${pct}%` }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: `${(i + 1) * 10}%` }} aria-hidden="true" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ShoeIllustration({ color, imageUrl }: { color: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <div className="relative w-full h-36 rounded-sm overflow-hidden bg-slate-50" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Shoe" className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className="relative w-full h-36 rounded-sm overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${color}0f` }} aria-hidden="true">
      <svg viewBox="0 0 200 100" className="w-48 h-24 opacity-80" aria-hidden="true">
        <ellipse cx="100" cy="88" rx="88" ry="10" fill={`${color}30`} />
        <path d="M 20 85 Q 18 55 40 50 L 110 42 Q 140 38 160 48 Q 180 55 185 70 L 188 85 Z" fill={color} opacity="0.85" />
        <path d="M 18 85 Q 18 92 30 93 L 180 93 Q 192 92 188 85 Z" fill={`${color}60`} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={62 + i * 18} y1={52 + i * 5} x2={62 + i * 18 + 14} y2={50 + i * 5} stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        ))}
      </svg>
    </div>
  )
}

function GearCard({ shoe, onEdit, onSetDefault }: { shoe: Shoe; onEdit: (s: Shoe) => void; onSetDefault: (id: string) => void }) {
  const currentMileage = shoe.startingMileage || shoe.mileage || 0
  const pctUsed = Math.min(100, Math.round((currentMileage / shoe.targetLifespan) * 100))
  const remaining = Math.max(0, shoe.targetLifespan - currentMileage)
  const isDefault = shoe.isDefault
  const isRetiring = shoe.status.toLowerCase() === 'retiring soon'

  return (
    <article
      id={`gear-card-${shoe.id}`}
      className={[
        'bg-white dark:bg-slate-900 border rounded-sm shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md',
        isDefault ? 'border-orange-300 dark:border-orange-800 ring-1 ring-orange-100 dark:ring-orange-900' : 'border-slate-200 dark:border-slate-800',
      ].join(' ')}
    >
      <div className="relative">
        <ShoeIllustration color={isDefault ? '#ea580c' : '#3b82f6'} imageUrl={shoe.imageUrl} />
        <button
          onClick={() => onEdit(shoe)}
          className="absolute top-2 left-2 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-orange-600 hover:border-orange-300 transition-all shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight mt-1">{shoe.brandModel}</h2>
          </div>
          <StatusTag status={shoe.status} isDefault={isDefault} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F5F5F3] dark:bg-slate-800 rounded-sm p-2.5 flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              <Footprints className="w-2.5 h-2.5" />
              Logged
            </span>
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {currentMileage}<span className="text-xs text-slate-400 ml-0.5">km</span>
            </span>
          </div>
          <div className="bg-[#F5F5F3] dark:bg-slate-800 rounded-sm p-2.5 flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              <BarChart2 className="w-2.5 h-2.5" />
              Remaining
            </span>
            <span className={`font-mono text-lg font-bold tabular-nums ${isRetiring ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
              {remaining}<span className="text-xs text-slate-400 ml-0.5">km</span>
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Usage</span>
            <span className="font-mono text-xs text-slate-600 font-bold">{currentMileage} / {shoe.targetLifespan} km</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${isRetiring ? 'bg-red-500' : 'bg-slate-400'}`} style={{ width: `${pctUsed}%` }} />
          </div>
        </div>

        <WearBar pct={pctUsed} status={shoe.status} isDefault={isDefault} />

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Acquired {shoe.dateAcquired}</span>
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-1">
          {isDefault ? (
            <button disabled className="w-full py-2 text-xs font-bold tracking-widest bg-orange-50 text-orange-600 border border-orange-200 rounded-sm uppercase cursor-default flex items-center justify-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> Current Default
            </button>
          ) : (
            <button
              onClick={() => onSetDefault(shoe.id)}
              className="w-full py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors flex items-center justify-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" /> Set as Default
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function RetiredCard({ shoe }: { shoe: Shoe }) {
  const currentMileage = shoe.startingMileage || shoe.mileage || 0
  return (
    <article className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-sm p-4 flex items-center gap-4 opacity-70 hover:opacity-90 transition-opacity">
      <div className="w-20 h-14 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center shrink-0 overflow-hidden" aria-hidden="true">
        <svg viewBox="0 0 200 100" className="w-16 h-10">
          <path d="M 20 85 Q 18 55 40 50 L 110 42 Q 140 38 160 48 Q 180 55 185 70 L 188 85 Z" fill="#94a3b8" opacity="0.5" />
          <path d="M 18 85 Q 18 92 30 93 L 180 93 Q 192 92 188 85 Z" fill="#cbd5e1" opacity="0.5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
            <Archive className="w-2.5 h-2.5" /> RETIRED
          </span>
        </div>
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-sm mt-0.5">{shoe.brandModel}</h3>
        <div className="flex items-center gap-4 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400"><Footprints className="w-3 h-3" />{currentMileage} km lifetime</span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400"><Calendar className="w-3 h-3" />{shoe.dateAcquired}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </article>
  )
}

export default function GearPage() {
  const [gear, setGear] = useState<Shoe[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const activeShoes = gear.filter((s) => s.status.toLowerCase() !== 'retired')
  const retiredShoes = gear.filter((s) => s.status.toLowerCase() === 'retired')
  const totalKm = activeShoes.reduce((s, sh) => s + (sh.startingMileage || sh.mileage || 0), 0)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<GearRecord | null>(null)
  const { t } = useLanguage()

  const fetchGear = async () => {
    try {
      const res = await fetch('/api/gear', { cache: 'no-store' })
      if (res.ok) setGear(await res.json())
    } catch {
      console.error('Failed to fetch gear')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchGear() }, [])

  async function handleSetDefault(id: string) {
    const res = await fetch(`/api/gear/${id}/default`, { method: 'PUT' })
    if (res.ok) fetchGear()
  }

  function openEdit(shoe: Shoe) {
    setEditTarget({
      id: shoe.id,
      brand: shoe.brandModel.split(' ')[0], // Best effort heuristic for the dropdown
      model: shoe.brandModel.split(' ').slice(1).join(' '),
      dateAcquired: shoe.dateAcquired,
      targetLifespan: shoe.targetLifespan,
      mileage: shoe.startingMileage || shoe.mileage || 0,
      status: shoe.status.toLowerCase() as any,
    })
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-1">Equipment Manager</p>
            <h1 className="font-extrabold tracking-tight text-4xl sm:text-5xl text-slate-900 dark:text-slate-100 leading-none">{t('myGear').toUpperCase()}</h1>
            <p className="mt-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              {isLoading ? '...' : `${activeShoes.length} Active Pairs · ${totalKm.toLocaleString()} km Logged`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 uppercase transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Gear
            </button>
          </div>
        </header>

        <section>
          {isLoading && <p className="text-sm text-slate-500 animate-pulse">Loading gear roster...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeShoes.map((shoe) => (
              <GearCard key={shoe.id} shoe={shoe} onEdit={openEdit} onSetDefault={handleSetDefault} />
            ))}
          </div>
        </section>

        {retiredShoes.length > 0 && (
          <section className="border-t border-slate-200 dark:border-slate-800 pt-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-1">Archive</p>
                <h2 className="font-extrabold text-xl tracking-tight text-slate-400 dark:text-slate-500">RETIRED PERFORMANCE VAULT</h2>
              </div>
              <Archive className="w-5 h-5 text-slate-300" />
            </div>
            <div className="space-y-3">
              {retiredShoes.map((shoe) => <RetiredCard key={shoe.id} shoe={shoe} />)}
            </div>
          </section>
        )}
      </div>

      {isAddOpen && (
        <AddGearModal onClose={() => setIsAddOpen(false)} onSuccess={fetchGear} />
      )}

      {editTarget && (
        <EditGearModal
          gear={editTarget}
          onClose={() => setEditTarget(null)}
          onDelete={async (id) => {
            const res = await fetch(`/api/gear/${id}`, { method: 'DELETE' })
            if (res.ok) { setEditTarget(null); fetchGear() }
          }}
          onSuccess={fetchGear}
        />
      )}
    </>
  )
}
