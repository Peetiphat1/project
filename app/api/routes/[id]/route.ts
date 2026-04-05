export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { routeSchema } from '@/lib/validations'

// Next.js (15+) requires treating params as a Promise
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const result = routeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const updatedRoute = await prisma.route.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updatedRoute, { status: 200 })
  } catch (error) {
    console.error(`PUT /api/routes/[id] error:`, error)
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.route.delete({
      where: { id },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(`DELETE /api/routes/[id] error:`, error)
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 })
  }
}
