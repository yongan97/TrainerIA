-- Configuración del atleta: zonas, FTP y carrera objetivo. Fila única (id=1).
create table if not exists settings (
  id          int primary key default 1,
  ftp         int,          -- Functional Threshold Power (bici, W)
  lthr        int,          -- Lactate Threshold HR (bpm)
  hr_max      int,
  hr_rest     int,
  weight_kg   numeric,
  goal_name   text,         -- carrera objetivo
  goal_date   date,
  updated_at  timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

alter table settings enable row level security;
