import { Workout, WorkoutPhase } from '@/lib/types'

function PhaseRow({ label, phase, color }: { label: string; phase: WorkoutPhase; color: string }) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
          <div className="text-sm mt-0.5">{phase.description}</div>
        </div>
        <div className="text-right ml-4 shrink-0">
          <div className="text-sm font-medium">{phase.distance_km} km</div>
          <div className="text-xs opacity-70">{phase.pace_min_km} min/km</div>
        </div>
      </div>
    </div>
  )
}

export function WorkoutDetail({ workout }: { workout: Workout }) {
  return (
    <div className="mt-4 space-y-2">
      <PhaseRow label="Warming-up" phase={workout.warmup} color="bg-blue-50" />
      <PhaseRow label="Kern" phase={workout.core} color="bg-red-50" />
      <PhaseRow label="Cooling-down" phase={workout.cooldown} color="bg-blue-50" />
    </div>
  )
}
