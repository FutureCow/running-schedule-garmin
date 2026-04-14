'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Schedule, Week, Workout } from '@/lib/types'
import { WeekNavigation } from '@/components/dashboard/WeekNavigation'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'

export default function DashboardPage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [activeWeekNum, setActiveWeekNum] = useState(1)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const loadSchedule = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: scheduleRow } = await supabase
      .from('schedules')
      .select('*, weeks(*, workouts(*))')
      .eq('user_id', user.id)
      .eq('actief', true)
      .single()

    if (!scheduleRow) {
      router.push('/onboarding')
      return
    }

    const weeks: Week[] = (scheduleRow.weeks as any[])
      .sort((a, b) => a.weeknummer - b.weeknummer)
      .map(w => ({
        id: w.id,
        schedule_id: w.schedule_id,
        week_number: w.weeknummer,
        theme: w.thema,
        workouts: (w.workouts as any[]).map(wo => ({
          id: wo.id,
          week_id: wo.week_id,
          dag: wo.dag,
          type: wo.type,
          distance_km: wo.afstand_km,
          heart_rate_zone: wo.hartslagzone,
          warmup: wo.warming_up,
          core: wo.kern,
          cooldown: wo.cooling_down,
          voltooid: wo.voltooid,
        } as Workout)),
      }))

    setSchedule({
      id: scheduleRow.id,
      total_weeks: scheduleRow.totaal_weken,
      start_date: scheduleRow.startdatum,
      end_date: scheduleRow.einddatum,
      weeks,
    })
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadSchedule() }, [loadSchedule])

  async function toggleWorkoutComplete(workoutId: string, voltooid: boolean) {
    await supabase.from('workouts').update({ voltooid }).eq('id', workoutId)
    setSchedule(prev => {
      if (!prev) return prev
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          workouts: w.workouts.map(wo =>
            wo.id === workoutId ? { ...wo, voltooid } : wo
          ),
        })),
      }
    })
  }

  async function regenerateSchedule() {
    setRegenerating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })

    if (response.ok) await loadSchedule()
    setRegenerating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Schema laden...</p>
      </div>
    )
  }

  if (!schedule) return null

  const activeWeek = schedule.weeks.find(w => w.week_number === activeWeekNum)
  const completedCount = schedule.weeks.flatMap(w => w.workouts).filter(wo => wo.voltooid).length
  const totalCount = schedule.weeks.flatMap(w => w.workouts).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mijn Schema</h1>
          <p className="text-gray-500 text-sm mt-1">
            {completedCount} / {totalCount} trainingen voltooid
          </p>
        </div>
        <button
          onClick={regenerateSchedule}
          disabled={regenerating}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {regenerating ? 'Genereren...' : '↺ Opnieuw genereren'}
        </button>
      </div>

      <div className="h-2 bg-gray-200 rounded-full mb-6">
        <div
          className="h-2 bg-green-500 rounded-full transition-all"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <WeekNavigation
        weeks={schedule.weeks}
        activeWeek={activeWeekNum}
        onSelectWeek={setActiveWeekNum}
      />

      {activeWeek && (
        <div className="mt-4">
          <div className="mb-3">
            <h2 className="font-semibold text-lg">Week {activeWeek.week_number}</h2>
            <p className="text-gray-500 text-sm">{activeWeek.theme}</p>
          </div>
          <div className="space-y-3">
            {activeWeek.workouts.map(workout => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onToggleComplete={toggleWorkoutComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
