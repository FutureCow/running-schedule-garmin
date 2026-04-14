import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await request.json()

  await sql`
    INSERT INTO profiles (
      user_id, doel, doelafstand_km, doeltijd_min, doeltempo_min_km,
      leeftijd, lengte_cm, gewicht_kg, langste_afstand_km,
      frequentie_per_week, jaren_actief, blessures,
      trainingsdagen_per_week, trainingsdagen, dag_lange_loop,
      ondergrond, einddatum, aantal_weken, bijgewerkt_op
    ) VALUES (
      ${session.user.id},
      ${profile.doel}, ${profile.doelafstand_km ?? null},
      ${profile.doeltijd_min ?? null}, ${profile.doeltempo_min_km ?? null},
      ${profile.leeftijd}, ${profile.lengte_cm}, ${profile.gewicht_kg},
      ${profile.langste_afstand_km}, ${profile.frequentie_per_week},
      ${profile.jaren_actief}, ${profile.blessures ?? null},
      ${profile.trainingsdagen_per_week}, ${profile.trainingsdagen},
      ${profile.dag_lange_loop}, ${profile.ondergrond},
      ${profile.einddatum ?? null}, ${profile.aantal_weken ?? null},
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      doel = EXCLUDED.doel,
      doelafstand_km = EXCLUDED.doelafstand_km,
      doeltijd_min = EXCLUDED.doeltijd_min,
      doeltempo_min_km = EXCLUDED.doeltempo_min_km,
      leeftijd = EXCLUDED.leeftijd,
      lengte_cm = EXCLUDED.lengte_cm,
      gewicht_kg = EXCLUDED.gewicht_kg,
      langste_afstand_km = EXCLUDED.langste_afstand_km,
      frequentie_per_week = EXCLUDED.frequentie_per_week,
      jaren_actief = EXCLUDED.jaren_actief,
      blessures = EXCLUDED.blessures,
      trainingsdagen_per_week = EXCLUDED.trainingsdagen_per_week,
      trainingsdagen = EXCLUDED.trainingsdagen,
      dag_lange_loop = EXCLUDED.dag_lange_loop,
      ondergrond = EXCLUDED.ondergrond,
      einddatum = EXCLUDED.einddatum,
      aantal_weken = EXCLUDED.aantal_weken,
      bijgewerkt_op = now()
  `

  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const rows = await sql`SELECT * FROM profiles WHERE user_id = ${session.user.id}`
  if (rows.length === 0) return NextResponse.json(null)
  return NextResponse.json(rows[0])
}
