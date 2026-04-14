import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step4Condition({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Huidige conditie</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Langste afstand recent (km)</label>
        <input
          type="number" min={0} max={200} step={0.5}
          value={data.langste_afstand_km ?? ''}
          onChange={e => onChange({ langste_afstand_km: parseFloat(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Trainingsfrequentie (keer per week)</label>
        <input
          type="number" min={0} max={14}
          value={data.frequentie_per_week ?? ''}
          onChange={e => onChange({ frequentie_per_week: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Jaar hardlopend</label>
        <input
          type="number" min={0} max={50}
          value={data.jaren_actief ?? ''}
          onChange={e => onChange({ jaren_actief: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
