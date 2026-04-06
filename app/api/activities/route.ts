export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { manualActivitySchema } from '@/lib/validations'

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Returns the Monday 00:00:00 of the current week in GMT+7 (Phuket).
 * We shift UTC time by +7 hours, find the Monday, then convert back.
 */
function getWeekStartUTC(): Date {
  const TZ_OFFSET_MS = 7 * 60 * 60 * 1000         // GMT+7
  const nowLocal = Date.now() + TZ_OFFSET_MS        // local epoch ms
  const dayOfWeek = new Date(nowLocal).getUTCDay()  // 0=Sun
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const mondayLocal = nowLocal - daysSinceMonday * 86400_000
  // Truncate to midnight local → back to UTC
  const mondayMidnightLocal = Math.floor(mondayLocal / 86400_000) * 86400_000
  return new Date(mondayMidnightLocal - TZ_OFFSET_MS)
}

// ── GET /api/activities ────────────────────────────────────────────────────
/**
 * Returns all activities ordered by date desc, plus the aggregate total km,
 * and computed weekly stats (weeklyKm, avgPace, runCount) from the DB.
 */
export async function GET() {
  try {
    const weekStart = getWeekStartUTC()

    const [activities, aggregate, weeklyActivities] = await Promise.all([
      prisma.activity.findMany({ orderBy: { date: 'desc' } }),
      prisma.activity.aggregate({ _sum: { distanceKm: true } }),
      prisma.activity.findMany({
        where: { date: { gte: weekStart } },
      }),
    ])

    // ── Compute combined weekly stats ──────────────────────────────────
    const weeklyKmNum = weeklyActivities.reduce((s, a) => s + a.distanceKm, 0)
    const weeklyDurSec = weeklyActivities.reduce((s, a) => s + a.durationSec, 0)

    let avgPace = '—'
    if (weeklyKmNum > 0 && weeklyDurSec > 0) {
      const secPerKm = weeklyDurSec / weeklyKmNum
      const min = Math.floor(secPerKm / 60)
      const sec = Math.round(secPerKm % 60)
      avgPace = `${min}:${sec.toString().padStart(2, '0')}`
    }

    const weeklyStats = {
      weeklyKm: weeklyKmNum.toFixed(1),
      avgPace,
      runCount: weeklyActivities.length,
    }

    return NextResponse.json({
      activities,
      totalKm: aggregate._sum.distanceKm ?? 0,
      weeklyStats,
    })
  } catch (err) {
    console.error('[GET /api/activities]', err)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

// ── POST /api/activities ───────────────────────────────────────────────────
/**
 * Creates a manual activity entry, increments the default gear's mileage,
 * and auto-retires gear if its lifespan is now exceeded.
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

    // Increment default gear mileage + auto-retire if needed
    const defaultGear = await prisma.gear.findFirst({ where: { isDefault: true } })
    if (defaultGear) {
      const updatedMileage = defaultGear.startingMileage + distanceKm
      const shouldRetire = updatedMileage >= defaultGear.targetLifespan

      await prisma.gear.update({
        where: { id: defaultGear.id },
        data: {
          startingMileage: updatedMileage,
          ...(shouldRetire ? { status: 'Retired' } : {}),
        },
      })
    }

    return NextResponse.json(activity, { status: 201 })
  } catch (err) {
    console.error('[POST /api/activities]', err)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
