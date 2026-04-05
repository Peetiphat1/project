export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { routeSchema } from '@/lib/validations'

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(routes, { status: 200 })
  } catch (error) {
    console.error('GET /api/routes error:', error)
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = routeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const newRoute = await prisma.route.create({
      data: result.data,
    })

    return NextResponse.json(newRoute, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/routes error:', error)
    return NextResponse.json({ error: 'Failed to create route', message: error.message }, { status: 500 })
  }
}
