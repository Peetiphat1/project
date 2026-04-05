export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/gear/[id]/default — sets this gear as default, clears all others
export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Clear all existing defaults first
    await prisma.gear.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
    // Set the target gear as default
    const updated = await prisma.gear.update({
      where: { id },
      data: { isDefault: true },
    })
    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('PUT /api/gear/[id]/default error:', error)
    return NextResponse.json({ error: 'Failed to set default gear' }, { status: 500 })
  }
}
