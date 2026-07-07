-- Sensaciones subjetivas por actividad (RPE + cómo se sintió). Columnas en
-- activities: el sync hace upsert solo de sus campos, así que estas se preservan.
alter table activities add column if not exists rpe int;         -- esfuerzo percibido 1-10
alter table activities add column if not exists feel text;       -- genial/bien/normal/cansado/mal
alter table activities add column if not exists user_notes text; -- notas propias
