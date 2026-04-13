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
