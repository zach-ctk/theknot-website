// scripts/test-rphq.mjs
// Standalone smoke test for the RPHQ GraphQL API — no Astro/Cloudflare needed.
// Runs the real two-step flow (discover the report by name, then execute it)
// and prints the raw response plus a keyed-record view so you can confirm the
// columns and values are what you expect.
//
// Usage (reads creds from .env via Node's built-in loader):
//   node --env-file=.env scripts/test-rphq.mjs
// Or pass a different report name:
//   node --env-file=.env scripts/test-rphq.mjs "ProgramsNext30Days"
// Or set vars inline (PowerShell):
//   $env:RPHQ_ORG="acme"; $env:RPHQ_API_TOKEN="xxx"; node scripts/test-rphq.mjs

const ORG = process.env.RPHQ_ORG;
const TOKEN = process.env.RPHQ_API_TOKEN;
const FACILITY = process.env.RPHQ_FACILITY;
const REPORT_NAME = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'ProgramsNext30Days';

// PII guard: the only sensitive column is the instructor's customer id. (Names
// are public — they're shown in the calendar — so they are NOT masked.) Mask id
// values in console output by default so they don't land in terminal scrollback
// or shared logs. Pass --show-pii (or SHOW_PII=1) to reveal while debugging.
const SHOW_PII = process.argv.includes('--show-pii') || process.env.SHOW_PII === '1';
const PII_COLUMN = /\bid\b|customer|member|email|phone/i;

if (!ORG || !TOKEN || !FACILITY) {
  console.error(
    'Missing RPHQ_ORG, RPHQ_API_TOKEN and/or RPHQ_FACILITY.\n' +
      'Set them in .env and run:  node --env-file=.env scripts/test-rphq.mjs',
  );
  process.exit(1);
}

// Account-level host (no facility code in the subdomain); facility is sent as a
// header per Redpoint's guidance. e.g. RPHQ_ORG=theknot, RPHQ_FACILITY=CTK
const ENDPOINT = `https://${ORG}.rphq.com/api/graphql`;

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'X-Redpoint-Hq-Facility': FACILITY,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}\n${text}`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Response was not JSON:\n${text}`);
  }
  if (json.errors?.length) {
    throw new Error('GraphQL errors:\n' + json.errors.map((e) => '  - ' + e.message).join('\n'));
  }
  return json.data;
}

const REPORTS_QUERY = `
  query CustomReports($first: Int, $after: String) {
    customReports(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { id name } }
    }
  }
`;

const EXECUTE_QUERY = `
  query CustomReport($id: ID!) {
    customReport(id: $id) {
      id
      name
      execute {
        __typename
        ... on CustomReportExecuteResult {
          runtime
          columns { name }
          rows { values { type value } }
        }
      }
    }
  }
`;

async function findReportId(name) {
  let after = null;
  const seen = [];
  for (let page = 0; page < 50; page++) {
    const data = await gql(REPORTS_QUERY, { first: 100, after });
    for (const edge of data.customReports.edges) {
      seen.push(edge.node.name);
      if (edge.node.name?.trim().toLowerCase() === name.toLowerCase()) {
        return edge.node.id;
      }
    }
    if (!data.customReports.pageInfo.hasNextPage) break;
    after = data.customReports.pageInfo.endCursor;
    if (!after) break;
  }
  throw new Error(
    `No report named "${name}". Reports found:\n` + seen.map((n) => '  - ' + n).join('\n'),
  );
}

function previewValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

(async () => {
  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Facility:    ${FACILITY}  (X-Redpoint-Hq-Facility)`);
  console.log(`Report name: ${REPORT_NAME}\n`);

  let id = process.env.RPHQ_REPORT_ID;
  if (id) {
    console.log(`1) Using configured RPHQ_REPORT_ID = ${id}\n`);
  } else {
    console.log('1) Discovering report id by name…');
    id = await findReportId(REPORT_NAME);
    console.log(`   id = ${id}`);
    console.log('   (set RPHQ_REPORT_ID to this value to skip discovery)\n');
  }

  console.log('2) Executing report…');
  const data = await gql(EXECUTE_QUERY, { id });
  const exec = data.customReport.execute;
  console.log(`   __typename = ${exec.__typename}`);

  if (exec.__typename !== 'CustomReportExecuteResult') {
    console.log('   Report returned no result set. Full execute payload:');
    console.dir(exec, { depth: null });
    return;
  }

  const columns = (exec.columns ?? []).map((c) => c.name);
  const rows = exec.rows ?? [];
  console.log(`   runtime    = ${exec.runtime} ms`);
  console.log(`   columns (${columns.length}): ${JSON.stringify(columns)}`);
  console.log(`   rows       = ${rows.length}\n`);

  const maskedCols = SHOW_PII ? [] : columns.filter((c) => PII_COLUMN.test(c));
  if (maskedCols.length) {
    console.log(`   (masking PII columns: ${JSON.stringify(maskedCols)} — pass --show-pii to reveal)`);
  }

  console.log('3) First 5 rows as keyed records:');
  rows.slice(0, 5).forEach((row, i) => {
    const record = {};
    (row.values ?? []).forEach((cell, idx) => {
      const col = columns[idx] ?? `col_${idx}`;
      record[col] = !SHOW_PII && PII_COLUMN.test(col) ? '***' : previewValue(cell?.value);
    });
    console.log(`   [${i}]`, record);
  });

  if (rows.length === 0) {
    console.log('   (no rows — report executed but returned an empty set)');
  }
})().catch((err) => {
  console.error('\n❌ ' + err.message);
  process.exit(1);
});
