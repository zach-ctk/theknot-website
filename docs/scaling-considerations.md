# Scaling Considerations

A running list of things that work fine at the current (small) traffic level but
could become problems if the site's traffic grows significantly. These are
**not bugs** — they're deliberate trade-offs we've chosen to accept for now.
Each item notes the concern, why it's fine today, and how we'd fix it.

When you touch one of these areas, re-check whether the trade-off still holds.

---

## 1. Gym-capacity endpoint has no shared cache (per-browser only)

- **Where:** [src/pages/api/capacity.json.ts](../src/pages/api/capacity.json.ts), consumed by the footer meter in [src/components/Footer.astro](../src/components/Footer.astro).
- **Concern:** The endpoint fetches the RPHQ "Check In/Out count & check-ins
  without checkouts" report **live on every request**. The `Cache-Control:
  public, max-age=60, stale-while-revalidate=120` header only produces a
  **per-browser** cache — Cloudflare Pages Functions are *not* edge-cached by
  default. So N distinct visitors within a 60s window can trigger up to N calls
  to the Redpoint API (one per first-load per browser), rather than one shared
  call.
- **Why it's fine today:** Traffic is low, and the footer is on every page, so a
  single visitor's browser cache already dedupes their own navigation. Redpoint
  call volume stays small.
- **Risk at scale:** Under heavy concurrent traffic this becomes a fan-out of
  live calls to Redpoint every 60s, which could hit RPHQ rate limits or slow the
  footer for users, and puts a third-party API on the (indirect) hot path.
- **Fix when needed (either works):**
  1. **Cloudflare Cache API** (`caches.default`) inside the endpoint — check the
     edge cache first, fetch RPHQ + `put` with a 60s TTL on a miss. Collapses
     load to roughly one RPHQ call per 60s *per datacenter*. Smallest change.
  2. **Lazy KV cache** — store `capacity:current` in KV with a timestamp; serve
     it if under ~60s old, otherwise refresh from RPHQ and write back. Globally
     shared, no cron needed.
  Contrast with the class **schedule**, which sidesteps this entirely by having
  the cron Worker ([worker/index.ts](../worker/index.ts)) snapshot RPHQ into KV
  every 90 min (dormant as of Aug 2026 — the calendar page isn't routed, so the
  trigger is commented out and the Worker is undeployed); capacity can't use
  that path as-is because it's real-time and a 90-min-stale head count would be
  wrong.

---

<!-- Add new items above this line. Suggested template:

## N. Short title

- **Where:** file/component links
- **Concern:** what the bottleneck is
- **Why it's fine today:** the current trade-off
- **Risk at scale:** what breaks and when
- **Fix when needed:** concrete remediation

-->
