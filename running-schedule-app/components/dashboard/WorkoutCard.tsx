'use client'

import { useState } from 'react'
import { Workout } from '@/lib/types'
import { WorkoutDetail } from './WorkoutDetail'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  herstelloop:      { label: 'Herstel',       color: 'text-emerald-700', bg: 'bg-emerald-50' },
  duurloop:         { label: 'Duurloop',      color: 'text-blue-700',    bg: 'bg-blue-50' },
  intervaltraining: { label: 'Interval',      color: 'text-red-700',     bg: 'bg-red-50' },
  drempeltraining:  { label: 'Drempel',       color: 'text-purple-700',  bg: 'bg-purple-50' },
  lange_duurlloop:  { label: 'Lange duurloop', color: 'text-orange-700', bg: 'bg-orange-50' },
  fartlek:          { label: 'Fartlek',       color: 'text-yellow-700',  bg: 'bg-yellow-50' },
}

interface Props {
  workout: Workout
  onToggleComplete: (id: string, voltooid: boolean) => void
}

export function WorkoutCard({ workout, onToggleComplete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[workout.type] ?? { label: workout.type, color: 'text-slate-700', bg: 'bg-slate-100' }

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      workout.voltooid ? 'border-slate-100 opacity-60' : 'border-slate-200'
    }`}>
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => onToggleComplete(workout.id!, !workout.voltooid)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            workout.voltooid
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 hover:border-orange-400'
          }`}
        >
          {workout.voltooid && <span className="text-xs font-bold">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 capitalize text-sm">{workout.dag}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${config.color} ${config.bg}`}>
              {config.label}
            </span>
            <span className="text-sm text-slate-600 font-medium">{workout.distance_km} km</span>
            <span className="text-xs text-slate-400">Zone {workout.heart_rate_zone}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <WorkoutDetail workout={workout} />
        </div>
      )}
    </div>
  )
}
