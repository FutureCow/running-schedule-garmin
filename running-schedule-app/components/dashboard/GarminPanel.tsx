'use client'

import { useState } from 'react'

interface Props {
  weekWorkouts: Array<{
    dag: string
    type: string
    distance_km: number
    warmup: { description: string; distance_km: number; pace_min_km: string }
    core: { description: string; distance_km: number; pace_min_km: string }
    cooldown: { description: string; distance_km: number; pace_min_km: string }
  }>
  initialConnected: boolean
}

export function GarminPanel({ weekWorkouts, initialConnected }: Props) {
  const [showConnect, setShowConnect] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [isConnected, setIsConnected] = useState(initialConnected)

  async function connectGarmin() {
    setConnecting(true)
    setMessage('')
    const res = await fetch('/api/garmin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      setIsConnected(true)
      setShowConnect(false)
      setMessage('Garmin Connect gekoppeld!')
    } else {
      setMessage(data.error || 'Koppelen mislukt')
    }
    setConnecting(false)
  }

  async function uploadWeek() {
    setUploading(true)
    setMessage('')
    const res = await fetch('/api/garmin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workouts: weekWorkouts }),
    })
    const data = await res.json()
    setMessage(data.message || (data.success ? 'Geüpload!' : 'Upload mislukt'))
    setUploading(false)
  }

  const isError = message.includes('mislukt') || message.includes('fout')

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-lg">⌚</div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Garmin Connect</h3>
          <p className="text-xs text-slate-400">
            {isConnected ? 'Verbonden' : 'Niet gekoppeld'}
          </p>
        </div>
        {isConnected && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-xs text-emerald-600 font-medium">Actief</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 mb-4 ${isError ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
          <p className={`text-sm ${isError ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>
        </div>
      )}

      {showConnect ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Garmin gebruikersnaam of e-mail"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 bg-slate-50"
          />
          <div className="flex gap-2">
            <button
              onClick={connectGarmin}
              disabled={connecting || !username || !password}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors"
            >
              {connecting ? 'Koppelen...' : 'Koppelen'}
            </button>
            <button
              onClick={() => setShowConnect(false)}
              className="px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuleren
            </button>
          </div>
          <p className="text-xs text-slate-400">
            🔒 Je gegevens worden versleuteld opgeslagen en nooit gedeeld.
          </p>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {!isConnected && (
            <button
              onClick={() => setShowConnect(true)}
              className="text-sm border-2 border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Garmin koppelen
            </button>
          )}
          <button
            onClick={uploadWeek}
            disabled={uploading}
            className="text-sm bg-orange-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploaden...' : '⌚ Week naar Garmin sturen'}
          </button>
        </div>
      )}
    </div>
  )
}
