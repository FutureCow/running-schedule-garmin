'use client'

import { Week } from '@/lib/types'

interface Props {
  weeks: Week[]
  activeWeek: number
  onSelectWeek: (weekNumber: number) => void
}

export function WeekNavigation({ weeks, activeWeek, onSelectWeek }: Props) {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-2">
        {weeks.map(week => (
          <button
            key={week.week_number}
            onClick={() => onSelectWeek(week.week_number)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeWeek === week.week_number
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-200'
            }`}
          >
            W{week.week_number}
          </button>
        ))}
      </div>
    </div>
  )
}
