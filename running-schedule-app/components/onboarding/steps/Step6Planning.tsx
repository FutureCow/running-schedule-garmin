import { Ondergrond, UserProfile } from '@/lib/types'

const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
const ONDERGRONDEN: { value: Ondergrond; label: string }[] = [
  { value: 'weg', label: 'Weg / asfalt' },
  { value: 'trail', label: 'Trail / natuur' },
  { value: 'gemengd', label: 'Gemengd' },
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
      <h2 className="text-xl font-semibold">Trainingsplanning</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Op welke dagen wil je trainen?</label>
        <div className="grid grid-cols-4 gap-2">
          {DAGEN.map(dag => (
            <button
              key={dag}
              onClick={() => toggleDag(dag)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDagen.includes(dag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {dag.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {selectedDagen.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Dag voor de lange duurloop</label>
          <select
            value={data.dag_lange_loop ?? ''}
            onChange={e => onChange({ dag_lange_loop: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Kies een dag</option>
            {selectedDagen.map(dag => (
              <option key={dag} value={dag}>{dag.charAt(0).toUpperCase() + dag.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Ondergrond</label>
        <div className="space-y-2">
          {ONDERGRONDEN.map(o => (
            <button
              key={o.value}
              onClick={() => onChange({ ondergrond: o.value })}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                data.ondergrond === o.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
