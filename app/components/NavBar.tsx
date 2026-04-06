'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/lib/i18n'
import {
  Bell,
  Settings,
  Search,
  Menu,
  X,
  Timer,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // next-themes needs the component to be mounted before reading the theme
  useEffect(() => setMounted(true), [])

  const navLinks = [
    { key: 'dashboard' as const, href: '/' },
    { key: 'myRoutes' as const, href: '/routes' },
    { key: 'gear' as const, href: '/gear' },
  ]

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
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
          <span className="text-slate-900 dark:text-slate-100 font-extrabold tracking-tight text-sm sm:text-base whitespace-nowrap leading-none">
            THE ENDURANCE LOG
          </span>
        </Link>

        {/* ── Center nav links (desktop) ────────────────────────── */}
        <ul
          className="hidden md:flex items-center gap-8"
          role="list"
          aria-label="Primary links"
        >
          {navLinks.map(({ key, href }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  id={`nav-link-${key}`}
                  href={href}
                  className={[
                    'text-xs font-bold tracking-widest transition-colors duration-150 pb-0.5',
                    isActive
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-b-2 border-transparent',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {t(key).toUpperCase()}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* ── Right controls (desktop) ──────────────────────────── */}
        <div className="hidden md:flex items-center gap-2">
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
              className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 w-40 lg:w-48 transition"
            />
          </div>

          {/* ── Language Toggle (EN / TH) ───────────────────────── */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-sm p-0.5 gap-0.5">
            {(['en', 'th'] as const).map((l) => (
              <button
                key={l}
                id={`lang-toggle-${l}`}
                onClick={() => setLang(l)}
                aria-label={`Switch to ${l === 'en' ? 'English' : 'Thai'}`}
                className={[
                  'text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm transition-colors',
                  lang === l
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                ].join(' ')}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Theme Toggle (Light / Dark) ─────────────────────── */}
          <button
            id="theme-toggle"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mounted ? (
              isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Monitor className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {/* Notifications */}
          <button
            id="nav-notifications"
            aria-label="Notifications"
            className="relative p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" aria-hidden="true" />
          </button>

          {/* Settings */}
          <button
            id="nav-settings"
            aria-label="Settings"
            className="p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Avatar */}
          <button
            id="nav-user-avatar"
            aria-label="User profile"
            className="w-8 h-8 rounded-full bg-slate-900 dark:bg-orange-600 flex items-center justify-center text-white text-xs font-bold tracking-wide hover:ring-2 hover:ring-orange-500 transition-all"
          >
            AT
          </button>
        </div>

        {/* ── Mobile: theme + lang toggles + hamburger ──────────── */}
        <div className="md:hidden flex items-center gap-2">
          {/* Language pill */}
          <button
            id="mobile-lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="text-[10px] font-bold tracking-widest px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-sm"
          >
            {lang.toUpperCase()}
          </button>
          {/* Theme toggle */}
          <button
            id="mobile-theme-toggle"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="p-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mounted ? (
              isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </button>
          {/* Hamburger */}
          <button
            id="nav-mobile-menu-toggle"
            className="p-2 rounded-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
        </div>
      </nav>

      {/* ── Mobile dropdown ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          id="nav-mobile-menu"
          className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pb-4 shadow-lg transition-colors"
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
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <ul className="mt-3 space-y-1" role="list">
            {navLinks.map(({ key, href }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'block px-3 py-2.5 text-xs font-bold tracking-widest rounded-sm transition-colors',
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-950 text-orange-600'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {t(key).toUpperCase()}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <button
              aria-label="Settings"
              className="p-2 rounded-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              aria-label="User profile"
              className="w-8 h-8 rounded-full bg-slate-900 dark:bg-orange-600 flex items-center justify-center text-white text-xs font-bold"
            >
              AT
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
