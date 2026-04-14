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
| Database + Auth | PostgreSQL + NextAuth.js |
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

### 6. PostgreSQL database inrichten

```bash
# PostgreSQL installeren (als nog niet aanwezig)
sudo apt install -y postgresql postgresql-contrib

# Controleer of de service draait
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Optie A — gebruik de standaard `postgres` superuser (eenvoudig, lokaal)**

```bash
# Stel een wachtwoord in voor de postgres gebruiker
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'mijnwachtwoord';"

# Database aanmaken
sudo -u postgres psql -c "CREATE DATABASE hardloopschema;"

# Migratie uitvoeren
psql -U postgres -d hardloopschema -f db/migrations/001_initial.sql
```

Gebruik daarna in `.env.local`:
```
DATABASE_URL=postgresql://postgres:mijnwachtwoord@localhost:5432/hardloopschema
```

**Optie B — maak een aparte databasegebruiker aan (aanbevolen)**

```bash
# Maak gebruiker aan (vervang 'hardloop' en 'mijnwachtwoord')
sudo -u postgres psql -c "CREATE USER hardloop WITH PASSWORD 'mijnwachtwoord';"

# Maak database aan en geef eigenaarschap
sudo -u postgres psql -c "CREATE DATABASE hardloopschema OWNER hardloop;"

# Migratie uitvoeren
psql -U hardloop -d hardloopschema -f db/migrations/001_initial.sql
```

Gebruik daarna in `.env.local`:
```
DATABASE_URL=postgresql://hardloop:mijnwachtwoord@localhost:5432/hardloopschema
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

### 7. PostgreSQL database inrichten

```bash
# PostgreSQL installeren
apk add postgresql postgresql-contrib

# Initialiseer de database (eerste keer)
mkdir -p /var/lib/postgresql/data
chown postgres:postgres /var/lib/postgresql/data
su postgres -c "initdb -D /var/lib/postgresql/data"

# Service starten
rc-service postgresql start
rc-update add postgresql default   # automatisch starten bij boot
```

**Optie A — gebruik de standaard `postgres` superuser (eenvoudig, lokaal)**

```bash
# Stel een wachtwoord in voor de postgres gebruiker
su postgres -c "psql -c \"ALTER USER postgres PASSWORD 'mijnwachtwoord';\""

# Database aanmaken
su postgres -c "psql -c \"CREATE DATABASE hardloopschema;\""

# Migratie uitvoeren
psql -U postgres -d hardloopschema -f db/migrations/001_initial.sql
```

Gebruik daarna in `.env.local`:
```
DATABASE_URL=postgresql://postgres:mijnwachtwoord@localhost:5432/hardloopschema
```

**Optie B — maak een aparte databasegebruiker aan (aanbevolen)**

```bash
# Maak gebruiker aan (vervang 'hardloop' en 'mijnwachtwoord')
su postgres -c "psql -c \"CREATE USER hardloop WITH PASSWORD 'mijnwachtwoord';\""

# Maak database aan en geef eigenaarschap
su postgres -c "psql -c \"CREATE DATABASE hardloopschema OWNER hardloop;\""

# Migratie uitvoeren
psql -U hardloop -d hardloopschema -f db/migrations/001_initial.sql
```

Gebruik daarna in `.env.local`:
```
DATABASE_URL=postgresql://hardloop:mijnwachtwoord@localhost:5432/hardloopschema
```

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

---

### 1. `DATABASE_URL`

**Wat:** Verbindingsstring naar jouw PostgreSQL database.

**Formaat:** `postgresql://gebruiker:wachtwoord@host:poort/databasenaam`

**PostgreSQL gebruiker en database aanmaken:**

Kies één van de twee opties hieronder. Zie ook de uitgebreidere stappen in de installatie-instructies voor Debian of Alpine.

```bash
# Optie A — standaard postgres superuser
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'mijnwachtwoord';"
sudo -u postgres psql -c "CREATE DATABASE hardloopschema;"
# → DATABASE_URL=postgresql://postgres:mijnwachtwoord@localhost:5432/hardloopschema

# Optie B — aparte gebruiker (aanbevolen)
sudo -u postgres psql -c "CREATE USER hardloop WITH PASSWORD 'mijnwachtwoord';"
sudo -u postgres psql -c "CREATE DATABASE hardloopschema OWNER hardloop;"
# → DATABASE_URL=postgresql://hardloop:mijnwachtwoord@localhost:5432/hardloopschema
```

Voer daarna de migratie uit:
```bash
psql -U <gebruiker> -d hardloopschema -f db/migrations/001_initial.sql
```

```
DATABASE_URL=postgresql://hardloop:mijnwachtwoord@localhost:5432/hardloopschema
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

## Updaten naar een nieuwe versie

### 1. Haal de laatste wijzigingen op

```bash
cd running-schedule-garmin
git pull
```

### 2. Next.js dependencies bijwerken

```bash
cd running-schedule-app
npm install
```

### 3. Controleer of er nieuwe migraties zijn

Vergelijk de migrations map met wat er al in je database zit:

```bash
ls db/migrations/
```

Als er een nieuw bestand staat (bijv. `002_...sql`) dat je nog niet hebt uitgevoerd:

```bash
psql -U <gebruiker> -d hardloopschema -f db/migrations/002_....sql
```

> Voer migraties altijd op volgorde uit en sla geen versie over.

### 4. Python dependencies bijwerken

```bash
cd ../garmin-service
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### 5. App herstarten

**Lokaal:**
```bash
# Next.js (Ctrl+C stoppen en opnieuw starten)
cd running-schedule-app
npm run dev

# Garmin service
cd ../garmin-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Productie (Vercel + Railway):**
```bash
# Next.js → Vercel deploy automatisch bij git push naar main

# Garmin service → opnieuw deployen op Railway
cd garmin-service
railway up
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
│   │   ├── db.ts                  # PostgreSQL database client
│   │   └── auth.ts                # NextAuth.js configuratie
│   └── db/
│       └── migrations/
│           └── 001_initial.sql    # Database schema
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

---

## Licentie

MIT
