'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Bell,
  Settings,
  Search,
  Menu,
  X,
  Timer,
} from 'lucide-react'

const navLinks = [
  { label: 'DASHBOARD', href: '/' },
  { label: 'MY ROUTES', href: '/routes' },
  { label: 'GEAR', href: '/gear' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link
          href="/"
          id="nav-logo"
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="bg-orange-600 rounded-sm p-1">
            <Timer className="w-4 h-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-slate-900 font-extrabold tracking-tight text-sm sm:text-base whitespace-nowrap leading-none">
            THE ENDURANCE LOG
          </span>
        </Link>

        {/* ── Center nav links (desktop) ────────────────────────── */}
        <ul
          className="hidden md:flex items-center gap-8"
          role="list"
          aria-label="Primary links"
        >
          {navLinks.map(({ label, href }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  id={`nav-link-${label.toLowerCase().replace(/\s+/g, '-')}`}
                  href={href}
                  className={[
                    'text-xs font-bold tracking-widest transition-colors duration-150 pb-0.5',
                    isActive
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* ── Right controls (desktop) ──────────────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="nav-search"
              type="search"
              placeholder="Search workouts…"
              aria-label="Search workouts"
              className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 w-48 transition"
            />
          </div>

          {/* Notifications */}
          <button
            id="nav-notifications"
            aria-label="Notifications"
            className="relative p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" aria-hidden="true" />
          </button>

          {/* Settings */}
          <button
            id="nav-settings"
            aria-label="Settings"
            className="p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Avatar */}
          <button
            id="nav-user-avatar"
            aria-label="User profile"
            className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold tracking-wide hover:ring-2 hover:ring-orange-500 transition-all"
          >
            AT
          </button>
        </div>

        {/* ── Hamburger (mobile) ────────────────────────────────── */}
        <button
          id="nav-mobile-menu-toggle"
          className="md:hidden p-2 rounded-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* ── Mobile dropdown ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          id="nav-mobile-menu"
          className="md:hidden bg-white border-t border-slate-200 px-4 pb-4 shadow-lg"
        >
          {/* Mobile search */}
          <div className="relative mt-3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search workouts…"
              aria-label="Search workouts"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <ul className="mt-3 space-y-1" role="list">
            {navLinks.map(({ label, href }) => {
              const isActive =
                href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'block px-3 py-2.5 text-xs font-bold tracking-widest rounded-sm transition-colors',
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <button
              aria-label="Settings"
              className="p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              aria-label="User profile"
              className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold"
            >
              AT
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
