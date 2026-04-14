import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step4Condition({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Huidige conditie</h2>
        <p className="text-slate-500 mt-1">Zodat het schema aansluit op je huidig niveau.</p>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1">🏅 Langste afstand recent</label>
          <p className="text-xs text-slate-400 mb-3">De langste loop die je de afgelopen weken hebt gedaan</p>
          <div className="relative">
            <input
              type="number" min={0} max={200} step={0.5}
              placeholder="bijv. 10"
              value={data.langste_afstand_km ?? ''}
              onChange={e => onChange({ langste_afstand_km: parseFloat(e.target.value) })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">km</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-1">📅 Trainingen/week</label>
            <div className="relative mt-2">
              <input
                type="number" min={0} max={14}
                placeholder="bijv. 3"
                value={data.frequentie_per_week ?? ''}
                onChange={e => onChange({ frequentie_per_week: parseInt(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">keer</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-1">🗓 Jaren actief</label>
            <div className="relative mt-2">
              <input
                type="number" min={0} max={50}
                placeholder="bijv. 2"
                value={data.jaren_actief ?? ''}
                onChange={e => onChange({ jaren_actief: parseInt(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">jaar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
