import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { generateSchedule } from '@/lib/claude'
import { UserProfile, GarminSummary } from '@/lib/types'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { profile, garminData } = await request.json() as {
    profile: UserProfile
    garminData?: GarminSummary
  }

  let schedule
  try {
    schedule = await generateSchedule(profile, garminData)
  } catch (e) {
    console.error('Claude fout:', e)
    return NextResponse.json({ error: 'Schema generatie mislukt' }, { status: 500 })
  }

  // Markeer vorige schema's als inactief
  await sql`
    UPDATE schedules SET actief = false WHERE user_id = ${session.user.id}
  `

  // Sla nieuw schema op
  const newScheduleRows = await sql`
    INSERT INTO schedules (user_id, actief, totaal_weken, startdatum, einddatum, raw_json)
    VALUES (${session.user.id}, true, ${schedule.total_weeks},
            ${schedule.start_date}, ${schedule.end_date}, ${JSON.stringify(schedule)})
    RETURNING id
  `
  const scheduleId = newScheduleRows[0].id

  // Sla weken en workouts op
  for (const week of schedule.weeks) {
    const weekRows = await sql`
      INSERT INTO weeks (schedule_id, weeknummer, thema)
      VALUES (${scheduleId}, ${week.week_number}, ${week.theme})
      RETURNING id
    `
    const weekId = weekRows[0].id

    for (const workout of week.workouts) {
      await sql`
        INSERT INTO workouts
          (week_id, dag, type, afstand_km, hartslagzone,
           warming_up, kern, cooling_down, voltooid)
        VALUES
          (${weekId}, ${workout.dag}, ${workout.type},
           ${workout.distance_km}, ${workout.heart_rate_zone},
           ${JSON.stringify(workout.warmup)},
           ${JSON.stringify(workout.core)},
           ${JSON.stringify(workout.cooldown)},
           false)
      `
    }
  }

  return NextResponse.json({ success: true, scheduleId })
}
