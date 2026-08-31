-- Registro diario de adherencia al plan de nutrición (checklist).
-- Una fila por día: comidas, suplementos y agua.
create table if not exists nutrition_logs (
  date date primary key,
  desayuno boolean not null default false,
  almuerzo boolean not null default false,
  merienda boolean not null default false,
  cena boolean not null default false,
  creatina boolean not null default false,
  omega3 boolean not null default false,
  water_ml integer not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);
alter table nutrition_logs enable row level security;
