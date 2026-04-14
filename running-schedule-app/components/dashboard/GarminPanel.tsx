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
}

export function GarminPanel({ weekWorkouts }: Props) {
  const [showConnect, setShowConnect] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)

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

  return (
    <div className="border rounded-xl p-4 mt-4">
      <h3 className="font-semibold mb-3">Garmin Connect</h3>

      {message && (
        <p className={`text-sm mb-3 ${message.includes('mislukt') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      {showConnect ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Garmin gebruikersnaam"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Garmin wachtwoord"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={connectGarmin}
              disabled={connecting || !username || !password}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {connecting ? 'Koppelen...' : 'Koppelen'}
            </button>
            <button
              onClick={() => setShowConnect(false)}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              Annuleren
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Je gegevens worden versleuteld opgeslagen en nooit gedeeld.
          </p>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {!isConnected && (
            <button
              onClick={() => setShowConnect(true)}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
            >
              Garmin koppelen
            </button>
          )}
          <button
            onClick={uploadWeek}
            disabled={uploading}
            className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploaden...' : 'Week naar Garmin sturen'}
          </button>
        </div>
      )}
    </div>
  )
}
