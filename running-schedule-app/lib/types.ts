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
