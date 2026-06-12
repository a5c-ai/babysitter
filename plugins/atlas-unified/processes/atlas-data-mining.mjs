/**
 * @process atlas/atlas-data-mining
 * @description Mine the REAL data stores and data models present in the user's
 *   named sources: cloud databases (Postgres / Redis / storage / AI-Search via
 *   read-only `az`), schemas/migrations in repos, and package data models / types.
 *   Every store and model cites its real source (an Azure resource id, a migration
 *   file, a schema/type file path). The Atlas public knowledge graph
 *   (mcp__atlas__atlas_public_*) is used ONLY as a SECONDARY comparison layer.
 *   Short, iterative, TDD-shaped: each phase produces a checkable artifact and
 *   asserts on it. Agent tasks only — no shell tasks (the agent runs the real
 *   read-only scans itself via its Bash tool).
 * @inputs { need, projectDir?, outDir? }
 * @outputs { success, sourceCount, storeCount, model }
 *
 * Repo override honored: agent-only subtasks (no shell); breakpoints kept sparse.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// Phase 1: parse the stated need into concrete cloud/repo/dir sources
// ---------------------------------------------------------------------------
export const parseSourcesTask = defineTask('atlas-datamine-parse-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse the stated need into concrete sources to mine for data',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data-mining analyst (real-source scanner)',
      task: `Interpret the stated need into a concrete, de-duplicated list of SOURCES whose REAL data stores and data models will be mined: Azure account(s) (for cloud DBs/storage), git repos, and local directories. Determine the output directory.`,
      context: { need: args.need, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'Read the stated need below and extract the SOURCES whose data you must mine: cloud (kind:"cloud", for managed DBs/storage/search), repos (kind:"repo"), and directories (kind:"dir", for schemas/migrations/models).',
        'Resolve "this repo"/"this directory" against projectDir. Detect an output directory if stated; otherwise use the provided outDir.',
        'Do NOT invent sources. Only mine what is in scope (scoping, not a silent fallback to the public graph).',
        'If the sources are genuinely ambiguous, set `ambiguous: true` and list `questions`.',
        `Write "${args.outDir}/sources.json" with keys: sources (array of { kind, ref, note? }), resolvedOutDir (string), ambiguous (boolean), questions (array).`,
        'TDD assertion: sources.json has a non-empty `sources[]` (unless ambiguous:true) and a non-empty `resolvedOutDir`. Iterate until both hold.',
        `Stated need:\n${args.need}`,
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'resolvedOutDir'],
      properties: { sources: { type: 'array' }, resolvedOutDir: { type: 'string' }, ambiguous: { type: 'boolean' }, questions: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 2: mine REAL data stores from the cloud (read-only az) — primary
// ---------------------------------------------------------------------------
export const mineCloudDataTask = defineTask('atlas-datamine-cloud', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mine real cloud data stores (read-only az)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud data inventory engineer (read-only Azure survey)',
      task: `For each Azure source in scope, run READ-ONLY \`az\` commands to enumerate the REAL data stores — Postgres/MySQL, Redis, storage accounts, AI Search, Cosmos, Key Vaults — each citing its real resource id and resource group.`,
      context: { sources: args.sources, outDir: args.outDir },
      instructions: [
        'Select sources[] entries with kind === "cloud". If there are none, write `{ skipped: true, reason: "no cloud source named", stores: [] }` and finish. Correct scoping, not a fallback.',
        'Use your Bash tool to run READ-ONLY `az` only: `az postgres flexible-server list` (+ `az postgres server list`), `az mysql flexible-server list`, `az redis list`, `az storage account list`, `az search service list`, `az cosmosdb list`, `az sql server list` / `az sql db list`, `az keyvault list`, `az cognitiveservices account list` (for AI Search / OpenAI data). NEVER run mutating commands and NEVER read secret VALUES — list metadata only.',
        'If `az` is unavailable / not logged in, record that as a real finding — do NOT invent stores.',
        'NEVER invent resource ids, names, versions, SKUs, or regions. Every store MUST come from real `az` output.',
        `Write "${args.outDir}/cloud-data.json" with key: stores (array of { id, name, type, engine?, version?, sku?, location, resourceGroup }), notes (array), skipped? (boolean), reason? (string).`,
        'TDD assertion: cloud-data.json is valid JSON; if cloud sources were in scope and az was available it has a non-empty stores[] with real ids; otherwise skipped:true with a reason. No invented ids. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['stores'],
      properties: { stores: { type: 'array' }, skipped: { type: 'boolean' }, reason: { type: 'string' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 3: mine REAL data models from repos/dirs (schemas, migrations, types)
// ---------------------------------------------------------------------------
export const mineRepoDataTask = defineTask('atlas-datamine-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mine real data models from repos/dirs (schemas, migrations, types)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data modeler (read-only filesystem survey)',
      task: `For each repo/dir source in scope, mine the REAL data models: schemas, migrations, ORM models, and package data types — each citing its real file path.`,
      context: { sources: args.sources, projectDir: args.projectDir, outDir: args.outDir },
      instructions: [
        'Select sources[] entries with kind === "repo" or "dir". If there are none, write `{ skipped: true, reason: "no repo/dir source named", entities: [] }` and finish. Correct scoping, not a fallback.',
        'Survey the REAL tree (read-only) via Bash/Read/Glob for: SQL/Prisma/Drizzle schemas, migration directories (migrations/**, *.sql), ORM model classes, JSON/Avro/protobuf schemas, and exported TypeScript/Python data types/interfaces that represent persisted entities.',
        'For each entity capture: name, fields (where readable), and the relations to other entities. NEVER invent entities, fields, relations, or file paths — every entity MUST cite a real file you actually read.',
        `Write "${args.outDir}/repo-data.json" with key: entities (array of { name, file, source, fields?: [...], relations?: [{ to, kind }] }), notes (array), skipped? (boolean), reason? (string).`,
        'TDD assertion: repo-data.json is valid JSON; if repo/dir sources were in scope it has entities[] each citing a real `file` (or an explicit note that no data models were found); otherwise skipped:true with a reason. No invented files. Iterate until satisfied.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['entities'],
      properties: { entities: { type: 'array' }, skipped: { type: 'boolean' }, reason: { type: 'string' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ---------------------------------------------------------------------------
// Phase 4: emit the data model artifacts (+ secondary graph comparison)
// ---------------------------------------------------------------------------
export const emitDataModelTask = defineTask('atlas-datamine-emit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emit the real data-model artifacts (graph comparison secondary)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data modeler / technical writer (evidence-backed synthesis)',
      task: `Combine the real cloud stores and repo data models into a single source-cited data atlas. Bind repo models to the cloud stores that back them where the evidence supports it. Atlas-graph comparison is SECONDARY only.`,
      context: { outDir: args.outDir, storeCount: args.storeCount, entityCount: args.entityCount },
      instructions: [
        `Read the real inputs from "${args.outDir}": cloud-data.json and repo-data.json.`,
        'Cross-link where the evidence supports it: which repo schema/migration set targets which cloud Postgres, which model maps to which store. Cite the real resource id AND the real file for each binding.',
        'OPTIONAL SECONDARY enrichment: for the major real data domains found, query the Atlas graph (mcp__atlas__atlas_public_search / _record / _neighbors / _edge_kinds) for comparable canonical data models. Collect only real Atlas ids. Fold any comparison in only as labelled "(Atlas comparison)" asides — never as the primary model. If the graph is irrelevant/unreachable, skip it with a note.',
        `Write "${args.outDir}/data-models.md" — a human-readable data atlas: a data-stores table (each store citing its real resource id/RG) and an entity/relations summary (each entity citing its real file). Mark any Atlas comparison clearly as secondary.`,
        `Write "${args.outDir}/data-models.json" — the machine mirror with keys: stores (array, real ids), entities (array of { name, file, fields, relations }), bindings (array of { entityFile, storeId, evidence }), graphComparison (array of { subject, atlasIds }).`,
        'Every relation/binding endpoint MUST reference a real entity or a real store from the inputs. No invented ids/paths.',
        'TDD assertion: data-models.json is valid JSON; stores[] + entities[] reflect the real inputs; every binding endpoint exists in the input sets; graphComparison ids (if any) are real. Iterate until internally consistent.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['stores', 'entities'],
      properties: { stores: { type: 'array' }, entities: { type: 'array' }, bindings: { type: 'array' }, modelPath: { type: 'string' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ===========================================================================
// Orchestration — mine real data first; graph comparison secondary.
// ===========================================================================
export async function process(inputs, ctx) {
  const need = inputs.need ?? inputs.$ARGUMENTS ?? '';
  const projectDir = inputs.projectDir ?? '.';
  const outDir = inputs.outDir ?? `.a5c/atlas/${ctx.runId ?? 'run'}`;
  const base = { need, projectDir, outDir };

  const parsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources' });

  if (parsed.ambiguous === true) {
    const clarify = await ctx.breakpoint({
      question: `The sources to mine for data are ambiguous. ${(parsed.questions || []).join(' ')} Which cloud account(s)/repo(s)/director(ies) should I mine data from?`,
      options: ['Provide the sources', 'Proceed with best-guess sources'],
      expert: 'owner',
      tags: ['interview'],
    });
    if (clarify && clarify.response) {
      base.need = `${need}\n\nClarification (sources): ${clarify.response}`;
      const reparsed = await ctx.task(parseSourcesTask, base, { key: 'parse-sources-2' });
      parsed.sources = reparsed.sources;
      parsed.resolvedOutDir = reparsed.resolvedOutDir;
    }
  }

  const resolvedOutDir = parsed.resolvedOutDir && String(parsed.resolvedOutDir).trim() ? parsed.resolvedOutDir : outDir;
  const scanBase = { ...base, outDir: resolvedOutDir, sources: parsed.sources };

  const cloud = await ctx.task(mineCloudDataTask, scanBase, { key: 'mine-cloud-data' });
  const repo = await ctx.task(mineRepoDataTask, scanBase, { key: 'mine-repo-data' });

  const model = await ctx.task(
    emitDataModelTask,
    {
      ...scanBase,
      storeCount: Array.isArray(cloud.stores) ? cloud.stores.length : 0,
      entityCount: Array.isArray(repo.entities) ? repo.entities.length : 0,
    },
    { key: 'emit-data-model' },
  );

  return {
    success: true,
    sourceCount: Array.isArray(parsed.sources) ? parsed.sources.length : 0,
    storeCount: Array.isArray(model.stores) ? model.stores.length : 0,
    model,
  };
}

export default process;
