# Migratie Supabase → Lokale PostgreSQL

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vervang Supabase (auth + database) door lokale PostgreSQL met NextAuth.js voor auth en postgres.js voor databasetoegang.

**Architecture:** NextAuth.js v5 met Credentials provider (email/bcrypt/JWT) vervangt Supabase Auth. postgres.js met raw SQL vervangt de Supabase client. Autorisatie gebeurt op applicatieniveau (user_id check in queries) in plaats van via Supabase RLS.

**Tech Stack:** next-auth@5, postgres (postgres.js), bcryptjs, PostgreSQL 15+

---

## Gewijzigde bestanden overzicht

```
running-schedule-app/
├── VERWIJDEREN:
│   ├── lib/supabase/client.ts
│   └── lib/supabase/server.ts
│
├── NIEUW:
│   ├── lib/db.ts                          # postgres.js connectie
│   ├── lib/auth.ts                        # NextAuth config + helpers
│   ├── next-auth.d.ts                     # TypeScript Session type uitbreiding
│   ├── app/api/auth/[...nextauth]/route.ts # NextAuth handlers
│   ├── app/api/auth/register/route.ts     # Registratie endpoint
│   ├── app/api/profile/route.ts           # GET + POST profiel
│   └── app/api/workouts/[id]/route.ts     # PATCH workout (afvinken)
│
├── AANGEPAST:
│   ├── package.json                       # deps wisselen
│   ├── .env.local.example                 # nieuwe vars, supabase vars weg
│   ├── proxy.ts                           # NextAuth session check
│   ├── app/page.tsx                       # NextAuth session
│   ├── app/(auth)/login/page.tsx          # NextAuth signIn()
│   ├── app/(auth)/register/page.tsx       # POST /api/auth/register
│   ├── app/onboarding/page.tsx            # NextAuth session
│   ├── app/dashboard/page.tsx            # server component + db direct
│   ├── components/onboarding/OnboardingWizard.tsx  # POST /api/profile
│   ├── app/api/generate/route.ts          # db i.p.v. supabase
│   ├── app/api/garmin/auth/route.ts       # db i.p.v. supabase
│   ├── app/api/garmin/activities/route.ts # db i.p.v. supabase
│   └── app/api/garmin/upload/route.ts     # db i.p.v. supabase
│
└── NIEUW (database):
    └── db/migrations/001_initial.sql      # schema zonder RLS, met users tabel
```

---

## Task 1: Dependencies en omgevingsvariabelen

**Files:**
- Modify: `running-schedule-app/package.json`
- Modify: `running-schedule-app/.env.local.example`
- Modify: `running-schedule-app/.env.local`

- [ ] **Stap 1: Verwijder Supabase packages, installeer nieuwe**

```bash
cd "c:/Users/fhett/OpenCloud/Persoonlijk/Claude Code/Running-Schedule-Garmin/running-schedule-app"
npm uninstall @supabase/supabase-js @supabase/ssr
npm install next-auth@beta postgres bcryptjs
npm install -D @types/bcryptjs
```

Verwacht: geen errors, `package.json` bevat niet meer `@supabase/*`.

- [ ] **Stap 2: Update .env.local.example**

Vervang de volledige inhoud van `.env.local.example`:

```
DATABASE_URL=postgresql://postgres:wachtwoord@localhost:5432/hardloopschema
NEXTAUTH_SECRET=vervang-dit-met-32-karakter-willekeurige-string
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
GARMIN_SERVICE_URL=http://localhost:8000
GARMIN_ENCRYPTION_KEY=32-karakter-random-sleutel-hier
```

- [ ] **Stap 3: Update .env.local met echte waarden**

```bash
# Genereer NEXTAUTH_SECRET
openssl rand -hex 32
```

Vul `.env.local` in:
```
DATABASE_URL=postgresql://postgres:jouwwachtwoord@localhost:5432/hardloopschema
NEXTAUTH_SECRET=<uitvoer van openssl commando>
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=<jouw sleutel>
GARMIN_SERVICE_URL=http://localhost:8000
GARMIN_ENCRYPTION_KEY=<jouw sleutel>
```

- [ ] **Stap 4: Commit**

```bash
git add package.json package-lock.json .env.local.example
git commit -m "chore: wissel Supabase voor NextAuth + postgres.js"
```

---

## Task 2: Database schema en postgres.js client

**Files:**
- Create: `db/migrations/001_initial.sql`
- Create: `lib/db.ts`
- Delete: `lib/supabase/client.ts`
- Delete: `lib/supabase/server.ts`

- [ ] **Stap 1: Maak database aan in PostgreSQL**

```bash
# Als postgres gebruiker (of met sudo)
psql -U postgres -c "CREATE DATABASE hardloopschema;"
# Of als je een andere gebruiker hebt:
createdb hardloopschema
```

- [ ] **Stap 2: Maak db/migrations/001_initial.sql**

```sql
-- Users (vervangt Supabase auth.users)
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  password_hash text not null,
  created_at  timestamptz default now()
);

-- Profiles
create table if not exists profiles (
  user_id              uuid primary key references users(id) on delete cascade,
  doel                 text not null,
  doelafstand_km       numeric,
  doeltijd_min         integer,
  doeltempo_min_km     text,
  leeftijd             integer not null,
  lengte_cm            integer not null,
  gewicht_kg           numeric not null,
  langste_afstand_km   numeric not null,
  frequentie_per_week  integer not null,
  jaren_actief         integer not null,
  blessures            text,
  trainingsdagen_per_week integer not null,
  trainingsdagen       text[] not null,
  dag_lange_loop       text not null,
  ondergrond           text not null,
  einddatum            date,
  aantal_weken         integer,
  aangemaakt_op        timestamptz default now(),
  bijgewerkt_op        timestamptz default now()
);

-- Schedules
create table if not exists schedules (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  aangemaakt_op timestamptz default now(),
  actief        boolean default true,
  totaal_weken  integer not null,
  startdatum    date not null,
  einddatum     date not null,
  raw_json      jsonb not null
);

create index if not exists schedules_user_actief on schedules(user_id, actief);

-- Weeks
create table if not exists weeks (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  weeknummer  integer not null,
  thema       text not null
);

-- Workouts
create table if not exists workouts (
  id          uuid primary key default gen_random_uuid(),
  week_id     uuid not null references weeks(id) on delete cascade,
  dag         text not null,
  type        text not null,
  afstand_km  numeric not null,
  hartslagzone integer not null,
  warming_up  jsonb not null,
  kern        jsonb not null,
  cooling_down jsonb not null,
  voltooid    boolean default false
);

-- Garmin connections
create table if not exists garmin_connections (
  user_id             uuid primary key references users(id) on delete cascade,
  username_encrypted  text not null,
  password_encrypted  text not null,
  laatste_sync        timestamptz
);
```

- [ ] **Stap 3: Voer migratie uit**

```bash
psql -U postgres -d hardloopschema -f db/migrations/001_initial.sql
```

Verwacht: `CREATE TABLE` voor elk van de 6 tabellen, geen errors.

- [ ] **Stap 4: Maak lib/db.ts**

```typescript
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
})

export default sql
```

- [ ] **Stap 5: Verwijder Supabase client bestanden**

```bash
rm lib/supabase/client.ts lib/supabase/server.ts
rmdir lib/supabase
```

- [ ] **Stap 6: TypeScript check**

```bash
npx tsc --noEmit
```

Verwacht: fouten over ontbrekende Supabase imports — die lossen we op in de volgende taken.

- [ ] **Stap 7: Commit**

```bash
git add db/ lib/db.ts
git rm lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: vervang Supabase client door postgres.js en nieuw database schema"
```

---

## Task 3: NextAuth configuratie

**Files:**
- Create: `lib/auth.ts`
- Create: `next-auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Stap 1: Maak next-auth.d.ts (TypeScript type uitbreiding)**

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
    }
  }
  interface User {
    id: string
    email: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
```

- [ ] **Stap 2: Maak lib/auth.ts**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import sql from './db'

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Wachtwoord', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const rows = await sql<{ id: string; email: string; password_hash: string }[]>`
          SELECT id, email, password_hash
          FROM users
          WHERE email = ${credentials.email as string}
        `
        const user = rows[0]
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
        if (!valid) return null

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
```

- [ ] **Stap 3: Maak app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

- [ ] **Stap 4: TypeScript check**

```bash
npx tsc --noEmit
```

Verwacht: minder fouten dan na Task 2 (auth.ts compileert nu). Nog fouten in bestanden die nog Supabase importeren.

- [ ] **Stap 5: Commit**

```bash
git add next-auth.d.ts lib/auth.ts app/api/auth/
git commit -m "feat: NextAuth.js met Credentials provider en postgres"
```

---

## Task 4: Registratie API route

**Files:**
- Create: `app/api/auth/register/route.ts`

- [ ] **Stap 1: Maak app/api/auth/register/route.ts**

```typescript
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
```

- [ ] **Stap 2: Commit**

```bash
git add app/api/auth/register/
git commit -m "feat: registratie endpoint met bcrypt"
```

---

## Task 5: Login en register pagina's updaten

**Files:**
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Stap 1: Vervang login/page.tsx volledig**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Ongeldig e-mailadres of wachtwoord')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">Inloggen</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Nog geen account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">Registreren</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Stap 2: Vervang register/page.tsx volledig**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Registreren mislukt')
      setLoading(false)
      return
    }

    // Direct inloggen na registratie
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Registratie gelukt, maar inloggen mislukt. Probeer in te loggen.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">Account aanmaken</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Al een account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Inloggen</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Stap 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Stap 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: login en register paginas gebruiken NextAuth"
```

---

## Task 6: Proxy (middleware) updaten

**Files:**
- Modify: `proxy.ts`

- [ ] **Stap 1: Vervang proxy.ts volledig**

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth(function proxy(request) {
  const { pathname } = request.nextUrl
  const session = request.auth

  const publicRoutes = ['/login', '/register']

  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Stap 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Stap 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: proxy gebruikt NextAuth session"
```

---

## Task 7: Server pagina's updaten (page.tsx, onboarding/page.tsx)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/onboarding/page.tsx`

- [ ] **Stap 1: Vervang app/page.tsx**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export default async function Home() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const profiles = await sql`
    SELECT user_id FROM profiles WHERE user_id = ${session.user.id}
  `

  if (profiles.length === 0) redirect('/onboarding')
  redirect('/dashboard')
}
```

- [ ] **Stap 2: Vervang app/onboarding/page.tsx**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return <OnboardingWizard userId={session.user.id} />
}
```

- [ ] **Stap 3: Commit**

```bash
git add app/page.tsx app/onboarding/page.tsx
git commit -m "feat: root en onboarding paginas gebruiken NextAuth session"
```

---

## Task 8: Profiel API route + OnboardingWizard updaten

**Files:**
- Create: `app/api/profile/route.ts`
- Modify: `components/onboarding/OnboardingWizard.tsx`

- [ ] **Stap 1: Maak app/api/profile/route.ts**

```typescript
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
```

- [ ] **Stap 2: Update OnboardingWizard.tsx — verwijder Supabase import, vervang door fetch**

Vervang de volledige `handleFinish` functie en de import van Supabase:

```typescript
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
```

- [ ] **Stap 3: Commit**

```bash
git add app/api/profile/ components/onboarding/OnboardingWizard.tsx
git commit -m "feat: profiel API route + OnboardingWizard zonder Supabase"
```

---

## Task 9: Dashboard herschrijven + workout toggle API

**Files:**
- Create: `app/api/workouts/[id]/route.ts`
- Modify: `app/dashboard/page.tsx`

- [ ] **Stap 1: Maak app/api/workouts/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const { voltooid } = await request.json()

  // Controleer dat de workout van deze gebruiker is
  const rows = await sql`
    SELECT wo.id
    FROM workouts wo
    JOIN weeks w ON w.id = wo.week_id
    JOIN schedules s ON s.id = w.schedule_id
    WHERE wo.id = ${id} AND s.user_id = ${session.user.id}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }

  await sql`UPDATE workouts SET voltooid = ${voltooid} WHERE id = ${id}`

  return NextResponse.json({ success: true })
}
```

- [ ] **Stap 2: Vervang app/dashboard/page.tsx volledig**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { Schedule, Week, Workout, WorkoutPhase } from '@/lib/types'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

async function loadSchedule(userId: string): Promise<Schedule | null> {
  const scheduleRows = await sql`
    SELECT id, totaal_weken, startdatum, einddatum
    FROM schedules
    WHERE user_id = ${userId} AND actief = true
    LIMIT 1
  `
  if (scheduleRows.length === 0) return null
  const s = scheduleRows[0]

  const weekRows = await sql`
    SELECT id, weeknummer, thema
    FROM weeks
    WHERE schedule_id = ${s.id}
    ORDER BY weeknummer
  `

  const weeks: Week[] = await Promise.all(weekRows.map(async w => {
    const workoutRows = await sql`
      SELECT id, dag, type, afstand_km, hartslagzone,
             warming_up, kern, cooling_down, voltooid
      FROM workouts
      WHERE week_id = ${w.id}
    `

    const workouts: Workout[] = workoutRows.map(wo => ({
      id: wo.id,
      week_id: w.id,
      dag: wo.dag,
      type: wo.type,
      distance_km: Number(wo.afstand_km),
      heart_rate_zone: wo.hartslagzone,
      warmup: wo.warming_up as WorkoutPhase,
      core: wo.kern as WorkoutPhase,
      cooldown: wo.cooling_down as WorkoutPhase,
      voltooid: wo.voltooid,
    }))

    return {
      id: w.id,
      schedule_id: s.id,
      week_number: w.weeknummer,
      theme: w.thema,
      workouts,
    }
  }))

  return {
    id: s.id,
    total_weeks: s.totaal_weken,
    start_date: String(s.startdatum),
    end_date: String(s.einddatum),
    weeks,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const schedule = await loadSchedule(session.user.id)
  if (!schedule) redirect('/onboarding')

  return <DashboardClient schedule={schedule} />
}
```

- [ ] **Stap 3: Maak components/dashboard/DashboardClient.tsx**

```typescript
'use client'

import { useState } from 'react'
import { Schedule, Week, Workout } from '@/lib/types'
import { WeekNavigation } from './WeekNavigation'
import { WorkoutCard } from './WorkoutCard'
import { GarminPanel } from './GarminPanel'

interface Props {
  schedule: Schedule
}

export function DashboardClient({ schedule: initialSchedule }: Props) {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [activeWeekNum, setActiveWeekNum] = useState(1)
  const [regenerating, setRegenerating] = useState(false)

  async function toggleWorkoutComplete(workoutId: string, voltooid: boolean) {
    await fetch(`/api/workouts/${workoutId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voltooid }),
    })
    setSchedule(prev => ({
      ...prev,
      weeks: prev.weeks.map(w => ({
        ...w,
        workouts: w.workouts.map(wo =>
          wo.id === workoutId ? { ...wo, voltooid } : wo
        ),
      })),
    }))
  }

  async function regenerateSchedule() {
    setRegenerating(true)
    const profileRes = await fetch('/api/profile')
    if (!profileRes.ok) { setRegenerating(false); return }
    const profile = await profileRes.json()

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })

    if (res.ok) window.location.reload()
    setRegenerating(false)
  }

  const activeWeek = schedule.weeks.find(w => w.week_number === activeWeekNum)
  const completedCount = schedule.weeks.flatMap(w => w.workouts).filter(wo => wo.voltooid).length
  const totalCount = schedule.weeks.flatMap(w => w.workouts).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mijn Schema</h1>
          <p className="text-gray-500 text-sm mt-1">
            {completedCount} / {totalCount} trainingen voltooid
          </p>
        </div>
        <button
          onClick={regenerateSchedule}
          disabled={regenerating}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {regenerating ? 'Genereren...' : '↺ Opnieuw genereren'}
        </button>
      </div>

      <div className="h-2 bg-gray-200 rounded-full mb-6">
        <div
          className="h-2 bg-green-500 rounded-full transition-all"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <WeekNavigation
        weeks={schedule.weeks}
        activeWeek={activeWeekNum}
        onSelectWeek={setActiveWeekNum}
      />

      {activeWeek && (
        <div className="mt-4">
          <div className="mb-3">
            <h2 className="font-semibold text-lg">Week {activeWeek.week_number}</h2>
            <p className="text-gray-500 text-sm">{activeWeek.theme}</p>
          </div>
          <div className="space-y-3">
            {activeWeek.workouts.map(workout => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onToggleComplete={toggleWorkoutComplete}
              />
            ))}
          </div>
          <GarminPanel
            weekWorkouts={activeWeek.workouts.map(wo => ({
              dag: wo.dag,
              type: wo.type,
              distance_km: wo.distance_km,
              warmup: wo.warmup,
              core: wo.core,
              cooldown: wo.cooldown,
            }))}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Stap 4: Commit**

```bash
git add app/api/workouts/ app/dashboard/page.tsx components/dashboard/DashboardClient.tsx
git commit -m "feat: dashboard server component + workout toggle API"
```

---

## Task 10: API routes updaten (generate + garmin)

**Files:**
- Modify: `app/api/generate/route.ts`
- Modify: `app/api/garmin/auth/route.ts`
- Modify: `app/api/garmin/activities/route.ts`
- Modify: `app/api/garmin/upload/route.ts`

- [ ] **Stap 1: Vervang app/api/generate/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { generateSchedule } from '@/lib/claude'
import { UserProfile, GarminSummary } from '@/lib/types'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { profile, garminData } = await request.json() as {
    profile: UserProfile
    garminData?: GarminSummary
  }

  let schedule
  try {
    schedule = await generateSchedule(profile, garminData)
  } catch (e) {
    console.error('Claude fout:', e)
    return NextResponse.json({ error: 'Schema generatie mislukt' }, { status: 500 })
  }

  // Markeer vorige schema's als inactief
  await sql`
    UPDATE schedules SET actief = false WHERE user_id = ${session.user.id}
  `

  // Sla nieuw schema op
  const newScheduleRows = await sql`
    INSERT INTO schedules (user_id, actief, totaal_weken, startdatum, einddatum, raw_json)
    VALUES (${session.user.id}, true, ${schedule.total_weeks},
            ${schedule.start_date}, ${schedule.end_date}, ${JSON.stringify(schedule)})
    RETURNING id
  `
  const scheduleId = newScheduleRows[0].id

  // Sla weken en workouts op
  for (const week of schedule.weeks) {
    const weekRows = await sql`
      INSERT INTO weeks (schedule_id, weeknummer, thema)
      VALUES (${scheduleId}, ${week.week_number}, ${week.theme})
      RETURNING id
    `
    const weekId = weekRows[0].id

    for (const workout of week.workouts) {
      await sql`
        INSERT INTO workouts
          (week_id, dag, type, afstand_km, hartslagzone,
           warming_up, kern, cooling_down, voltooid)
        VALUES
          (${weekId}, ${workout.dag}, ${workout.type},
           ${workout.distance_km}, ${workout.heart_rate_zone},
           ${JSON.stringify(workout.warmup)},
           ${JSON.stringify(workout.core)},
           ${JSON.stringify(workout.cooldown)},
           false)
      `
    }
  }

  return NextResponse.json({ success: true, scheduleId })
}
```

- [ ] **Stap 2: Vervang app/api/garmin/auth/route.ts**

```typescript
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
```

- [ ] **Stap 3: Vervang app/api/garmin/activities/route.ts**

```typescript
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
```

- [ ] **Stap 4: Vervang app/api/garmin/upload/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { workouts } = await request.json()

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

  const garminRes = await fetch(`${process.env.GARMIN_SERVICE_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, workouts }),
  })

  return NextResponse.json(await garminRes.json())
}
```

- [ ] **Stap 5: TypeScript check**

```bash
npx tsc --noEmit
```

Verwacht: geen errors meer.

- [ ] **Stap 6: Build check**

```bash
npm run build
```

Verwacht: succesvolle build.

- [ ] **Stap 7: Commit**

```bash
git add app/api/
git commit -m "feat: alle API routes gebruiken NextAuth + postgres.js"
```

---

## Task 11: README updaten + opruimen

**Files:**
- Modify: `README.md`
- Delete: `running-schedule-app/.env.local.example` (al gedaan in Task 1, checken)

- [ ] **Stap 1: Vervang de omgevingsvariabelen sectie in README.md**

Vind de sectie `## Omgevingsvariabelen` en vervang de tabel + uitleg volledig:

```markdown
## Omgevingsvariabelen

Kopieer eerst het voorbeeld bestand:

```bash
cd running-schedule-app
cp .env.local.example .env.local
```

---

### 1. `DATABASE_URL`

**Wat:** Verbindingsstring naar jouw PostgreSQL database.

**Formaat:** `postgresql://gebruiker:wachtwoord@host:poort/databasenaam`

**Lokaal aanmaken:**
```bash
# Database aanmaken (als postgres superuser)
psql -U postgres -c "CREATE DATABASE hardloopschema;"

# Of met een eigen gebruiker
createdb hardloopschema
```

```
DATABASE_URL=postgresql://postgres:mijnwachtwoord@localhost:5432/hardloopschema
```

---

### 2. `NEXTAUTH_SECRET`

**Wat:** Willekeurige geheime string waarmee NextAuth.js JWT-tokens ondertekent. Minimaal 32 tekens.

**Genereren:**
```bash
openssl rand -hex 32
# Voorbeeld: a3f8c2d1e9b4f7a0c6d3e2f1b9a4c7d0e8f3b2a1c9d4e7f0b3a2c1d9e8f7b4
```

```
NEXTAUTH_SECRET=a3f8c2d1e9b4f7a0c6d3e2f1b9a4c7d0e8f3b2a1c9d4e7f0b3a2c1d9e8f7b4
```

> Verlies je deze sleutel, dan worden alle actieve sessies ongeldig.

---

### 3. `NEXTAUTH_URL`

**Wat:** De publieke URL van de app. NextAuth gebruikt dit voor callbacks.

```
NEXTAUTH_URL=http://localhost:3000         # lokaal
NEXTAUTH_URL=https://jouwapp.vercel.app    # productie
```

---

### 4. `ANTHROPIC_API_KEY`

**Wat:** API-sleutel voor de Claude API.

**Hoe verkrijgen:**
1. Ga naar [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Kopieer de sleutel direct (wordt maar één keer getoond)

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

### 5. `GARMIN_SERVICE_URL`

**Wat:** Adres van de Python Garmin microservice.

```
GARMIN_SERVICE_URL=http://localhost:8000   # lokaal
GARMIN_SERVICE_URL=https://xxx.railway.app # na deployen
```

---

### 6. `GARMIN_ENCRYPTION_KEY`

**Wat:** 32-karakter sleutel voor AES-256 versleuteling van Garmin credentials.

```bash
openssl rand -hex 16
# Voorbeeld: 4a7f2c9d1e8b3f6a0c5d2e9f4b7a1e3d
```

```
GARMIN_ENCRYPTION_KEY=4a7f2c9d1e8b3f6a0c5d2e9f4b7a1e3d
```

---

### Volledig ingevuld voorbeeld

```env
DATABASE_URL=postgresql://postgres:mijnwachtwoord@localhost:5432/hardloopschema
NEXTAUTH_SECRET=a3f8c2d1e9b4f7a0c6d3e2f1b9a4c7d0e8f3b2a1c9d4e7f0b3a2c1d9e8f7b4
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
GARMIN_SERVICE_URL=http://localhost:8000
GARMIN_ENCRYPTION_KEY=4a7f2c9d1e8b3f6a0c5d2e9f4b7a1e3d
```
```

- [ ] **Stap 2: Commit en push**

```bash
git add README.md .env.local.example
git commit -m "docs: README bijgewerkt voor lokale PostgreSQL + NextAuth"
git push
```

---

## Zelf-review: Spec coverage

| Vereiste | Gedekt in taak |
|----------|---------------|
| Supabase deps verwijderd | Task 1 |
| postgres.js client | Task 2 |
| users tabel in eigen schema | Task 2 |
| NextAuth Credentials provider + bcrypt | Task 3 |
| Registratie endpoint | Task 4 |
| Login/register pagina's | Task 5 |
| Middleware (proxy.ts) | Task 6 |
| Server pagina's (page.tsx, onboarding) | Task 7 |
| Profiel opslaan via API | Task 8 |
| OnboardingWizard zonder Supabase client | Task 8 |
| Dashboard als server component | Task 9 |
| Workout toggle API | Task 9 |
| generate route → postgres.js | Task 10 |
| garmin/* routes → postgres.js | Task 10 |
| README bijgewerkt | Task 11 |
