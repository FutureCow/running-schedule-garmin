import { Ondergrond, UserProfile } from '@/lib/types'

const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
const ONDERGRONDEN: { value: Ondergrond; label: string; icon: string; sub: string }[] = [
  { value: 'weg',      label: 'Weg / asfalt', icon: '🏙', sub: 'Stads- en fietspad' },
  { value: 'trail',    label: 'Trail / natuur', icon: '🌲', sub: 'Bos en onverhard' },
  { value: 'gemengd',  label: 'Gemengd', icon: '🗺', sub: 'Combinatie van beide' },
]

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step6Planning({ data, onChange }: Props) {
  const selectedDagen = data.trainingsdagen ?? []

  function toggleDag(dag: string) {
    const newDagen = selectedDagen.includes(dag)
      ? selectedDagen.filter(d => d !== dag)
      : [...selectedDagen, dag]
    onChange({
      trainingsdagen: newDagen,
      trainingsdagen_per_week: newDagen.length,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Trainingsplanning</h2>
        <p className="text-slate-500 mt-1">Op welke dagen wil je trainen?</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-3">📅 Trainingsdagen</label>
          <div className="grid grid-cols-4 gap-2">
            {DAGEN.map(dag => (
              <button
                key={dag}
                onClick={() => toggleDag(dag)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedDagen.includes(dag)
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dag.slice(0, 2).toUpperCase()}
              </button>
            ))}
          </div>
          {selectedDagen.length > 0 && (
            <p className="text-xs text-slate-400 mt-3">
              {selectedDagen.length} dag{selectedDagen.length !== 1 ? 'en' : ''} geselecteerd
            </p>
          )}
        </div>

        {selectedDagen.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-3">🏁 Dag voor de lange duurloop</label>
            <select
              value={data.dag_lange_loop ?? ''}
              onChange={e => onChange({ dag_lange_loop: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50 text-sm"
            >
              <option value="">Kies een dag</option>
              {selectedDagen.map(dag => (
                <option key={dag} value={dag}>{dag.charAt(0).toUpperCase() + dag.slice(1)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <label className="block text-sm font-semibold text-slate-700 mb-3">🌍 Ondergrond</label>
          <div className="space-y-2">
            {ONDERGRONDEN.map(o => (
              <button
                key={o.value}
                onClick={() => onChange({ ondergrond: o.value })}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  data.ondergrond === o.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{o.icon}</span>
                  <div>
                    <div className={`font-semibold text-sm ${data.ondergrond === o.value ? 'text-orange-700' : 'text-slate-800'}`}>
                      {o.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{o.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
