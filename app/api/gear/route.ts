export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { gearSchema } from '@/lib/validations'

export async function GET() {
  try {
    const settings = await prisma.userSettings.findFirst()
    const currentAthleteId = settings?.currentAthleteId ?? null

    // If an athlete is connected, show only their gear.
    // If not connected yet (null), return nothing — no cross-athlete leakage.
    const gearList = await prisma.gear.findMany({
      where: currentAthleteId ? { athleteId: currentAthleteId } : { athleteId: null },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(gearList, { status: 200 })
  } catch (error) {
    console.error('GET /api/gear error:', error)
    return NextResponse.json({ error: 'Failed to fetch gear' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { imageUrl, ...rest } = body
    const result = gearSchema.safeParse(rest)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // Attach the current athlete so gear is scoped correctly
    const settings = await prisma.userSettings.findFirst()
    const currentAthleteId = settings?.currentAthleteId ?? null

    const newGear = await prisma.gear.create({
      data: {
        ...result.data,
        ...(imageUrl ? { imageUrl } : {}),
        athleteId: currentAthleteId,
      },
    })

    return NextResponse.json(newGear, { status: 201 })
  } catch (error) {
    console.error('POST /api/gear error:', error)
    return NextResponse.json({ error: 'Failed to create gear' }, { status: 500 })
  }
}
