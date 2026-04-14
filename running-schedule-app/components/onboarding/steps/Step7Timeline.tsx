import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step7Timeline({ data, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tijdlijn</h2>
        <p className="text-slate-500 mt-1">Hoe lang wil je trainen?</p>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1">🗓 Einddatum</label>
          <p className="text-xs text-slate-400 mb-3">Bijvoorbeeld je wedstrijddatum</p>
          <input
            type="date"
            min={today}
            value={data.einddatum ?? ''}
            onChange={e => onChange({ einddatum: e.target.value || undefined, aantal_weken: undefined })}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">of</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1">📆 Aantal weken</label>
          <p className="text-xs text-slate-400 mb-3">Minimum 4, maximum 52 weken</p>
          <div className="relative">
            <input
              type="number"
              min={4}
              max={52}
              placeholder="bijv. 12"
              value={data.aantal_weken ?? ''}
              onChange={e => onChange({ aantal_weken: parseInt(e.target.value) || undefined, einddatum: undefined })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">weken</span>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
        <p className="text-sm text-orange-700">
          🏅 Na het aanmaken kun je vanuit het dashboard je Garmin Connect account koppelen.
        </p>
      </div>
    </div>
  )
}
