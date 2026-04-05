import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Gear | The Endurance Log',
  description: 'Track, manage, and retire your running shoe collection.',
}

export default function GearLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
