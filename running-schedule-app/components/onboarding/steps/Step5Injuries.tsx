import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step5Injuries({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Blessures & beperkingen</h2>
      <p className="text-gray-500 text-sm">Optioneel — beschrijf eventuele blessures of fysieke beperkingen zodat het schema hier rekening mee houdt.</p>
      <textarea
        rows={5}
        placeholder="bijv. Kniepijn bij hardlopen bergaf, pas hersteld van achillespeesblessure..."
        value={data.blessures ?? ''}
        onChange={e => onChange({ blessures: e.target.value || undefined })}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  )
}
