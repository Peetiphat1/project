export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { gearSchema } from '@/lib/validations'

export async function GET() {
  try {
    // We assume the schema will have a gear model with createdAt
    const gearList = await prisma.gear.findMany({
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
    const result = gearSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const newGear = await prisma.gear.create({
      data: result.data,
    })

    return NextResponse.json(newGear, { status: 201 })
  } catch (error) {
    console.error('POST /api/gear error:', error)
    return NextResponse.json({ error: 'Failed to create gear' }, { status: 500 })
  }
}
