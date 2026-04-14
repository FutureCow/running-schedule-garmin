import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSchedule } from '@/lib/claude'
import { UserProfile, GarminSummary } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

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
  await supabase
    .from('schedules')
    .update({ actief: false })
    .eq('user_id', user.id)

  // Sla nieuw schema op
  const { data: newSchedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert({
      user_id: user.id,
      actief: true,
      totaal_weken: schedule.total_weeks,
      startdatum: schedule.start_date,
      einddatum: schedule.end_date,
      raw_json: schedule,
    })
    .select('id')
    .single()

  if (scheduleError || !newSchedule) {
    return NextResponse.json({ error: 'Opslaan schema mislukt' }, { status: 500 })
  }

  // Sla weken en workouts op
  for (const week of schedule.weeks) {
    const { data: weekRow } = await supabase
      .from('weeks')
      .insert({
        schedule_id: newSchedule.id,
        weeknummer: week.week_number,
        thema: week.theme,
      })
      .select('id')
      .single()

    if (!weekRow) continue

    for (const workout of week.workouts) {
      await supabase.from('workouts').insert({
        week_id: weekRow.id,
        dag: workout.dag,
        type: workout.type,
        afstand_km: workout.distance_km,
        hartslagzone: workout.heart_rate_zone,
        warming_up: workout.warmup,
        kern: workout.core,
        cooling_down: workout.cooldown,
        voltooid: false,
      })
    }
  }

  return NextResponse.json({ success: true, scheduleId: newSchedule.id })
}
