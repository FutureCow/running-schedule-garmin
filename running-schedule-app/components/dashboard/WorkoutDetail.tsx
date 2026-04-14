import { Workout, WorkoutPhase } from '@/lib/types'

function PhaseRow({ label, phase, icon }: { label: string; phase: WorkoutPhase; icon: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-sm text-slate-700 mt-0.5">{phase.description}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-slate-800">{phase.distance_km} km</div>
        <div className="text-xs text-slate-400">{phase.pace_min_km} /km</div>
      </div>
    </div>
  )
}

export function WorkoutDetail({ workout }: { workout: Workout }) {
  return (
    <div className="mt-4 bg-slate-50 rounded-xl px-4 py-1">
      <PhaseRow label="Warming-up" phase={workout.warmup} icon="🔥" />
      <PhaseRow label="Kern" phase={workout.core} icon="⚡" />
      <PhaseRow label="Cooling-down" phase={workout.cooldown} icon="❄️" />
    </div>
  )
}
