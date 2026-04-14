import { Doel, UserProfile } from '@/lib/types'

const DOELEN: { value: Doel; label: string; afstand?: number; icon: string; sub: string }[] = [
  { value: '5K',       label: '5 kilometer',                icon: '🏃',  sub: 'Beginnersvriendelijk',  afstand: 5 },
  { value: '10K',      label: '10 kilometer',               icon: '🏃‍♂️', sub: 'Populaire afstand',     afstand: 10 },
  { value: 'HM',       label: 'Halve marathon',             icon: '🥈',  sub: '21,1 km',               afstand: 21.1 },
  { value: 'M',        label: 'Marathon',                   icon: '🏅',  sub: '42,2 km',               afstand: 42.2 },
  { value: 'conditie', label: 'Algemene conditie',          icon: '💪',  sub: 'Fitter worden' },
  { value: 'custom',   label: 'Aangepaste afstand',         icon: '🎯',  sub: 'Eigen doel' },
]

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step1Goal({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Wat is je trainingsdoel?</h2>
        <p className="text-slate-500 mt-1">Kies het doel waarvoor je wilt trainen.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DOELEN.map(doel => (
          <button
            key={doel.value}
            onClick={() => onChange({ doel: doel.value, doelafstand_km: doel.afstand })}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              data.doel === doel.value
                ? 'border-orange-500 bg-orange-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'
            }`}
          >
            <div className="text-2xl mb-2">{doel.icon}</div>
            <div className={`font-semibold text-sm ${data.doel === doel.value ? 'text-orange-700' : 'text-slate-800'}`}>
              {doel.label}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{doel.sub}</div>
          </button>
        ))}
      </div>

      {data.doel === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Afstand (km)</label>
          <input
            type="number"
            min={1}
            max={200}
            placeholder="bijv. 15"
            value={data.doelafstand_km ?? ''}
            onChange={e => onChange({ doelafstand_km: parseFloat(e.target.value) })}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-white"
          />
        </div>
      )}
    </div>
  )
}
