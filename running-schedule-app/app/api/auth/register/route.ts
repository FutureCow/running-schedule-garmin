import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord (min. 6 tekens)' }, { status: 400 })
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return NextResponse.json({ error: 'E-mailadres is al in gebruik' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${password_hash})
  `

  return NextResponse.json({ success: true })
}
