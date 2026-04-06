import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import NavBar from './components/NavBar'
import { ThemeProvider } from './components/ThemeProvider'
import { LanguageProvider } from '@/lib/i18n'

// ── Fonts ──────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'The Endurance Log — Athlete Tracking Dashboard',
    template: '%s | The Endurance Log',
  },
  description:
    'Track your runs, monitor gear health, and analyse your endurance performance with The Endurance Log — the premium athlete training companion.',
  keywords: ['running', 'endurance', 'athlete', 'training log', 'strava', 'performance'],
  openGraph: {
    title: 'The Endurance Log',
    description: 'Your premium athlete training companion.',
    type: 'website',
  },
}

// ── Root Layout ────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans">
        <ThemeProvider>
          <LanguageProvider>
            {/* ── Navigation ─────────────────────────────────────── */}
            <NavBar />

            {/* ── Page content ──────────────────────────────────── */}
            <main id="main-content" className="flex-1">
              {children}
            </main>

            {/* ── Footer ────────────────────────────────────────── */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto transition-colors">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-slate-100 font-extrabold tracking-tight text-sm">
                    THE ENDURANCE LOG
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 text-sm">|</span>
                  <span className="text-slate-400 text-xs font-mono">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 tracking-wide">
                  © {new Date().getFullYear()} The Endurance Log. Built for athletes.
                </p>
                <nav aria-label="Footer links" className="flex items-center gap-4">
                  <a href="#" className="text-xs text-slate-500 hover:text-orange-600 transition-colors tracking-wide">Privacy</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-orange-600 transition-colors tracking-wide">Terms</a>
                  <a href="#" className="text-xs text-slate-500 hover:text-orange-600 transition-colors tracking-wide">Support</a>
                </nav>
              </div>
            </footer>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
