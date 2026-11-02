-- Cocina: objetivo de peso, pesadas, cambios de la semana y lista de compras.
-- No toca el sync de Whoop ni de Garmin. El peso de Whoop sigue entrando
-- por settings.weight_kg; acá se guarda el historial.

alter table settings
  add column if not exists weight_goal_kg numeric,
  add column if not exists weight_goal_date date;

create table if not exists weight_logs (
  date date not null,
  source text not null check (source in ('manual', 'whoop')),
  weight_kg numeric not null check (weight_kg > 30 and weight_kg < 250),
  created_at timestamptz not null default now(),
  primary key (date, source)
);

create table if not exists meal_swaps (
  day date not null,
  meal text not null check (meal in ('desayuno', 'almuerzo', 'merienda', 'cena')),
  option_id text not null,
  updated_at timestamptz not null default now(),
  primary key (day, meal)
);

create table if not exists shopping_checks (
  week_start date not null,
  item_key text not null,
  checked boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (week_start, item_key)
);

alter table weight_logs enable row level security;
alter table meal_swaps enable row level security;
alter table shopping_checks enable row level security;
