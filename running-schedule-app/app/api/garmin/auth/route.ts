import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const key = Buffer.from(process.env.GARMIN_ENCRYPTION_KEY!, 'utf8').slice(0, 32)
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { username, password } = await request.json()

  // Valideer bij Garmin
  const garminRes = await fetch(`${process.env.GARMIN_SERVICE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const result = await garminRes.json()
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  // Sla versleuteld op in Supabase
  await supabase.from('garmin_connections').upsert({
    user_id: user.id,
    username_encrypted: encrypt(username),
    password_encrypted: encrypt(password),
    laatste_sync: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
