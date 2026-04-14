'use client'

import { Week } from '@/lib/types'

interface Props {
  weeks: Week[]
  activeWeek: number
  onSelectWeek: (weekNumber: number) => void
}

export function WeekNavigation({ weeks, activeWeek, onSelectWeek }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {weeks.map(week => (
          <button
            key={week.week_number}
            onClick={() => onSelectWeek(week.week_number)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeWeek === week.week_number
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            W{week.week_number}
          </button>
        ))}
      </div>
    </div>
  )
}
