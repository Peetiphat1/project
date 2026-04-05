import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Routes | The Endurance Log',
  description: 'Browse, plan, and manage all your saved running routes.',
}

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
