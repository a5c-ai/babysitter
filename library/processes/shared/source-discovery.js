/**
 * @module library/processes/shared/source-discovery
 * @description Generic "discover authoritative open data sources for a domain
 *   and scope" process.
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 *   `specializations/domains/business/travel/flight-dataset-build.js` so it
 *   can be reused for any dataset build (travel, science, finance, sports,
 *   civic data, ...).
 *
 *   The output is a machine-readable source manifest that downstream
 *   schema/ETL processes can consume without re-doing the discovery work.
 *   All tasks are `kind:'agent'` -- the agent actually reads the web,
 *   inspects sample payloads, and judges licence + freshness.
 *
 * @inputs {
 *   domain: string,                    // e.g. "business/travel", "science/astronomy"
 *   scope: object,                     // opaque domain-specific scope bag (origin/window/entities/regions)
 *   workDir: string,                   // absolute path for manifest + samples
 *   entityHints?: string[],            // optional nudges: ["airports","airlines","schedules"]
 *   licencePolicy?: 'permissive'|'any' // default 'permissive' -- MIT/Apache/CC-BY/public-domain only
 *   maxSources?: number,               // default 12
 *   priorManifestPath?: string         // if provided, agent reuses/extends instead of rediscovering
 * }
 *
 * @outputs {
 *   success: boolean,
 *   manifestPath: string,              // absolute path to sources.json
 *   sources: Array<{
 *     name: string,
 *     url: string,
 *     licence: string,
 *     format: 'csv'|'json'|'sqlite'|'parquet'|'geojson'|'xml'|'other',
 *     entities: string[],              // which entities this source feeds
 *     freshness: string,               // e.g. "daily","monthly","snapshot-2025-04"
 *     derivedEntities?: boolean,       // true if agent generates rows rather than downloading
 *     access: 'http'|'https'|'ftp'|'git'|'api',
 *     authRequired?: boolean,
 *     notes?: string
 *   }>,
 *   coverageGaps: string[],            // entities the agent could not find a source for
 *   artifacts: Array<{ path: string; format?: string; label?: string }>,
 *   duration: number,
 *   metadata: object
 * }
 *
 * Usage:
 *
 * ```js
 * import { process as discoverSources } from '@a5c-ai/babysitter-library/processes/shared/source-discovery.js';
 * const result = await discoverSources({
 *   domain: 'science/astronomy',
 *   scope: { objects: ['exoplanets'], window: { from: '1995-01-01' } },
 *   workDir: '/abs/path/work',
 * }, ctx);
 * ```
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    scope,
    workDir,
    entityHints = [],
    licencePolicy = 'permissive',
    maxSources = 12,
    priorManifestPath,
  } = inputs;

  const startedAt = ctx.now();
  const artifacts = [];
  ctx.log('info', `Source discovery: domain=${domain} entities=${entityHints.join(',') || 'auto'}`);

  const scoping = await ctx.task(scopeRefinementTask, {
    domain, scope, entityHints, workDir, priorManifestPath,
  });
  artifacts.push(...(scoping.artifacts || []));

  const discovery = await ctx.task(sourceDiscoveryTask, {
    domain, refinedScope: scoping.refinedScope, licencePolicy, maxSources, workDir, priorManifestPath,
  });
  artifacts.push(...(discovery.artifacts || []));

  const validation = await ctx.task(sourceValidationTask, {
    sources: discovery.sources, workDir,
  });
  artifacts.push(...(validation.artifacts || []));

  const manifest = await ctx.task(manifestExportTask, {
    sources: validation.validatedSources,
    coverageGaps: validation.coverageGaps,
    refinedScope: scoping.refinedScope,
    domain,
    workDir,
  });
  artifacts.push(...(manifest.artifacts || []));

  return {
    success: true,
    manifestPath: manifest.manifestPath,
    sources: validation.validatedSources,
    coverageGaps: validation.coverageGaps,
    artifacts,
    duration: ctx.now() - startedAt,
    metadata: {
      processId: 'shared/source-discovery',
      domain,
      timestamp: startedAt,
    },
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const scopeRefinementTask = defineTask('scope-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine dataset scope into concrete entity list',
  agent: {
    name: 'dataset-scope-planner',
    prompt: {
      role: 'Dataset Scope Planner',
      task: 'Turn a loose domain + scope object into a concrete entity inventory the source scout can shop for.',
      context: args,
      instructions: [
        'Enumerate the entities required (e.g. core records, reference/lookup tables, time-series facts, geographic dimensions).',
        'For each entity, list the attributes that are load-bearing for downstream analysis -- not every field, just the ones that would break the use-case if missing.',
        'Mark which entities are derivable (computed from other entities) vs must-be-sourced.',
        'Honour priorManifestPath if set -- prefer to extend the existing manifest rather than restart.',
        'Return refinedScope = { entities:[{name, attributes[], mustBeSourced, notes}], regions?, timeRange?, granularity? }.',
      ],
      outputFormat: 'JSON: { refinedScope, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['refinedScope', 'artifacts'],
      properties: {
        refinedScope: { type: 'object' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'scope'],
}));

export const sourceDiscoveryTask = defineTask('source-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover authoritative open data sources for the refined scope',
  agent: {
    name: 'open-data-scout',
    prompt: {
      role: 'Open Data Scout',
      task: 'Find publicly redistributable open data sources that feed the refined entity list.',
      context: args,
      instructions: [
        'For each mustBeSourced entity, locate at least one source. Prefer primary/authoritative publishers over aggregators.',
        `Licence policy is "${args.licencePolicy}". If "permissive", only accept MIT / Apache-2.0 / BSD / CC0 / CC-BY / public-domain sources. Reject anything non-commercial, share-alike, or unclear.`,
        'For each source record: name, url, licence (verbatim string as published), format, entities it feeds, freshness/update cadence, access protocol, authRequired flag.',
        'If an entity truly has no public source, mark it for derivation (derivedEntities:true) and note the synthesis recipe -- do NOT invent a url.',
        `Cap total sources at ${args.maxSources}. Quality over quantity.`,
        'Do NOT download the dataset itself here -- only confirm the endpoint, a sample row or schema, and the licence.',
      ],
      outputFormat: 'JSON: { sources:[...], artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'artifacts'],
      properties: {
        sources: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'discovery'],
}));

export const sourceValidationTask = defineTask('source-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate each candidate source is reachable and usable',
  agent: {
    name: 'open-data-scout',
    prompt: {
      role: 'Open Data Scout (validator)',
      task: 'Prove each candidate source is reachable, parseable, and licence-clean.',
      context: args,
      instructions: [
        'For each candidate source: issue a HEAD or small GET and verify 2xx. For APIs, fetch a 1-page sample.',
        'Parse the sample (csv/json/xml/geojson) and confirm the advertised attributes exist.',
        'Persist a tiny sample (first 5 rows or 2 KB, whichever is smaller) under workDir/samples/<slug>.* and list it in artifacts.',
        'Drop any source that fails reachability, parsing, or licence re-check. Record the reason in a dropped[] list.',
        'Compute coverageGaps: entities from refinedScope.mustBeSourced that now have zero validated sources.',
      ],
      outputFormat: 'JSON: { validatedSources, dropped, coverageGaps, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['validatedSources', 'coverageGaps', 'artifacts'],
      properties: {
        validatedSources: { type: 'array' },
        dropped: { type: 'array' },
        coverageGaps: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'validation'],
}));

export const manifestExportTask = defineTask('manifest-export', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write sources.json manifest',
  agent: {
    name: 'open-data-scout',
    prompt: {
      role: 'Open Data Scout (manifest writer)',
      task: 'Emit a stable sources.json + SOURCES.md under workDir.',
      context: args,
      instructions: [
        'sources.json shape: { domain, generatedAt, refinedScope, sources:[...], coverageGaps:[...] }.',
        'SOURCES.md: one section per source with name, licence, url, entities it feeds, freshness, and any integration notes (auth, rate limits, pagination).',
        'Return absolute paths to both files in manifestPath and artifacts.',
      ],
      outputFormat: 'JSON: { manifestPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['manifestPath', 'artifacts'],
      properties: {
        manifestPath: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dataset', 'manifest'],
}));
