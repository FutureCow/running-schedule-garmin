import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step2Tempo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tijd- of tempodoel?</h2>
        <p className="text-slate-500 mt-1">Optioneel — sla over als je nog geen doel hebt.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            ⏱ Doeltijd
          </label>
          <p className="text-xs text-slate-400 mb-3">Totale tijd in minuten</p>
          <input
            type="number"
            placeholder="bijv. 45"
            min={1}
            value={data.doeltijd_min ?? ''}
            onChange={e => onChange({ doeltijd_min: parseInt(e.target.value) || undefined })}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">of</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            🏃 Doeltempo
          </label>
          <p className="text-xs text-slate-400 mb-3">Minuten per kilometer</p>
          <input
            type="text"
            placeholder="bijv. 5:30"
            value={data.doeltempo_min_km ?? ''}
            onChange={e => onChange({ doeltempo_min_km: e.target.value || undefined })}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
          />
        </div>
      </div>
    </div>
  )
}
