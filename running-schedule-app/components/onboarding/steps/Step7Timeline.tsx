import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step7Timeline({ data, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tijdlijn</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Einddatum (bijv. wedstrijddatum)</label>
        <input
          type="date"
          min={today}
          value={data.einddatum ?? ''}
          onChange={e => onChange({ einddatum: e.target.value || undefined, aantal_weken: undefined })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="text-center text-gray-400 text-sm">of</div>

      <div>
        <label className="block text-sm font-medium mb-1">Aantal weken</label>
        <input
          type="number"
          min={4}
          max={52}
          value={data.aantal_weken ?? ''}
          onChange={e => onChange({ aantal_weken: parseInt(e.target.value) || undefined, einddatum: undefined })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">
          Je kunt later ook je Garmin Connect account koppelen vanuit het dashboard.
        </p>
      </div>
    </div>
  )
}
