export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { manualActivitySchema } from '@/lib/validations'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const result = manualActivitySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // We only update if it's a manual activity. Strava activities shouldn't be edited here.
    const updated = await prisma.activity.updateMany({
      where: { id, isManual: true },
      data: {
        name: result.data.name,
        distanceKm: result.data.distanceKm,
        durationSec: result.data.durationSec,
        elevationM: result.data.elevationM,
        date: new Date(result.data.date),
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Manual activity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`PUT /api/activities/[id] error:`, error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = await prisma.activity.deleteMany({
      where: { id, isManual: true },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Manual activity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`DELETE /api/activities/[id] error:`, error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
