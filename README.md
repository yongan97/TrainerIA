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

## Estado actual (paso 1)

- ✅ Esquema Supabase + vista `daily_summary` (`supabase/migrations/0001_init.sql`)
- ✅ OAuth 2.0 de Whoop v2 end-to-end (auth → callback → tokens cifrados → sync)
- ✅ Sync incremental de recovery / sueño / cycles / workouts (idempotente)
- ✅ Cron de Vercel (cada 6h) + botón de sync manual
- ✅ Overview con tu recovery real (últimos 14 días)

Siguiente: import de Garmin (.fit/.tcx), plan del entrenador, calendario y tendencias.

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
