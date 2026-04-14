import { Doel, UserProfile } from '@/lib/types'

const DOELEN: { value: Doel; label: string; afstand?: number }[] = [
  { value: '5K', label: '5 kilometer', afstand: 5 },
  { value: '10K', label: '10 kilometer', afstand: 10 },
  { value: 'HM', label: 'Halve marathon', afstand: 21.1 },
  { value: 'M', label: 'Marathon', afstand: 42.2 },
  { value: 'custom', label: 'Aangepaste afstand' },
  { value: 'conditie', label: 'Algemene conditie verbeteren' },
]

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step1Goal({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Wat is je trainingsdoel?</h2>
      <div className="grid grid-cols-1 gap-3">
        {DOELEN.map(doel => (
          <button
            key={doel.value}
            onClick={() => onChange({
              doel: doel.value,
              doelafstand_km: doel.afstand,
            })}
            className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
              data.doel === doel.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {doel.label}
          </button>
        ))}
      </div>
      {data.doel === 'custom' && (
        <div>
          <label className="block text-sm font-medium mb-1">Afstand (km)</label>
          <input
            type="number"
            min={1}
            max={200}
            value={data.doelafstand_km ?? ''}
            onChange={e => onChange({ doelafstand_km: parseFloat(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  )
}
