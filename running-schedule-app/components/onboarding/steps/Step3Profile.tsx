import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

function InputField({ label, icon, unit, ...props }: {
  label: string
  icon: string
  unit: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {icon} {label}
      </label>
      <div className="relative mt-2">
        <input
          {...props}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
          {unit}
        </span>
      </div>
    </div>
  )
}

export function Step3Profile({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Jouw profiel</h2>
        <p className="text-slate-500 mt-1">We gebruiken dit om je schema te personaliseren.</p>
      </div>

      <div className="space-y-3">
        <InputField
          label="Leeftijd" icon="🎂" unit="jaar"
          type="number" min={10} max={100}
          value={data.leeftijd ?? ''}
          onChange={e => onChange({ leeftijd: parseInt(e.target.value) })}
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Lengte" icon="📏" unit="cm"
            type="number" min={100} max={250}
            value={data.lengte_cm ?? ''}
            onChange={e => onChange({ lengte_cm: parseInt(e.target.value) })}
          />
          <InputField
            label="Gewicht" icon="⚖️" unit="kg"
            type="number" min={30} max={200}
            value={data.gewicht_kg ?? ''}
            onChange={e => onChange({ gewicht_kg: parseFloat(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
