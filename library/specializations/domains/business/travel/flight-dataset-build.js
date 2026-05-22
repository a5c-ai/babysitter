/**
 * @process specializations/domains/business/travel/flight-dataset-build
 * @description Build a local SQLite travel/flight dataset: scope the search
 *   geography & time window, discover authoritative open data sources,
 *   design a query-friendly schema, write and run Python 3 + stdlib
 *   `sqlite3` scripts to ingest the data, add indexes and denormalized
 *   helper views, and produce a SCHEMA.md describing the database for
 *   downstream agents. No MCP is used anywhere. All database creation,
 *   loading and querying happens through Python scripts that import the
 *   Python standard-library `sqlite3` module; no SQL is executed in any
 *   other way.
 *
 * @inputs {
 *   originCountry: string,            // e.g. "IL"
 *   originAirports?: string[],        // optional list of IATA codes to pin
 *   travelWindow: { start: string, end: string }, // ISO dates
 *   interestRegions?: string[],       // e.g. ["Europe","Mediterranean"]
 *   dbPath: string,                   // absolute path to SQLite file to (re)create
 *   workDir: string,                  // absolute path where Python scripts + logs are written
 *   refreshPolicy?: 'reuse'|'rebuild' // default: 'rebuild'
 * }
 *
 * @outputs {
 *   success: boolean,
 *   dbPath: string,
 *   schemaDocPath: string,
 *   ingestReport: object,             // per-table row counts + source provenance
 *   queryReadiness: object,           // sample SELECTs that succeed + timings
 *   artifacts: Array<{ path: string; format?: string; label?: string }>
 * }
 *
 * Inspired by Michael Lugassy's curated-dataset + direct-SQL-tool travel
 * agent pattern:
 *   - https://github.com/mluggy
 *   - https://www.linkedin.com/posts/mluggy_%D7%9B%D7%9E%D7%95-%D7%9E%D7%99%D7%9C%D7%99%D7%95%D7%A0%D7%99-%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99%D7%9D-%D7%92%D7%9D-%D7%90%D7%A0%D7%97%D7%A0%D7%95-%D7%9E%D7%AA%D7%9B%D7%A0%D7%A0%D7%99%D7%9D-%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA-ugcPost-7448843353275858944-b7d4
  * @graph
 *   domains: [domain:travel]
 *   skillAreas: [skill-area:travel-itinerary-planning, skill-area:product-discovery]
 *   workflows: [workflow:customer-journey-optimization]
 *   roles: [role:product-manager, role:operations-analyst]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    originCountry,
    originAirports = [],
    travelWindow,
    interestRegions = [],
    dbPath,
    workDir,
    refreshPolicy = 'rebuild',
  } = inputs;

  const startedAt = ctx.now();
  const artifacts = [];
  ctx.log('info', `Building travel dataset for ${originCountry} -> ${interestRegions.join(', ') || 'any'} into ${dbPath}`);

  // Phase 1 — Scope: turn the traveler's interest area into a concrete
  // geographic + temporal + entity-set scope the rest of the pipeline will honor.
  const scope = await ctx.task(scopeDefinitionTask, {
    originCountry, originAirports, travelWindow, interestRegions, workDir,
  });
  artifacts.push(...(scope.artifacts || []));

  // Phase 2 — Source discovery: find authoritative open datasets
  // (airports, routes, schedules, fares) that cover the scope. No runtime
  // web-fetch in later phases -- every source is pinned to a downloadable URL + checksum here.
  const sources = await ctx.task(sourceDiscoveryTask, {
    scope: scope.scope, workDir,
  });
  artifacts.push(...(sources.artifacts || []));

  // Phase 3 — Schema: design a small, denormalized-where-useful relational
  // schema with explicit join keys. Output is DDL text + an ER narrative.
  const schema = await ctx.task(schemaDesignTask, {
    scope: scope.scope, sources: sources.sources, workDir, dbPath,
  });
  artifacts.push(...(schema.artifacts || []));

  // Phase 4 — Python ETL authoring: write create_db.py and one
  // ingest_<source>.py per source. Every script MUST use only Python 3
  // stdlib + `sqlite3`. No ORMs. No MCP. Scripts must be idempotent
  // (DROP TABLE IF EXISTS when refreshPolicy === 'rebuild').
  const etl = await ctx.task(pythonEtlAuthoringTask, {
    schemaDdl: schema.ddl, sources: sources.sources, dbPath, workDir, refreshPolicy,
  });
  artifacts.push(...(etl.artifacts || []));

  // Phase 5 — Ingest run: the agent executes the scripts it just authored
  // (python3 create_db.py, then each ingest_*.py), captures stdout/stderr,
  // records per-table row counts, and reconciles against scope expectations.
  const ingest = await ctx.task(ingestExecutionTask, {
    scripts: etl.scripts, dbPath, workDir, expectedCoverage: scope.scope.expectedCoverage,
  });
  artifacts.push(...(ingest.artifacts || []));

  // Phase 6 — Indexing + helper views: agent writes build_indexes.py that
  // runs CREATE INDEX and CREATE VIEW statements collapsing the common
  // query shapes (directRoutes, oneStopItineraries, carrierSchedule).
  const indexes = await ctx.task(indexBuildTask, {
    dbPath, workDir, schemaDdl: schema.ddl, commonQueries: scope.scope.expectedQueries,
  });
  artifacts.push(...(indexes.artifacts || []));

  // Phase 7 — Validation: sample-based correctness + referential integrity
  // + stopover-candidate smoke test (the whole reason the DB exists).
  const validation = await ctx.task(dataValidationTask, {
    dbPath, workDir, originAirports: scope.scope.originAirports,
  });
  artifacts.push(...(validation.artifacts || []));

  // Phase 8 — Schema documentation: produce SCHEMA.md so the planning
  // process (and any downstream agent) can compose SQL without guessing.
  const doc = await ctx.task(schemaDocumentationTask, {
    dbPath, workDir, schemaDdl: schema.ddl, indexes: indexes.indexes, views: indexes.views,
    ingestReport: ingest.report, validation,
  });
  artifacts.push(...(doc.artifacts || []));

  return {
    success: true,
    dbPath,
    schemaDocPath: doc.schemaDocPath,
    ingestReport: ingest.report,
    queryReadiness: validation.queryReadiness,
    artifacts,
    duration: ctx.now() - startedAt,
    metadata: {
      processId: 'specializations/domains/business/travel/flight-dataset-build',
      timestamp: startedAt,
      originCountry,
      travelWindow,
    },
  };
}

// ============================================================================
// TASK DEFINITIONS -- every task is kind:'agent'. The agents execute their
// Python scripts through their own harness tools; the process itself never
// dispatches a shell task and never speaks MCP.
// ============================================================================

export const scopeDefinitionTask = defineTask('travel-scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define travel-dataset scope',
  agent: {
    name: 'trip-scope-planner',
    prompt: {
      role: 'Travel Scope Planner',
      task: 'Translate origin + travel window + interest regions into a concrete dataset scope.',
      context: args,
      instructions: [
        'Resolve originCountry + originAirports into a canonical list of IATA codes (pin at least the top-2 hubs).',
        'Enumerate target regions/countries and list their main gateway airports likely to appear in direct + one-stop itineraries from the origin.',
        'Define the temporal grain: month-of-travel buckets derived from travelWindow.',
        'List expected entities the DB must carry: airports, airlines, aircraft types, routes, scheduled flights, fares (if licensed source exists), country/region lookup, weather-similarity tags.',
        'List 5-10 "expected queries" the dataset MUST serve (direct flights; cheapest direct to region; 2-3 day stopover combinations; carrier vs carrier times; aircraft comparison; same-weather destinations).',
        'Estimate expectedCoverage: rough airport/route/schedule counts (for Phase 5 reconciliation).',
        'Do not fetch data here -- this phase produces the scope only.',
      ],
      outputFormat: 'JSON: { scope: { originAirports, gatewayAirports, regions, monthBuckets, entities, expectedQueries, expectedCoverage }, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'artifacts'],
      properties: {
        scope: { type: 'object' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'scope'],
}));

export const sourceDiscoveryTask = defineTask('travel-source-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover authoritative flight/travel data sources',
  agent: {
    name: 'open-data-scout',
    prompt: {
      role: 'Open-Data Scout',
      task: 'Identify authoritative, downloadable open data sources covering the defined scope.',
      context: args,
      instructions: [
        'Prefer open datasets with stable URLs (OpenFlights airports/routes/airlines, OurAirports, OAG or equivalent schedule dumps if available, Wikidata country/region, Köppen-Geiger climate classification for weather-similarity).',
        'For each source, record: name, licence, downloadable URL(s), file format, expected row counts, freshness, and which scope entities it maps to.',
        'Explicitly reject any source that requires an MCP adapter or a proprietary API wrapper -- only flat files (CSV/JSON/Parquet) or direct HTTPS downloads.',
        'For each source, list the raw columns and propose how they will normalize into the relational schema.',
        'If a scope entity has no open source, flag it as "derived" -- the ingest phase will compute it from primary sources (e.g. stopover-friendly cities from route graph + climate tags).',
        'Do not download anything yet. Produce a source manifest only.',
      ],
      outputFormat: 'JSON: { sources: [{ name, url, licence, format, entity, columns, notes }], derived: [...], artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'artifacts'],
      properties: {
        sources: { type: 'array' },
        derived: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'sources'],
}));

export const schemaDesignTask = defineTask('travel-schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design SQLite schema for the travel dataset',
  agent: {
    name: 'sqlite-schema-architect',
    prompt: {
      role: 'SQLite Schema Architect',
      task: 'Produce the CREATE TABLE DDL and a short ER narrative for the travel DB.',
      context: args,
      instructions: [
        'Design for read-heavy, single-user SQLite. Use INTEGER PRIMARY KEYs, explicit FOREIGN KEYs, and text IATA codes as natural keys where idiomatic.',
        'Include at minimum: airports, airlines, aircraft_types, countries, regions, routes (origin_airport, destination_airport, airline, aircraft, distance_km), scheduled_flights (route_id, departure_local, arrival_local, day_of_week, month_bucket), climate_tags (airport, koppen_class, same_weather_group).',
        'Denormalize where it collapses the expected-query shapes named in the scope -- for example, add a precomputed route.is_direct_from_origin flag or a route.region_pair text column.',
        'Do NOT depend on SQLite JSON1 -- stdlib sqlite3 in Python is enough.',
        'Output the full DDL as one string (semicolon-delimited statements) plus a short narrative linking each table back to the scope entities and expected queries.',
      ],
      outputFormat: 'JSON: { ddl: string, tables: [{name,columns,purpose}], narrative: string, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['ddl', 'tables', 'artifacts'],
      properties: {
        ddl: { type: 'string' },
        tables: { type: 'array' },
        narrative: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'schema'],
}));

export const pythonEtlAuthoringTask = defineTask('travel-python-etl-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author Python + sqlite3 ETL scripts',
  agent: {
    name: 'python-etl-engineer',
    prompt: {
      role: 'Python ETL Engineer',
      task: 'Write Python 3 scripts that create the SQLite database and load every source into it.',
      context: args,
      instructions: [
        'Write all scripts under workDir. Use ONLY the Python 3 standard library -- `sqlite3`, `csv`, `json`, `urllib.request`, `pathlib`, `hashlib`, `argparse`. No pandas, no SQLAlchemy, no MCP.',
        'create_db.py: opens dbPath, applies schemaDdl, enables PRAGMA foreign_keys=ON, PRAGMA journal_mode=WAL. Idempotent -- honors refreshPolicy (drop-and-recreate vs reuse).',
        'For each source in `sources`, produce ingest_<source>.py that: downloads (or reads a cached local path) the source, parses it streamingly with csv.DictReader / json.loads, normalizes columns into the target table, INSERTs in batches of ~1000 with executemany(), and prints a final `INGEST <table> rows=<n>` line.',
        'Every script must accept --db and --work-dir CLI flags via argparse.',
        'Every script must exit non-zero on parse/insert failure and log the offending row number.',
        'Do not execute anything yet -- just write the scripts and return their paths.',
      ],
      outputFormat: 'JSON: { scripts: [{ path, role, source?, notes }], runManifest: [ordered list of script invocations], artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'runManifest', 'artifacts'],
      properties: {
        scripts: { type: 'array' },
        runManifest: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'python', 'etl'],
}));

export const ingestExecutionTask = defineTask('travel-ingest-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute the Python ETL scripts and reconcile coverage',
  agent: {
    name: 'python-etl-engineer',
    prompt: {
      role: 'Python ETL Engineer (execution)',
      task: 'Run the ETL scripts in order, capture output, reconcile row counts against expectedCoverage.',
      context: args,
      instructions: [
        'Execute create_db.py first, then every ingest_<source>.py in the order given by runManifest, using your harness shell/python tool. Always `python3 <script> --db <dbPath> --work-dir <workDir>`.',
        'After each script, parse the `INGEST <table> rows=<n>` line and record it in the report.',
        'If a script exits non-zero, capture the offending row, stop the pipeline, and return a detailed failure record.',
        'Open the DB with Python sqlite3 and run integrity checks: PRAGMA foreign_key_check, PRAGMA integrity_check, and SELECT COUNT(*) on every table.',
        'Reconcile against expectedCoverage -- flag any table that is <50% or >300% of the expected row count.',
        'Return an ingestReport keyed by table name, plus a log file path capturing full stdout/stderr.',
      ],
      outputFormat: 'JSON: { report: { [table]: { rows, source, warnings } }, logPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        logPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'ingest'],
}));

export const indexBuildTask = defineTask('travel-index-build', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build indexes and denormalized helper views',
  agent: {
    name: 'sqlite-schema-architect',
    prompt: {
      role: 'SQLite Schema Architect (indexing)',
      task: 'Write and execute build_indexes.py which adds indexes + views that collapse the common query shapes.',
      context: args,
      instructions: [
        'Write build_indexes.py under workDir -- Python 3 stdlib + sqlite3 only.',
        'CREATE INDEX at least on: routes(origin_airport), routes(destination_airport), scheduled_flights(route_id), scheduled_flights(month_bucket, day_of_week), airports(country), climate_tags(same_weather_group).',
        'CREATE VIEW direct_routes_from_origin AS SELECT ... (routes where origin_airport IN :originAirports).',
        'CREATE VIEW one_stop_itineraries AS SELECT leg1.*, leg2.* FROM direct_routes_from_origin leg1 JOIN routes leg2 ON leg1.destination_airport = leg2.origin_airport (constrained to distinct final destinations).',
        'CREATE VIEW carrier_schedule_matrix AS per-carrier per-route morning/afternoon/evening departure bands.',
        'Execute build_indexes.py against dbPath, capture stdout.',
        'Return the list of index + view names actually created.',
      ],
      outputFormat: 'JSON: { indexes: [name,table,cols], views: [name,purpose], artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['indexes', 'views', 'artifacts'],
      properties: {
        indexes: { type: 'array' },
        views: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'indexes'],
}));

export const dataValidationTask = defineTask('travel-data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate the travel dataset end-to-end',
  agent: {
    name: 'data-quality-inspector',
    prompt: {
      role: 'Data Quality Inspector',
      task: 'Confirm the DB answers the expected queries correctly and quickly.',
      context: args,
      instructions: [
        'Write validate.py under workDir that opens dbPath with Python sqlite3 and runs a fixed battery of SELECTs.',
        'Battery must include: (a) COUNT direct_routes_from_origin, (b) SELECT 5 sample stopover itineraries from one_stop_itineraries, (c) airline schedule comparison for one sample route, (d) aircraft-type distribution on a sample route, (e) same-weather-group lookup from originAirports.',
        'For every query, record wall-clock time (time.perf_counter) and row count. Fail validation if any query returns 0 rows unless marked allowed-empty.',
        'Spot-check 10 random airports + 10 random routes for FK integrity (join to the dim tables).',
        'Return a queryReadiness object keyed by query name -> { ok, rows, ms, sample }.',
      ],
      outputFormat: 'JSON: { queryReadiness, integrity: { foreignKeyViolations, orphanRows }, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['queryReadiness', 'artifacts'],
      properties: {
        queryReadiness: { type: 'object' },
        integrity: { type: 'object' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'validation'],
}));

export const schemaDocumentationTask = defineTask('travel-schema-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write SCHEMA.md for downstream planning agents',
  agent: {
    name: 'sqlite-schema-architect',
    prompt: {
      role: 'SQLite Schema Architect (docs)',
      task: 'Produce SCHEMA.md describing the DB so the travel-plan-compose process can author SQL without guessing.',
      context: args,
      instructions: [
        'Write SCHEMA.md under workDir. Structure: Overview, Tables (for each: columns with types, PK/FK, row count), Views (with purpose + sample SELECT), Indexes, Query Recipes.',
        'Query Recipes section MUST give ready-to-run SQL snippets for: direct flights origin->region, cheapest direct per destination, viable 2-3 day stopover pairs, carrier morning-vs-afternoon comparison, aircraft NEO-vs-older comparison, same-weather alternates.',
        'Include a short "How to query from Python" block showing a `with sqlite3.connect(dbPath) as conn: conn.row_factory = sqlite3.Row` example. No MCP.',
        'Return the SCHEMA.md absolute path.',
      ],
      outputFormat: 'JSON: { schemaDocPath, sections: string[], artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['schemaDocPath', 'artifacts'],
      properties: {
        schemaDocPath: { type: 'string' },
        sections: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'travel', 'dataset', 'docs'],
}));
