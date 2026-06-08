// worker/index.ts
// Standalone Cloudflare Worker (separate deployable from the Pages site) that
// refreshes the class schedule on a cron trigger and stores the shaped result
// in KV. The Pages endpoint (src/pages/api/classes.json.ts) reads that KV
// snapshot, so the RPHQ call is kept off the user-facing request path.
//
// Cron: every 90 minutes (see worker/wrangler.toml). 90 minutes can't be a
// single cron expression because the minute field tops out at 59, so the two
// expressions there interleave on-the-hour and half-past-the-hour slots.
import { fetchProgramsReport } from '../src/lib/rphq';
import { toSchedule, SCHEDULE_KV_KEY, type SchedulePayload } from '../src/lib/schedule';

interface KVNamespace {
  get(key: string, type: 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

interface Env extends Record<string, unknown> {
  RPHQ_ORG: string;
  RPHQ_API_TOKEN: string;
  /** Facility code sent as X-Redpoint-Hq-Facility, e.g. "CTK". */
  RPHQ_FACILITY: string;
  /** Optional report id to execute directly (falls back to name discovery). */
  RPHQ_REPORT_ID?: string;
  SCHEDULE_KV: KVNamespace;
  /** Optional shared secret to gate the manual ?refresh=1 trigger. */
  REFRESH_KEY?: string;
}

/** Run the report, shape it, and write the snapshot to KV. */
async function refreshSchedule(env: Env): Promise<SchedulePayload> {
  const report = await fetchProgramsReport(env);
  const payload: SchedulePayload = {
    generatedAt: new Date().toISOString(),
    status: report.status,
    schedule: toSchedule(report.rows),
  };
  await env.SCHEDULE_KV.put(SCHEDULE_KV_KEY, JSON.stringify(payload));
  return payload;
}

export default {
  // Invoked by the cron trigger. waitUntil keeps the worker alive until the
  // refresh completes.
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(refreshSchedule(env));
  },

  // HTTP entrypoint (workers.dev URL). GET shows the current snapshot;
  // GET ?refresh=1 forces an immediate refresh — handy to populate KV right
  // after deploy or to debug. Gated by REFRESH_KEY when that secret is set.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body, null, 2), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

    if (url.searchParams.get('refresh') === '1') {
      if (env.REFRESH_KEY && url.searchParams.get('key') !== env.REFRESH_KEY) {
        return json({ ok: false, error: 'unauthorized' }, 401);
      }
      try {
        const payload = await refreshSchedule(env);
        return json({ ok: true, refreshed: true, generatedAt: payload.generatedAt, days: payload.schedule.length });
      } catch (err) {
        return json({ ok: false, error: err instanceof Error ? err.message : 'refresh failed' }, 502);
      }
    }

    const current = (await env.SCHEDULE_KV.get(SCHEDULE_KV_KEY, 'json')) as SchedulePayload | null;
    return json({ ok: true, current });
  },
};
