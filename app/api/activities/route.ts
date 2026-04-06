export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { manualActivitySchema } from '@/lib/validations'

// ── GET /api/activities ────────────────────────────────────────────────────
/** Returns all activities ordered by date desc, plus the aggregate total km. */
export async function GET() {
  try {
    const [activities, aggregate] = await Promise.all([
      prisma.activity.findMany({ orderBy: { date: 'desc' } }),
      prisma.activity.aggregate({ _sum: { distanceKm: true } }),
    ])

    return NextResponse.json({
      activities,
      totalKm: aggregate._sum.distanceKm ?? 0,
    })
  } catch (err) {
    console.error('[GET /api/activities]', err)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// ── POST /api/activities ───────────────────────────────────────────────────
/**
 * Creates a manual activity entry, then increments the default gear's
 * startingMileage by the same distanceKm — mirrors the Strava sync logic.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = manualActivitySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, distanceKm, durationSec, elevationM, date } = result.data

    // Create the activity row
    const activity = await prisma.activity.create({
      data: {
        name,
        distanceKm,
        durationSec,
        elevationM,
        date: new Date(date),
        isManual: true,
      },
    })

    // Increment default gear mileage
    const defaultGear = await prisma.gear.findFirst({ where: { isDefault: true } })
    if (defaultGear) {
      await prisma.gear.update({
        where: { id: defaultGear.id },
        data: { startingMileage: { increment: distanceKm } },
      })
    }

    return NextResponse.json(activity, { status: 201 })
  } catch (err) {
    console.error('[POST /api/activities]', err)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
