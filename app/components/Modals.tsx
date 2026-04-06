'use client'

/**
 * app/components/Modals.tsx
 *
 * Four modal interfaces for Prisma CRUD operations:
 *   - AddRouteModal
 *   - EditRouteModal
 *   - AddGearModal
 *   - EditGearModal
 *
 * Each modal is a named export so pages can import exactly what they need.
 * Validation mirrors Zod's error shape so it can be swapped for real Zod
 * server-action results with zero API changes.
 */

import { useState, useRef, useCallback, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { routeSchema, gearSchema, manualActivitySchema } from '@/lib/validations'
import {
  X,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Upload,
  ImagePlus,
  MapPin,
  TrendingUp,
  Ruler,
  Layers,
  Tag,
  Calendar,
  Gauge,
  SlidersHorizontal,
  Save,
  PlusCircle,
  ChevronDown,
  Info,
  Activity,
  Navigation,
  Clock,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors the shape of a Zod `.flatten().fieldErrors` object. */
type FieldErrors<T extends string> = Partial<Record<T, string>>

/** A backdrop + centered panel that traps focus and closes on outside-click. */
function ModalShell({
  id,
  onClose,
  children,
  width = 'max-w-lg',
}: {
  id: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}) {
  // Close on Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    /* Backdrop */
    <div
      id={`${id}-backdrop`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="presentation"
    >
      {/* Panel */}
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        className={[
          'relative w-full bg-white border border-slate-200 rounded-sm shadow-2xl',
          'flex flex-col max-h-[90vh] overflow-hidden',
          width,
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  )
}

/** Sticky header row inside a modal. */
function ModalHeader({
  label,
  title,
  onClose,
  rightSlot,
}: {
  label: string
  title: string
  onClose: () => void
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
      <div>
        <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-0.5">
          {label}
        </p>
        <h2 className="font-extrabold tracking-tight text-slate-900 text-xl leading-tight">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="p-1.5 rounded-sm text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** Scrollable body region. */
function ModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {children}
    </div>
  )
}

/** Sticky footer row. */
function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-[#F5F5F3]">
      {children}
    </div>
  )
}

// ── Reusable field components ─────────────────────────────────────────────

function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
      >
        {label}
        {required && <span className="text-orange-500">*</span>}
        {hint && (
          <span title={hint} className="ml-auto cursor-help text-slate-300 hover:text-slate-500">
            <Info className="w-3 h-3" aria-hidden="true" />
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="flex items-center gap-1 text-[11px] text-red-600 font-semibold">
          <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

const inputBaseClass =
  'w-full px-3 py-2.5 text-sm bg-[#F5F5F3] border rounded-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors'

const inputOk = 'border-slate-200 focus:ring-orange-500 focus:border-orange-500'
const inputErr = 'border-red-400 bg-red-50/30 focus:ring-red-500 focus:border-red-500'

function TextInput({
  id,
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  type = 'text',
  min,
  max,
  step,
}: {
  id: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  icon?: React.ElementType
  type?: 'text' | 'number' | 'date'
  min?: string
  max?: string
  step?: string
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className={[
          inputBaseClass,
          Icon ? 'pl-9' : '',
          error ? inputErr : inputOk,
        ].join(' ')}
        aria-describedby={error ? `${id}-err` : undefined}
        aria-invalid={!!error}
      />
    </div>
  )
}

function SelectInput({
  id,
  value,
  onChange,
  options,
  error,
  icon: Icon,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  error?: string
  icon?: React.ElementType
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          inputBaseClass,
          'appearance-none cursor-pointer pr-9',
          Icon ? 'pl-9' : '',
          error ? inputErr : inputOk,
        ].join(' ')}
        aria-invalid={!!error}
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}

/** Orange primary action button. */
function PrimaryBtn({
  id,
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  id: string
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest bg-orange-600 text-white rounded-sm hover:bg-orange-700 active:scale-95 uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {children}
    </button>
  )
}

/** Ghost cancel button. */
function GhostBtn({
  id,
  children,
  onClick,
}: {
  id: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 bg-white rounded-sm hover:border-slate-300 hover:text-slate-900 uppercase transition-colors"
    >
      {children}
    </button>
  )
}

/** Danger (red) button. */
function DangerBtn({
  id,
  children,
  onClick,
}: {
  id: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-widest text-red-600 border border-red-200 bg-red-50 rounded-sm hover:bg-red-600 hover:text-white hover:border-red-600 uppercase transition-all"
    >
      {children}
    </button>
  )
}

/** Success / error banner shown after submission attempt. */
function SubmitBanner({ state }: { state: 'success' | 'error' | null }) {
  if (!state) return null
  if (state === 'success') {
    return (
      <div
        role="status"
        className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-sm px-3 py-2 text-xs font-bold text-green-700"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        Saved successfully — syncing to database…
      </div>
    )
  }
  return (
    <div
      role="alert"
      className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-3 py-2 text-xs font-bold text-red-700"
    >
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      Please fix the errors above before saving.
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADD ROUTE MODAL
// ─────────────────────────────────────────────────────────────────────────────

type RouteFields = 'name' | 'distance' | 'elevation' | 'terrain'

interface AddRouteForm {
  name: string
  distance: string
  elevation: string
  terrain: string
}

/** Inline validator — mirrors what a Zod schema would return from `.safeParse()`. */
function validateRoute(form: AddRouteForm): FieldErrors<RouteFields> {
  const errors: FieldErrors<RouteFields> = {}
  if (!form.name.trim()) errors.name = 'Route name is required.'
  else if (form.name.trim().length < 3) errors.name = 'Name must be at least 3 characters.'

  const dist = parseFloat(form.distance)
  if (!form.distance) errors.distance = 'Distance is required.'
  else if (isNaN(dist) || dist <= 0) errors.distance = 'Distance must be a positive number.'
  else if (dist > 500) errors.distance = 'Distance cannot exceed 500 km.'

  const elev = parseFloat(form.elevation)
  if (form.elevation && (isNaN(elev) || elev < 0))
    errors.elevation = 'Elevation must be 0 or greater.'

  if (!form.terrain) errors.terrain = 'Please select a terrain type.'
  return errors
}

const terrainOptions = [
  { value: 'Road', label: 'Road / Pavement' },
  { value: 'Trail', label: 'Trail' },
  { value: 'Technical', label: 'Technical / Track' },
  { value: 'Mixed', label: 'Mixed Terrain' },
]

export function AddRouteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState<AddRouteForm>({
    name: '', distance: '', elevation: '', terrain: '',
  })
  const [errors, setErrors] = useState<FieldErrors<RouteFields>>({})
  const [submitted, setSubmitted] = useState(false)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)

  function set(field: keyof AddRouteForm) {
    return (v: string) => {
      setForm((f) => ({ ...f, [field]: v }))
      // Live-clear errors after first submission attempt
      if (submitted) setErrors((e) => ({ ...e, [field]: undefined }))
    }
  }

  async function handleSubmit() {
    setSubmitted(true)
    const payload = {
      name: form.name.trim(),
      distance: parseFloat(form.distance),
      elevation: parseFloat(form.elevation || '0'),
      terrain: form.terrain,
      isFavorite: false,
    }
    const result = routeSchema.safeParse(payload)
    if (!result.success) {
      const errs: any = {}
      result.error.issues.forEach(iss => { errs[iss.path[0]] = iss.message })
      setErrors(errs)
      setBanner('error')
      return
    }
    setErrors({})
    try {
      const res = await fetch('/api/routes', { method: 'POST', body: JSON.stringify(result.data) })
      if (!res.ok) throw new Error()
      setBanner('success')
      if (onSuccess) onSuccess()
      setTimeout(onClose, 800)
    } catch {
      setBanner('error')
    }
  }

  return (
    <ModalShell id="add-route-modal" onClose={onClose}>
      <ModalHeader
        label="Route Library"
        title="ADD NEW ROUTE"
        onClose={onClose}
      />

      <ModalBody>
        {/* Route Name */}
        <FieldWrapper label="Route Name" htmlFor="ar-name" error={errors.name} required>
          <TextInput
            id="ar-name"
            placeholder="e.g. Kathu Trail Loop"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            icon={MapPin}
          />
        </FieldWrapper>

        {/* Distance + Elevation row */}
        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper
            label="Distance"
            htmlFor="ar-distance"
            error={errors.distance}
            hint="Total route length in kilometres"
            required
          >
            <TextInput
              id="ar-distance"
              placeholder="14.2"
              value={form.distance}
              onChange={set('distance')}
              error={errors.distance}
              icon={Ruler}
              type="number"
              min="0"
              step="0.1"
            />
            {!errors.distance && (
              <span className="text-[10px] font-mono text-slate-400 -mt-0.5">km</span>
            )}
          </FieldWrapper>

          <FieldWrapper
            label="Elevation Gain"
            htmlFor="ar-elevation"
            error={errors.elevation}
            hint="Total positive elevation in metres"
          >
            <TextInput
              id="ar-elevation"
              placeholder="312"
              value={form.elevation}
              onChange={set('elevation')}
              error={errors.elevation}
              icon={TrendingUp}
              type="number"
              min="0"
              step="1"
            />
            {!errors.elevation && (
              <span className="text-[10px] font-mono text-slate-400 -mt-0.5">m</span>
            )}
          </FieldWrapper>
        </div>

        {/* Terrain Type */}
        <FieldWrapper label="Terrain Type" htmlFor="ar-terrain" error={errors.terrain} required>
          <SelectInput
            id="ar-terrain"
            value={form.terrain}
            onChange={set('terrain')}
            options={terrainOptions}
            error={errors.terrain}
            icon={Layers}
          />
        </FieldWrapper>

        {/* Zod-style inline error demonstration */}
        {submitted && errors.distance === 'Distance must be a positive number.' && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-sm p-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-red-700">Zod validation failed</p>
              <p className="text-[11px] text-red-500 font-mono mt-0.5">
                ZodError: distance — "Distance must be a positive number."
              </p>
            </div>
          </div>
        )}

        <SubmitBanner state={banner} />
      </ModalBody>

      <ModalFooter>
        <GhostBtn id="ar-cancel-btn" onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn id="ar-save-btn" onClick={handleSubmit}>
          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          Create Route
        </PrimaryBtn>
      </ModalFooter>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EDIT ROUTE MODAL
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteRecord {
  id: string
  name: string
  distance: string
  elevation: string
  terrain: string
}

export function EditRouteModal({
  route,
  onClose,
  onDelete,
  onSuccess,
}: {
  route: RouteRecord
  onClose: () => void
  onDelete: (id: string) => void
  onSuccess?: () => void
}) {
  const [form, setForm] = useState<AddRouteForm>({
    name: route.name,
    distance: route.distance,
    elevation: route.elevation,
    terrain: route.terrain,
  })
  const [errors, setErrors] = useState<FieldErrors<RouteFields>>({})
  const [submitted, setSubmitted] = useState(false)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set(field: keyof AddRouteForm) {
    return (v: string) => {
      setForm((f) => ({ ...f, [field]: v }))
      if (submitted) setErrors((e) => ({ ...e, [field]: undefined }))
    }
  }

  async function handleSave() {
    setSubmitted(true)
    const payload = {
      name: form.name.trim(),
      distance: parseFloat(form.distance),
      elevation: parseFloat(form.elevation || '0'),
      terrain: form.terrain,
      isFavorite: false,
    }
    const result = routeSchema.safeParse(payload)
    if (!result.success) {
      const errs: any = {}
      result.error.issues.forEach(iss => { errs[iss.path[0]] = iss.message })
      setErrors(errs)
      setBanner('error')
      return
    }
    setErrors({})
    try {
      const res = await fetch(`/api/routes/${route.id}`, { method: 'PUT', body: JSON.stringify(result.data) })
      if (!res.ok) throw new Error()
      setBanner('success')
      if (onSuccess) onSuccess()
      setTimeout(onClose, 800)
    } catch {
      setBanner('error')
    }
  }

  return (
    <ModalShell id="edit-route-modal" onClose={onClose}>
      <ModalHeader
        label="Route Library"
        title="EDIT ROUTE"
        onClose={onClose}
        rightSlot={
          <DangerBtn
            id="er-delete-btn"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Delete
          </DangerBtn>
        }
      />

      <ModalBody>
        {/* Delete confirmation */}
        {confirmDelete && (
          <div
            role="alertdialog"
            aria-labelledby="er-delete-confirm-title"
            className="bg-red-50 border border-red-300 rounded-sm p-4 space-y-3"
          >
            <p id="er-delete-confirm-title" className="text-sm font-bold text-red-800 flex items-center gap-2">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Permanently delete &ldquo;{route.name}&rdquo;?
            </p>
            <p className="text-xs text-red-600">
              This will remove the route and all associated run history from the database.
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                id="er-confirm-delete-btn"
                onClick={() => { onDelete(route.id); onClose() }}
                className="px-3 py-1.5 text-xs font-bold tracking-widest bg-red-600 text-white rounded-sm hover:bg-red-700 uppercase transition-colors"
              >
                Yes, Delete
              </button>
              <button
                id="er-cancel-delete-btn"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-bold tracking-widest text-slate-600 border border-slate-200 rounded-sm hover:border-slate-300 uppercase transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Route Name */}
        <FieldWrapper label="Route Name" htmlFor="er-name" error={errors.name} required>
          <TextInput id="er-name" placeholder="Route name" value={form.name} onChange={set('name')} error={errors.name} icon={MapPin} />
        </FieldWrapper>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Distance" htmlFor="er-distance" error={errors.distance} hint="km" required>
            <TextInput id="er-distance" placeholder="0.0" value={form.distance} onChange={set('distance')} error={errors.distance} icon={Ruler} type="number" min="0" step="0.1" />
          </FieldWrapper>
          <FieldWrapper label="Elevation Gain" htmlFor="er-elevation" error={errors.elevation} hint="m">
            <TextInput id="er-elevation" placeholder="0" value={form.elevation} onChange={set('elevation')} error={errors.elevation} icon={TrendingUp} type="number" min="0" />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Terrain Type" htmlFor="er-terrain" error={errors.terrain} required>
          <SelectInput id="er-terrain" value={form.terrain} onChange={set('terrain')} options={terrainOptions} error={errors.terrain} icon={Layers} />
        </FieldWrapper>

        {/* Change log notice */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-sm p-3">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Changes will be reflected across all runs that reference this route.
          </p>
        </div>

        <SubmitBanner state={banner} />
      </ModalBody>

      <ModalFooter>
        <GhostBtn id="er-cancel-btn" onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn id="er-save-btn" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          Save Changes
        </PrimaryBtn>
      </ModalFooter>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADD GEAR MODAL
// ─────────────────────────────────────────────────────────────────────────────

type GearAddFields = 'brand' | 'model' | 'dateAcquired' | 'targetLifespan' | 'photo'

interface AddGearForm {
  brand: string
  model: string
  dateAcquired: string
  targetLifespan: string
  photo: File | null
}

function validateGearAdd(form: AddGearForm): FieldErrors<GearAddFields> {
  const errors: FieldErrors<GearAddFields> = {}
  if (!form.brand.trim()) errors.brand = 'Brand is required.'
  if (!form.model.trim()) errors.model = 'Model name is required.'
  else if (form.model.trim().length < 2) errors.model = 'Model must be at least 2 characters.'
  if (!form.dateAcquired) errors.dateAcquired = 'Date acquired is required.'
  const ls = parseInt(form.targetLifespan, 10)
  if (!form.targetLifespan) errors.targetLifespan = 'Target lifespan is required.'
  else if (isNaN(ls) || ls < 100) errors.targetLifespan = 'Lifespan must be at least 100 km.'
  else if (ls > 2000) errors.targetLifespan = 'Lifespan cannot exceed 2,000 km.'
  return errors
}

const brandOptions = [
  { value: 'nike', label: 'Nike' },
  { value: 'asics', label: 'ASICS' },
  { value: 'adidas', label: 'Adidas' },
  { value: 'brooks', label: 'Brooks' },
  { value: 'saucony', label: 'Saucony' },
  { value: 'hoka', label: 'HOKA' },
  { value: 'salomon', label: 'Salomon' },
  { value: 'on', label: 'On Running' },
  { value: 'new_balance', label: 'New Balance' },
  { value: 'other', label: 'Other' },
]

/** Photo drop-zone component */
function PhotoDropZone({
  file,
  onChange,
  error,
}: {
  file: File | null
  onChange: (f: File | null) => void
  error?: string
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = file ? URL.createObjectURL(file) : null

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) onChange(dropped)
  }, [onChange])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    if (picked) onChange(picked)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1">
        Shoe Photo
        <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span>
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'relative flex flex-col items-center justify-center gap-2 h-36 rounded-sm border-2 border-dashed cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-orange-400 bg-orange-50 scale-[1.01]'
            : previewUrl
            ? 'border-green-400 bg-green-50'
            : error
            ? 'border-red-400 bg-red-50/20'
            : 'border-slate-200 bg-[#F5F5F3] hover:border-orange-300 hover:bg-orange-50/40',
        ].join(' ')}
        role="button"
        aria-label="Upload shoe photo"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Shoe preview" className="h-full w-full object-contain p-2" />
            <div className="absolute bottom-2 right-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
                className="p-1 bg-white border border-slate-200 rounded-sm text-slate-500 hover:text-red-500 shadow-sm"
                aria-label="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`p-3 rounded-full ${isDragging ? 'bg-orange-100' : 'bg-slate-100'}`}>
              {isDragging
                ? <ImagePlus className="w-6 h-6 text-orange-500" aria-hidden="true" />
                : <Upload className="w-6 h-6 text-slate-400" aria-hidden="true" />
              }
            </div>
            <div className="text-center px-4">
              <p className="text-xs font-bold text-slate-600">
                {isDragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP — max 5 MB</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          id="ag-photo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleChange}
        />
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-[11px] text-red-600 font-semibold">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          {error}
        </p>
      )}
      {file && (
        <p className="flex items-center gap-1 text-[11px] text-green-700 font-semibold">
          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
          {file.name} ready to upload
        </p>
      )}
    </div>
  )
}

export function AddGearModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState<AddGearForm>({
    brand: '', model: '', dateAcquired: '', targetLifespan: '', photo: null,
  })
  const [errors, setErrors] = useState<FieldErrors<GearAddFields>>({})
  const [submitted, setSubmitted] = useState(false)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)

  function setField<K extends keyof AddGearForm>(field: K, value: AddGearForm[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    if (submitted) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit() {
    setSubmitted(true)
    const payload = {
      brandModel: `${form.brand} ${form.model}`.trim(),
      dateAcquired: form.dateAcquired,
      startingMileage: 0,
      targetLifespan: parseInt(form.targetLifespan || '0', 10),
      status: 'Active'
    }
    const result = gearSchema.safeParse(payload)
    if (!result.success) {
      const errs: any = {}
      result.error.issues.forEach(iss => { errs[iss.path[0]] = iss.message })
      // Map brandModel errors back to brand/model fields for display
      if (errs.brandModel) { errs.brand = errs.brandModel; delete errs.brandModel }
      setErrors(errs)
      setBanner('error')
      return
    }
    setErrors({})
    try {
      // Convert photo to Base64 if present
      let imageUrl: string | undefined
      if (form.photo) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(form.photo!)
        })
      }
      const res = await fetch('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result.data, ...(imageUrl ? { imageUrl } : {}) }),
      })
      if (!res.ok) throw new Error()
      setBanner('success')
      if (onSuccess) onSuccess()
      setTimeout(onClose, 800)
    } catch {
      setBanner('error')
    }
  }

  return (
    <ModalShell id="add-gear-modal" onClose={onClose} width="max-w-xl">
      <ModalHeader label="Equipment Manager" title="ADD NEW GEAR" onClose={onClose} />

      <ModalBody>
        {/* Brand */}
        <FieldWrapper label="Brand" htmlFor="ag-brand" error={errors.brand} required>
          <SelectInput
            id="ag-brand"
            value={form.brand}
            onChange={(v) => setField('brand', v)}
            options={brandOptions}
            error={errors.brand}
            icon={Tag}
          />
        </FieldWrapper>

        {/* Model */}
        <FieldWrapper label="Model Name" htmlFor="ag-model" error={errors.model} required>
          <TextInput
            id="ag-model"
            placeholder="e.g. Vaporfly 3"
            value={form.model}
            onChange={(v) => setField('model', v)}
            error={errors.model}
          />
        </FieldWrapper>

        {/* Date + Lifespan row */}
        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Date Acquired" htmlFor="ag-date" error={errors.dateAcquired} required>
            <TextInput
              id="ag-date"
              placeholder=""
              value={form.dateAcquired}
              onChange={(v) => setField('dateAcquired', v)}
              error={errors.dateAcquired}
              icon={Calendar}
              type="date"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Target Lifespan"
            htmlFor="ag-lifespan"
            error={errors.targetLifespan}
            hint="Manufacturer's recommended maximum distance"
            required
          >
            <TextInput
              id="ag-lifespan"
              placeholder="800"
              value={form.targetLifespan}
              onChange={(v) => setField('targetLifespan', v)}
              error={errors.targetLifespan}
              icon={Gauge}
              type="number"
              min="100"
              max="2000"
              step="50"
            />
            {!errors.targetLifespan && (
              <span className="text-[10px] font-mono text-slate-400 -mt-0.5">km recommended</span>
            )}
          </FieldWrapper>
        </div>

        {/* Photo drop-zone */}
        <PhotoDropZone
          file={form.photo}
          onChange={(f) => setField('photo', f)}
          error={errors.photo}
        />

        {/* Zod-style validation detail on brand error */}
        {submitted && errors.brand && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-sm p-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-red-700">Zod validation failed</p>
              <p className="text-[11px] text-red-500 font-mono mt-0.5">
                ZodError: brand — &quot;{errors.brand}&quot;
              </p>
            </div>
          </div>
        )}

        <SubmitBanner state={banner} />
      </ModalBody>

      <ModalFooter>
        <GhostBtn id="ag-cancel-btn" onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn id="ag-save-btn" onClick={handleSubmit}>
          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          Add to Roster
        </PrimaryBtn>
      </ModalFooter>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EDIT GEAR MODAL
// ─────────────────────────────────────────────────────────────────────────────

type GearStatus = 'active' | 'default' | 'retiring' | 'retired'

type GearEditFields = 'brand' | 'model' | 'dateAcquired' | 'targetLifespan' | 'status' | 'mileage'

interface EditGearForm {
  brand: string
  model: string
  dateAcquired: string
  targetLifespan: string
  status: GearStatus | ''
  mileage: number  // 0–targetLifespan
}

export interface GearRecord {
  id: string
  brand: string
  model: string
  dateAcquired: string
  targetLifespan: number
  mileage: number
  status: GearStatus
}

function validateGearEdit(form: EditGearForm): FieldErrors<GearEditFields> {
  const errors: FieldErrors<GearEditFields> = {}
  if (!form.brand) errors.brand = 'Brand is required.'
  if (!form.model.trim()) errors.model = 'Model name is required.'
  if (!form.dateAcquired) errors.dateAcquired = 'Date acquired is required.'
  const ls = parseInt(form.targetLifespan, 10)
  if (!form.targetLifespan) errors.targetLifespan = 'Target lifespan is required.'
  else if (isNaN(ls) || ls < 100) errors.targetLifespan = 'Lifespan must be at least 100 km.'
  if (!form.status) errors.status = 'Status is required.'
  return errors
}

const statusOptions: { value: GearStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'default', label: 'Default (Primary)' },
  { value: 'retiring', label: 'Retiring Soon' },
  { value: 'retired', label: 'Retired' },
]

const statusColors: Record<GearStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  default: 'bg-orange-50 text-orange-700 border-orange-200',
  retiring: 'bg-red-50 text-red-700 border-red-200',
  retired: 'bg-slate-100 text-slate-500 border-slate-200',
}

/** Interactive mileage slider */
function MileageSlider({
  value,
  max,
  onChange,
}: {
  value: number
  max: number
  onChange: (v: number) => void
}) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))

  // Color transitions
  const fillColor =
    pct >= 85 ? '#ef4444' :
    pct >= 65 ? '#f59e0b' :
    '#ea580c'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="eg-mileage-slider"
          className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1"
        >
          <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
          Current Mileage
        </label>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-lg font-bold text-slate-900">{value}</span>
          <span className="text-xs text-slate-400 font-mono">/ {max} km</span>
          <span
            className="ml-2 text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm border"
            style={{ color: fillColor, backgroundColor: `${fillColor}15`, borderColor: `${fillColor}40` }}
          >
            {pct}% WORN
          </span>
        </div>
      </div>

      {/* Custom-styled range input */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2.5 bg-slate-100 rounded-sm overflow-hidden">
          {/* Fill */}
          <div
            className="h-full rounded-sm transition-all duration-150"
            style={{ width: `${pct}%`, backgroundColor: fillColor }}
          >
            {/* Tread grooves */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/25"
                style={{ left: `${(i + 1) * 8.33}%` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Native range for interaction */}
        <input
          id="eg-mileage-slider"
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="relative w-full h-2.5 opacity-0 cursor-pointer z-10"
          aria-label={`Current mileage: ${value} km of ${max} km`}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
        />

        {/* Thumb overlay */}
        <div
          className="absolute h-5 w-5 rounded-full bg-white border-2 shadow-md pointer-events-none transition-all duration-150 -translate-x-1/2"
          style={{
            left: `${pct}%`,
            borderColor: fillColor,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Markers */}
      <div className="flex justify-between text-[9px] font-mono text-slate-400 -mt-1">
        <span>0 km</span>
        <span className="text-amber-500 font-bold">{Math.round(max * 0.75)} km (caution)</span>
        <span className="text-red-500 font-bold">{max} km (max)</span>
      </div>

      {/* Wear warning */}
      {pct >= 75 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-[11px] text-amber-700 font-bold">
            {pct >= 90
              ? 'Critically worn — retire immediately to prevent injury.'
              : 'Approaching end of lifespan — plan replacement soon.'}
          </p>
        </div>
      )}
    </div>
  )
}

export function EditGearModal({
  gear,
  onClose,
  onDelete,
  onSuccess,
}: {
  gear: GearRecord
  onClose: () => void
  onDelete?: (id: string) => void
  onSuccess?: () => void
}) {
  const [form, setForm] = useState<EditGearForm>({
    brand: gear.brand,
    model: gear.model,
    dateAcquired: gear.dateAcquired,
    targetLifespan: String(gear.targetLifespan),
    status: gear.status,
    mileage: gear.mileage,
  })
  const [errors, setErrors] = useState<FieldErrors<GearEditFields>>({})
  const [submitted, setSubmitted] = useState(false)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)

  const maxMileage = parseInt(form.targetLifespan || '1000', 10) || 1000

  function setField<K extends keyof EditGearForm>(field: K, value: EditGearForm[K]) {
    setForm((f) => ({ ...f, [field]: value }))
    if (submitted) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSave() {
    setSubmitted(true)
    const payload = {
      brandModel: `${form.brand} ${form.model}`.trim(),
      dateAcquired: form.dateAcquired,
      startingMileage: parseInt(String(form.mileage) || '0', 10),
      targetLifespan: parseInt(String(form.targetLifespan) || '0', 10),
      status: form.status === 'default' ? 'Default' :
              form.status === 'retiring' ? 'Retiring Soon' :
              form.status === 'retired' ? 'Retired' : 'Active'
    }
    const result = gearSchema.safeParse(payload)
    if (!result.success) {
      const errs: any = {}
      result.error.issues.forEach(iss => { errs[iss.path[0]] = iss.message })
      setErrors(errs)
      setBanner('error')
      return
    }
    setErrors({})
    try {
      const res = await fetch(`/api/gear/${gear.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      if (!res.ok) throw new Error()
      setBanner('success')
      if (onSuccess) onSuccess()
      setTimeout(onClose, 800)
    } catch {
      setBanner('error')
    }
  }

  return (
    <ModalShell id="edit-gear-modal" onClose={onClose} width="max-w-xl">
      <ModalHeader
        label="Equipment Manager"
        title="EDIT GEAR"
        onClose={onClose}
        rightSlot={
          <div className="flex gap-2 items-center">
            {onDelete && (
              <DangerBtn id="eg-delete-btn" onClick={() => { onDelete(gear.id); onClose(); }}>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </DangerBtn>
            )}
            {form.status && (
              <span
                className={`text-[10px] font-bold tracking-widest border px-2 py-1 rounded-sm ${statusColors[form.status as GearStatus]}`}
              >
                {statusOptions.find((o) => o.value === form.status)?.label?.toUpperCase()}
              </span>
            )}
          </div>
        }
      />

      <ModalBody>
        {/* Brand */}
        <FieldWrapper label="Brand" htmlFor="eg-brand" error={errors.brand} required>
          <SelectInput
            id="eg-brand"
            value={form.brand}
            onChange={(v) => setField('brand', v)}
            options={brandOptions}
            error={errors.brand}
            icon={Tag}
          />
        </FieldWrapper>

        {/* Model */}
        <FieldWrapper label="Model Name" htmlFor="eg-model" error={errors.model} required>
          <TextInput
            id="eg-model"
            placeholder="Model name"
            value={form.model}
            onChange={(v) => setField('model', v)}
            error={errors.model}
          />
        </FieldWrapper>

        {/* Date + Lifespan */}
        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Date Acquired" htmlFor="eg-date" error={errors.dateAcquired} required>
            <TextInput
              id="eg-date"
              placeholder=""
              value={form.dateAcquired}
              onChange={(v) => setField('dateAcquired', v)}
              error={errors.dateAcquired}
              icon={Calendar}
              type="date"
            />
          </FieldWrapper>
          <FieldWrapper label="Target Lifespan" htmlFor="eg-lifespan" error={errors.targetLifespan} hint="km" required>
            <TextInput
              id="eg-lifespan"
              placeholder="800"
              value={form.targetLifespan}
              onChange={(v) => setField('targetLifespan', v)}
              error={errors.targetLifespan}
              icon={Gauge}
              type="number"
              min="100"
              max="2000"
              step="50"
            />
          </FieldWrapper>
        </div>

        {/* Status dropdown */}
        <FieldWrapper label="Status" htmlFor="eg-status" error={errors.status} required>
          <SelectInput
            id="eg-status"
            value={form.status}
            onChange={(v) => setField('status', v as GearStatus)}
            options={statusOptions}
            error={errors.status}
          />
        </FieldWrapper>

        {/* Interactive mileage slider */}
        <div className="bg-[#F5F5F3] border border-slate-200 rounded-sm p-4">
          <MileageSlider
            value={form.mileage}
            max={maxMileage}
            onChange={(v) => setField('mileage', v)}
          />
        </div>

        <SubmitBanner state={banner} />
      </ModalBody>

      <ModalFooter>
        <GhostBtn id="eg-cancel-btn" onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn id="eg-save-btn" onClick={handleSave}>
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          Save Changes
        </PrimaryBtn>
      </ModalFooter>
    </ModalShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo harness — delete this before wiring to your real pages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ModalDemo is a self-contained page component you can drop into any route
 * (e.g. app/modals-demo/page.tsx) for visual QA. Remove before production.
 *
 * Usage:
 *   import { ModalDemo } from '@/app/components/Modals'
 *   export default ModalDemo
 */
export function ModalDemo() {
  const [open, setOpen] = useState<
    'addRoute' | 'editRoute' | 'addGear' | 'editGear' | null
  >(null)

  const sampleRoute: RouteRecord = {
    id: 'kathu-trail',
    name: 'Kathu Trail Loop',
    distance: '14.2',
    elevation: '312',
    terrain: 'trail',
  }

  const sampleGear: GearRecord = {
    id: 'vaporfly-3',
    brand: 'nike',
    model: 'Vaporfly 3',
    dateAcquired: '2025-09-01',
    targetLifespan: 1000,
    mileage: 563,
    status: 'retiring',
  }

  const btnClass =
    'px-4 py-2.5 text-xs font-bold tracking-widest rounded-sm border uppercase transition-all ' +
    'bg-white border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600 shadow-sm'

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center mb-4">
        <p className="text-[10px] font-bold tracking-[0.25em] text-orange-600 uppercase mb-1">
          Component Preview
        </p>
        <h1 className="font-extrabold text-3xl tracking-tight text-slate-900">
          MODAL INTERFACES
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Click a button to open the corresponding modal.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
        <button id="demo-open-add-route" className={btnClass} onClick={() => setOpen('addRoute')}>
          + Add Route
        </button>
        <button id="demo-open-edit-route" className={btnClass} onClick={() => setOpen('editRoute')}>
          ✏ Edit Route
        </button>
        <button id="demo-open-add-gear" className={btnClass} onClick={() => setOpen('addGear')}>
          + Add Gear
        </button>
        <button id="demo-open-edit-gear" className={btnClass} onClick={() => setOpen('editGear')}>
          ✏ Edit Gear
        </button>
      </div>

      {open === 'addRoute'  && <AddRouteModal  onClose={() => setOpen(null)} />}
      {open === 'editRoute' && (
        <EditRouteModal
          route={sampleRoute}
          onClose={() => setOpen(null)}
          onDelete={(id) => console.log('delete route', id)}
        />
      )}
      {open === 'addGear'  && <AddGearModal   onClose={() => setOpen(null)} />}
      {open === 'editGear' && (
        <EditGearModal
          gear={sampleGear}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MANUAL ACTIVITY MODAL
// ─────────────────────────────────────────────────────────────────────────────

export function ManualActivityModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess?: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    name: '',
    distanceKm: '',
    durationMin: '',
    durationSec: '',
    elevationM: '',
    date: today,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [banner, setBanner] = useState<'success' | 'error' | null>(null)
  const [syncing, setSyncing] = useState(false)

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    if (submitted) setErrors((e) => ({ ...e, [field]: undefined as unknown as string }))
  }

  async function handleSubmit() {
    setSubmitted(true)
    const durationSec =
      (parseInt(form.durationMin || '0', 10) * 60) +
      parseInt(form.durationSec || '0', 10)

    const payload = {
      name: form.name,
      distanceKm: parseFloat(form.distanceKm),
      durationSec,
      elevationM: parseFloat(form.elevationM || '0'),
      date: form.date,
    }

    const result = manualActivitySchema.safeParse(payload)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((iss) => { errs[String(iss.path[0])] = iss.message })
      setErrors(errs)
      setBanner('error')
      return
    }
    setErrors({})
    setSyncing(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Server error')
      }
      setBanner('success')
      if (onSuccess) onSuccess()
      setTimeout(onClose, 900)
    } catch (err: unknown) {
      console.error(err)
      setBanner('error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <ModalShell id="manual-activity-modal" onClose={onClose} width="max-w-lg">
      <ModalHeader label="Activity Log" title="LOG MANUAL ACTIVITY" onClose={onClose} />

      <ModalBody>
        {/* Activity Name */}
        <FieldWrapper htmlFor="ma-name" label="Activity Name" required error={errors.name}>
          <TextInput
            id="ma-name"
            placeholder="Morning trail run"
            value={form.name}
            onChange={(v) => setField('name', v)}
            error={errors.name}
            icon={Activity}
          />
        </FieldWrapper>

        {/* Distance */}
        <FieldWrapper htmlFor="ma-distance" label="Distance (km)" required error={errors.distanceKm}
          hint="Must be a positive number">
          <TextInput
            id="ma-distance"
            placeholder="10.5"
            value={form.distanceKm}
            onChange={(v) => setField('distanceKm', v)}
            error={errors.distanceKm}
            icon={Navigation}
            type="number"
            min="0.1"
            step="0.1"
          />
        </FieldWrapper>

        {/* Duration row */}
        <FieldWrapper htmlFor="ma-duration-min" label="Duration (optional)" error={errors.durationSec}>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              id="ma-duration-min"
              placeholder="45"
              value={form.durationMin}
              onChange={(v) => setField('durationMin', v)}
              icon={Clock}
              type="number"
              min="0"
            />
            <TextInput
              id="ma-duration-sec"
              placeholder="30"
              value={form.durationSec}
              onChange={(v) => setField('durationSec', v)}
              icon={Clock}
              type="number"
              min="0"
              max="59"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono -mt-1">Minutes / Seconds</p>
        </FieldWrapper>

        {/* Elevation */}
        <FieldWrapper htmlFor="ma-elevation" label="Elevation Gain (m, optional)" error={errors.elevationM}>
          <TextInput
            id="ma-elevation"
            placeholder="120"
            value={form.elevationM}
            onChange={(v) => setField('elevationM', v)}
            icon={TrendingUp}
            type="number"
            min="0"
          />
        </FieldWrapper>

        {/* Date */}
        <FieldWrapper htmlFor="ma-date" label="Date" required error={errors.date}>
          <TextInput
            id="ma-date"
            placeholder={today}
            value={form.date}
            onChange={(v) => setField('date', v)}
            icon={Calendar}
            type="date"
          />
        </FieldWrapper>

        {/* Impact notice */}
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-sm p-3">
          <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] text-orange-700 font-bold leading-snug">
            This activity will be added to your total distance log and will increase your default gear&apos;s mileage counter.
          </p>
        </div>

        <SubmitBanner state={banner} />
      </ModalBody>

      <ModalFooter>
        <GhostBtn id="ma-cancel-btn" onClick={onClose}>Cancel</GhostBtn>
        <PrimaryBtn id="ma-save-btn" onClick={handleSubmit} disabled={syncing}>
          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {syncing ? 'Saving…' : 'Log Activity'}
        </PrimaryBtn>
      </ModalFooter>
    </ModalShell>
  )
}
