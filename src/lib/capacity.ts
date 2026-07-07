// src/lib/capacity.ts
// Pure helper that shapes the RPHQ "Check In/Out count & check-ins without
// checkouts" report into the single number the footer's capacity meter needs:
// how many people are currently in the gym (check-ins minus check-outs today).
// Kept free of runtime-/fetch-specific code so it can be reused and unit-tested.
import type { ReportRow } from './rphq';

/**
 * The report returns three columns; the only one we care about is the running
 * difference between today's check-ins and check-outs (i.e. people still in).
 */
export const CAPACITY_COLUMN = 'Difference Checkins Checkouts Today';

/**
 * Extract the current head-count from the capacity report rows. The report
 * emits a single summary row. Column names come back verbatim from RPHQ, so we
 * match case-insensitively on the exact name with a loose contains-fallback,
 * mirroring the `pick()` approach in src/lib/schedule.ts. Returns null when the
 * column is absent or non-numeric so the caller can surface a failure rather
 * than a bogus zero.
 */
export function toCurrentCapacity(rows: ReportRow[]): number | null {
  for (const row of rows) {
    const keys = Object.keys(row);
    const key =
      keys.find((k) => k.trim().toLowerCase() === CAPACITY_COLUMN.toLowerCase()) ??
      keys.find(
        (k) => k.toLowerCase().includes('difference') && k.toLowerCase().includes('checkin'),
      );
    if (key == null) continue;

    const n = Number(row[key]);
    if (Number.isFinite(n)) return Math.max(0, Math.round(n));
  }
  return null;
}
