// src/lib/rphq.ts
// Server-only helper for talking to the RPHQ GraphQL API.
// IMPORTANT: this module must never be imported into client-side code — it
// reads the bearer token. It is consumed only by the SSR endpoint
// (src/pages/api/classes.json.ts).

export interface RphqEnv {
  /**
   * Account host used to build the endpoint: https://<org>.rphq.com/api/graphql
   * Use the account-level host with NO facility code, e.g. "theknot" →
   * https://theknot.rphq.com/api/graphql (NOT "theknot-ctk"). Per Redpoint, the
   * facility is supplied via the X-Redpoint-Hq-Facility header instead.
   */
  RPHQ_ORG?: string;
  /** Bearer token sent as `Authorization: Bearer <token>` */
  RPHQ_API_TOKEN?: string;
  /** Facility code sent as `X-Redpoint-Hq-Facility`, e.g. "CTK". */
  RPHQ_FACILITY?: string;
  /**
   * Optional. Custom report id to execute directly, skipping name discovery.
   * If unset — or if it no longer resolves (e.g. the report was recreated) —
   * the code falls back to discovering the id by name.
   */
  RPHQ_REPORT_ID?: string;
  /**
   * Optional. Custom report id for the capacity (check-in/out) report. Same
   * self-healing fallback as RPHQ_REPORT_ID: if unset or stale, the id is
   * discovered by name.
   */
  RPHQ_CAPACITY_REPORT_ID?: string;
}

/**
 * Resolve env from either the Cloudflare runtime (production SSR) or
 * import.meta.env / process.env (local `astro dev`).
 */
export function resolveRphqEnv(runtimeEnv?: Record<string, unknown>): Required<RphqEnv> {
  const pick = (key: keyof RphqEnv): string => {
    const fromRuntime = runtimeEnv?.[key];
    if (typeof fromRuntime === 'string' && fromRuntime) return fromRuntime;
    const fromMeta = (import.meta.env as Record<string, unknown>)?.[key];
    if (typeof fromMeta === 'string' && fromMeta) return fromMeta;
    const fromProcess =
      typeof process !== 'undefined' ? (process.env as Record<string, unknown>)?.[key] : undefined;
    if (typeof fromProcess === 'string' && fromProcess) return fromProcess;
    return '';
  };

  return {
    RPHQ_ORG: pick('RPHQ_ORG'),
    RPHQ_API_TOKEN: pick('RPHQ_API_TOKEN'),
    RPHQ_FACILITY: pick('RPHQ_FACILITY'),
    RPHQ_REPORT_ID: pick('RPHQ_REPORT_ID'),
    RPHQ_CAPACITY_REPORT_ID: pick('RPHQ_CAPACITY_REPORT_ID'),
  };
}

export class RphqError extends Error {
  constructor(message: string, readonly detail?: unknown) {
    super(message);
    this.name = 'RphqError';
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Low-level GraphQL POST against the org endpoint. */
async function rphqQuery<T>(
  env: Required<RphqEnv>,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  if (!env.RPHQ_ORG) throw new RphqError('RPHQ_ORG is not configured');
  if (!env.RPHQ_API_TOKEN) throw new RphqError('RPHQ_API_TOKEN is not configured');
  if (!env.RPHQ_FACILITY) throw new RphqError('RPHQ_FACILITY is not configured');

  // Account-level host (no facility code in the subdomain); facility context is
  // carried by the X-Redpoint-Hq-Facility header per Redpoint's guidance.
  const endpoint = `https://${env.RPHQ_ORG}.rphq.com/api/graphql`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${env.RPHQ_API_TOKEN}`,
      'X-Redpoint-Hq-Facility': env.RPHQ_FACILITY,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new RphqError(`RPHQ request failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new RphqError(json.errors.map((e) => e.message).join('; '), json.errors);
  }
  if (!json.data) throw new RphqError('RPHQ response contained no data');
  return json.data;
}

// ---------------------------------------------------------------------------
// 1. Discover the "Programs" custom report id
// ---------------------------------------------------------------------------

const REPORTS_QUERY = /* GraphQL */ `
  query CustomReports($filter: CustomReportFilter, $first: Int, $after: String) {
    customReports(filter: $filter, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

interface ReportsData {
  customReports: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{ node: { id: string; name: string } }>;
  };
}

const PROGRAMS_REPORT_NAME = 'ProgramsNext30Days';
/** Report powering the live gym-capacity counter (see src/lib/capacity.ts). */
export const CAPACITY_REPORT_NAME = 'Check In/Out count & check-ins without checkouts';

/**
 * Page through customReports and return the id of the report with the given
 * name. Matching is case-insensitive on an exact trimmed name.
 */
export async function findReportIdByName(env: Required<RphqEnv>, name: string): Promise<string> {
  let after: string | null = null;
  for (let page = 0; page < 50; page++) {
    const data: ReportsData = await rphqQuery<ReportsData>(env, REPORTS_QUERY, {
      first: 100,
      after,
    });
    const match = data.customReports.edges.find(
      (e) => e.node.name?.trim().toLowerCase() === name.toLowerCase(),
    );
    if (match) return match.node.id;

    if (!data.customReports.pageInfo.hasNextPage) break;
    after = data.customReports.pageInfo.endCursor;
    if (!after) break;
  }
  throw new RphqError(`No custom report named "${name}" was found`);
}

/** Convenience wrapper for the "Programs" schedule report. */
export function findProgramsReportId(env: Required<RphqEnv>): Promise<string> {
  return findReportIdByName(env, PROGRAMS_REPORT_NAME);
}

// ---------------------------------------------------------------------------
// 2. Execute the report
// ---------------------------------------------------------------------------

// Selection set for the execute() union. CustomReportExecuteResult exposes
// columns:[{name}] and rows:[{values:[{type,value}]}] (value is a scalar).
// The Empty/Timeout/QueryException variants are identified by __typename only;
// we don't select extra fields on them since their schema isn't confirmed and
// requesting an unknown field would reject the whole query.
const EXECUTE_RESULT_SELECTION = /* GraphQL */ `
  ... on CustomReportExecuteResult {
    runtime
    columns {
      name
    }
    rows {
      values {
        type
        value
      }
    }
  }
`;

const EXECUTE_QUERY = /* GraphQL */ `
  query CustomReport($id: ID!) {
    customReport(id: $id) {
      id
      name
      execute {
        __typename
        ${EXECUTE_RESULT_SELECTION}
      }
    }
  }
`;

interface ExecuteCell {
  type: string;
  value: string | number | boolean | null;
}

interface ExecuteResult {
  __typename: string;
  runtime?: number;
  columns?: Array<{ name: string }>;
  rows?: Array<{ values: ExecuteCell[] }>;
}

interface ExecuteData {
  // null when the id doesn't resolve (e.g. report was deleted/recreated).
  customReport: {
    id: string;
    name: string;
    execute: ExecuteResult;
  } | null;
}

/** Raw row record keyed by column name. */
export type ReportRow = Record<string, string | number | null>;

/**
 * Pair each row's positional cell values with the column names to produce an
 * array of records keyed by column name. Cell values are coerced to
 * string | number | null.
 */
export function normalizeRows(execute: ExecuteResult): ReportRow[] {
  const rows = execute.rows;
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const headers = (execute.columns ?? []).map((c, i) => c?.name ?? `col_${i}`);

  return rows.map((row) => {
    const record: ReportRow = {};
    (row.values ?? []).forEach((cell, i) => {
      const key = headers[i] ?? `col_${i}`;
      const value = cell?.value;
      record[key] = typeof value === 'boolean' ? String(value) : (value as string | number | null);
    });
    return record;
  });
}

export interface ProgramsReport {
  reportId: string;
  status: string; // execute __typename
  rows: ReportRow[];
}

/**
 * Execute a report by id and normalize the rows.
 * Returns null if the id doesn't resolve (customReport === null), so the caller
 * can fall back to name discovery. Throws for any other failure (auth, network,
 * or an execute() result that isn't a CustomReportExecuteResult).
 */
async function executeReportById(
  env: Required<RphqEnv>,
  reportId: string,
): Promise<ProgramsReport | null> {
  const data = await rphqQuery<ExecuteData>(env, EXECUTE_QUERY, { id: reportId });
  if (!data.customReport) return null; // stale/unknown id

  const execute = data.customReport.execute;
  // execute() is a union; non-result variants (Empty/Timeout/QueryException)
  // carry no rows. Surface the typename so the caller can react if needed.
  if (execute.__typename !== 'CustomReportExecuteResult') {
    throw new RphqError(`Report did not return results (${execute.__typename})`);
  }

  return {
    reportId,
    status: execute.__typename,
    rows: normalizeRows(execute),
  };
}

/**
 * End-to-end: execute a report (identified by name) and normalize the rows.
 *
 * Fast path uses `directId` when provided. If that id no longer resolves
 * (report recreated under a new id) the call self-heals by discovering the id
 * by name. With no `directId`, it goes straight to name discovery.
 */
async function fetchReportByName(
  env: Required<RphqEnv>,
  name: string,
  directId?: string,
): Promise<ProgramsReport> {
  // 1. Direct execute via the configured id.
  if (directId) {
    const report = await executeReportById(env, directId);
    if (report) return report;
    // else: id didn't resolve — fall through to discovery.
  }

  // 2. Discover the id by name, then execute.
  const reportId = await findReportIdByName(env, name);
  const report = await executeReportById(env, reportId);
  if (!report) {
    throw new RphqError(`Report "${name}" (id ${reportId}) did not resolve`);
  }
  return report;
}

/** Execute the "Programs" schedule report (see fetchReportByName). */
export function fetchProgramsReport(runtimeEnv?: Record<string, unknown>): Promise<ProgramsReport> {
  const env = resolveRphqEnv(runtimeEnv);
  return fetchReportByName(env, PROGRAMS_REPORT_NAME, env.RPHQ_REPORT_ID || undefined);
}

/**
 * Execute the "Check In/Out count & check-ins without checkouts" report that
 * powers the live gym-capacity counter. Shape the rows with
 * `toCurrentCapacity` from src/lib/capacity.ts.
 */
export function fetchCapacityReport(runtimeEnv?: Record<string, unknown>): Promise<ProgramsReport> {
  const env = resolveRphqEnv(runtimeEnv);
  return fetchReportByName(env, CAPACITY_REPORT_NAME, env.RPHQ_CAPACITY_REPORT_ID || undefined);
}
