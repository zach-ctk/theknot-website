// src/pages/api/classes.json.ts
// SSR endpoint (Cloudflare Pages Function) that serves the upcoming dated class
// schedule. Fast path: read the snapshot the cron Worker refreshes into KV
// every 90 minutes. Fallback: if KV is empty (e.g. before the first cron run),
// fetch RPHQ live so the page is never blank. The bearer token stays
// server-side either way.
//
// SECURITY / PII: the RPHQ report rows include the instructor's customer id,
// which must NOT reach the browser. (The instructor's name is non-sensitive and
// is shown publicly in the calendar.) Keep responses limited to the shaped
// `schedule` from toSchedule(); never put `report.rows`, raw cells, or the
// customer id into a response or the KV payload.
import type { APIRoute } from 'astro';
import { fetchProgramsReport, RphqError } from '../../lib/rphq';
import { toSchedule, SCHEDULE_KV_KEY, type SchedulePayload } from '../../lib/schedule';

// Opt this route out of static prerendering so it runs on the server.
export const prerender = false;

interface KVNamespace {
  get(key: string, type: 'json'): Promise<unknown>;
}

interface RuntimeEnv extends Record<string, unknown> {
  SCHEDULE_KV?: KVNamespace;
}

export const GET: APIRoute = async ({ locals }) => {
  const env = ((locals as { runtime?: { env?: RuntimeEnv } })?.runtime?.env ?? {}) as RuntimeEnv;

  const json = (body: unknown, status: number, cacheSeconds: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheSeconds}, stale-while-revalidate=600`,
      },
    });

  try {
    // Fast path — serve the cron-refreshed snapshot from KV.
    const cached = (await env.SCHEDULE_KV?.get(SCHEDULE_KV_KEY, 'json')) as SchedulePayload | null;
    if (cached?.schedule?.length) {
      return json(
        { ok: true, source: 'kv', generatedAt: cached.generatedAt, status: cached.status, schedule: cached.schedule },
        200,
        300,
      );
    }

    // Fallback — KV not populated yet; fetch live so the page isn't blank.
    const report = await fetchProgramsReport(env);
    const schedule = toSchedule(report.rows);
    return json({ ok: true, source: 'live', status: report.status, schedule }, 200, 60);
  } catch (err) {
    const message = err instanceof RphqError ? err.message : 'Failed to load class schedule';
    return json({ ok: false, error: message }, 502, 0);
  }
};
