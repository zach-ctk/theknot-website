// src/pages/api/capacity.json.ts
// SSR endpoint (Cloudflare Pages Function) that serves the live gym-capacity
// count for the footer meter. Unlike the class schedule (which the cron Worker
// snapshots into KV every 90 min), capacity is real-time — it changes as
// climbers check in and out — so we fetch RPHQ live on each request and lean on
// a short edge cache (Cache-Control below) to keep the RPHQ call off the
// hot path without going stale. The bearer token stays server-side.
//
// The RPHQ report returns three columns; we surface only the shaped integer
// head-count from toCurrentCapacity() — never raw rows.
import type { APIRoute } from 'astro';
import { fetchCapacityReport, RphqError } from '../../lib/rphq';
import { toCurrentCapacity } from '../../lib/capacity';

// Opt this route out of static prerendering so it runs on the server.
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = ((locals as { runtime?: { env?: Record<string, unknown> } })?.runtime?.env ??
    {}) as Record<string, unknown>;

  const json = (body: unknown, status: number, cacheSeconds: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheSeconds}, stale-while-revalidate=120`,
      },
    });

  try {
    const report = await fetchCapacityReport(env);
    const currentCapacity = toCurrentCapacity(report.rows);
    if (currentCapacity == null) {
      return json({ ok: false, error: 'Capacity column not found in report' }, 502, 0);
    }
    return json({ ok: true, currentCapacity }, 200, 60);
  } catch (err) {
    const message = err instanceof RphqError ? err.message : 'Failed to load gym capacity';
    return json({ ok: false, error: message }, 502, 0);
  }
};
