import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step2Tempo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Heb je een tijd- of tempodoel?</h2>
      <p className="text-gray-500 text-sm">Optioneel — sla over als je nog geen doel hebt.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Doeltijd (minuten)</label>
          <input
            type="number"
            placeholder="bijv. 45"
            min={1}
            value={data.doeltijd_min ?? ''}
            onChange={e => onChange({ doeltijd_min: parseInt(e.target.value) || undefined })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-center text-gray-400 text-sm">of</div>
        <div>
          <label className="block text-sm font-medium mb-1">Doeltempo (min/km)</label>
          <input
            type="text"
            placeholder="bijv. 5:30"
            value={data.doeltempo_min_km ?? ''}
            onChange={e => onChange({ doeltempo_min_km: e.target.value || undefined })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
