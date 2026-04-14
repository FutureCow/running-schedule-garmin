import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { Schedule, Week, Workout, WorkoutPhase } from '@/lib/types'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

async function loadSchedule(userId: string): Promise<Schedule | null> {
  const scheduleRows = await sql`
    SELECT id, totaal_weken, startdatum, einddatum
    FROM schedules
    WHERE user_id = ${userId} AND actief = true
    LIMIT 1
  `
  if (scheduleRows.length === 0) return null
  const s = scheduleRows[0]

  const weekRows = await sql`
    SELECT id, weeknummer, thema
    FROM weeks
    WHERE schedule_id = ${s.id}
    ORDER BY weeknummer
  `

  const weeks: Week[] = await Promise.all(weekRows.map(async w => {
    const workoutRows = await sql`
      SELECT id, dag, type, afstand_km, hartslagzone,
             warming_up, kern, cooling_down, voltooid
      FROM workouts
      WHERE week_id = ${w.id}
    `

    const workouts: Workout[] = workoutRows.map(wo => ({
      id: wo.id,
      week_id: w.id,
      dag: wo.dag,
      type: wo.type,
      distance_km: Number(wo.afstand_km),
      heart_rate_zone: wo.hartslagzone,
      warmup: wo.warming_up as WorkoutPhase,
      core: wo.kern as WorkoutPhase,
      cooldown: wo.cooling_down as WorkoutPhase,
      voltooid: wo.voltooid,
    }))

    return {
      id: w.id,
      schedule_id: s.id,
      week_number: w.weeknummer,
      theme: w.thema,
      workouts,
    }
  }))

  return {
    id: s.id,
    total_weeks: s.totaal_weken,
    start_date: String(s.startdatum),
    end_date: String(s.einddatum),
    weeks,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const schedule = await loadSchedule(session.user.id)
  if (!schedule) redirect('/onboarding')

  const garminRows = await sql`
    SELECT user_id FROM garmin_connections WHERE user_id = ${session.user.id}
  `
  const garminConnected = garminRows.length > 0

  return <DashboardClient schedule={schedule} garminConnected={garminConnected} />
}
