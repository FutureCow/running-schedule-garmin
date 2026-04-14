import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step5Injuries({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Blessures & beperkingen</h2>
        <p className="text-slate-500 mt-1">Optioneel — sla over als je geen blessures hebt.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-1">🩹 Blessures of beperkingen</label>
        <p className="text-xs text-slate-400 mb-3">Beschrijf eventuele blessures zodat het schema hier rekening mee houdt</p>
        <textarea
          rows={5}
          placeholder="bijv. Kniepijn bij hardlopen bergaf, pas hersteld van achillespeesblessure..."
          value={data.blessures ?? ''}
          onChange={e => onChange({ blessures: e.target.value || undefined })}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50 resize-none text-sm"
        />
      </div>
    </div>
  )
}
