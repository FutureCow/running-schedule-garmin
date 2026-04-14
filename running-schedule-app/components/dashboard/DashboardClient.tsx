'use client'

import { useState } from 'react'
import { Schedule, Workout } from '@/lib/types'
import { WeekNavigation } from './WeekNavigation'
import { WorkoutCard } from './WorkoutCard'
import { GarminPanel } from './GarminPanel'

interface Props {
  schedule: Schedule
}

export function DashboardClient({ schedule: initialSchedule }: Props) {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [activeWeekNum, setActiveWeekNum] = useState(1)
  const [regenerating, setRegenerating] = useState(false)

  async function toggleWorkoutComplete(workoutId: string, voltooid: boolean) {
    await fetch(`/api/workouts/${workoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voltooid }),
    })
    setSchedule(prev => ({
      ...prev,
      weeks: prev.weeks.map(w => ({
        ...w,
        workouts: w.workouts.map(wo =>
          wo.id === workoutId ? { ...wo, voltooid } : wo
        ),
      })),
    }))
  }

  async function regenerateSchedule() {
    setRegenerating(true)
    const profileRes = await fetch('/api/profile')
    if (!profileRes.ok) { setRegenerating(false); return }
    const profile = await profileRes.json()

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })

    if (res.ok) window.location.reload()
    setRegenerating(false)
  }

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
          <GarminPanel
            weekWorkouts={activeWeek.workouts.map(wo => ({
              dag: wo.dag,
              type: wo.type,
              distance_km: wo.distance_km,
              warmup: wo.warmup,
              core: wo.core,
              cooldown: wo.cooldown,
            }))}
          />
        </div>
      )}
    </div>
  )
}
