# Design: Gepersonaliseerde Hardloopschema Web App met Garmin Integratie

**Datum:** 2026-04-13  
**Status:** Goedgekeurd  
**Taal:** Nederlands (UI en content)

---

## Samenvatting

Een mobiel-vriendelijke multi-user web applicatie die via een onboarding wizard gebruikersdata verzamelt, optioneel Garmin Connect-activiteiten analyseert, en vervolgens via de Claude API een volledig gepersonaliseerd hardlooptrainingsschema genereert. Het schema toont per training het type, de afstand, en concrete tempo's per onderdeel (warming-up, kern, cooling-down). Gebruikers kunnen het schema opnieuw genereren na profielwijzigingen, en wekelijkse workouts exporteren naar Garmin Connect.

---

## Architectuur

### Stack

| Laag | Technologie | Platform |
|---|---|---|
| Frontend + API routes | Next.js (React) | Vercel |
| Database + Auth | Supabase (PostgreSQL) | Supabase cloud |
| AI schema generatie | Claude API (Anthropic SDK) | Anthropic |
| Garmin integratie | Python FastAPI + python-garminconnect | Railway (gratis tier) |

### Communicatie

- Browser ↔ Next.js: standaard HTTP / React Server Components
- Next.js `/api/garmin/*` routes proxyen naar de Python microservice via interne HTTP
- Garmin credentials worden nooit aan de browser blootgesteld — alles loopt server-side
- Next.js `/api/generate` roept de Claude API aan met het gebruikersprofiel + optionele Garmin-data

### Python Microservice (Garmin)

FastAPI applicatie met drie endpoints:
- `POST /auth` — valideer Garmin credentials en sla sessie op
- `GET /activities` — haal hardloopactiviteiten op van afgelopen 3 maanden
- `POST /upload` — upload een `.fit` workout bestand naar Garmin Connect

Gebruikt de [python-garminconnect](https://github.com/cyberjunky/python-garminconnect) library (cyberjunky). De informele API kan breken bij Garmin updates — de app toont een duidelijke foutmelding als de sync mislukt, met fallback naar handmatige `.fit` download.

---

## Onboarding Wizard

Zeven stappen, één onderwerp per scherm, mobiel-vriendelijk:

| Stap | Onderwerp | Verplicht |
|---|---|---|
| 1 | Doel & afstand (5K / 10K / HM / M / Custom / Algemene conditie) | Ja |
| 2 | Gewenste tijd of tempo (min:sec of min/km) | Nee |
| 3 | Runner profiel: leeftijd, lengte (cm), gewicht (kg) | Ja |
| 4 | Huidige conditie: langste afstand, frequentie/week, jaren actief | Ja |
| 5 | Blessures & beperkingen (vrij tekstveld) | Nee |
| 6 | Trainingsplanning: dagen/week, welke dagen, dag lange loop, ondergrond | Ja |
| 7 | Tijdlijn: einddatum of aantal weken + optioneel Garmin koppelen | Ja |

Na stap 7 wordt direct het schema gegenereerd. Garmin Connect koppelen kan ook later vanuit het dashboard.

---

## Schema Generatie (Claude API)

### Aanroep

Na het invullen van de wizard stuurt de Next.js API-route één call naar Claude met:
- Volledig profiel (alle wizard-antwoorden)
- Samenvatting Garmin-activiteiten van afgelopen 3 maanden (optioneel): gemiddelde wekelijkse km, snelste recente tempo, langste loop

### Output

Claude geeft altijd gestructureerde JSON terug (geen vrije tekst). Het JSON-formaat:

```json
{
  "total_weeks": 12,
  "start_date": "2026-04-14",
  "end_date": "2026-07-07",
  "weeks": [
    {
      "week_number": 1,
      "theme": "Opbouwweek",
      "workouts": [
        {
          "day": "maandag",
          "type": "herstelloop",
          "distance_km": 5,
          "heart_rate_zone": 2,
          "warmup": { "description": "Rustig inlopen", "distance_km": 0.5, "pace_min_km": "6:30" },
          "core": { "description": "Rustig duurlopen", "distance_km": 4, "pace_min_km": "6:15" },
          "cooldown": { "description": "Uitlopen", "distance_km": 0.5, "pace_min_km": "7:00" }
        }
      ]
    }
  ]
}
```

### Opnieuw genereren

De gebruiker kan op elk moment "Schema opnieuw genereren" klikken, profiel aanpassen, en een nieuwe versie laten maken. Het vorige schema wordt als inactief bewaard (versioning).

### Kosten (indicatie)

- Claude Haiku: ~€0,05–0,10 per generatie
- Claude Sonnet: ~€0,30–0,50 per generatie
- Aanbeveling: start met Sonnet voor kwaliteit, schakel over naar Haiku als kosten groeien

---

## Dashboard & Weekoverzicht

### Mobiel

- Voortgangsbalk: week X van Y
- Per trainingsdag: dag-afkorting, trainingstype, afstand, tempo (min/km)
- Voltooide trainingen afgevinkt (groen vinkje)
- "Stuur week naar Garmin" knop onderaan

### Desktop

- Week-tabs voor navigatie door het schema
- Uitklapbaar trainingsdetail per dag:
  - Warming-up: beschrijving + tempo (blauw)
  - Kern: beschrijving + tempo (rood voor interval, paars voor drempel)
  - Cooling-down: beschrijving + tempo (blauw)
  - Doel van de training
- Tempozones legenda
- Knoppen: "Schema opnieuw genereren", "Week naar Garmin sturen", "Garmin sync"

### Trainingen afvinken

- Handmatig via checkbox in de app
- Automatisch via Garmin sync: als een activiteit op de juiste dag en afstand overeenkomt, wordt de training als voltooid gemarkeerd

---

## Garmin Connect Integratie

### Koppelen

De gebruiker vult Garmin Connect gebruikersnaam en wachtwoord in. De Python microservice valideert de login en slaat de credentials versleuteld op in Supabase (`garmin_connections` tabel). Geen OAuth — de informele API ondersteunt dit niet.

### Activiteiten importeren

Bij schema generatie haalt de Python service hardloopactiviteiten op van de afgelopen 3 maanden. Deze worden als context meegestuurd naar Claude.

### Workouts exporteren

"Week naar Garmin sturen" bouwt per training een `.fit` bestand en uploadt dit naar Garmin Connect via de Python microservice. De training verschijnt dan in Garmin Connect.

**Fallback:** Als de upload mislukt (bijv. door API-wijzigingen bij Garmin), kan de gebruiker het `.fit` bestand handmatig downloaden en zelf importeren in Garmin Connect.

---

## Datamodel (Supabase)

### `profiles`
`user_id` · `leeftijd` · `lengte` · `gewicht` · `doel` · `doelafstand` · `doeltijd` · `doeltempo` · `langste_afstand` · `frequentie_per_week` · `jaren_actief` · `blessures` (nullable) · `trainingsdagen_per_week` · `trainingsdagen` · `dag_lange_loop` · `ondergrond` · `einddatum` · `aantal_weken`

### `schedules`
`id` · `user_id` · `aangemaakt_op` · `actief` (bool) · `totaal_weken` · `startdatum` · `einddatum` · `raw_json` (Claude output)

### `weeks`
`id` · `schedule_id` · `weeknummer` · `thema`

### `workouts`
`id` · `week_id` · `dag` · `type` · `afstand_km` · `hartslagzone` · `warming_up` (JSON) · `kern` (JSON) · `cooling_down` (JSON) · `voltooid` (bool)

### `garmin_connections`
`user_id` · `username` (encrypted) · `password` (encrypted) · `laatste_sync`

---

## Authenticatie & Autorisatie

- Supabase Auth: email/wachtwoord aanmelden
- Row Level Security (RLS) in Supabase zodat gebruikers alleen hun eigen data zien
- Garmin credentials opgeslagen met encryptie (AES-256 via server-side encryptie voor opslag)

---

## Niet in scope

- Native mobiele app (PWA volstaat)
- Garmin partner API (officieel) — wordt niet aangevraagd
- Sociale functies (schema's delen, vergelijken)
- Integratie met andere sport-apps (Strava, Polar, etc.)
- Betaalmuur of abonnementsmodel
