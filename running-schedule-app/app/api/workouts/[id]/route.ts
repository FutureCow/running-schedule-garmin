import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const { voltooid } = await request.json()

  // Controleer dat de workout van deze gebruiker is
  const rows = await sql`
    SELECT wo.id
    FROM workouts wo
    JOIN weeks w ON w.id = wo.week_id
    JOIN schedules s ON s.id = w.schedule_id
    WHERE wo.id = ${id} AND s.user_id = ${session.user.id}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }

  await sql`UPDATE workouts SET voltooid = ${voltooid} WHERE id = ${id}`

  return NextResponse.json({ success: true })
}
