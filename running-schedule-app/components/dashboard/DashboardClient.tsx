'use client'

import { useState } from 'react'
import { Schedule, Workout } from '@/lib/types'
import { WeekNavigation } from './WeekNavigation'
import { WorkoutCard } from './WorkoutCard'
import { GarminPanel } from './GarminPanel'

interface Props {
  schedule: Schedule
  garminConnected: boolean
}

export function DashboardClient({ schedule: initialSchedule, garminConnected }: Props) {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [activeWeekNum, setActiveWeekNum] = useState(initialSchedule.weeks[0]?.week_number ?? 1)
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
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mijn schema</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {completedCount} / {totalCount} trainingen voltooid
            </p>
          </div>
          <button
            onClick={regenerateSchedule}
            disabled={regenerating}
            className="text-sm border border-slate-200 bg-white text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50 font-medium transition-colors"
          >
            {regenerating ? 'Genereren...' : '↺ Opnieuw'}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full mb-6">
          <div
            className="h-1.5 bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Week navigation */}
        <WeekNavigation
          weeks={schedule.weeks}
          activeWeek={activeWeekNum}
          onSelectWeek={setActiveWeekNum}
        />

        {/* Active week */}
        {activeWeek && (
          <div className="mt-5">
            <div className="mb-4">
              <h2 className="font-bold text-slate-900 text-lg">Week {activeWeek.week_number}</h2>
              <p className="text-slate-500 text-sm">{activeWeek.theme}</p>
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
              initialConnected={garminConnected}
            />
          </div>
        )}
      </div>
    </div>
  )
}
