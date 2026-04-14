# Hardloopschema — Gepersonaliseerde Hardloopapp met Garmin Integratie

Een mobiel-vriendelijke web applicatie die via een onboarding wizard een volledig gepersonaliseerd hardlooptrainingsschema genereert met de Claude API en workouts exporteert naar Garmin Connect.

## Functies

- **7-staps onboarding wizard** — verzamelt je hardloopprofiel (doel, conditie, planning)
- **AI-gegenereerd schema** — Claude Sonnet maakt een schema op maat met warming-up, kern en cooling-down per training
- **Week-navigatie** — bekijk en vink trainingen af per week
- **Garmin Connect export** — stuur je weekschema als .fit bestanden naar je Garmin horloge
- **Multi-user** — iedereen beheert zijn eigen profiel en schema

## Architectuur

```
running-schedule-app/    # Next.js 16 (Vercel)
garmin-service/          # Python FastAPI (Railway)
```

| Laag | Technologie |
|------|-------------|
| Frontend + API routes | Next.js 16, TypeScript, Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + Auth) |
| AI schema generatie | Claude API (claude-sonnet-4-6) |
| Garmin integratie | Python FastAPI + python-garminconnect |

---

## Vereisten

| Tool | Versie |
|------|--------|
| Node.js | 20+ |
| Python | 3.12+ |
| Git | 2.x |

---

## Installatie — Debian / Ubuntu

### 1. Systeem updaten en basistools installeren

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
```

### 2. Node.js 20 installeren (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x.x
npm --version    # 10.x.x
```

### 3. Python 3.12 installeren

```bash
sudo apt install -y python3.12 python3.12-venv python3.12-dev python3-pip
python3.12 --version   # Python 3.12.x
```

### 4. Repository klonen

```bash
git clone https://github.com/FutureCow/running-schedule-garmin.git
cd running-schedule-garmin
```

### 5. Next.js app instellen

```bash
cd running-schedule-app

# Dependencies installeren
npm install

# Omgevingsvariabelen instellen
cp .env.local.example .env.local
nano .env.local   # vul de waarden in (zie sectie "Omgevingsvariabelen")
```

### 6. Supabase database inrichten

1. Maak een gratis account aan op [supabase.com](https://supabase.com)
2. Maak een nieuw project aan
3. Ga naar **SQL Editor** en voer de migratie uit:

```bash
cat supabase/migrations/001_initial.sql
# Kopieer de inhoud en plak in Supabase SQL Editor → Run
```

### 7. Python Garmin service instellen

```bash
cd ../garmin-service

# Virtuele omgeving aanmaken en activeren
python3.12 -m venv venv
source venv/bin/activate

# Dependencies installeren
pip install -r requirements.txt

# Omgevingsvariabelen (optioneel, service leest ze uit het omroepproces)
cp .env.example .env 2>/dev/null || true
```

### 8. Lokaal starten

**Terminal 1 — Garmin service:**
```bash
cd garmin-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Controleer: http://localhost:8000/health → {"status":"ok"}
```

**Terminal 2 — Next.js app:**
```bash
cd running-schedule-app
npm run dev
# Open: http://localhost:3000
```

---

## Installatie — Alpine Linux

### 1. Pakketbeheer bijwerken en basistools installeren

```bash
apk update && apk upgrade
apk add git curl bash build-base
```

### 2. Node.js 20 installeren

```bash
apk add nodejs-current npm
node --version   # v20.x.x of hoger
npm --version
```

> **Opmerking:** Als `nodejs-current` niet beschikbaar is in jouw Alpine versie:
> ```bash
> apk add nodejs npm   # installeert de LTS versie
> ```

### 3. Python 3.12 installeren

```bash
apk add python3 python3-dev py3-pip
python3 --version   # Python 3.12.x of hoger
```

### 4. Extra build-dependencies voor Python packages

```bash
# Nodig voor garminconnect en cryptography
apk add libffi-dev openssl-dev gcc musl-dev
```

### 5. Repository klonen

```bash
git clone https://github.com/FutureCow/running-schedule-garmin.git
cd running-schedule-garmin
```

### 6. Next.js app instellen

```bash
cd running-schedule-app
npm install
cp .env.local.example .env.local
vi .env.local   # vul de waarden in
```

### 7. Supabase database inrichten

Zelfde als bij Debian (zie stap 6 hierboven).

### 8. Python Garmin service instellen

```bash
cd ../garmin-service

# Virtuele omgeving
python3 -m venv venv
source venv/bin/activate

# Op Alpine: pip upgraden voor juiste wheel-support
pip install --upgrade pip

# Dependencies installeren
pip install -r requirements.txt
```

> **Opmerking:** Als `cryptography` niet wil compileren:
> ```bash
> apk add cargo   # Rust compiler voor cryptography package
> pip install cryptography
> ```

### 9. Lokaal starten

**Terminal 1 — Garmin service:**
```bash
cd garmin-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Next.js app:**
```bash
cd running-schedule-app
npm run dev
```

---

## Omgevingsvariabelen

Kopieer eerst het voorbeeld bestand:

```bash
cd running-schedule-app
cp .env.local.example .env.local
```

Open `.env.local` in een teksteditor en vul de zes waarden in zoals hieronder beschreven.

---

### 1. `NEXT_PUBLIC_SUPABASE_URL`

**Wat:** De URL van jouw Supabase project. Begint altijd met `https://` en eindigt op `.supabase.co`.

**Hoe verkrijgen:**
1. Ga naar [supabase.com](https://supabase.com) en log in (of maak een gratis account aan)
2. Maak een nieuw project aan via **New Project**
3. Ga naar **Project Settings** (tandwiel links onderaan) → **API**
4. Kopieer de waarde onder **Project URL**

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

---

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Wat:** De publieke "anonymous" API-sleutel van Supabase. Deze sleutel is veilig om in de browser te gebruiken — hij geeft alleen toegang via de RLS-regels die jij instelt.

**Hoe verkrijgen:**
1. Zelfde pagina als hierboven: **Project Settings** → **API**
2. Kopieer de waarde onder **Project API keys** → `anon` `public`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> De waarde is een lange JWT-string die begint met `eyJ`.

---

### 3. `SUPABASE_SERVICE_ROLE_KEY`

**Wat:** De geheime "service role" sleutel van Supabase. Deze sleutel omzeilt RLS en wordt alleen server-side gebruikt (nooit in de browser). Houd hem geheim.

**Hoe verkrijgen:**
1. Zelfde pagina: **Project Settings** → **API**
2. Kopieer de waarde onder **Project API keys** → `service_role` `secret`
3. Klik op **Reveal** om de waarde zichtbaar te maken

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Zet deze waarde **nooit** in een publieke repository of client-side code.

---

### 4. `ANTHROPIC_API_KEY`

**Wat:** De API-sleutel voor de Claude API van Anthropic. Hiermee genereert de app het hardloopschema.

**Hoe verkrijgen:**
1. Ga naar [console.anthropic.com](https://console.anthropic.com) en log in (of maak een account aan)
2. Ga naar **API Keys** in het linkermenu
3. Klik op **Create Key**, geef hem een naam (bijv. `hardloopschema`)
4. Kopieer de sleutel direct — hij wordt maar één keer getoond

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

> De sleutel begint met `sk-ant-`. Je hebt credits nodig; nieuwe accounts krijgen gratis starttegoed.

**Kosten per schema generatie (indicatie):**
- Claude Sonnet: ±€0,30–0,50
- Claude Haiku (goedkoper alternatief): ±€0,05–0,10

---

### 5. `GARMIN_SERVICE_URL`

**Wat:** Het adres van de Python FastAPI service die de Garmin Connect integratie verzorgt.

**Lokale ontwikkeling:**
```
GARMIN_SERVICE_URL=http://localhost:8000
```

**Na deployen op Railway:**
```
GARMIN_SERVICE_URL=https://garmin-service-production-xxxx.up.railway.app
```

> Zie de sectie **Deployen** voor hoe je de Railway URL verkrijgt.

---

### 6. `GARMIN_ENCRYPTION_KEY`

**Wat:** Een willekeurige 32-karakter sleutel die gebruikt wordt om Garmin Connect gebruikersnamen en wachtwoorden te versleutelen (AES-256-CBC) voordat ze in de database worden opgeslagen.

**Hoe genereren** (kies één methode):

```bash
# Methode 1: openssl (aanbevolen)
openssl rand -hex 16
# Voorbeeld uitvoer: 4a7f2c9d1e8b3f6a0c5d2e9f4b7a1e3d

# Methode 2: Python
python3 -c "import secrets; print(secrets.token_hex(16))"

# Methode 3: /dev/urandom
cat /dev/urandom | tr -dc 'a-f0-9' | head -c 32
```

```
GARMIN_ENCRYPTION_KEY=4a7f2c9d1e8b3f6a0c5d2e9f4b7a1e3d
```

> Gebruik voor elke installatie een unieke sleutel. Verlies je deze sleutel, dan kunnen de opgeslagen Garmin credentials niet meer worden ontsleuteld en moeten gebruikers opnieuw koppelen.

---

### Volledig ingevuld voorbeeld

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1MDAwMDAwfQ.voorbeeld
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjIwMTUwMDAwMDB9.voorbeeld
ANTHROPIC_API_KEY=sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef
GARMIN_SERVICE_URL=http://localhost:8000
GARMIN_ENCRYPTION_KEY=4a7f2c9d1e8b3f6a0c5d2e9f4b7a1e3d
```

---

## Deployen

### Next.js app → Vercel

```bash
cd running-schedule-app
npm install -g vercel
vercel login
vercel --prod
# Voeg omgevingsvariabelen toe via Vercel dashboard → Settings → Environment Variables
```

### Python service → Railway

1. Installeer de [Railway CLI](https://railway.app):
   ```bash
   curl -fsSL https://railway.app/install.sh | sh
   ```
2. Deploy:
   ```bash
   cd garmin-service
   railway login
   railway init
   railway up
   ```
3. Zet `GARMIN_SERVICE_URL` in Vercel in op de Railway URL die je ontvangt.

### Python service → Docker (zelfhosting)

```bash
cd garmin-service

# Image bouwen
docker build -t garmin-service .

# Starten
docker run -d \
  --name garmin-service \
  -p 8000:8000 \
  garmin-service

# Controleer
curl http://localhost:8000/health
```

---

## Projectstructuur

```
running-schedule-garmin/
├── running-schedule-app/          # Next.js applicatie
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Inlogpagina
│   │   │   └── register/page.tsx  # Registratiepagina
│   │   ├── onboarding/page.tsx    # Onboarding wizard
│   │   ├── dashboard/page.tsx     # Hoofd dashboard
│   │   └── api/
│   │       ├── generate/route.ts  # Claude API aanroep
│   │       └── garmin/            # Garmin proxy routes
│   ├── components/
│   │   ├── onboarding/            # Wizard stap-componenten
│   │   └── dashboard/             # Dashboard componenten
│   ├── lib/
│   │   ├── claude.ts              # Schema generatie prompt
│   │   ├── types.ts               # Gedeelde TypeScript types
│   │   └── supabase/              # Supabase clients
│   └── supabase/
│       └── migrations/
│           └── 001_initial.sql    # Database schema + RLS
│
└── garmin-service/                # Python FastAPI service
    ├── main.py                    # API endpoints
    ├── garmin_client.py           # Garmin Connect integratie
    ├── fit_builder.py             # FIT bestand generatie
    ├── models.py                  # Pydantic data modellen
    ├── requirements.txt
    └── Dockerfile
```

---

## Veelgestelde vragen

**Garmin Connect credentials — is dat veilig?**
Ja. Je Garmin gebruikersnaam en wachtwoord worden nooit opgeslagen in plaintext. Ze worden versleuteld met AES-256-CBC voordat ze in de database worden opgeslagen. De Python service ontvangt ze alleen tijdelijk voor de duur van de API aanroep.

**Wat als Garmin Connect de API blokkeert?**
De `python-garminconnect` library maakt gebruik van de informele Garmin API die bij updates kan breken. De app toont een foutmelding als de sync mislukt. Je kunt het schema dan handmatig bekijken in de app.

**Welk Claude model wordt gebruikt?**
`claude-sonnet-4-6`. Je kunt dit aanpassen in `running-schedule-app/lib/claude.ts` als je een ander model wilt gebruiken (bijv. `claude-haiku-4-5-20251001` voor lagere kosten).

**Kosten van de Claude API per schema generatie?**
- Claude Sonnet: ±€0,30–0,50 per generatie
- Claude Haiku: ±€0,05–0,10 per generatie

---

## Licentie

MIT
