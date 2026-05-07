/**
 * @module library/processes/shared/local-db-build
 * @description Generic "build a local SQLite database from a source manifest"
 *   process. Generalized from the schema-design + ETL + index + validation +
 *   documentation phases of
 *   `specializations/domains/business/travel/flight-dataset-build.js`.
 *
 *   Produces a queryable SQLite file + SCHEMA.md that downstream
 *   exploration processes (see `db-agent-explore.js`) can consume without
 *   guessing table/column names.
 *
 *   Hard constraints (inherited from the travel pattern):
 *   - All tasks are `kind:'agent'`. No shell tasks. No MCP.
 *   - All DB creation, loading, indexing, and validation is performed by
 *     Python 3 scripts that use ONLY the stdlib `sqlite3` module.
 *   - No ORM, no sqlite3 CLI.
 *   - The build is idempotent: re-running with the same inputs either
 *     reuses the existing DB or rebuilds deterministically.
 *
 * @inputs {
 *   manifestPath: string,    // absolute path to sources.json from source-discovery
 *   workDir: string,         // absolute work dir; DB + scripts + SCHEMA.md land here
 *   dbFileName?: string,     // default "dataset.sqlite"
 *   rebuild?: boolean,       // default false -- reuse existing DB if present
 *   domain?: string,         // carried through to SCHEMA.md header
 *   scopeNotes?: string,     // free-text scope description for SCHEMA.md
 *   expectedRowCounts?: {    // optional validation targets per entity
 *     [entity: string]: { min?: number; max?: number }
 *   }
 * }
 *
 * @outputs {
 *   success: boolean,
 *   dbPath: string,
 *   schemaDocPath: string,
 *   ingestReport: {
 *     perEntity: Array<{ entity: string; rowsLoaded: number; source: string }>,
 *     indexesCreated: string[],
 *     viewsCreated: string[]
 *   },
 *   queryReadiness: { passed: boolean; checks: Array<{name: string; ok: boolean; detail?: string}> },
 *   artifacts: Array<{ path: string; format?: string; label?: string }>,
 *   duration: number,
 *   metadata: object
 * }
 *
 * Usage:
 *
 * ```js
 * import { process as buildLocalDb } from '@a5c-ai/babysitter-library/processes/shared/local-db-build.js';
 * const db = await buildLocalDb({
 *   manifestPath: '/abs/work/sources.json',
 *   workDir: '/abs/work',
 *   domain: 'science/astronomy',
 *   scopeNotes: 'confirmed exoplanets discovered 1995-present',
 * }, ctx);
 * ```
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    manifestPath,
    workDir,
    dbFileName = 'dataset.sqlite',
    rebuild = false,
    domain = 'generic',
    scopeNotes = '',
    expectedRowCounts = {},
  } = inputs;

  const startedAt = ctx.now();
  const artifacts = [];
  ctx.log('info', `Local DB build: manifest=${manifestPath} rebuild=${rebuild}`);

  const schema = await ctx.task(schemaDesignTask, {
    manifestPath, workDir, domain, scopeNotes,
  });
  artifacts.push(...(schema.artifacts || []));

  const etl = await ctx.task(pythonEtlAuthoringTask, {
    manifestPath, schema: schema.schema, workDir, dbFileName,
  });
  artifacts.push(...(etl.artifacts || []));

  const ingest = await ctx.task(ingestExecutionTask, {
    workDir, dbFileName, etlScripts: etl.scripts, rebuild,
  });
  artifacts.push(...(ingest.artifacts || []));

  const indexes = await ctx.task(indexBuildTask, {
    workDir, dbFileName, schema: schema.schema,
  });
  artifacts.push(...(indexes.artifacts || []));

  const validation = await ctx.task(dataValidationTask, {
    workDir, dbFileName, schema: schema.schema, expectedRowCounts,
  });
  artifacts.push(...(validation.artifacts || []));

  const docs = await ctx.task(schemaDocumentationTask, {
    workDir, dbFileName, schema: schema.schema,
    ingestReport: ingest.ingestReport,
    indexesCreated: indexes.indexesCreated,
    viewsCreated: indexes.viewsCreated,
    queryReadiness: validation.queryReadiness,
    domain, scopeNotes,
  });
  artifacts.push(...(docs.artifacts || []));

  return {
    success: validation.queryReadiness.passed,
    dbPath: docs.dbPath,
    schemaDocPath: docs.schemaDocPath,
    ingestReport: {
      perEntity: ingest.ingestReport.perEntity,
      indexesCreated: indexes.indexesCreated,
      viewsCreated: indexes.viewsCreated,
    },
    queryReadiness: validation.queryReadiness,
    artifacts,
    duration: ctx.now() - startedAt,
    metadata: {
      processId: 'shared/local-db-build',
      domain,
      timestamp: startedAt,
    },
  };
}

// ============================================================================
// TASK DEFINITIONS -- all kind:'agent', all DB work via Python stdlib sqlite3.
// ============================================================================

export const schemaDesignTask = defineTask('schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design SQLite schema from source manifest',
  agent: {
    name: 'sqlite-schema-architect',
    prompt: {
      role: 'SQLite Schema Architect',
      task: 'Design a normalized SQLite schema that fits every source in the manifest and the scope notes.',
      context: args,
      instructions: [
        'Read manifestPath. Produce one CREATE TABLE per core entity plus lookup tables where attributes repeat.',
        'Choose appropriate column types (INTEGER / REAL / TEXT / BLOB / NUMERIC). Use TEXT for ISO dates/times.',
        'Define PRIMARY KEYs and FOREIGN KEYs explicitly. Use NOT NULL on identity columns.',
        'Plan (do not create yet) useful indexes and denormalized views for the expected query patterns implied by scopeNotes.',
        'Return schema = { tables:[{name, columns:[{name,type,nullable,pk,fk?}], primaryKey, description}], plannedIndexes:[...], plannedViews:[...] }.',
      ],
      outputFormat: 'JSON: { schema, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'artifacts'],
      properties: { schema: { type: 'object' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'schema'],
}));

export const pythonEtlAuthoringTask = defineTask('python-etl-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author Python 3 stdlib ETL scripts',
  agent: {
    name: 'python-etl-engineer',
    prompt: {
      role: 'Python ETL Engineer',
      task: 'Write one or more Python 3 scripts that create the schema and load each source into the SQLite DB.',
      context: args,
      instructions: [
        'Under workDir, write scripts using ONLY the Python stdlib (`sqlite3`, `csv`, `json`, `xml.etree.ElementTree`, `urllib.request`, `pathlib`, `argparse`, `gzip`, `zipfile`, `io`, `time`).',
        'First script: create_schema.py -- executes the CREATE TABLE statements idempotently (use IF NOT EXISTS). Accepts --db argument.',
        'Per-source script: load_<entity>.py -- downloads (or reads locally cached) the source, streams it row-by-row, normalizes, and bulk-inserts with executemany(). Must be re-runnable (INSERT OR REPLACE or pre-DELETE by PK).',
        'For derived entities, write a derive_<entity>.py that computes rows from already-loaded tables via SQL + Python aggregation.',
        'NO pandas, NO requests, NO sqlalchemy, NO external packages. stdlib only.',
        'NO sqlite3 CLI shell-outs -- always the sqlite3 Python module.',
        'Scripts should log row counts to stdout in a line "LOADED <entity> <rowCount>" for the ingest executor to parse.',
        'Return scripts = [{ path, entity, purpose:"schema"|"load"|"derive" }].',
      ],
      outputFormat: 'JSON: { scripts, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'artifacts'],
      properties: { scripts: { type: 'array' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'etl'],
}));

export const ingestExecutionTask = defineTask('ingest-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute ETL scripts against the SQLite DB',
  agent: {
    name: 'python-etl-engineer',
    prompt: {
      role: 'Python ETL Engineer (runner)',
      task: 'Run the ETL scripts in dependency order to produce a populated SQLite DB.',
      context: args,
      instructions: [
        'Target DB path: workDir/dbFileName. If rebuild=true, delete the file first; otherwise skip load_<entity>.py for entities whose table is already populated.',
        'Run create_schema.py first, then every load_*.py, then every derive_*.py.',
        'Parse each script stdout for "LOADED <entity> <count>" lines. Record perEntity:[{entity, rowsLoaded, source}].',
        'If any script fails, stop and report the error -- do NOT continue past a failed load.',
        'Invoke Python via your harness python tool. Do NOT use the sqlite3 CLI.',
      ],
      outputFormat: 'JSON: { ingestReport: { perEntity }, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['ingestReport', 'artifacts'],
      properties: { ingestReport: { type: 'object' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'ingest'],
}));

export const indexBuildTask = defineTask('index-build', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create indexes and denormalized views',
  agent: {
    name: 'sqlite-schema-architect',
    prompt: {
      role: 'SQLite Schema Architect (indexer)',
      task: 'Create the planned indexes and denormalized views on the populated DB.',
      context: args,
      instructions: [
        'Write workDir/build_indexes.py using Python stdlib + sqlite3. It must execute CREATE INDEX IF NOT EXISTS and CREATE VIEW IF NOT EXISTS statements.',
        'Prefer views that pre-join common lookups so downstream agents can write short SELECTs.',
        'Run ANALYZE at the end so the planner has stats.',
        'Return indexesCreated[] and viewsCreated[] by name.',
      ],
      outputFormat: 'JSON: { indexesCreated, viewsCreated, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['indexesCreated', 'viewsCreated', 'artifacts'],
      properties: {
        indexesCreated: { type: 'array' },
        viewsCreated: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'index'],
}));

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate the populated DB',
  agent: {
    name: 'data-quality-inspector',
    prompt: {
      role: 'Data Quality Inspector',
      task: 'Prove the DB is sound enough for downstream SQL composition.',
      context: args,
      instructions: [
        'Write workDir/validate.py using Python stdlib + sqlite3.',
        'Run PRAGMA foreign_key_check and PRAGMA integrity_check -- both must be clean.',
        'For each table, verify row count against expectedRowCounts (if provided) -- must fall within [min,max].',
        'Run 5-10 representative SELECT queries that a downstream agent would plausibly need (one per expected use-case). Record their row counts.',
        'Return queryReadiness = { passed: boolean, checks:[{name, ok, detail?}] }.',
      ],
      outputFormat: 'JSON: { queryReadiness, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['queryReadiness', 'artifacts'],
      properties: { queryReadiness: { type: 'object' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'validation'],
}));

export const schemaDocumentationTask = defineTask('schema-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write SCHEMA.md',
  agent: {
    name: 'sqlite-schema-architect',
    prompt: {
      role: 'SQLite Schema Architect (documenter)',
      task: 'Emit SCHEMA.md next to the DB so downstream agents can author SQL without guessing.',
      context: args,
      instructions: [
        'SCHEMA.md sections: (1) Domain + scope notes, (2) Tables -- for each: columns with types, PK/FK, row count, description, (3) Views -- with the SELECT body and intended use, (4) Indexes, (5) Example queries (3-5 worked examples covering the most common question shapes), (6) Ingest report summary, (7) Query readiness summary.',
        'Return absolute paths dbPath (workDir/dbFileName) and schemaDocPath (workDir/SCHEMA.md).',
      ],
      outputFormat: 'JSON: { dbPath, schemaDocPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['dbPath', 'schemaDocPath', 'artifacts'],
      properties: {
        dbPath: { type: 'string' },
        schemaDocPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'docs'],
}));
