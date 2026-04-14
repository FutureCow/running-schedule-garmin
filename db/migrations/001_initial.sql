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
