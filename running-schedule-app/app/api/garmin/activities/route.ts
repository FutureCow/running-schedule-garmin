import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
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

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const rows = await sql`
    SELECT username_encrypted, password_encrypted
    FROM garmin_connections
    WHERE user_id = ${session.user.id}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Geen Garmin account gekoppeld' }, { status: 404 })
  }

  const username = decrypt(rows[0].username_encrypted)
  const password = decrypt(rows[0].password_encrypted)

  const garminRes = await fetch(`${process.env.GARMIN_SERVICE_URL}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!garminRes.ok) {
    return NextResponse.json({ error: 'Garmin sync mislukt' }, { status: 500 })
  }

  await sql`
    UPDATE garmin_connections SET laatste_sync = now()
    WHERE user_id = ${session.user.id}
  `

  return NextResponse.json(await garminRes.json())
}
