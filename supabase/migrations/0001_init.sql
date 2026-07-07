-- TrainerIA — esquema inicial
-- Modelo: base "activities" (multideporte, común + sport) con métricas
-- específicas en JSONB; Whoop (TOLERADO); planned_sessions (PLANIFICADO);
-- rehab_logs; oauth_tokens. Vista daily_summary que une las tres capas por día.
--
-- App single-user sin login: habilitamos RLS SIN policies para que la anon key
-- quede bloqueada; todo el acceso pasa por el service-role (que bypassea RLS).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- OAuth tokens (Whoop). Tokens cifrados a nivel app (AES-256-GCM).
-- ---------------------------------------------------------------------------
create table if not exists oauth_tokens (
  provider      text primary key,
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz not null,
  scope         text,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- EJECUTADO — actividades multideporte (Garmin, Whoop workouts, manual).
-- Campos comunes tipados; métricas específicas por deporte en `metrics` jsonb.
-- ---------------------------------------------------------------------------
create table if not exists activities (
  id                uuid primary key default gen_random_uuid(),
  sport             text not null,                 -- 'bike' | 'run' | ... (registry en app)
  source            text not null,                 -- 'garmin' | 'whoop' | 'manual'
  started_at        timestamptz not null,
  duration_s        integer,
  distance_m        numeric,
  elevation_gain_m  numeric,
  avg_hr            integer,
  max_hr            integer,
  hr_zones          jsonb,                          -- segundos/ms por zona (común)
  load              numeric,                        -- carga normalizada p/ combinar deportes
  strain            numeric,                        -- de Whoop, si matchea
  metrics           jsonb,                          -- específico por deporte
  external_id       text unique,                    -- idempotencia del sync
  raw               jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists activities_started_at_idx on activities (started_at desc);
create index if not exists activities_sport_idx on activities (sport);

-- ---------------------------------------------------------------------------
-- PLANIFICADO — plan del entrenador.
-- ---------------------------------------------------------------------------
create table if not exists planned_sessions (
  id                uuid primary key default gen_random_uuid(),
  sport             text not null,
  date              date not null,
  type              text,
  target_duration_s integer,
  targets           jsonb,                          -- zonas/pace/potencia objetivo
  rehab_notes       text,
  source            text not null default 'manual', -- 'manual' | 'file'
  created_at        timestamptz not null default now()
);
create index if not exists planned_sessions_date_idx on planned_sessions (date desc);

-- ---------------------------------------------------------------------------
-- TOLERADO — Whoop.
-- ---------------------------------------------------------------------------
create table if not exists whoop_recovery (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique,
  date            date not null,
  recovery_score  numeric,
  hrv_rmssd       numeric,
  rhr             numeric,
  spo2            numeric,
  skin_temp_c     numeric,
  raw             jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists whoop_recovery_date_idx on whoop_recovery (date desc);

create table if not exists whoop_sleep (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique,
  date          date not null,
  duration_s    integer,
  efficiency    numeric,
  disturbances  integer,
  stages        jsonb,
  raw           jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists whoop_sleep_date_idx on whoop_sleep (date desc);

create table if not exists whoop_cycles (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique,
  date        date not null,
  day_strain  numeric,
  avg_hr      numeric,
  kilojoules  numeric,
  raw         jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists whoop_cycles_date_idx on whoop_cycles (date desc);

-- ---------------------------------------------------------------------------
-- Rehab diario — dolor de rodilla (0-10) + drills.
-- ---------------------------------------------------------------------------
create table if not exists rehab_logs (
  id           uuid primary key default gen_random_uuid(),
  date         date not null unique,
  knee_pain    integer check (knee_pain between 0 and 10),
  drills_done  jsonb,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vista diaria: une PLANIFICADO / EJECUTADO / TOLERADO por día.
-- Base = unión de fechas presentes en cualquiera de las capas.
-- ---------------------------------------------------------------------------
create or replace view daily_summary as
with days as (
  select date from whoop_recovery
  union select date from whoop_cycles
  union select date from whoop_sleep
  union select date from planned_sessions
  union select started_at::date as date from activities
),
distinct_days as (select distinct date from days),
acts as (
  select
    started_at::date as date,
    count(*)                                as activity_count,
    sum(duration_s)                         as total_duration_s,
    sum(load)                               as total_load,
    jsonb_agg(distinct sport)               as sports
  from activities
  group by started_at::date
),
plans as (
  select date, count(*) as planned_count, jsonb_agg(distinct sport) as planned_sports
  from planned_sessions group by date
)
select
  d.date,
  r.recovery_score,
  r.hrv_rmssd,
  r.rhr,
  s.duration_s        as sleep_duration_s,
  s.efficiency        as sleep_efficiency,
  c.day_strain,
  coalesce(a.activity_count, 0)  as activity_count,
  a.total_duration_s,
  a.total_load,
  a.sports,
  coalesce(p.planned_count, 0)   as planned_count,
  p.planned_sports
from distinct_days d
left join whoop_recovery r on r.date = d.date
left join whoop_sleep    s on s.date = d.date
left join whoop_cycles   c on c.date = d.date
left join acts           a on a.date = d.date
left join plans          p on p.date = d.date
order by d.date desc;

-- ---------------------------------------------------------------------------
-- RLS: on sin policies => anon bloqueada, service-role bypassea.
-- ---------------------------------------------------------------------------
alter table oauth_tokens    enable row level security;
alter table activities      enable row level security;
alter table planned_sessions enable row level security;
alter table whoop_recovery  enable row level security;
alter table whoop_sleep     enable row level security;
alter table whoop_cycles    enable row level security;
alter table rehab_logs      enable row level security;
