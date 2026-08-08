-- Deporte del objetivo (bike/run/...). Permite predecir el tiempo de carrera
-- con el modelo correcto: pace/Riegel para running, velocidad media para ciclismo.
alter table settings add column if not exists goal_sport text;
