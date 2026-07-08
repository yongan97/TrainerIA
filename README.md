# TrainerIA

Dashboard personal de training. Cruza tres capas por día:

1. **PLANIFICADO** — lo que indica el entrenador (`planned_sessions`)
2. **EJECUTADO** — lo que realmente hiciste, multideporte (`activities`, Garmin/Whoop)
3. **TOLERADO** — cómo lo asimiló el cuerpo (Whoop: recovery, HRV, sueño, strain)

Multideporte desde el diseño (bici + running hoy, extensible). Métricas comunes
tipadas en `activities`; las específicas por deporte en `activities.metrics` (JSONB),
gobernadas por el registry en `src/lib/sports/registry.ts`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · Recharts ·
Supabase (Postgres) · Deploy en Vercel. Dark mode por defecto.

## Módulos

**Hoy (Overview)** — recomendación del coach del día, estado (recovery/HRV/sueño),
próximo entreno del plan, strain y qué entrenaste, cuenta regresiva a la carrera.

**Entrenamiento**
- **Calendario** — planificado vs ejecutado vs tolerado por día + adherencia al plan.
- **Semana** — resumen narrado, deltas vs semana previa, volumen 8 semanas, mapa de consistencia.
- **Plan** — generador de mesociclo (progresión por semana), sesiones sueltas, import Garmin `.tcx`.
- **Carrera** — carrera objetivo, cuenta regresiva y tapering.

**Análisis**
- **Tendencias** — ACWR (carga aguda:crónica), HRV vs línea base, recovery, volumen, tolerancia.
- **Forma** — PMC (Fitness/Fatiga/Forma) + estado de entrenamiento.
- **VO₂max** — evolución de la capacidad aeróbica (estimación Garmin).
- **Intensidad** — distribución por zonas de FC + chequeo polarizado 80/20.
- **Predictor** — tiempos de 5K/10K/21K/42K (Riegel).
- **Marcas** — records por deporte.

**Salud**
- **Alertas** — avisos automáticos (recovery bajo, pico de carga, dolor alto, etc.).
- **Sueño** — fases, duración, eficiencia, deuda de sueño.
- **Rehab** — dolor de rodilla vs impacto de running, regla del 10%, racha de drills.

**Detalle de salida** — objetivo vs real, métricas por deporte, TSS/IF por potencia,
zonas de FC, splits por vuelta (Garmin), efecto de entrenamiento, sensaciones (RPE).

**Configuración** — FTP, zonas, carrera objetivo, export CSV.

## Motor de datos

- OAuth 2.0 de Whoop v2 (auth → callback → tokens cifrados → sync incremental)
- Garmin vía librería no oficial detrás de flag (`GARMIN_ENABLED`) + import `.tcx`
- Reconcile: Garmin manda como fuente del ejecutado, se le pega el strain de Whoop
- Cron diario en Vercel (Whoop + Garmin + reconcile), idempotente
- **Auto-sync al abrir la app** si faltan datos de hoy (backfill vía `/api/sync?days=N`)
- **PWA instalable** (manifest + ícono) para usarla como app en el celular
- `computePmc`, `acwr`, `rollingAvg`, `trainingStatus`, motor de coaching en `src/lib`

## Setup

1. **Dependencias:** `npm install`
2. **Env:** copiá `.env.example` a `.env.local` y completá (Supabase + Whoop).
   - En Whoop (developer.whoop.com) creá una app con redirect
     `http://localhost:3000/api/whoop/callback` y scopes
     `read:recovery read:sleep read:cycles read:workout read:profile offline`.
   - `APP_ENCRYPTION_KEY`: `openssl rand -base64 32`
3. **Base de datos:** aplicá `supabase/migrations/0001_init.sql`
   (SQL Editor de Supabase, o `supabase db push` si usás la CLI).
4. **Correr:** `npm run dev` → abrí http://localhost:3000
5. En el overview, tocá **Conectar Whoop**, autorizá, y volvés con datos reales.

## Arquitectura (dónde está qué)

```
src/lib/sports/registry.ts   # deportes, métricas, colores, mapeo sport_id de Whoop
src/lib/domain/types.ts      # tipos del dominio (Activity, WhoopRecovery, …)
src/lib/whoop/               # OAuth, cliente API v2, mappers, sync incremental
src/lib/supabase/admin.ts    # cliente service-role (solo server)
src/app/api/whoop/*          # auth / callback / sync
src/app/api/cron/sync        # endpoint del cron
supabase/migrations/         # esquema SQL versionado
```

Uso personal single-user: sin login. RLS habilitada sin policies (bloquea la
anon key); todo el acceso pasa por el service-role en el server.
