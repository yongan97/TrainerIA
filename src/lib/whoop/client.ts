import { WHOOP } from "./config";
import { getValidAccessToken } from "./oauth";

/** Respuesta paginada estándar de Whoop v2. */
interface Paginated<T> {
  records: T[];
  next_token?: string | null;
}

async function whoopGet<T>(
  path: string,
  params: Record<string, string>,
): Promise<Paginated<T>> {
  const token = await getValidAccessToken();
  const url = new URL(`${WHOOP.apiBase}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Whoop GET ${path} falló (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as Paginated<T>;
}

/** GET de un recurso único (no paginado), p.ej. body measurement. */
async function whoopGetOne<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${WHOOP.apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Whoop GET ${path} falló (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Recorre todas las páginas de un endpoint desde `start` (ISO) hasta ahora. */
async function fetchAll<T>(path: string, startISO: string): Promise<T[]> {
  const out: T[] = [];
  let nextToken: string | undefined;
  do {
    const params: Record<string, string> = { start: startISO, limit: "25" };
    if (nextToken) params.nextToken = nextToken;
    const page = await whoopGet<T>(path, params);
    out.push(...(page.records ?? []));
    nextToken = page.next_token ?? undefined;
  } while (nextToken);
  return out;
}

// Endpoints v2. Los tipos son laxos a propósito: guardamos raw y mapeamos
// defensivamente porque validamos los nombres de campos con datos reales.
export const whoopApi = {
  recovery: (startISO: string) =>
    fetchAll<Record<string, unknown>>("/v2/recovery", startISO),
  sleep: (startISO: string) =>
    fetchAll<Record<string, unknown>>("/v2/activity/sleep", startISO),
  cycles: (startISO: string) =>
    fetchAll<Record<string, unknown>>("/v2/cycle", startISO),
  workouts: (startISO: string) =>
    fetchAll<Record<string, unknown>>("/v2/activity/workout", startISO),
  /** Medidas corporales: peso, altura, FC máx observada. Requiere scope read:body_measurement. */
  body: () =>
    whoopGetOne<{
      height_meter?: number;
      weight_kilogram?: number;
      max_heart_rate?: number;
    }>("/v2/user/measurement/body"),
};
