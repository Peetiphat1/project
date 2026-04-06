export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ── GET /api/milestone ─────────────────────────────────────────────────────
/** Returns the active milestone (creates a default one if none exists) + computed currentKm from all activities. */
export async function GET() {
  try {
    let milestone = await prisma.milestone.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!milestone) {
      milestone = await prisma.milestone.create({
        data: { title: 'Lifetime Total', targetKm: 500 },
      })
    }

    const aggregate = await prisma.activity.aggregate({ _sum: { distanceKm: true } })
    const currentKm = Math.round((aggregate._sum.distanceKm ?? 0) * 10) / 10

    return NextResponse.json({ ...milestone, currentKm })
  } catch (err) {
    console.error('[GET /api/milestone]', err)
    return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 })
  }
}

// ── PUT /api/milestone ─────────────────────────────────────────────────────
/** Updates the active milestone's title and/or targetKm. */
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { title, targetKm } = body as { title?: string; targetKm?: number }

    let milestone = await prisma.milestone.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!milestone) {
      milestone = await prisma.milestone.create({
        data: {
          title: title ?? 'Lifetime Total',
          targetKm: targetKm ?? 500,
        },
      })
    } else {
      milestone = await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          ...(title !== undefined && { title }),
          ...(targetKm !== undefined && { targetKm }),
        },
      })
    }

    const aggregate = await prisma.activity.aggregate({ _sum: { distanceKm: true } })
    const currentKm = Math.round((aggregate._sum.distanceKm ?? 0) * 10) / 10

    return NextResponse.json({ ...milestone, currentKm })
  } catch (err) {
    console.error('[PUT /api/milestone]', err)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}
