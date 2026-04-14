import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function decrypt(encryptedText: string): string {
  const key = Buffer.from(process.env.GARMIN_ENCRYPTION_KEY!, 'utf8').slice(0, 32)
  const [ivHex, encHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { workouts } = await request.json()

  const { data: garminConn } = await supabase
    .from('garmin_connections')
    .select('username_encrypted, password_encrypted')
    .eq('user_id', user.id)
    .single()

  if (!garminConn) {
    return NextResponse.json({ error: 'Geen Garmin account gekoppeld' }, { status: 404 })
  }

  const username = decrypt(garminConn.username_encrypted)
  const password = decrypt(garminConn.password_encrypted)

  const garminRes = await fetch(`${process.env.GARMIN_SERVICE_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, workouts }),
  })

  const result = await garminRes.json()
  return NextResponse.json(result)
}
