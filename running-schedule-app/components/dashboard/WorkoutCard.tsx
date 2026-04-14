'use client'

import { useState } from 'react'
import { Workout } from '@/lib/types'
import { WorkoutDetail } from './WorkoutDetail'

const TYPE_KLEUREN: Record<string, string> = {
  herstelloop: 'bg-green-100 text-green-800',
  duurloop: 'bg-blue-100 text-blue-800',
  intervaltraining: 'bg-red-100 text-red-800',
  drempeltraining: 'bg-purple-100 text-purple-800',
  lange_duurlloop: 'bg-orange-100 text-orange-800',
  fartlek: 'bg-yellow-100 text-yellow-800',
}

const TYPE_LABELS: Record<string, string> = {
  herstelloop: 'Herstelloop',
  duurloop: 'Duurloop',
  intervaltraining: 'Interval',
  drempeltraining: 'Drempel',
  lange_duurlloop: 'Lange duurloop',
  fartlek: 'Fartlek',
}

interface Props {
  workout: Workout
  onToggleComplete: (id: string, voltooid: boolean) => void
}

export function WorkoutCard({ workout, onToggleComplete }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border rounded-xl p-4 transition-all ${workout.voltooid ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleComplete(workout.id!, !workout.voltooid)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              workout.voltooid
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {workout.voltooid && <span className="text-xs">✓</span>}
          </button>
          <div>
            <div className="font-medium capitalize">{workout.dag}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_KLEUREN[workout.type] ?? 'bg-gray-100'}`}>
                {TYPE_LABELS[workout.type] ?? workout.type}
              </span>
              <span className="text-sm text-gray-600">{workout.distance_km} km</span>
              <span className="text-sm text-gray-500">• Z{workout.heart_rate_zone}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-gray-400 hover:text-gray-600 px-2"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && <WorkoutDetail workout={workout} />}
    </div>
  )
}
