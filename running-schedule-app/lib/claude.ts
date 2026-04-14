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

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  const schedule: Schedule = JSON.parse(text)
  return schedule
}
