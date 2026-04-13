# Running Schedule Garmin App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw een mobiel-vriendelijke Next.js web app die via een onboarding wizard een gepersonaliseerd hardloopschema genereert met de Claude API en workouts exporteert naar Garmin Connect.

**Architecture:** Next.js (App Router) op Vercel voor frontend + API routes, Supabase voor auth + database, Python FastAPI microservice op Railway voor Garmin Connect integratie.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, @anthropic-ai/sdk, Python FastAPI, python-garminconnect

---

## File Structure

```
running-schedule-app/
├── app/
│   ├── layout.tsx                    # Root layout + Supabase provider
│   ├── page.tsx                      # Redirect naar /onboarding of /dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── onboarding/page.tsx           # Wizard container
│   ├── dashboard/page.tsx            # Dashboard container
│   └── api/
│       ├── generate/route.ts         # Claude API aanroep
│       └── garmin/
│           ├── auth/route.ts         # Proxy naar Python service
│           ├── activities/route.ts
│           └── upload/route.ts
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.tsx      # Wizard state machine
│   │   ├── ProgressBar.tsx
│   │   └── steps/
│   │       ├── Step1Goal.tsx
│   │       ├── Step2Tempo.tsx
│   │       ├── Step3Profile.tsx
│   │       ├── Step4Condition.tsx
│   │       ├── Step5Injuries.tsx
│   │       ├── Step6Planning.tsx
│   │       └── Step7Timeline.tsx
│   └── dashboard/
│       ├── WeekNavigation.tsx
│       ├── WorkoutCard.tsx
│       ├── WorkoutDetail.tsx
│       └── GarminPanel.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── server.ts                 # Server Supabase client
│   ├── claude.ts                     # Schema generatie prompt + aanroep
│   └── types.ts                      # Gedeelde TypeScript types
├── middleware.ts                      # Auth route protection
├── supabase/migrations/001_initial.sql
├── .env.local.example
└── package.json

garmin-service/
├── main.py                           # FastAPI app (3 endpoints)
├── garmin_client.py                  # python-garminconnect wrapper
├── fit_builder.py                    # FIT bestand generatie
├── models.py                         # Pydantic models
├── requirements.txt
└── Dockerfile
```

---

## Task 1: Next.js Project Aanmaken

**Files:**
- Create: `running-schedule-app/` (project root)
- Create: `running-schedule-app/package.json`
- Create: `running-schedule-app/.env.local.example`

- [ ] **Stap 1: Maak Next.js project aan**

```bash
cd "c:/Users/fhett/OpenCloud/Persoonlijk/Claude Code/Running-Schedule-Garmin"
npx create-next-app@latest running-schedule-app \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd running-schedule-app
```

- [ ] **Stap 2: Installeer dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
npm install -D @types/node
```

- [ ] **Stap 3: Maak .env.local.example aan**

```bash
cat > .env.local.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
GARMIN_SERVICE_URL=http://localhost:8000
GARMIN_ENCRYPTION_KEY=32-karakter-random-sleutel-hier
EOF
```

- [ ] **Stap 4: Kopieer naar .env.local en vul in**

```bash
cp .env.local.example .env.local
# Vul de waarden in vanuit Supabase dashboard en Anthropic console
```

- [ ] **Stap 5: Commit**

```bash
git init
git add .
git commit -m "feat: initieel Next.js project met dependencies"
```

---

## Task 2: TypeScript Types Definiëren

**Files:**
- Create: `running-schedule-app/lib/types.ts`

- [ ] **Stap 1: Schrijf types**

Maak `lib/types.ts`:

```typescript
// Onboarding / Profiel
export type Doel = '5K' | '10K' | 'HM' | 'M' | 'custom' | 'conditie'
export type Ondergrond = 'weg' | 'trail' | 'gemengd'
export type TrainingsType =
  | 'herstelloop'
  | 'duurloop'
  | 'intervaltraining'
  | 'drempeltraining'
  | 'lange_duurlloop'
  | 'fartlek'

export interface UserProfile {
  // Stap 1
  doel: Doel
  doelafstand_km?: number
  // Stap 2
  doeltijd_min?: number      // totaal in minuten
  doeltempo_min_km?: string  // bijv. "5:30"
  // Stap 3
  leeftijd: number
  lengte_cm: number
  gewicht_kg: number
  // Stap 4
  langste_afstand_km: number
  frequentie_per_week: number
  jaren_actief: number
  // Stap 5
  blessures?: string
  // Stap 6
  trainingsdagen_per_week: number
  trainingsdagen: string[]   // ['maandag', 'woensdag', 'vrijdag', 'zondag']
  dag_lange_loop: string
  ondergrond: Ondergrond
  // Stap 7
  einddatum?: string         // ISO datum string
  aantal_weken?: number
}

// Claude output
export interface WorkoutPhase {
  description: string
  distance_km: number
  pace_min_km: string
}

export interface Workout {
  id?: string
  week_id?: string
  dag: string
  type: TrainingsType
  distance_km: number
  heart_rate_zone: number
  warmup: WorkoutPhase
  core: WorkoutPhase
  cooldown: WorkoutPhase
  voltooid?: boolean
}

export interface Week {
  id?: string
  schedule_id?: string
  week_number: number
  theme: string
  workouts: Workout[]
}

export interface Schedule {
  id?: string
  total_weeks: number
  start_date: string
  end_date: string
  weeks: Week[]
}

// Garmin
export interface GarminActivity {
  date: string
  distance_km: number
  duration_min: number
  avg_pace_min_km: string
}

export interface GarminSummary {
  avg_weekly_km: number
  fastest_pace_min_km: string
  longest_run_km: number
  activities: GarminActivity[]
}
```

- [ ] **Stap 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: TypeScript types voor profiel, schema en Garmin"
```

---

## Task 3: Supabase Client Setup + Database Schema

**Files:**
- Create: `running-schedule-app/lib/supabase/client.ts`
- Create: `running-schedule-app/lib/supabase/server.ts`
- Create: `running-schedule-app/middleware.ts`
- Create: `running-schedule-app/supabase/migrations/001_initial.sql`

- [ ] **Stap 1: Maak Supabase browser client**

Maak `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Stap 2: Maak Supabase server client**

Maak `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Stap 3: Maak middleware voor auth**

Maak `middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Niet-ingelogde gebruikers naar login sturen (behalve auth routes)
  const publicRoutes = ['/login', '/register']
  if (!user && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Ingelogde gebruikers niet naar auth routes laten
  if (user && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
```

- [ ] **Stap 4: Maak database migratie SQL**

Maak `supabase/migrations/001_initial.sql`:

```sql
-- Profiles
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  doel text not null,
  doelafstand_km numeric,
  doeltijd_min integer,
  doeltempo_min_km text,
  leeftijd integer not null,
  lengte_cm integer not null,
  gewicht_kg numeric not null,
  langste_afstand_km numeric not null,
  frequentie_per_week integer not null,
  jaren_actief integer not null,
  blessures text,
  trainingsdagen_per_week integer not null,
  trainingsdagen text[] not null,
  dag_lange_loop text not null,
  ondergrond text not null,
  einddatum date,
  aantal_weken integer,
  aangemaakt_op timestamptz default now(),
  bijgewerkt_op timestamptz default now()
);

-- Schedules
create table schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aangemaakt_op timestamptz default now(),
  actief boolean default true,
  totaal_weken integer not null,
  startdatum date not null,
  einddatum date not null,
  raw_json jsonb not null
);

-- Index om snel actief schema op te halen
create index schedules_user_actief on schedules(user_id, actief);

-- Weeks
create table weeks (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedules(id) on delete cascade,
  weeknummer integer not null,
  thema text not null
);

-- Workouts
create table workouts (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  dag text not null,
  type text not null,
  afstand_km numeric not null,
  hartslagzone integer not null,
  warming_up jsonb not null,
  kern jsonb not null,
  cooling_down jsonb not null,
  voltooid boolean default false
);

-- Garmin connections
create table garmin_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username_encrypted text not null,
  password_encrypted text not null,
  laatste_sync timestamptz
);

-- Row Level Security
alter table profiles enable row level security;
alter table schedules enable row level security;
alter table weeks enable row level security;
alter table workouts enable row level security;
alter table garmin_connections enable row level security;

-- RLS policies
create policy "Eigen profiel" on profiles for all using (auth.uid() = user_id);
create policy "Eigen schema's" on schedules for all using (auth.uid() = user_id);
create policy "Eigen weken" on weeks for all
  using (schedule_id in (select id from schedules where user_id = auth.uid()));
create policy "Eigen workouts" on workouts for all
  using (week_id in (
    select w.id from weeks w
    join schedules s on s.id = w.schedule_id
    where s.user_id = auth.uid()
  ));
create policy "Eigen Garmin" on garmin_connections for all using (auth.uid() = user_id);
```

- [ ] **Stap 5: Voer migratie uit in Supabase**

Open Supabase dashboard → SQL Editor → plak inhoud van `001_initial.sql` → Run.

- [ ] **Stap 6: Commit**

```bash
git add lib/supabase/ middleware.ts supabase/
git commit -m "feat: Supabase clients, middleware en database schema"
```

---

## Task 4: Auth Pagina's (Login + Register)

**Files:**
- Create: `running-schedule-app/app/(auth)/login/page.tsx`
- Create: `running-schedule-app/app/(auth)/register/page.tsx`
- Create: `running-schedule-app/app/layout.tsx`
- Create: `running-schedule-app/app/page.tsx`

- [ ] **Stap 1: Maak root layout**

Maak `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hardloopschema',
  description: 'Gepersonaliseerd hardlooptrainingsschema met Garmin integratie',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Stap 2: Maak root redirect pagina**

Maak `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check of gebruiker al een profiel heeft
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  redirect('/dashboard')
}
```

- [ ] **Stap 3: Maak login pagina**

Maak `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Ongeldig e-mailadres of wachtwoord')
      setLoading(false)
      return
    }
    router.push('/')
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

- [ ] **Stap 4: Maak register pagina**

Maak `app/(auth)/register/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/onboarding')
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

- [ ] **Stap 5: Test in browser**

```bash
npm run dev
```

Ga naar `http://localhost:3000` → zou naar `/login` moeten redirecten. Registreer een account, controleer of je naar `/onboarding` gaat.

- [ ] **Stap 6: Commit**

```bash
git add app/
git commit -m "feat: auth paginas login en register met Supabase"
```

---

## Task 5: Onboarding Wizard

**Files:**
- Create: `running-schedule-app/components/onboarding/OnboardingWizard.tsx`
- Create: `running-schedule-app/components/onboarding/ProgressBar.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step1Goal.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step2Tempo.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step3Profile.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step4Condition.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step5Injuries.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step6Planning.tsx`
- Create: `running-schedule-app/components/onboarding/steps/Step7Timeline.tsx`
- Create: `running-schedule-app/app/onboarding/page.tsx`

- [ ] **Stap 1: Maak ProgressBar component**

Maak `components/onboarding/ProgressBar.tsx`:

```typescript
interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Stap {current} van {total}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Stap 2: Maak Step1Goal**

Maak `components/onboarding/steps/Step1Goal.tsx`:

```typescript
import { Doel, UserProfile } from '@/lib/types'

const DOELEN: { value: Doel; label: string; afstand?: number }[] = [
  { value: '5K', label: '5 kilometer', afstand: 5 },
  { value: '10K', label: '10 kilometer', afstand: 10 },
  { value: 'HM', label: 'Halve marathon', afstand: 21.1 },
  { value: 'M', label: 'Marathon', afstand: 42.2 },
  { value: 'custom', label: 'Aangepaste afstand' },
  { value: 'conditie', label: 'Algemene conditie verbeteren' },
]

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step1Goal({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Wat is je trainingsdoel?</h2>
      <div className="grid grid-cols-1 gap-3">
        {DOELEN.map(doel => (
          <button
            key={doel.value}
            onClick={() => onChange({
              doel: doel.value,
              doelafstand_km: doel.afstand,
            })}
            className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
              data.doel === doel.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {doel.label}
          </button>
        ))}
      </div>
      {data.doel === 'custom' && (
        <div>
          <label className="block text-sm font-medium mb-1">Afstand (km)</label>
          <input
            type="number"
            min={1}
            max={200}
            value={data.doelafstand_km ?? ''}
            onChange={e => onChange({ doelafstand_km: parseFloat(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Stap 3: Maak Step2Tempo**

Maak `components/onboarding/steps/Step2Tempo.tsx`:

```typescript
import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step2Tempo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Heb je een tijd- of tempodoel?</h2>
      <p className="text-gray-500 text-sm">Optioneel — sla over als je nog geen doel hebt.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Doeltijd (min:sec)</label>
          <input
            type="text"
            placeholder="bijv. 45:00"
            value={data.doeltijd_min ? `${Math.floor(data.doeltijd_min)}:00` : ''}
            onChange={e => {
              const [min] = e.target.value.split(':').map(Number)
              if (!isNaN(min)) onChange({ doeltijd_min: min })
            }}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-center text-gray-400 text-sm">of</div>
        <div>
          <label className="block text-sm font-medium mb-1">Doeltempo (min/km)</label>
          <input
            type="text"
            placeholder="bijv. 5:30"
            value={data.doeltempo_min_km ?? ''}
            onChange={e => onChange({ doeltempo_min_km: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Stap 4: Maak Step3Profile**

Maak `components/onboarding/steps/Step3Profile.tsx`:

```typescript
import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step3Profile({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Jouw profiel</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Leeftijd</label>
        <input
          type="number" min={10} max={100}
          value={data.leeftijd ?? ''}
          onChange={e => onChange({ leeftijd: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Lengte (cm)</label>
        <input
          type="number" min={100} max={250}
          value={data.lengte_cm ?? ''}
          onChange={e => onChange({ lengte_cm: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
        <input
          type="number" min={30} max={200}
          value={data.gewicht_kg ?? ''}
          onChange={e => onChange({ gewicht_kg: parseFloat(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
```

- [ ] **Stap 5: Maak Step4Condition**

Maak `components/onboarding/steps/Step4Condition.tsx`:

```typescript
import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step4Condition({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Huidige conditie</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Langste afstand recent (km)</label>
        <input
          type="number" min={0} max={200} step={0.5}
          value={data.langste_afstand_km ?? ''}
          onChange={e => onChange({ langste_afstand_km: parseFloat(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Trainingsfrequentie (keer per week)</label>
        <input
          type="number" min={0} max={14}
          value={data.frequentie_per_week ?? ''}
          onChange={e => onChange({ frequentie_per_week: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Jaar hardlopend</label>
        <input
          type="number" min={0} max={50}
          value={data.jaren_actief ?? ''}
          onChange={e => onChange({ jaren_actief: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
```

- [ ] **Stap 6: Maak Step5Injuries**

Maak `components/onboarding/steps/Step5Injuries.tsx`:

```typescript
import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step5Injuries({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Blessures & beperkingen</h2>
      <p className="text-gray-500 text-sm">Optioneel — beschrijf eventuele blessures of fysieke beperkingen zodat het schema hier rekening mee houdt.</p>
      <textarea
        rows={5}
        placeholder="bijv. Kniepijn bij hardlopen bergaf, pas hersteld van achillespeesblessure..."
        value={data.blessures ?? ''}
        onChange={e => onChange({ blessures: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>
  )
}
```

- [ ] **Stap 7: Maak Step6Planning**

Maak `components/onboarding/steps/Step6Planning.tsx`:

```typescript
import { Ondergrond, UserProfile } from '@/lib/types'

const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
const ONDERGRONDEN: { value: Ondergrond; label: string }[] = [
  { value: 'weg', label: 'Weg / asfalt' },
  { value: 'trail', label: 'Trail / natuur' },
  { value: 'gemengd', label: 'Gemengd' },
]

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step6Planning({ data, onChange }: Props) {
  const selectedDagen = data.trainingsdagen ?? []

  function toggleDag(dag: string) {
    const newDagen = selectedDagen.includes(dag)
      ? selectedDagen.filter(d => d !== dag)
      : [...selectedDagen, dag]
    onChange({
      trainingsdagen: newDagen,
      trainingsdagen_per_week: newDagen.length,
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Trainingsplanning</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Op welke dagen wil je trainen?</label>
        <div className="grid grid-cols-4 gap-2">
          {DAGEN.map(dag => (
            <button
              key={dag}
              onClick={() => toggleDag(dag)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDagen.includes(dag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {dag.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {selectedDagen.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Dag voor de lange duurloop</label>
          <select
            value={data.dag_lange_loop ?? ''}
            onChange={e => onChange({ dag_lange_loop: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Kies een dag</option>
            {selectedDagen.map(dag => (
              <option key={dag} value={dag}>{dag.charAt(0).toUpperCase() + dag.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Ondergrond</label>
        <div className="space-y-2">
          {ONDERGRONDEN.map(o => (
            <button
              key={o.value}
              onClick={() => onChange({ ondergrond: o.value })}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                data.ondergrond === o.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Stap 8: Maak Step7Timeline**

Maak `components/onboarding/steps/Step7Timeline.tsx`:

```typescript
import { UserProfile } from '@/lib/types'

interface Props {
  data: Partial<UserProfile>
  onChange: (data: Partial<UserProfile>) => void
}

export function Step7Timeline({ data, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tijdlijn</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Einddatum (bijv. wedstrijddatum)</label>
        <input
          type="date"
          min={today}
          value={data.einddatum ?? ''}
          onChange={e => onChange({ einddatum: e.target.value, aantal_weken: undefined })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="text-center text-gray-400 text-sm">of</div>

      <div>
        <label className="block text-sm font-medium mb-1">Aantal weken</label>
        <input
          type="number"
          min={4}
          max={52}
          value={data.aantal_weken ?? ''}
          onChange={e => onChange({ aantal_weken: parseInt(e.target.value), einddatum: undefined })}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">
          Je kunt later ook je Garmin Connect account koppelen vanuit het dashboard.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Stap 9: Maak OnboardingWizard**

Maak `components/onboarding/OnboardingWizard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
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
    case 2: return true // optioneel
    case 3: return !!data.leeftijd && !!data.lengte_cm && !!data.gewicht_kg
    case 4: return !!data.langste_afstand_km && !!data.frequentie_per_week && data.jaren_actief !== undefined
    case 5: return true // optioneel
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
  const supabase = createClient()

  function updateProfile(updates: Partial<UserProfile>) {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  async function handleFinish() {
    setSaving(true)
    setError('')

    // Profiel opslaan
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...profile })

    if (profileError) {
      setError('Fout bij opslaan profiel: ' + profileError.message)
      setSaving(false)
      return
    }

    // Schema genereren
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })

    if (!response.ok) {
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

- [ ] **Stap 10: Maak onboarding page**

Maak `app/onboarding/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <OnboardingWizard userId={user.id} />
}
```

- [ ] **Stap 11: Test wizard in browser**

Ga naar `http://localhost:3000/onboarding` en doorloop alle 7 stappen. Controleer of validatie werkt (Volgende-knop disabled).

- [ ] **Stap 12: Commit**

```bash
git add components/onboarding/ app/onboarding/
git commit -m "feat: onboarding wizard met 7 stappen"
```

---

## Task 6: Claude API Schema Generatie

**Files:**
- Create: `running-schedule-app/lib/claude.ts`
- Create: `running-schedule-app/app/api/generate/route.ts`

- [ ] **Stap 1: Maak claude.ts met prompt**

Maak `lib/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { UserProfile, GarminSummary, Schedule } from './types'

const client = new Anthropic()

export async function generateSchedule(
  profile: UserProfile,
  garminData?: GarminSummary
): Promise<Schedule> {
  const today = new Date().toISOString().split('T')[0]

  const garminContext = garminData
    ? `
## Garmin Connect data (afgelopen 3 maanden)
- Gemiddelde wekelijkse km: ${garminData.avg_weekly_km.toFixed(1)} km
- Snelste recente tempo: ${garminData.fastest_pace_min_km} min/km
- Langste loop: ${garminData.longest_run_km} km
`
    : ''

  const prompt = `Je bent een professionele hardloopcoach. Genereer een gepersonaliseerd hardlooptrainingsschema als JSON.

## Gebruikersprofiel
- Doel: ${profile.doel}${profile.doelafstand_km ? ` (${profile.doelafstand_km} km)` : ''}
- Doeltijd: ${profile.doeltijd_min ? `${profile.doeltijd_min} minuten` : 'niet opgegeven'}
- Doeltempo: ${profile.doeltempo_min_km ?? 'niet opgegeven'}
- Leeftijd: ${profile.leeftijd} jaar
- Lengte: ${profile.lengte_cm} cm
- Gewicht: ${profile.gewicht_kg} kg
- Langste recente afstand: ${profile.langste_afstand_km} km
- Trainingsfrequentie: ${profile.frequentie_per_week} keer/week
- Jaren actief als hardloper: ${profile.jaren_actief}
- Blessures/beperkingen: ${profile.blessures || 'geen'}
- Trainingsdagen: ${profile.trainingsdagen.join(', ')}
- Dag lange duurloop: ${profile.dag_lange_loop}
- Ondergrond: ${profile.ondergrond}
- ${profile.einddatum ? `Einddatum: ${profile.einddatum}` : `Aantal weken: ${profile.aantal_weken}`}
${garminContext}

## Vereisten
1. Schema start op ${today}
2. Trainingen ALLEEN op de opgegeven trainingsdagen
3. De lange duurloop ALTIJD op ${profile.dag_lange_loop}
4. Progressieve opbouw (10% regel)
5. Elke training heeft warming-up, kern en cooling-down met realistisch tempo
6. Hartslagzones: 1-5 (zone 2 = duurlopen, zone 4-5 = interval/drempel)

## Verplicht JSON formaat
Geef ALLEEN geldige JSON terug, geen tekst of markdown:

{
  "total_weeks": <getal>,
  "start_date": "<YYYY-MM-DD>",
  "end_date": "<YYYY-MM-DD>",
  "weeks": [
    {
      "week_number": 1,
      "theme": "<thema van de week>",
      "workouts": [
        {
          "dag": "<dag in het Nederlands>",
          "type": "<herstelloop|duurloop|intervaltraining|drempeltraining|lange_duurlloop|fartlek>",
          "distance_km": <getal>,
          "heart_rate_zone": <1-5>,
          "warmup": { "description": "<beschrijving>", "distance_km": <getal>, "pace_min_km": "<M:SS>" },
          "core": { "description": "<beschrijving>", "distance_km": <getal>, "pace_min_km": "<M:SS>" },
          "cooldown": { "description": "<beschrijving>", "distance_km": <getal>, "pace_min_km": "<M:SS>" }
        }
      ]
    }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: 'Je bent een professionele hardloopcoach. Geef altijd alleen geldige JSON terug zonder markdown of uitleg.',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const schedule: Schedule = JSON.parse(text)
  return schedule
}
```

- [ ] **Stap 2: Maak generate API route**

Maak `app/api/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSchedule } from '@/lib/claude'
import { UserProfile } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { profile, garminData } = await request.json() as {
    profile: UserProfile
    garminData?: Parameters<typeof generateSchedule>[1]
  }

  let schedule
  try {
    schedule = await generateSchedule(profile, garminData)
  } catch (e) {
    console.error('Claude fout:', e)
    return NextResponse.json({ error: 'Schema generatie mislukt' }, { status: 500 })
  }

  // Markeer vorige schema's als inactief
  await supabase
    .from('schedules')
    .update({ actief: false })
    .eq('user_id', user.id)

  // Sla nieuw schema op
  const { data: newSchedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert({
      user_id: user.id,
      actief: true,
      totaal_weken: schedule.total_weeks,
      startdatum: schedule.start_date,
      einddatum: schedule.end_date,
      raw_json: schedule,
    })
    .select('id')
    .single()

  if (scheduleError || !newSchedule) {
    return NextResponse.json({ error: 'Opslaan schema mislukt' }, { status: 500 })
  }

  // Sla weken en workouts op
  for (const week of schedule.weeks) {
    const { data: weekRow } = await supabase
      .from('weeks')
      .insert({
        schedule_id: newSchedule.id,
        weeknummer: week.week_number,
        thema: week.theme,
      })
      .select('id')
      .single()

    if (!weekRow) continue

    for (const workout of week.workouts) {
      await supabase.from('workouts').insert({
        week_id: weekRow.id,
        dag: workout.dag,
        type: workout.type,
        afstand_km: workout.distance_km,
        hartslagzone: workout.heart_rate_zone,
        warming_up: workout.warmup,
        kern: workout.core,
        cooling_down: workout.cooldown,
        voltooid: false,
      })
    }
  }

  return NextResponse.json({ success: true, scheduleId: newSchedule.id })
}
```

- [ ] **Stap 3: Test schema generatie**

Doorloop de volledige onboarding wizard en controleer:
1. Supabase → Table Editor → `schedules` heeft een nieuwe rij
2. `weeks` tabel heeft weken
3. `workouts` tabel heeft trainingen
4. Redirect naar `/dashboard` werkt (ook al is de pagina nog leeg)

- [ ] **Stap 4: Commit**

```bash
git add lib/claude.ts app/api/generate/
git commit -m "feat: Claude API schema generatie met Supabase opslag"
```

---

## Task 7: Dashboard + Week View

**Files:**
- Create: `running-schedule-app/components/dashboard/WeekNavigation.tsx`
- Create: `running-schedule-app/components/dashboard/WorkoutCard.tsx`
- Create: `running-schedule-app/components/dashboard/WorkoutDetail.tsx`
- Create: `running-schedule-app/app/dashboard/page.tsx`

- [ ] **Stap 1: Maak WorkoutCard**

Maak `components/dashboard/WorkoutCard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Workout } from '@/lib/types'
import { WorkoutDetail } from './WorkoutDetail'
import { createClient } from '@/lib/supabase/client'

const TYPE_KLEUREN: Record<string, string> = {
  herstelloop: 'bg-green-100 text-green-800',
  duurloop: 'bg-blue-100 text-blue-800',
  intervaltraining: 'bg-red-100 text-red-800',
  drempeltraining: 'bg-purple-100 text-purple-800',
  lange_duurlloop: 'bg-orange-100 text-orange-800',
  fartlek: 'bg-yellow-100 text-yellow-800',
}

const TYPE_LABELS: Record<string, string> = {
  herstelloop: 'Herstelloop',
  duurloop: 'Duurloop',
  intervaltraining: 'Interval',
  drempeltraining: 'Drempel',
  lange_duurlloop: 'Lange duurloop',
  fartlek: 'Fartlek',
}

interface Props {
  workout: Workout
  onToggleComplete: (id: string, voltooid: boolean) => void
}

export function WorkoutCard({ workout, onToggleComplete }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border rounded-xl p-4 transition-all ${workout.voltooid ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleComplete(workout.id!, !workout.voltooid)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              workout.voltooid
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {workout.voltooid && <span className="text-xs">✓</span>}
          </button>
          <div>
            <div className="font-medium capitalize">{workout.dag}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_KLEUREN[workout.type] ?? 'bg-gray-100'}`}>
                {TYPE_LABELS[workout.type] ?? workout.type}
              </span>
              <span className="text-sm text-gray-600">{workout.distance_km} km</span>
              <span className="text-sm text-gray-500">• Z{workout.heart_rate_zone}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-gray-400 hover:text-gray-600 px-2"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && <WorkoutDetail workout={workout} />}
    </div>
  )
}
```

- [ ] **Stap 2: Maak WorkoutDetail**

Maak `components/dashboard/WorkoutDetail.tsx`:

```typescript
import { Workout, WorkoutPhase } from '@/lib/types'

function PhaseRow({ label, phase, color }: { label: string; phase: WorkoutPhase; color: string }) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
          <div className="text-sm mt-0.5">{phase.description}</div>
        </div>
        <div className="text-right ml-4 shrink-0">
          <div className="text-sm font-medium">{phase.distance_km} km</div>
          <div className="text-xs opacity-70">{phase.pace_min_km} min/km</div>
        </div>
      </div>
    </div>
  )
}

export function WorkoutDetail({ workout }: { workout: Workout }) {
  return (
    <div className="mt-4 space-y-2">
      <PhaseRow label="Warming-up" phase={workout.warmup} color="bg-blue-50" />
      <PhaseRow label="Kern" phase={workout.core} color="bg-red-50" />
      <PhaseRow label="Cooling-down" phase={workout.cooldown} color="bg-blue-50" />
    </div>
  )
}
```

- [ ] **Stap 3: Maak WeekNavigation**

Maak `components/dashboard/WeekNavigation.tsx`:

```typescript
'use client'

import { Week } from '@/lib/types'

interface Props {
  weeks: Week[]
  activeWeek: number
  onSelectWeek: (weekNumber: number) => void
}

export function WeekNavigation({ weeks, activeWeek, onSelectWeek }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {weeks.map(week => (
          <button
            key={week.week_number}
            onClick={() => onSelectWeek(week.week_number)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeWeek === week.week_number
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            W{week.week_number}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Stap 4: Maak dashboard page**

Maak `app/dashboard/page.tsx`:

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Schedule, Week, Workout } from '@/lib/types'
import { WeekNavigation } from '@/components/dashboard/WeekNavigation'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'

export default function DashboardPage() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [activeWeekNum, setActiveWeekNum] = useState(1)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const loadSchedule = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Haal actief schema op met weken en workouts
    const { data: scheduleRow } = await supabase
      .from('schedules')
      .select('*, weeks(*, workouts(*))')
      .eq('user_id', user.id)
      .eq('actief', true)
      .single()

    if (!scheduleRow) {
      router.push('/onboarding')
      return
    }

    // Zet database rijen om naar Schedule type
    const weeks: Week[] = (scheduleRow.weeks as any[])
      .sort((a, b) => a.weeknummer - b.weeknummer)
      .map(w => ({
        id: w.id,
        schedule_id: w.schedule_id,
        week_number: w.weeknummer,
        theme: w.thema,
        workouts: (w.workouts as any[]).map(wo => ({
          id: wo.id,
          week_id: wo.week_id,
          dag: wo.dag,
          type: wo.type,
          distance_km: wo.afstand_km,
          heart_rate_zone: wo.hartslagzone,
          warmup: wo.warming_up,
          core: wo.kern,
          cooldown: wo.cooling_down,
          voltooid: wo.voltooid,
        } as Workout)),
      }))

    setSchedule({
      id: scheduleRow.id,
      total_weeks: scheduleRow.totaal_weken,
      start_date: scheduleRow.startdatum,
      end_date: scheduleRow.einddatum,
      weeks,
    })
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadSchedule() }, [loadSchedule])

  async function toggleWorkoutComplete(workoutId: string, voltooid: boolean) {
    await supabase.from('workouts').update({ voltooid }).eq('id', workoutId)
    setSchedule(prev => {
      if (!prev) return prev
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          workouts: w.workouts.map(wo =>
            wo.id === workoutId ? { ...wo, voltooid } : wo
          ),
        })),
      }
    })
  }

  async function regenerateSchedule() {
    setRegenerating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    })

    if (response.ok) await loadSchedule()
    setRegenerating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Schema laden...</p>
      </div>
    )
  }

  if (!schedule) return null

  const activeWeek = schedule.weeks.find(w => w.week_number === activeWeekNum)
  const completedCount = schedule.weeks.flatMap(w => w.workouts).filter(wo => wo.voltooid).length
  const totalCount = schedule.weeks.flatMap(w => w.workouts).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
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

      {/* Voortgangsbalk */}
      <div className="h-2 bg-gray-200 rounded-full mb-6">
        <div
          className="h-2 bg-green-500 rounded-full transition-all"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Week navigatie */}
      <WeekNavigation
        weeks={schedule.weeks}
        activeWeek={activeWeekNum}
        onSelectWeek={setActiveWeekNum}
      />

      {/* Week info */}
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
        </div>
      )}
    </div>
  )
}
```

- [ ] **Stap 5: Test dashboard**

Ga naar `http://localhost:3000/dashboard` na een volledige onboarding. Controleer:
- Schema wordt getoond
- Week navigatie werkt
- Workout uitklappen toont warming-up/kern/cooling-down
- Afvinken werkt en blijft bewaard na page refresh

- [ ] **Stap 6: Commit**

```bash
git add components/dashboard/ app/dashboard/
git commit -m "feat: dashboard met week navigatie en workout cards"
```

---

## Task 8: Python Garmin Microservice

**Files:**
- Create: `garmin-service/models.py`
- Create: `garmin-service/garmin_client.py`
- Create: `garmin-service/fit_builder.py`
- Create: `garmin-service/main.py`
- Create: `garmin-service/requirements.txt`
- Create: `garmin-service/Dockerfile`

- [ ] **Stap 1: Maak requirements.txt**

Maak `garmin-service/requirements.txt`:

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
garminconnect==0.2.17
pydantic==2.7.0
cryptography==42.0.0
python-dotenv==1.0.1
fit-tool==0.9.8
```

- [ ] **Stap 2: Maak Pydantic models**

Maak `garmin-service/models.py`:

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class GarminAuthRequest(BaseModel):
    username: str
    password: str

class GarminAuthResponse(BaseModel):
    success: bool
    message: str

class ActivitySummary(BaseModel):
    date: str
    distance_km: float
    duration_min: float
    avg_pace_min_km: str

class ActivitiesResponse(BaseModel):
    avg_weekly_km: float
    fastest_pace_min_km: str
    longest_run_km: float
    activities: List[ActivitySummary]

class WorkoutPhase(BaseModel):
    description: str
    distance_km: float
    pace_min_km: str  # "M:SS" formaat

class WorkoutUpload(BaseModel):
    dag: str
    type: str
    distance_km: float
    warmup: WorkoutPhase
    core: WorkoutPhase
    cooldown: WorkoutPhase

class UploadRequest(BaseModel):
    username: str
    password: str
    workouts: List[WorkoutUpload]

class UploadResponse(BaseModel):
    success: bool
    uploaded: int
    failed: int
    message: str
```

- [ ] **Stap 3: Maak garmin_client.py**

Maak `garmin-service/garmin_client.py`:

```python
from garminconnect import Garmin
from datetime import datetime, timedelta
from typing import List
from models import ActivitySummary, ActivitiesResponse
import logging

logger = logging.getLogger(__name__)

def parse_pace(seconds_per_meter: float) -> str:
    """Zet seconden/meter om naar min:sec/km string."""
    if seconds_per_meter <= 0:
        return "0:00"
    sec_per_km = seconds_per_meter * 1000
    minutes = int(sec_per_km // 60)
    seconds = int(sec_per_km % 60)
    return f"{minutes}:{seconds:02d}"

def get_activities(username: str, password: str) -> ActivitiesResponse:
    """Haal hardloopactiviteiten op van afgelopen 3 maanden."""
    client = Garmin(username, password)
    client.login()

    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)

    activities = client.get_activities_by_date(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d'),
        activitytype='running'
    )

    summaries: List[ActivitySummary] = []
    for act in activities:
        distance_m = act.get('distance', 0)
        duration_s = act.get('duration', 0)
        pace_s_per_m = act.get('averageSpeed', 0)

        if distance_m < 500:  # sla te korte activiteiten over
            continue

        summaries.append(ActivitySummary(
            date=act.get('startTimeLocal', '')[:10],
            distance_km=round(distance_m / 1000, 2),
            duration_min=round(duration_s / 60, 1),
            avg_pace_min_km=parse_pace(1 / act['averageSpeed']) if act.get('averageSpeed', 0) > 0 else '0:00',
        ))

    if not summaries:
        return ActivitiesResponse(
            avg_weekly_km=0,
            fastest_pace_min_km='0:00',
            longest_run_km=0,
            activities=[]
        )

    total_km = sum(s.distance_km for s in summaries)
    weeks = max(1, 90 / 7)
    avg_weekly = total_km / weeks
    longest = max(s.distance_km for s in summaries)

    # Snelste tempo = laagste min/km waarde
    def pace_to_seconds(pace: str) -> float:
        parts = pace.split(':')
        if len(parts) != 2:
            return float('inf')
        return int(parts[0]) * 60 + int(parts[1])

    fastest = min(summaries, key=lambda s: pace_to_seconds(s.avg_pace_min_km))

    return ActivitiesResponse(
        avg_weekly_km=round(avg_weekly, 1),
        fastest_pace_min_km=fastest.avg_pace_min_km,
        longest_run_km=longest,
        activities=summaries[:20],  # max 20 voor context
    )
```

- [ ] **Stap 4: Maak fit_builder.py**

Maak `garmin-service/fit_builder.py`:

```python
from models import WorkoutUpload, WorkoutPhase
from fit_tool.fit_file import FitFile
from fit_tool.fit_file_builder import FitFileBuilder
from fit_tool.profile.messages.file_id_message import FileIdMessage
from fit_tool.profile.messages.workout_message import WorkoutMessage
from fit_tool.profile.messages.workout_step_message import WorkoutStepMessage
from fit_tool.profile.profile_type import (
    FileType, Sport, WorkoutStepDuration, WorkoutStepTarget
)
import io
from typing import List

def pace_to_speed_ms(pace_min_km: str) -> float:
    """Zet min:sec/km om naar meter/seconde."""
    parts = pace_min_km.split(':')
    if len(parts) != 2:
        return 0.0
    sec_per_km = int(parts[0]) * 60 + int(parts[1])
    if sec_per_km == 0:
        return 0.0
    return 1000 / sec_per_km

def phase_to_steps(phase: WorkoutPhase, name: str) -> List[WorkoutStepMessage]:
    """Maak FIT workout stappen voor één fase."""
    steps = []
    step = WorkoutStepMessage()
    step.wkt_step_name = name
    step.duration_type = WorkoutStepDuration.DISTANCE
    step.duration_distance = phase.distance_km * 1000  # meters
    step.target_type = WorkoutStepTarget.SPEED
    speed = pace_to_speed_ms(phase.pace_min_km)
    # Target range: ± 5% van doeltempo
    step.target_value = int(speed * 1000)  # mm/s
    step.custom_target_speed_low = speed * 0.95
    step.custom_target_speed_high = speed * 1.05
    steps.append(step)
    return steps

def build_fit(workout: WorkoutUpload) -> bytes:
    """Bouw een .fit bestand voor één workout."""
    builder = FitFileBuilder()

    # File ID
    file_id = FileIdMessage()
    file_id.type = FileType.WORKOUT
    builder.add(file_id)

    # Workout header
    wkt = WorkoutMessage()
    wkt.sport = Sport.RUNNING
    wkt.wkt_name = f"{workout.type.replace('_', ' ').title()} - {workout.dag}"
    wkt.num_valid_steps = 3
    builder.add(wkt)

    # Voeg stappen toe
    for step_msg in phase_to_steps(workout.warmup, 'Warming-up'):
        builder.add(step_msg)
    for step_msg in phase_to_steps(workout.core, 'Kern'):
        builder.add(step_msg)
    for step_msg in phase_to_steps(workout.cooldown, 'Cooling-down'):
        builder.add(step_msg)

    fit_file = builder.build()
    buf = io.BytesIO()
    fit_file.to_file(buf)
    return buf.getvalue()
```

- [ ] **Stap 5: Maak main.py**

Maak `garmin-service/main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import (
    GarminAuthRequest, GarminAuthResponse,
    ActivitiesResponse, UploadRequest, UploadResponse
)
from garmin_client import get_activities
from fit_builder import build_fit
from garminconnect import Garmin, GarminConnectAuthenticationError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Garmin Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In productie: alleen Vercel domein
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth", response_model=GarminAuthResponse)
async def validate_auth(request: GarminAuthRequest):
    """Valideer Garmin Connect credentials."""
    try:
        client = Garmin(request.username, request.password)
        client.login()
        return GarminAuthResponse(success=True, message="Inloggen gelukt")
    except GarminConnectAuthenticationError:
        return GarminAuthResponse(success=False, message="Ongeldig gebruikersnaam of wachtwoord")
    except Exception as e:
        logger.error(f"Garmin auth fout: {e}")
        raise HTTPException(status_code=500, detail="Garmin verbindingsfout")

@app.post("/activities", response_model=ActivitiesResponse)
async def fetch_activities(request: GarminAuthRequest):
    """Haal hardloopactiviteiten op van afgelopen 3 maanden."""
    try:
        return get_activities(request.username, request.password)
    except GarminConnectAuthenticationError:
        raise HTTPException(status_code=401, detail="Garmin authenticatie mislukt")
    except Exception as e:
        logger.error(f"Activiteiten ophalen mislukt: {e}")
        raise HTTPException(status_code=500, detail="Kon activiteiten niet ophalen")

@app.post("/upload", response_model=UploadResponse)
async def upload_workouts(request: UploadRequest):
    """Upload workouts als .fit bestanden naar Garmin Connect."""
    try:
        client = Garmin(request.username, request.password)
        client.login()
    except GarminConnectAuthenticationError:
        raise HTTPException(status_code=401, detail="Garmin authenticatie mislukt")

    uploaded = 0
    failed = 0

    for workout in request.workouts:
        try:
            fit_data = build_fit(workout)
            client.upload_activity(fit_data, f"{workout.dag}-{workout.type}.fit")
            uploaded += 1
        except Exception as e:
            logger.error(f"Upload mislukt voor {workout.dag}: {e}")
            failed += 1

    return UploadResponse(
        success=failed == 0,
        uploaded=uploaded,
        failed=failed,
        message=f"{uploaded} workout(s) geüpload" + (f", {failed} mislukt" if failed else "")
    )

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Stap 6: Maak Dockerfile**

Maak `garmin-service/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Stap 7: Test Python service lokaal**

```bash
cd garmin-service
python -m venv venv
source venv/Scripts/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Ga naar `http://localhost:8000/health` → moet `{"status": "ok"}` teruggeven.

- [ ] **Stap 8: Commit**

```bash
cd ..
git add garmin-service/
git commit -m "feat: Python FastAPI Garmin microservice met FIT builder"
```

---

## Task 9: Garmin Integratie in Next.js

**Files:**
- Create: `running-schedule-app/app/api/garmin/auth/route.ts`
- Create: `running-schedule-app/app/api/garmin/activities/route.ts`
- Create: `running-schedule-app/app/api/garmin/upload/route.ts`
- Create: `running-schedule-app/components/dashboard/GarminPanel.tsx`

- [ ] **Stap 1: Maak Garmin auth proxy route**

Maak `app/api/garmin/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

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
```

- [ ] **Stap 2: Maak Garmin activities proxy route**

Maak `app/api/garmin/activities/route.ts`:

```typescript
import { NextResponse } from 'next/server'
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

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

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

  const garminRes = await fetch(`${process.env.GARMIN_SERVICE_URL}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!garminRes.ok) {
    return NextResponse.json({ error: 'Garmin sync mislukt' }, { status: 500 })
  }

  const data = await garminRes.json()

  // Bijwerken laatste sync
  await supabase
    .from('garmin_connections')
    .update({ laatste_sync: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json(data)
}
```

- [ ] **Stap 3: Maak Garmin upload proxy route**

Maak `app/api/garmin/upload/route.ts`:

```typescript
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
```

- [ ] **Stap 4: Maak GarminPanel component**

Maak `components/dashboard/GarminPanel.tsx`:

```typescript
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
  onSyncComplete?: () => void
}

export function GarminPanel({ weekWorkouts, onSyncComplete }: Props) {
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
    if (data.success && onSyncComplete) onSyncComplete()
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
```

- [ ] **Stap 5: Voeg GarminPanel toe aan dashboard**

Voeg in `app/dashboard/page.tsx` na de workout cards toe:

```typescript
// Importeer bovenaan
import { GarminPanel } from '@/components/dashboard/GarminPanel'

// Voeg toe na de workouts lijst (binnen het activeWeek blok):
{activeWeek && (
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
)}
```

- [ ] **Stap 6: Test Garmin integratie (optioneel)**

Als je een Garmin Connect account hebt:
1. Start de Python service: `cd garmin-service && uvicorn main:app --reload`
2. Zorg dat `GARMIN_SERVICE_URL=http://localhost:8000` in `.env.local` staat
3. Koppel je Garmin account via het dashboard
4. Klik "Week naar Garmin sturen"

Als je geen account hebt: controleer of de UI correct wordt getoond en geen crashes geeft.

- [ ] **Stap 7: Commit**

```bash
git add app/api/garmin/ components/dashboard/GarminPanel.tsx app/dashboard/page.tsx
git commit -m "feat: Garmin Connect integratie met auth, activiteiten en workout upload"
```

---

## Zelf-review: Spec Coverage

| Spec vereiste | Gedekt in taak |
|---|---|
| Onboarding wizard 7 stappen | Task 5 |
| Claude API JSON schema generatie | Task 6 |
| Schema versioning (oud als inactief) | Task 6, stap 2 |
| Dashboard mobiel + desktop | Task 7 |
| Trainingen afvinken | Task 7, stap 4 |
| Schema opnieuw genereren | Task 7, stap 4 |
| Python Garmin microservice | Task 8 |
| Garmin credentials versleuteld | Task 9, stap 1 |
| FIT bestand bouwen + uploaden | Task 8, stap 4 + Task 9, stap 3 |
| RLS Supabase | Task 3, stap 4 |
| Auth login/register | Task 4 |
| Route protection middleware | Task 3, stap 3 |
| Garmin sync (activiteiten → schema context) | Task 9 (activities route) |

Alle spec-vereisten zijn gedekt.
