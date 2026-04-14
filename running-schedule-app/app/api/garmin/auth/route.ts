import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
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
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { username, password } = await request.json()

  const garminRes = await fetch(`${process.env.GARMIN_SERVICE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const result = await garminRes.json()
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  await sql`
    INSERT INTO garmin_connections (user_id, username_encrypted, password_encrypted, laatste_sync)
    VALUES (${session.user.id}, ${encrypt(username)}, ${encrypt(password)}, now())
    ON CONFLICT (user_id) DO UPDATE SET
      username_encrypted = EXCLUDED.username_encrypted,
      password_encrypted = EXCLUDED.password_encrypted,
      laatste_sync = now()
  `

  return NextResponse.json({ success: true })
}
