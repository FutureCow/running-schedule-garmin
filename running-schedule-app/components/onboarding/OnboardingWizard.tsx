'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/types'
import { ProgressBar } from './ProgressBar'
import { Step1Goal } from './steps/Step1Goal'
import { Step2Tempo } from './steps/Step2Tempo'
import { Step3Profile } from './steps/Step3Profile'
import { Step4Condition } from './steps/Step4Condition'
import { Step5Injuries } from './steps/Step5Injuries'
import { Step6Planning } from './steps/Step6Planning'
import { Step7Timeline } from './steps/Step7Timeline'

const TOTAL_STEPS = 7

function isStepValid(step: number, data: Partial<UserProfile>): boolean {
  switch (step) {
    case 1: return !!data.doel && (data.doel !== 'custom' || !!data.doelafstand_km)
    case 2: return true
    case 3: return !!data.leeftijd && !!data.lengte_cm && !!data.gewicht_kg
    case 4: return !!data.langste_afstand_km && !!data.frequentie_per_week && data.jaren_actief !== undefined
    case 5: return true
    case 6: return (data.trainingsdagen?.length ?? 0) > 0 && !!data.dag_lange_loop && !!data.ondergrond
    case 7: return !!(data.einddatum || data.aantal_weken)
    default: return false
  }
}

export function OnboardingWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function updateProfile(updates: Partial<UserProfile>) {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  async function handleFinish() {
    setSaving(true)
    setError('')

    const profileRes = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })

    if (!profileRes.ok) {
      setError('Fout bij opslaan profiel. Probeer opnieuw.')
      setSaving(false)
      return
    }

    const generateRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })

    if (!generateRes.ok) {
      setError('Fout bij genereren schema. Probeer opnieuw.')
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  const canProceed = isStepValid(step, profile)

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto px-4 py-8">
      <ProgressBar current={step} total={TOTAL_STEPS} />

      <div className="flex-1 mt-8">
        {step === 1 && <Step1Goal data={profile} onChange={updateProfile} />}
        {step === 2 && <Step2Tempo data={profile} onChange={updateProfile} />}
        {step === 3 && <Step3Profile data={profile} onChange={updateProfile} />}
        {step === 4 && <Step4Condition data={profile} onChange={updateProfile} />}
        {step === 5 && <Step5Injuries data={profile} onChange={updateProfile} />}
        {step === 6 && <Step6Planning data={profile} onChange={updateProfile} />}
        {step === 7 && <Step7Timeline data={profile} onChange={updateProfile} />}
      </div>

      {error && <p className="text-red-600 text-sm my-2">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            Vorige
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canProceed || saving}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40"
          >
            {saving ? 'Schema genereren...' : 'Schema genereren'}
          </button>
        )}
      </div>
    </div>
  )
}
