const STAP_NAMEN = ['Doel', 'Tempo', 'Profiel', 'Conditie', 'Blessures', 'Planning', 'Tijdlijn']

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-slate-500">
          Stap {current} van {total}
        </span>
        <span className="text-sm font-semibold text-orange-500">
          {STAP_NAMEN[current - 1]}
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-1.5 bg-orange-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
