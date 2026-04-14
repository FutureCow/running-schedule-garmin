import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step3Profile({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Jouw profiel</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Leeftijd</label>
        <input
          type="number" min={10} max={100}
          value={data.leeftijd ?? ''}
          onChange={e => onChange({ leeftijd: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Lengte (cm)</label>
        <input
          type="number" min={100} max={250}
          value={data.lengte_cm ?? ''}
          onChange={e => onChange({ lengte_cm: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
        <input
          type="number" min={30} max={200}
          value={data.gewicht_kg ?? ''}
          onChange={e => onChange({ gewicht_kg: parseFloat(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
