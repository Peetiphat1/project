export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { gearSchema } from '@/lib/validations'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const result = gearSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const updatedGear = await prisma.gear.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json(updatedGear, { status: 200 })
  } catch (error) {
    console.error('PUT /api/gear/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update gear' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.gear.delete({
      where: { id },
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/gear/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete gear' }, { status: 500 })
  }
}
