/**
 * @process specializations/data-engineering-analytics/data-product-lifecycle-workflow
 * @description Flagship data-product lifecycle: requirement + data-contract definition ->
 *   parallel source discovery/profiling (a source that CANNOT be profiled FAILS the run — no
 *   assumed schema) + lineage mapping -> parallel model/pipeline build across the composed
 *   point tasks -> parallel EXECUTED data-quality and contract test families -> two adversarial
 *   gates whose critics RE-EXECUTE the quality suite and RE-COMPUTE profile stats and
 *   row/metric reconciliation against the source of truth (a green dbt run is NOT evidence) ->
 *   policy-gated destructive backfill and PII-field exposure -> policy-gated
 *   contract-breaking-change (raised ONLY when the contract diff classifies as breaking) ->
 *   policy-gated production cutover with executed post-cutover reconciliation -> catalog/contract
 *   publish -> SLA + freshness monitoring with an executed probe and severity-routed breach
 *   handling -> policy-gated IRREVERSIBLE dataset deprecation -> kip-backed data-product memory.
 *   Ownership boundary: this process owns datasets, pipelines and published data contracts;
 *   ../mlops/model-lifecycle.js owns trained-model governance, eval, promotion, drift and
 *   retirement. A gold-tier product published here is a legitimate `datasets` entry for
 *   model-lifecycle; neither supersedes the other.
 * @composes BY NAME (callable point-task stages, NOT superseded): data-catalog.js (discovery +
 *   the catalog/contract publish surface), data-lineage.js (upstream/downstream lineage map and
 *   the consumer inventory that makes deprecation impact analysis possible),
 *   data-quality-framework.js (the test-family spine), dimensional-model.js / obt-creation.js /
 *   scd-implementation.js / incremental-model.js (the four model patterns, routed via
 *   MODEL_PATTERN_MODULES), dbt-project-setup.js + dbt-model-development.js (project scaffold and
 *   per-model authoring), data-warehouse-setup.js (target platform), etl-elt-pipeline.js /
 *   streaming-pipeline.js / pipeline-migration.js (the three ingestion modes, routed via
 *   PIPELINE_MODE_MODULES), metrics-layer.js (semantic metric definitions the reconciliation
 *   critic recomputes against), feature-store.js / bi-dashboard.js / ab-testing-pipeline.js (the
 *   serving surfaces, routed via SERVING_SURFACE_MODULES), query-optimization.js (executed
 *   EXPLAIN/cost evidence before cutover). Shape references:
 *   methodologies/composition-open-source-data-validation/ (validation spine — frozen ordered
 *   stage table, executed suite gate, traceability matrix, conditional breaking-change gate),
 *   methodologies/composition-saas-analytics-dashboard/ (serving/consumption end),
 *   specializations/backend-development/backend-service-delivery.js (overall delivery shape).
 * @inputs {
 *   dataProduct: {                        // required
 *     name: string,                       // required — the data product under lifecycle
 *     version: string,                    // required — the contract/product version being shipped
 *     tier: string,                       // required — member of PRODUCT_TIERS; unknown value THROWS
 *     owner: string,                      // required — accountable team/owner
 *     repoRoot?: string,                  // default '.'
 *     warehouse?: string,                 // target platform hint for data-warehouse-setup composition
 *     publishedContractRef?: string|null  // previously published contract to diff against; null on first publish
 *   },
 *   sources: Array<{                      // required non-empty; EMPTY THROWS (unprofileable product)
 *     name: string, uri: string, system: string,
 *     expectedGrain?: string, sampleQuery?: string
 *   }>,
 *   models: Array<{                       // required non-empty; EMPTY THROWS (nothing to build)
 *     name: string, pattern: string,      // pattern member of MODEL_PATTERN_MODULES; unknown THROWS
 *     grain: string, sources: string[],   // every entry must name a `sources` member; unknown THROWS
 *     materialization?: string
 *   }>,
 *   pipelines: Array<{                    // required non-empty; EMPTY THROWS
 *     name: string, mode: string,         // mode member of PIPELINE_MODE_MODULES; unknown THROWS
 *     schedule?: string, models: string[]
 *   }>,
 *   contractFields: Array<{               // required non-empty; EMPTY THROWS (an uncontracted product is unpublishable)
 *     field: string, type: string,
 *     classification: string,             // member of FIELD_CLASSIFICATIONS; unknown THROWS
 *     semantics: string, nullable?: boolean
 *   }>,
 *   servingSurfaces?: Array<{ name: string, kind: string }>, // kind member of SERVING_SURFACE_MODULES; unknown THROWS; default []
 *   sla: {                                // required — the published freshness/availability promise
 *     freshnessMinutes: number, availabilityTarget: number, completenessTarget?: number
 *   },
 *   backfill?: { requested: boolean, window?: string, destructive?: boolean } | null, // default null (no backfill)
 *   cutoverStrategy?: string,             // member of CUTOVER_STRATEGIES (default 'dual-run'); unknown THROWS
 *   deprecation?: { requested: boolean, datasetRef?: string, reason?: string } | null, // default null
 *   maxFixAttempts?: number,              // fixer budget per adversarial gate (default 2)
 *   maxRemediationAttempts?: number,      // SLA-breach remediation attempts (default 1)
 *   kipEnabled?: boolean,                 // recall + assert data-product memory (default true)
 *   kipDir?: string,                      // default '.a5c/kip'
 *   kipModel?: string,                    // default 'sonnet'
 *   artifactsDir?: string                 // default ctx.artifactsDir
 * }
 * @outputs {
 *   success: boolean,
 *   dataProductName: string,
 *   version: string,
 *   contract: { path: string|null, fields: number, breaking: boolean, publishedRef: string|null }|null,
 *   sourceProfiles: Array<{ source: string, profiled: boolean, checks: number, rowCount: number|null }>,
 *   lineage: { path: string|null, upstream: number, downstream: number, consumers: string[] }|null,
 *   builds: { models: Array<{ model, pattern, built: boolean, path: string|null }>,
 *             pipelines: Array<{ pipeline, mode, built: boolean }>,
 *             servingSurfaces: Array<{ name, kind, built: boolean }> },
 *   testRuns: Array<{ family: string, ran: boolean, total: number, failed: number, passed: boolean }>,
 *   correctnessGate: { passed, attempts, escalated, issues }|null,
 *   contractGate: { passed, attempts, escalated, issues }|null,
 *   piiExposure: { fields: string[], gated: boolean, approved: boolean }|null,
 *   breakingChange: { detected: boolean, gated: boolean, approved: boolean }|null,
 *   backfill: { planned: boolean, destructive: boolean, gated: boolean, approved: boolean, executed: boolean, verified: boolean }|null,
 *   cutover: { strategy: string|null, gated: boolean, approved: boolean, executed: boolean, verified: boolean }|null,
 *   publish: { catalogEntry: string|null, contractRef: string|null, published: boolean }|null,
 *   slaMonitoring: { configured: boolean, path: string|null, probeRan: boolean, breachDetected: boolean, alertingHooks: string[] }|null,
 *   slaBreach: { detected: boolean, severity: string|null, escalationRaised: boolean,
 *                remediation: { attempted: boolean, verified: boolean }|null }|null,
 *   deprecation: { requested: boolean, consumers: number, gated: boolean, approved: boolean, executed: boolean, verified: boolean }|null,
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty) — fail-closed posture
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId: 'specializations/data-engineering-analytics/data-product-lifecycle-workflow',
 *               runId, timeline (orchestrator-accumulated, agents NEVER write it), breakpointsHit, reason? }
 * }
 * @graph
 *   domains: [domain:data-engineering, domain:analytics]
 *   specializations: [specialization:data-engineering-analytics, specialization:mlops]
 *   skillAreas: [skill-area:data-modeling, skill-area:data-quality, skill-area:data-contracts]
 *   topics: [topic:data-contract, topic:data-lineage, topic:data-quality]
 *   roles: [role:analytics-engineer, role:data-platform-lead, role:data-privacy-officer]
 *   workflows: [workflow:data-pipeline, workflow:data-product-delivery]
 * @policyGatedActions data-product.production-cutover (data-platform-lead) — cut consumers over to
 *   the new model/pipeline in production; data-product.destructive-backfill (data-platform-lead) —
 *   run a backfill or reprocess that overwrites or deletes existing warehouse data;
 *   data-product.pii-field-exposure (data-privacy-officer) — expose a PII or restricted-classification
 *   field in a mart, dashboard, or feature store; data-product.dataset-deprecation
 *   (data-platform-lead) — deprecate or drop a dataset that has live downstream consumers;
 *   data-product.contract-breaking-change (analytics-engineering-lead) — ship a schema or semantic
 *   change that breaks the published data contract. Each is raised via routedBreakpoint with
 *   breakpointId === actionId, tags ['policy-gated','data-product', <phase-tag>], strategy 'single',
 *   and NO autoApproveAfterN anywhere in this process. Every executor branch guards solely on
 *   approved === true and records provenance into autoApprovals/breakpointsHit.
 *
 * @example
 *   await orchestrate('specializations/data-engineering-analytics/data-product-lifecycle-workflow', {
 *     dataProduct: {
 *       name: 'orders-gold', version: '2.0.0', tier: 'gold', owner: 'analytics-platform',
 *       warehouse: 'snowflake', publishedContractRef: 'contracts/orders-gold@1.4.0.md',
 *     },
 *     sources: [
 *       { name: 'raw_orders', uri: 'raw.public.orders', system: 'postgres-cdc', expectedGrain: 'one row per order' },
 *       { name: 'raw_customers', uri: 'raw.public.customers', system: 'postgres-cdc' },
 *     ],
 *     models: [
 *       { name: 'dim_customer', pattern: 'scd', grain: 'one row per customer version', sources: ['raw_customers'] },
 *       { name: 'fct_orders', pattern: 'dimensional', grain: 'one row per order', sources: ['raw_orders'] },
 *     ],
 *     pipelines: [{ name: 'orders_elt', mode: 'batch', schedule: '0 * * * *', models: ['dim_customer', 'fct_orders'] }],
 *     contractFields: [
 *       { field: 'order_id', type: 'string', classification: 'internal', semantics: 'natural order key' },
 *       { field: 'customer_email', type: 'string', classification: 'pii', semantics: 'contact address' },
 *     ],
 *     servingSurfaces: [{ name: 'orders-exec-dashboard', kind: 'dashboard' }],
 *     sla: { freshnessMinutes: 60, availabilityTarget: 0.999, completenessTarget: 0.995 },
 *     backfill: { requested: true, window: '2024-01-01/2024-06-30', destructive: true },
 *     cutoverStrategy: 'blue-green',
 *   });
 *
 * Hard rules: Style-A agent tasks ONLY (zero kind:'shell' anywhere); every gate, verification and
 * executed-run outputSchema declares evidence { type: 'array', minItems: 1 }; NO fallbacks —
 * unknown tier, unknown model pattern, unknown pipeline mode, unknown serving-surface kind,
 * unknown field classification, unknown cutover strategy, unknown test family, unknown SLA
 * severity and never-raised routing lookups all THROW naming the source; a source that cannot be
 * profiled FAILS the run rather than proceeding on an assumed schema; a failing test family or a
 * failed adversarial gate BLOCKS cutover and the cutover gate is never raised; the
 * backfill/cutover/deprecation executors are guarded solely by gate.approved === true and each has
 * exactly ONE call site; no breakpoint in this process carries autoApproveAfterN; the timeline is
 * accumulated in the ORCHESTRATOR only.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Frozen tables + throwing lookups (no fallbacks anywhere)
// ---------------------------------------------------------------------------

/** Ordered data-product tiers. Tier drives mandatory test families and serving permission. */
export const PRODUCT_TIERS = Object.freeze(['bronze', 'silver', 'gold', 'platinum']);

/** The five independent test families fanned out via ctx.parallel.all. */
export const TEST_FAMILIES = Object.freeze([
  'schema-contract',
  'row-count-reconciliation',
  'metric-value-reconciliation',
  'uniqueness-referential',
  'freshness-sla',
]);

/** Per-tier mandatory test families and serving permission. */
export const TIER_POLICY = Object.freeze({
  bronze: Object.freeze({
    requiredFamilies: Object.freeze(['schema-contract']),
    servingAllowed: false,
  }),
  silver: Object.freeze({
    requiredFamilies: Object.freeze([
      'schema-contract',
      'row-count-reconciliation',
      'uniqueness-referential',
    ]),
    servingAllowed: false,
  }),
  gold: Object.freeze({
    requiredFamilies: Object.freeze([
      'schema-contract',
      'row-count-reconciliation',
      'metric-value-reconciliation',
      'uniqueness-referential',
      'freshness-sla',
    ]),
    servingAllowed: true,
  }),
  platinum: Object.freeze({
    requiredFamilies: Object.freeze([
      'schema-contract',
      'row-count-reconciliation',
      'metric-value-reconciliation',
      'uniqueness-referential',
      'freshness-sla',
    ]),
    servingAllowed: true,
  }),
});

/** The five checks every source profile must return, one entry each. */
export const SOURCE_PROFILE_CHECKS = Object.freeze([
  'schema',
  'volume',
  'nullability',
  'distribution',
  'freshness',
]);

/** Contract field classification. 'pii' and 'restricted' trigger the exposure gate. */
export const FIELD_CLASSIFICATIONS = Object.freeze([
  'public',
  'internal',
  'confidential',
  'pii',
  'restricted',
]);

/** Composition BY NAME: models[].pattern -> the point-task module whose conventions the build mirrors. */
export const MODEL_PATTERN_MODULES = Object.freeze({
  dimensional: 'dimensional-model.js',
  obt: 'obt-creation.js',
  scd: 'scd-implementation.js',
  incremental: 'incremental-model.js',
  dbt: 'dbt-model-development.js',
});

/** Composition BY NAME: pipelines[].mode -> its composed point-task module. */
export const PIPELINE_MODE_MODULES = Object.freeze({
  batch: 'etl-elt-pipeline.js',
  streaming: 'streaming-pipeline.js',
  migration: 'pipeline-migration.js',
});

/** Composition BY NAME: servingSurfaces[].kind -> its composed point-task module. */
export const SERVING_SURFACE_MODULES = Object.freeze({
  dashboard: 'bi-dashboard.js',
  'feature-store': 'feature-store.js',
  experiment: 'ab-testing-pipeline.js',
});

/** The remaining seven composed point tasks, named for the phases that mirror them. */
export const INGREDIENT_MODULES = Object.freeze({
  catalog: 'data-catalog.js',
  lineage: 'data-lineage.js',
  quality: 'data-quality-framework.js',
  warehouse: 'data-warehouse-setup.js',
  dbtProject: 'dbt-project-setup.js',
  metrics: 'metrics-layer.js',
  queryOptimization: 'query-optimization.js',
});

/** Cutover shape. 'in-place' additionally forces a backfill to be treated as destructive. */
export const CUTOVER_STRATEGIES = Object.freeze(['dual-run', 'blue-green', 'in-place']);

/** Freshness/SLA breach severities (mirrors model-lifecycle's DRIFT_SEVERITIES). */
export const SLA_BREACH_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);

/**
 * Freshness/SLA breach routing. SEV1/SEV2 go straight to remediation (escalationExpert is null —
 * requesting it is an orchestrator bug and throws); SEV3/SEV4 first raise the single non-policy
 * breakpoint of this process.
 */
export const SLA_BREACH_ROUTING = Object.freeze({
  SEV1: Object.freeze({ escalationPath: 'immediate-remediation', escalationExpert: null }),
  SEV2: Object.freeze({ escalationPath: 'immediate-remediation', escalationExpert: null }),
  SEV3: Object.freeze({ escalationPath: 'remediation-choice', escalationExpert: 'analytics-engineering-lead' }),
  SEV4: Object.freeze({ escalationPath: 'remediation-choice', escalationExpert: 'analytics-engineering-lead' }),
});

/**
 * Product-tier assertion. THROWS on unknown tier — no fallback tier exists.
 *
 * @param {string} tier - Candidate tier
 * @returns {string} The validated tier
 */
export function assertProductTier(tier) {
  if (!PRODUCT_TIERS.includes(tier)) {
    throw new Error(
      `PRODUCT_TIERS: unknown tier '${tier}'. ` +
      `Known tiers: ${PRODUCT_TIERS.join(', ')} — no fallback tier exists.`
    );
  }
  return tier;
}

/**
 * Per-tier policy lookup. THROWS on unknown tier — no fallback policy exists.
 *
 * @param {string} tier - Member of PRODUCT_TIERS
 * @returns {{ requiredFamilies: string[], servingAllowed: boolean }}
 */
export function tierPolicy(tier) {
  if (!Object.prototype.hasOwnProperty.call(TIER_POLICY, tier)) {
    throw new Error(
      `TIER_POLICY: unknown tier '${tier}'. ` +
      `Known tiers: ${Object.keys(TIER_POLICY).join(', ')} — no fallback policy exists.`
    );
  }
  return TIER_POLICY[tier];
}

/**
 * Source-profile check-name assertion. THROWS on an unknown check name.
 *
 * @param {string} check - Member of SOURCE_PROFILE_CHECKS
 * @returns {string} The validated check name
 */
export function profileCheckLabel(check) {
  if (!SOURCE_PROFILE_CHECKS.includes(check)) {
    throw new Error(
      `SOURCE_PROFILE_CHECKS: unknown check '${check}'. ` +
      `Known checks: ${SOURCE_PROFILE_CHECKS.join(', ')} — no fallback check exists.`
    );
  }
  return check;
}

/**
 * Field-classification assertion. THROWS naming the source on an unknown classification.
 *
 * @param {string} value - Candidate classification
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated classification
 */
export function assertFieldClassification(value, source) {
  if (!FIELD_CLASSIFICATIONS.includes(value)) {
    throw new Error(
      `Unknown field classification '${value}' from ${source} — expected one of ` +
      `${FIELD_CLASSIFICATIONS.join('|')}. No fallback classification is applied.`
    );
  }
  return value;
}

/**
 * Test-family assertion. THROWS on an unknown family.
 *
 * @param {string} family - Member of TEST_FAMILIES
 * @returns {string} The validated family
 */
export function assertTestFamily(family) {
  if (!TEST_FAMILIES.includes(family)) {
    throw new Error(
      `TEST_FAMILIES: unknown family '${family}'. ` +
      `Known families: ${TEST_FAMILIES.join(', ')} — no fallback family exists.`
    );
  }
  return family;
}

/**
 * Model-pattern -> composed module lookup. THROWS on an unknown pattern.
 *
 * @param {string} pattern - Member of MODEL_PATTERN_MODULES
 * @returns {string} The composed point-task module filename
 */
export function modelPatternModule(pattern) {
  if (!Object.prototype.hasOwnProperty.call(MODEL_PATTERN_MODULES, pattern)) {
    throw new Error(
      `MODEL_PATTERN_MODULES: unknown pattern '${pattern}'. ` +
      `Known patterns: ${Object.keys(MODEL_PATTERN_MODULES).join(', ')} — no fallback pattern exists.`
    );
  }
  return MODEL_PATTERN_MODULES[pattern];
}

/**
 * Pipeline-mode -> composed module lookup. THROWS on an unknown mode.
 *
 * @param {string} mode - Member of PIPELINE_MODE_MODULES
 * @returns {string} The composed point-task module filename
 */
export function pipelineModeModule(mode) {
  if (!Object.prototype.hasOwnProperty.call(PIPELINE_MODE_MODULES, mode)) {
    throw new Error(
      `PIPELINE_MODE_MODULES: unknown mode '${mode}'. ` +
      `Known modes: ${Object.keys(PIPELINE_MODE_MODULES).join(', ')} — no fallback mode exists.`
    );
  }
  return PIPELINE_MODE_MODULES[mode];
}

/**
 * Serving-surface-kind -> composed module lookup. THROWS on an unknown kind.
 *
 * @param {string} kind - Member of SERVING_SURFACE_MODULES
 * @returns {string} The composed point-task module filename
 */
export function servingSurfaceModule(kind) {
  if (!Object.prototype.hasOwnProperty.call(SERVING_SURFACE_MODULES, kind)) {
    throw new Error(
      `SERVING_SURFACE_MODULES: unknown kind '${kind}'. ` +
      `Known kinds: ${Object.keys(SERVING_SURFACE_MODULES).join(', ')} — no fallback kind exists.`
    );
  }
  return SERVING_SURFACE_MODULES[kind];
}

/**
 * Ingredient-role -> composed module lookup. THROWS on an unknown role.
 *
 * @param {string} role - Member of INGREDIENT_MODULES
 * @returns {string} The composed point-task module filename
 */
export function ingredientModule(role) {
  if (!Object.prototype.hasOwnProperty.call(INGREDIENT_MODULES, role)) {
    throw new Error(
      `INGREDIENT_MODULES: unknown role '${role}'. ` +
      `Known roles: ${Object.keys(INGREDIENT_MODULES).join(', ')} — no fallback role exists.`
    );
  }
  return INGREDIENT_MODULES[role];
}

/**
 * Cutover-strategy assertion. THROWS on an unknown strategy.
 *
 * @param {string} value - Candidate strategy
 * @returns {string} The validated strategy
 */
export function assertCutoverStrategy(value) {
  if (!CUTOVER_STRATEGIES.includes(value)) {
    throw new Error(
      `CUTOVER_STRATEGIES: unknown strategy '${value}'. ` +
      `Known strategies: ${CUTOVER_STRATEGIES.join(', ')} — no fallback strategy exists.`
    );
  }
  return value;
}

/**
 * SLA-severity assertion. Accepts SEV1..SEV4 or 'none'; anything else THROWS naming the source.
 *
 * @param {string} value - Candidate severity
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated severity
 */
export function assertSlaSeverity(value, source) {
  if (value === 'none') return value;
  if (!SLA_BREACH_SEVERITIES.includes(value)) {
    throw new Error(
      `Unknown SLA breach severity '${value}' from ${source} — expected one of ` +
      `${SLA_BREACH_SEVERITIES.join('|')}|none. No fallback severity is applied.`
    );
  }
  return value;
}

/**
 * SLA-breach routing lookup. THROWS on an unknown severity, and THROWS when the escalationExpert
 * is requested for an immediate-remediation severity (a null expert is an orchestrator bug, not a
 * fallback). THROWS on an unknown request.
 *
 * @param {string} severity - 'SEV1'|'SEV2'|'SEV3'|'SEV4'
 * @param {string} [request] - Pass 'escalationExpert' to resolve the expert route
 * @returns {object|string} The frozen routing row, or the expert when requested
 */
export function slaBreachRouting(severity, request) {
  if (!Object.prototype.hasOwnProperty.call(SLA_BREACH_ROUTING, severity)) {
    throw new Error(
      `SLA_BREACH_ROUTING: unknown severity '${severity}'. ` +
      `Known severities: ${SLA_BREACH_SEVERITIES.join(', ')} — no fallback route exists.`
    );
  }
  const row = SLA_BREACH_ROUTING[severity];
  if (request === 'escalationExpert') {
    if (row.escalationExpert === null) {
      throw new Error(
        `SLA_BREACH_ROUTING: severity '${severity}' routes to immediate-remediation — ` +
        'requesting its escalationExpert is an orchestrator bug (no fallback expert exists).'
      );
    }
    return row.escalationExpert;
  }
  if (request !== undefined) {
    throw new Error(
      `SLA_BREACH_ROUTING: unknown request '${request}' — only 'escalationExpert' is resolvable.`
    );
  }
  return row;
}

// ---------------------------------------------------------------------------
// P1 — requirement intake + data-contract definition + conditional contract diff
// ---------------------------------------------------------------------------

export const requirementsIntakeTask = defineTask('dpl.requirements-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements intake for ${args.dataProduct.name}@${args.dataProduct.version}`,
  agent: {
    name: 'data-product-owner',
    prompt: {
      role: 'Data product owner',
      task: 'Turn consumer requirements and the product tier into the questions the product must answer and the mandatory test families',
      context: args,
      instructions: [
        'Derive the consumer-facing questions and the grain each requires; never invent demand not present in the inputs.',
        'Echo the requiredFamilies given in context (they come from tierPolicy(tier)) as the mandatory families — do not add or drop families.',
        'Cross-reference priorKnowledge facts and cite matches instead of rediscovering them.',
        'List the named consumers you can substantiate from the inputs; an unsubstantiated consumer is not a consumer.',
      ],
      outputFormat: 'JSON with questions array (minItems 1), requiredFamilies array (minItems 1), consumers array',
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'requiredFamilies', 'consumers'],
      properties: {
        questions: { type: 'array', minItems: 1 },
        requiredFamilies: { type: 'array', minItems: 1 },
        consumers: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'requirements'],
}));

export const contractDefinitionTask = defineTask('dpl.contract-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define data contract for ${args.dataProduct.name}@${args.dataProduct.version}`,
  agent: {
    name: 'data-contract-author',
    prompt: {
      role: 'Data contract author',
      task: 'Write the versioned data contract for the product',
      context: args,
      instructions: [
        `Write the contract to ${args.contractPath} and report that exact path back as contractPath.`,
        'One entry per contractFields member with field, type, classification, semantics and nullability; plus the grain, the freshness/availability SLA, the ownership, and the version.',
        `Classification values must come from FIELD_CLASSIFICATIONS exactly (${FIELD_CLASSIFICATIONS.join('|')}) — do not invent a level.`,
        'This is a DEFINITION task: do not create, alter, or query warehouse objects.',
        'Set slaRecorded:true only when the freshness and availability promise is actually written into the contract.',
      ],
      outputFormat: 'JSON with contractPath string, fields array (minItems 1) of { field, type, classification, semantics }, slaRecorded boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['contractPath', 'fields', 'slaRecorded'],
      properties: {
        contractPath: { type: 'string' },
        fields: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['field', 'type', 'classification', 'semantics'],
            properties: {
              field: { type: 'string' },
              type: { type: 'string' },
              classification: { type: 'string', enum: ['public', 'internal', 'confidential', 'pii', 'restricted'] },
              semantics: { type: 'string' },
            },
          },
        },
        slaRecorded: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'contract'],
}));

export const contractDiffTask = defineTask('dpl.contract-diff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diff contract ${args.previousContractRef} -> ${args.contractPath}`,
  agent: {
    name: 'contract-diff-analyst',
    prompt: {
      role: 'Data contract diff analyst',
      task: 'Classify the diff between the previously published contract and the new one',
      context: args,
      instructions: [
        'Classify as major|minor|patch using published-contract semantics: a dropped field, a narrowed type, a changed grain, changed metric semantics, or tightened nullability on a consumed field are MAJOR.',
        'Emit one changes[] entry per difference with the classification rationale.',
        'Set breaking:true exactly when classification is major — the orchestrator raises the data-product.contract-breaking-change gate on it.',
        `Evidence must cite the two contract versions (${args.previousContractRef} and ${args.contractPath}) at file:line for every change claimed — at least one entry.`,
      ],
      outputFormat: 'JSON with classification string (major|minor|patch), changes array, breaking boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'changes', 'breaking', 'evidence'],
      properties: {
        classification: { type: 'string', enum: ['major', 'minor', 'patch'] },
        changes: { type: 'array' },
        breaking: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'contract', 'diff'],
}));

// ---------------------------------------------------------------------------
// P2 — source discovery + parallel profiling + lineage mapping
// ---------------------------------------------------------------------------

export const sourceDiscoveryTask = defineTask('dpl.source-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resolve ${args.sources.length} declared source(s) against the catalog`,
  agent: {
    name: 'source-discovery-analyst',
    prompt: {
      role: 'Source discovery analyst',
      task: `Resolve every declared source against the catalog (composes ${args.composedModule})`,
      context: args,
      instructions: [
        `Follow the catalog conventions of the composed module ${args.composedModule}.`,
        'Report resolved:false with the reason for any source that cannot be resolved — do NOT guess a location.',
        'Report the catalog reference and the accountable owner per resolved source.',
        'Set allResolved:true only when every declared source resolved.',
      ],
      outputFormat: 'JSON with sources array of { name, resolved, catalogRef, owner }, allResolved boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'allResolved'],
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'resolved'],
            properties: {
              name: { type: 'string' },
              resolved: { type: 'boolean' },
              catalogRef: { type: ['string', 'null'] },
              owner: { type: ['string', 'null'] },
            },
          },
        },
        allResolved: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'catalog', 'discovery'],
}));

export const sourceProfileTask = defineTask('dpl.source-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: `Profile source ${args.source.name} against real sample data`,
  agent: {
    name: 'source-profiler',
    prompt: {
      role: 'Source data profiler',
      task: 'Profile ONE source against real sample data across the five SOURCE_PROFILE_CHECKS',
      context: args,
      instructions: [
        'Run all five SOURCE_PROFILE_CHECKS against REAL sample data: schema (actual observed columns and types), volume (actual row count), nullability (actual per-column null rate), distribution (actual distinct cardinality and min/max for key columns), freshness (actual max event/load timestamp).',
        `Report exactly five checks[] entries, one per SOURCE_PROFILE_CHECKS member (${SOURCE_PROFILE_CHECKS.join(', ')}).`,
        'NO FALLBACK: if the source cannot be reached or sampled, report profiled:false with the failure reason. Do NOT infer a schema from naming conventions, documentation, or the declared expectedGrain — an assumed schema is a defect, and the orchestrator will FAIL the run on profiled:false.',
        'Set anomaly:true on any check whose observed value contradicts the declared expectation in context.',
        'Evidence must contain the raw profiling query output backing each reported statistic — at least one entry.',
      ],
      outputFormat: 'JSON with source string, profiled boolean, checks array (minItems 5) of { check (schema|volume|nullability|distribution|freshness), observed string, anomaly boolean }, rowCount number|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['source', 'profiled', 'checks', 'rowCount', 'evidence'],
      properties: {
        source: { type: 'string' },
        profiled: { type: 'boolean' },
        checks: {
          type: 'array',
          minItems: 5,
          items: {
            type: 'object',
            required: ['check', 'observed', 'anomaly'],
            properties: {
              check: { type: 'string', enum: ['schema', 'volume', 'nullability', 'distribution', 'freshness'] },
              observed: { type: 'string' },
              anomaly: { type: 'boolean' },
            },
          },
        },
        rowCount: { type: ['number', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'profiling'],
}));

export const lineageMapTask = defineTask('dpl.lineage-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Map lineage + live consumer inventory for ${args.dataProduct.name}`,
  agent: {
    name: 'lineage-mapper',
    prompt: {
      role: 'Data lineage mapper',
      task: `Map upstream lineage and the LIVE downstream consumer inventory (composes ${args.composedModule})`,
      context: args,
      instructions: [
        `Follow the lineage conventions of the composed module ${args.composedModule}.`,
        `Write the lineage map to ${args.lineagePath} and report that exact path back as lineagePath.`,
        'Enumerate downstream consumers concretely (dashboards, marts, feature views, exports, scheduled queries) — this inventory is the input to deprecation impact analysis.',
        'Report consumerInventoryComplete:false when the consumer set cannot be resolved; an unresolved inventory must never be reported as zero consumers.',
        'Evidence must cite the lineage source (manifest, catalog, query log) for each edge claimed — at least one entry.',
      ],
      outputFormat: 'JSON with lineagePath string, upstream array, downstream array, consumers array of string, consumerInventoryComplete boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['lineagePath', 'upstream', 'downstream', 'consumers', 'consumerInventoryComplete', 'evidence'],
      properties: {
        lineagePath: { type: 'string' },
        upstream: { type: 'array' },
        downstream: { type: 'array' },
        consumers: { type: 'array', items: { type: 'string' } },
        consumerInventoryComplete: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'lineage'],
}));

// ---------------------------------------------------------------------------
// P3 — build: scaffold, models, pipelines, metrics, serving surfaces, query optimization
// ---------------------------------------------------------------------------

export const warehouseProjectScaffoldTask = defineTask('dpl.warehouse-project-scaffold', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scaffold warehouse target + transformation project for ${args.dataProduct.name}`,
  agent: {
    name: 'platform-scaffolder',
    prompt: {
      role: 'Warehouse and transformation-project scaffolder',
      task: `Scaffold the warehouse target and the transformation project (composes ${args.warehouseModule} + ${args.dbtProjectModule})`,
      context: args,
      instructions: [
        `Follow the conventions of the composed modules named in context (${args.warehouseModule}, ${args.dbtProjectModule}).`,
        'Report the created project paths and the resolved target/profile.',
        'Do not invent credentials and do not create production objects — this is a scaffold.',
      ],
      outputFormat: 'JSON with projectPath string, target string, scaffolded boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'target', 'scaffolded'],
      properties: {
        projectPath: { type: 'string' },
        target: { type: 'string' },
        scaffolded: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'scaffold'],
}));

export const modelBuildTask = defineTask('dpl.model-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build model ${args.model.name} (${args.model.pattern} -> ${args.composedModule})`,
  agent: {
    name: 'analytics-engineer',
    prompt: {
      role: 'Analytics engineer',
      task: 'Build ONE model following the conventions of its routed composed module',
      context: args,
      instructions: [
        `Build the model per the pattern conventions of the composed module named in context (composedModule = ${args.composedModule}).`,
        'Ground every column on the PROFILED source schema in context — never on the declared expectedGrain alone.',
        'Declare the model grain explicitly and state which contract fields it satisfies.',
        'Evidence must cite the written model definition at file:line plus the executed compile/build output — at least one entry.',
        'A model you could not build reports built:false honestly with the reason; never fabricate a definition path.',
      ],
      outputFormat: 'JSON with model string, built boolean, modelPath string|null, grain string, contractFieldsSatisfied array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'built', 'modelPath', 'grain', 'contractFieldsSatisfied', 'evidence'],
      properties: {
        model: { type: 'string' },
        built: { type: 'boolean' },
        modelPath: { type: ['string', 'null'] },
        grain: { type: 'string' },
        contractFieldsSatisfied: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'model', 'build'],
}));

export const pipelineBuildTask = defineTask('dpl.pipeline-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build pipeline ${args.pipeline.name} (${args.pipeline.mode} -> ${args.composedModule})`,
  agent: {
    name: 'data-engineer',
    prompt: {
      role: 'Data engineer',
      task: 'Build ONE pipeline following the conventions of its routed composed module',
      context: args,
      instructions: [
        `Build the pipeline per the conventions of the composed module named in context (composedModule = ${args.composedModule}; one of etl-elt-pipeline.js | streaming-pipeline.js | pipeline-migration.js).`,
        'Wire the declared schedule and the models it materializes; declare idempotency and the replay/backfill entry point WITHOUT running one.',
        'Evidence must cite the pipeline definition at file:line plus the executed dry-run/validation output — at least one entry.',
      ],
      outputFormat: 'JSON with pipeline string, built boolean, definitionPath string|null, idempotent boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'built', 'definitionPath', 'idempotent', 'evidence'],
      properties: {
        pipeline: { type: 'string' },
        built: { type: 'boolean' },
        definitionPath: { type: ['string', 'null'] },
        idempotent: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'pipeline', 'build'],
}));

export const metricsLayerBuildTask = defineTask('dpl.metrics-layer-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define semantic metrics for ${args.dataProduct.name}`,
  agent: {
    name: 'metrics-engineer',
    prompt: {
      role: 'Metrics/semantic-layer engineer',
      task: `Define the semantic metrics on top of the built models (composes ${args.composedModule})`,
      context: args,
      instructions: [
        `Follow the conventions of the composed module ${args.composedModule}.`,
        `Write the metric definitions to ${args.metricsPath} and report that exact path back as metricsPath.`,
        'Every metric must carry an unambiguous definition including its grain, filters, and time semantics — these are exactly what the reconciliation critic will RECOMPUTE.',
        'Evidence must cite the metric definitions at file:line plus one executed metric query with its output — at least one entry.',
      ],
      outputFormat: 'JSON with metricsPath string, metrics array (minItems 1) of { name, definition, grain }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['metricsPath', 'metrics', 'evidence'],
      properties: {
        metricsPath: { type: 'string' },
        metrics: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'definition', 'grain'],
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              grain: { type: 'string' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'metrics'],
}));

export const servingSurfaceBuildTask = defineTask('dpl.serving-surface-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build serving surface ${args.surface.name} (${args.surface.kind} -> ${args.composedModule})`,
  agent: {
    name: 'serving-surface-builder',
    prompt: {
      role: 'Analytics serving-surface builder',
      task: 'Build ONE serving surface following the conventions of its routed composed module',
      context: args,
      instructions: [
        `Follow the conventions of the composed module named in context (composedModule = ${args.composedModule}; one of bi-dashboard.js | feature-store.js | ab-testing-pipeline.js).`,
        'Expose ONLY the contract fields listed in context. A field classified pii or restricted may appear only when the approved exposure decision in context lists it — otherwise omitting it is mandatory, not optional.',
        'Evidence must cite the surface definition at file:line plus executed rendering/serving output — at least one entry.',
      ],
      outputFormat: 'JSON with name string, kind string, built boolean, surfacePath string|null, fieldsExposed array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'kind', 'built', 'surfacePath', 'fieldsExposed', 'evidence'],
      properties: {
        name: { type: 'string' },
        kind: { type: 'string' },
        built: { type: 'boolean' },
        surfacePath: { type: ['string', 'null'] },
        fieldsExposed: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'serving'],
}));

export const queryOptimizationTask = defineTask('dpl.query-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize hot queries for ${args.dataProduct.name}`,
  agent: {
    name: 'query-optimizer',
    prompt: {
      role: 'Query performance engineer',
      task: `Optimize the product hot queries and prove the improvement with executed plans (composes ${args.composedModule})`,
      context: args,
      instructions: [
        `Follow the conventions of the composed module ${args.composedModule}.`,
        'For each hot query report the BEFORE and AFTER executed plan/cost — an assertion of improvement without both plans is not evidence.',
        'Do not change query SEMANTICS while optimizing; a plan change that alters results is a defect to report, not an optimization. Report semanticsUnchanged per query.',
        'Evidence must contain the executed EXPLAIN/cost output for both the before and the after plan — at least one entry.',
      ],
      outputFormat: 'JSON with queries array of { query, beforeCost, afterCost, semanticsUnchanged }, optimized boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['queries', 'optimized', 'evidence'],
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'object',
            required: ['query', 'beforeCost', 'afterCost', 'semanticsUnchanged'],
            properties: {
              query: { type: 'string' },
              beforeCost: { type: ['string', 'number', 'null'] },
              afterCost: { type: ['string', 'number', 'null'] },
              semanticsUnchanged: { type: 'boolean' },
            },
          },
        },
        optimized: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'performance'],
}));

// ---------------------------------------------------------------------------
// P4 — EXECUTED test families (parallel)
// ---------------------------------------------------------------------------

export const testFamilyRunTask = defineTask('dpl.test-family-run', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author AND EXECUTE test family ${args.family}`,
  agent: {
    name: 'data-quality-engineer',
    prompt: {
      role: 'Data quality engineer',
      task: `Author AND EXECUTE one test family against the built product (composes ${args.composedModule})`,
      context: args,
      instructions: [
        `Follow the conventions of the composed module ${args.composedModule} for the family '${args.family}'.`,
        'AUTHOR the assertions, then RUN them. Report per-assertion pass/fail with the raw runner output — an authored-but-unrun suite reports ran:false and is treated as a failure.',
        'For row-count-reconciliation and metric-value-reconciliation the comparison target is the SOURCE OF TRUTH (the profiled source or the system of record), not the model own output.',
        'Do not score the family overall — report ran, total, failed and the assertion detail; the orchestrator computes pass/fail deterministically.',
        'Evidence must contain the raw executed suite output — at least one entry.',
      ],
      outputFormat: 'JSON with family string, ran boolean, total number, failed number, assertions array (minItems 1) of { name, passed, detail }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['family', 'ran', 'total', 'failed', 'assertions', 'evidence'],
      properties: {
        family: {
          type: 'string',
          enum: [
            'schema-contract',
            'row-count-reconciliation',
            'metric-value-reconciliation',
            'uniqueness-referential',
            'freshness-sla',
          ],
        },
        ran: { type: 'boolean' },
        total: { type: 'number' },
        failed: { type: 'number' },
        assertions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'passed', 'detail'],
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              detail: { type: 'string' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'quality', 'executed'],
}));

// ---------------------------------------------------------------------------
// P5 — backfill plan / execution / verification, cutover execution / verification, publish
// ---------------------------------------------------------------------------

export const backfillPlanTask = defineTask('dpl.backfill-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan backfill for ${args.dataProduct.name} (window ${args.window})`,
  agent: {
    name: 'backfill-planner',
    prompt: {
      role: 'Backfill planner',
      task: 'Turn the requested backfill window into a per-target plan — a PLAN, not an execution',
      context: args,
      instructions: [
        'You must NOT run, overwrite, or delete anything: execution only happens after the data-product.destructive-backfill gate approves this plan.',
        'Emit one actions[] entry per target with { target, operation, rowsAffectedEstimate, overwritesExisting, deletesExisting, verificationQuery }.',
        'Set overwritesExisting/deletesExisting truthfully — the orchestrator uses them to classify destructiveness; understating them is a defect.',
        'Evidence must cite the source-of-truth counts backing every rowsAffectedEstimate — at least one entry.',
      ],
      outputFormat: 'JSON with planSummary string, actions array (minItems 1) of { target, operation, rowsAffectedEstimate, overwritesExisting, deletesExisting, verificationQuery }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['planSummary', 'actions', 'evidence'],
      properties: {
        planSummary: { type: 'string' },
        actions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['target', 'operation', 'rowsAffectedEstimate', 'overwritesExisting', 'deletesExisting', 'verificationQuery'],
            properties: {
              target: { type: 'string' },
              operation: { type: 'string' },
              rowsAffectedEstimate: { type: 'number' },
              overwritesExisting: { type: 'boolean' },
              deletesExisting: { type: 'boolean' },
              verificationQuery: { type: 'string' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'backfill', 'plan'],
}));

export const backfillExecutionTask = defineTask('dpl.backfill-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved backfill for ${args.dataProduct.name}`,
  agent: {
    name: 'backfill-executor',
    prompt: {
      role: 'Backfill executor',
      task: 'Execute EXACTLY the approved backfill plan — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the data-product.destructive-backfill gate approved the plan in context.',
        'Execute exactly the approved actions in order; do not improvise additional writes or touch unlisted targets.',
        'Report one actions[] entry per executed action with { action, outcome, timestamp, rowsAffected }.',
        'If a step fails, stop and report executed:false honestly — do not improvise an alternate action.',
        'Evidence must contain the raw execution output per action — at least one entry.',
      ],
      outputFormat: 'JSON with executed boolean, actions array (minItems 1) of { action, outcome, timestamp, rowsAffected }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'actions', 'evidence'],
      properties: {
        executed: { type: 'boolean' },
        actions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['action', 'outcome', 'timestamp', 'rowsAffected'],
            properties: {
              action: { type: 'string' },
              outcome: { type: 'string' },
              timestamp: { type: 'string' },
              rowsAffected: { type: ['number', 'null'] },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'backfill', 'execute', 'policy-gated'],
}));

export const backfillVerificationTask = defineTask('dpl.backfill-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify post-backfill state for ${args.dataProduct.name}`,
  agent: {
    name: 'backfill-verifier',
    prompt: {
      role: 'Backfill verifier',
      task: 'Re-run every verificationQuery from the approved plan and prove the post-backfill state',
      context: args,
      instructions: [
        'RUN each verificationQuery yourself and report its actual output — quoting the executor report is not verification.',
        'Reconcile the post-backfill row counts against the source of truth per target.',
        'Evidence must contain the raw query output per target — at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, checks array (minItems 1) of { target, expected, actual, matched }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'checks', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        checks: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['target', 'expected', 'actual', 'matched'],
            properties: {
              target: { type: 'string' },
              expected: { type: ['string', 'number', 'null'] },
              actual: { type: ['string', 'number', 'null'] },
              matched: { type: 'boolean' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'backfill', 'verify'],
}));

export const cutoverExecutionTask = defineTask('dpl.cutover-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved ${args.cutoverStrategy} cutover for ${args.dataProduct.name}`,
  agent: {
    name: 'cutover-executor',
    prompt: {
      role: 'Production cutover executor',
      task: 'Execute the approved production cutover using the declared strategy',
      context: args,
      instructions: [
        'This task only ever runs AFTER the data-product.production-cutover gate approved it.',
        `Follow the approved cutoverStrategy exactly (${args.cutoverStrategy}); do not substitute another strategy.`,
        'Record each consumer repointed with an ISO timestamp.',
        'If a step fails, stop and report executed:false honestly — do not improvise a rollback.',
        'Evidence must contain the raw execution output — at least one entry.',
      ],
      outputFormat: 'JSON with executed boolean, consumersCutOver array, actions array (minItems 1) of { action, outcome, timestamp }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'consumersCutOver', 'actions', 'evidence'],
      properties: {
        executed: { type: 'boolean' },
        consumersCutOver: { type: 'array' },
        actions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['action', 'outcome', 'timestamp'],
            properties: {
              action: { type: 'string' },
              outcome: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'cutover', 'execute', 'policy-gated'],
}));

export const cutoverVerificationTask = defineTask('dpl.cutover-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Re-reconcile ${args.dataProduct.name} post-cutover against the source of truth`,
  agent: {
    name: 'cutover-verifier',
    prompt: {
      role: 'Post-cutover reconciliation verifier',
      task: 'Re-reconcile row counts and headline metric values post-cutover against the source of truth',
      context: args,
      instructions: [
        'RUN the reconciliation queries yourself post-cutover; the domain failure mode is a SILENTLY WRONG ANSWER, so a healthy pipeline status is not verification.',
        'Compare each headline metric against the source of truth and report the absolute and relative difference.',
        'Evidence must contain the raw query output per reconciled item — at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, reconciliations array (minItems 1) of { item, expected, actual, diff, matched }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'reconciliations', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        reconciliations: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['item', 'expected', 'actual', 'diff', 'matched'],
            properties: {
              item: { type: 'string' },
              expected: { type: ['string', 'number', 'null'] },
              actual: { type: ['string', 'number', 'null'] },
              diff: { type: ['string', 'number', 'null'] },
              matched: { type: 'boolean' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'cutover', 'verify'],
}));

export const catalogPublishTask = defineTask('dpl.catalog-publish', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish ${args.dataProduct.name}@${args.dataProduct.version} to the catalog`,
  agent: {
    name: 'catalog-publisher',
    prompt: {
      role: 'Data catalog publisher',
      task: `Register the dataset and publish the contract version (composes ${args.composedModule})`,
      context: args,
      instructions: [
        `Follow the conventions of the composed module ${args.composedModule}.`,
        'Publish the contract version, ownership, SLA, field classifications and the lineage reference together — a catalog entry without the contract is incomplete.',
        'Evidence must cite the published catalog entry and contract ref — at least one entry.',
      ],
      outputFormat: 'JSON with published boolean, catalogEntry string, contractRef string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'catalogEntry', 'contractRef', 'evidence'],
      properties: {
        published: { type: 'boolean' },
        catalogEntry: { type: 'string' },
        contractRef: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'catalog', 'publish'],
}));

// ---------------------------------------------------------------------------
// P6 — SLA + freshness monitoring and breach handling
// ---------------------------------------------------------------------------

export const slaMonitorSetupTask = defineTask('dpl.sla-monitor-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure + probe SLA monitoring for ${args.dataProduct.name}`,
  agent: {
    name: 'sla-monitor-engineer',
    prompt: {
      role: 'SLA and freshness monitoring engineer',
      task: 'Configure freshness/availability/completeness monitoring, capture the baseline, RUN the probe and PROVE the alert hooks fire',
      context: args,
      instructions: [
        `Write the monitor spec to ${args.monitorSpecPath} and report that exact path back as monitorSpecPath, with one check per SLA dimension in context (freshnessMinutes, availabilityTarget, completenessTarget).`,
        'RUN the probe once against the live product and report the observed values plus breachDetected from that executed run.',
        'Fire each alerting hook against a SYNTHETIC breach and report the fired-alert output per hook — a configured-but-unfired hook counts as not configured.',
        'breachDetected:true requires an actual breach in the executed probe — never a guess.',
        'Evidence must contain the raw probe output and the fired-alert outputs — at least one entry.',
      ],
      outputFormat: 'JSON with monitorSpecPath string, configured boolean, baselineCaptured boolean, probeRun { ran boolean, observed object, breachDetected boolean }, alertingHooks array (minItems 1), evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['monitorSpecPath', 'configured', 'baselineCaptured', 'probeRun', 'alertingHooks', 'evidence'],
      properties: {
        monitorSpecPath: { type: 'string' },
        configured: { type: 'boolean' },
        baselineCaptured: { type: 'boolean' },
        probeRun: {
          type: 'object',
          required: ['ran', 'observed', 'breachDetected'],
          properties: {
            ran: { type: 'boolean' },
            observed: { type: 'object' },
            breachDetected: { type: 'boolean' },
          },
        },
        alertingHooks: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'sla', 'monitoring', 'executed'],
}));

export const slaBreachTriageTask = defineTask('dpl.sla-breach-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage SLA breach on ${args.dataProduct.name}`,
  agent: {
    name: 'sla-breach-triager',
    prompt: {
      role: 'SLA breach triager',
      task: 'Triage the detected SLA/freshness breach and assign a severity',
      context: args,
      instructions: [
        `Assign severity strictly from SLA_BREACH_SEVERITIES (${SLA_BREACH_SEVERITIES.join('|')}) — no other value is accepted and the orchestrator will THROW on one.`,
        'SEV1: the published promise is broken for every consumer with visible downstream damage. SEV2: significant ongoing freshness/completeness degradation. SEV3: partial/limited impact. SEV4: internal-only signal, no consumer impact.',
        'State the suspected cause with the pipeline/model it points at and a recommendation (fix-forward | remediate | escalate).',
        'Evidence must cite the probe output and the pipeline/run logs backing the cause — at least one entry.',
      ],
      outputFormat: 'JSON with severity string (SEV1|SEV2|SEV3|SEV4), summary string, recommendation string, rationale string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['severity', 'summary', 'recommendation', 'rationale', 'evidence'],
      properties: {
        severity: { type: 'string', enum: ['SEV1', 'SEV2', 'SEV3', 'SEV4'] },
        summary: { type: 'string' },
        recommendation: { type: 'string' },
        rationale: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'sla', 'triage'],
}));

export const slaRemediationExecutionTask = defineTask('dpl.sla-remediation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediate ${args.severity} SLA breach (attempt ${args.attempt})`,
  agent: {
    name: 'sla-remediator',
    prompt: {
      role: 'SLA remediation engineer',
      task: 'Remediate the breach with NON-DESTRUCTIVE actions only',
      context: args,
      instructions: [
        'Non-destructive only: re-run, resume, rescale, repair-in-place-without-overwrite.',
        'Anything that would overwrite or delete existing warehouse data is OUT OF SCOPE here — report it as requiresDestructiveBackfill:true and stop; it must re-enter the data-product.destructive-backfill gate.',
        'Report one actions[] entry per action with outcome and an ISO timestamp.',
        'Evidence must contain the raw execution output — at least one entry.',
      ],
      outputFormat: 'JSON with remediated boolean, requiresDestructiveBackfill boolean, actions array (minItems 1), evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['remediated', 'requiresDestructiveBackfill', 'actions', 'evidence'],
      properties: {
        remediated: { type: 'boolean' },
        requiresDestructiveBackfill: { type: 'boolean' },
        actions: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'sla', 'remediate'],
}));

export const slaRemediationVerificationTask = defineTask('dpl.sla-remediation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Re-run the SLA probe after remediation (attempt ${args.attempt})`,
  agent: {
    name: 'sla-remediation-verifier',
    prompt: {
      role: 'SLA remediation verifier',
      task: 'Re-run the freshness/SLA probe and prove the breach cleared',
      context: args,
      instructions: [
        'RE-RUN the probe yourself and report the fresh observed values — quoting the remediator is not verification.',
        'verified:true requires the observed values to clear the published promise in context; anything less is verified:false, honestly reported.',
        'Evidence must contain the raw re-run probe output — at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, observed object, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'observed', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        observed: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'sla', 'verify'],
}));

// ---------------------------------------------------------------------------
// P7 — deprecation / deletion path (policy-gated, irreversible)
// ---------------------------------------------------------------------------

export const deprecationImpactAnalysisTask = defineTask('dpl.deprecation-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyse deprecation impact for ${args.datasetRef}`,
  agent: {
    name: 'deprecation-impact-analyst',
    prompt: {
      role: 'Dataset deprecation impact analyst',
      task: 'Enumerate live consumers and plan the deprecation — a PLAN, not an execution',
      context: args,
      instructions: [
        'You must NOT drop, revoke, or alter anything: execution only happens after the data-product.dataset-deprecation gate approves this plan.',
        'Enumerate LIVE downstream consumers from the lineage map and catalog in context; propose a migration target and a notice period per consumer.',
        'NO FALLBACK: if the consumer inventory cannot be resolved, report inventoryResolved:false — never report zero consumers for an unresolved inventory. The orchestrator FAILS the run on inventoryResolved:false rather than deprecating blind.',
        'Emit one actions[] entry per target with a verificationQuery proving the post-deprecation state.',
        'Evidence must cite the lineage/catalog/query-log records backing each consumer claim — at least one entry.',
      ],
      outputFormat: 'JSON with inventoryResolved boolean, consumers array of { consumer, owner, migrationTarget, noticePeriod }, planSummary string, actions array (minItems 1) of { target, operation, verificationQuery }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['inventoryResolved', 'consumers', 'planSummary', 'actions', 'evidence'],
      properties: {
        inventoryResolved: { type: 'boolean' },
        consumers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['consumer', 'owner', 'migrationTarget', 'noticePeriod'],
            properties: {
              consumer: { type: 'string' },
              owner: { type: ['string', 'null'] },
              migrationTarget: { type: ['string', 'null'] },
              noticePeriod: { type: ['string', 'null'] },
            },
          },
        },
        planSummary: { type: 'string' },
        actions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['target', 'operation', 'verificationQuery'],
            properties: {
              target: { type: 'string' },
              operation: { type: 'string' },
              verificationQuery: { type: 'string' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'deprecation', 'plan'],
}));

export const deprecationExecutionTask = defineTask('dpl.deprecation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved IRREVERSIBLE deprecation of ${args.datasetRef}`,
  agent: {
    name: 'deprecation-executor',
    prompt: {
      role: 'Dataset deprecation executor',
      task: 'Execute EXACTLY the approved deprecation plan — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the data-product.dataset-deprecation gate approved the plan in context. The action is IRREVERSIBLE.',
        'Execute exactly the approved actions in order; do not drop objects outside the approved plan and do not touch unlisted consumers.',
        'If the approved plan is absent from the context, REFUSE and report executed:false — there is no un-gated deprecation path.',
        'Report one actions[] entry per executed action with { action, outcome, timestamp }.',
        'Evidence must contain the raw execution output per action — at least one entry.',
      ],
      outputFormat: 'JSON with executed boolean, actions array (minItems 1) of { action, outcome, timestamp }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'actions', 'evidence'],
      properties: {
        executed: { type: 'boolean' },
        actions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['action', 'outcome', 'timestamp'],
            properties: {
              action: { type: 'string' },
              outcome: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'deprecation', 'execute', 'policy-gated'],
}));

export const deprecationVerificationTask = defineTask('dpl.deprecation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify post-deprecation state of ${args.datasetRef}`,
  agent: {
    name: 'deprecation-verifier',
    prompt: {
      role: 'Deprecation verifier',
      task: 'Re-run every verificationQuery and prove the post-deprecation state',
      context: args,
      instructions: [
        'RUN each verificationQuery yourself and report the actual output.',
        'Confirm no live consumer is still reading the deprecated dataset; a still-reading consumer is a finding, not a rounding error.',
        'Evidence must contain the raw query output per target — at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, checks array (minItems 1) of { target, expected, actual, matched }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'checks', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        checks: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['target', 'expected', 'actual', 'matched'],
            properties: {
              target: { type: 'string' },
              expected: { type: ['string', 'number', 'null'] },
              actual: { type: ['string', 'number', 'null'] },
              matched: { type: 'boolean' },
            },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpl', 'deprecation', 'verify'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    dataProduct,
    sources,
    models,
    pipelines,
    contractFields,
    servingSurfaces = [],
    sla,
    backfill = null,
    cutoverStrategy = 'dual-run',
    deprecation = null,
    maxFixAttempts = 2,
    maxRemediationAttempts = 1,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -------------------------------------------------------------------------
  // Input validation — no fallbacks: unknown/missing values throw naming the source.
  // -------------------------------------------------------------------------
  if (!dataProduct || !dataProduct.name || !dataProduct.version || !dataProduct.tier || !dataProduct.owner) {
    throw new Error(
      'data-product-lifecycle-workflow requires dataProduct { name, version, tier, owner } — ' +
      'refusing to guess missing fields (no fallback product identity exists).'
    );
  }
  const productName = dataProduct.name;
  const productVersion = dataProduct.version;
  const tier = assertProductTier(dataProduct.tier);
  const policy = tierPolicy(tier);
  const repoRoot = dataProduct.repoRoot ?? '.';
  const warehouse = dataProduct.warehouse ?? null;
  const publishedContractRef = dataProduct.publishedContractRef ?? null;

  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(
      'data-product-lifecycle-workflow requires a non-empty sources array — a product with no ' +
      'source is unprofileable; no default sources are synthesized.'
    );
  }
  for (const source of sources) {
    if (!source || !source.name || !source.uri || !source.system) {
      throw new Error(
        `sources entries require { name, uri, system } (got ${JSON.stringify(source)}) — ` +
        'no fallback source definition exists.'
      );
    }
  }
  const sourceNames = sources.map((s) => s.name);

  if (!Array.isArray(models) || models.length === 0) {
    throw new Error(
      'data-product-lifecycle-workflow requires a non-empty models array — there is nothing to ' +
      'build; no default models are synthesized.'
    );
  }
  for (const model of models) {
    if (!model || !model.name || !model.pattern || !model.grain || !Array.isArray(model.sources) || model.sources.length === 0) {
      throw new Error(
        `models entries require { name, pattern, grain, sources[] } (got ${JSON.stringify(model)}) — ` +
        'no fallback model definition exists.'
      );
    }
    modelPatternModule(model.pattern);
    for (const ref of model.sources) {
      if (!sourceNames.includes(ref)) {
        throw new Error(
          `model '${model.name}' references unknown source '${ref}' — known sources: ` +
          `${sourceNames.join(', ')}. No fallback source resolution exists.`
        );
      }
    }
  }

  if (!Array.isArray(pipelines) || pipelines.length === 0) {
    throw new Error(
      'data-product-lifecycle-workflow requires a non-empty pipelines array — a product with no ' +
      'pipeline never materializes; no default pipelines are synthesized.'
    );
  }
  for (const pipeline of pipelines) {
    if (!pipeline || !pipeline.name || !pipeline.mode) {
      throw new Error(
        `pipelines entries require { name, mode } (got ${JSON.stringify(pipeline)}) — ` +
        'no fallback pipeline definition exists.'
      );
    }
    pipelineModeModule(pipeline.mode);
  }

  if (!Array.isArray(contractFields) || contractFields.length === 0) {
    throw new Error(
      'data-product-lifecycle-workflow requires a non-empty contractFields array — an ' +
      'uncontracted product is unpublishable; no default contract is synthesized.'
    );
  }
  for (const field of contractFields) {
    if (!field || !field.field || !field.type || !field.classification || !field.semantics) {
      throw new Error(
        `contractFields entries require { field, type, classification, semantics } (got ${JSON.stringify(field)}) — ` +
        'no fallback field definition exists.'
      );
    }
    assertFieldClassification(field.classification, `contractFields entry '${field.field}'`);
  }

  if (!Array.isArray(servingSurfaces)) {
    throw new Error(
      `servingSurfaces must be an array when provided (got ${JSON.stringify(servingSurfaces)}) — ` +
      'no fallback serving definition exists.'
    );
  }
  for (const surface of servingSurfaces) {
    if (!surface || !surface.name || !surface.kind) {
      throw new Error(
        `servingSurfaces entries require { name, kind } (got ${JSON.stringify(surface)}) — ` +
        'no fallback surface definition exists.'
      );
    }
    servingSurfaceModule(surface.kind);
    if (policy.servingAllowed !== true) {
      // No silent downgrade: a serving surface on a non-serving tier is a caller error.
      throw new Error(
        `servingSurfaces entry '${surface.name}' declared on tier '${tier}', whose TIER_POLICY sets ` +
        'servingAllowed:false — refusing to silently drop the surface or downgrade the product ' +
        '(no fallback serving policy exists).'
      );
    }
  }

  if (!sla || typeof sla.freshnessMinutes !== 'number' || typeof sla.availabilityTarget !== 'number') {
    throw new Error(
      'data-product-lifecycle-workflow requires sla { freshnessMinutes: number, availabilityTarget: number } — ' +
      'a product with no published promise cannot be monitored (no fallback SLA exists).'
    );
  }

  assertCutoverStrategy(cutoverStrategy);

  const mandatoryFamilies = policy.requiredFamilies.map((family) => assertTestFamily(family));

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();

  // Timeline is accumulated HERE, in the orchestrator — agents never write it.
  const timeline = [];
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };

  // Mutable run state referenced by buildResult (terminal returns carry full state).
  let contract = null;
  const sourceProfiles = [];
  let lineage = null;
  const builds = { models: [], pipelines: [], servingSurfaces: [] };
  const testRuns = [];
  let correctnessGate = null;
  let contractGate = null;
  let piiExposure = null;
  let breakingChange = null;
  let backfillState = null;
  let cutover = null;
  let publish = null;
  let slaMonitoring = null;
  const slaBreach = { detected: false, severity: null, escalationRaised: false, remediation: null };
  let slaTriage = null;
  let deprecationState = null;
  let kipFactsAsserted = 0;
  const artifacts = [];

  const buildResult = (success, reason) => ({
    success,
    dataProductName: productName,
    version: productVersion,
    contract,
    sourceProfiles,
    lineage,
    builds,
    testRuns,
    correctnessGate,
    contractGate,
    piiExposure,
    breakingChange,
    backfill: backfillState,
    cutover,
    publish,
    slaMonitoring,
    slaBreach,
    deprecation: deprecationState,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'specializations/data-engineering-analytics/data-product-lifecycle-workflow',
      runId: ctx.runId,
      timeline,
      breakpointsHit,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall of prior data-product memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior data-product memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: `data product: ${productName}@${productVersion}`,
      kipModel,
      kind: 'data-product',
    });
    timeline.push({ at: nowIso(), event: 'kip-recall', detail: `factCount=${priorKnowledge.factCount}` });
  }

  // -------------------------------------------------------------------------
  // P8 helper — kip assert at close. Facts are built DETERMINISTICALLY here in the
  // orchestrator (never inside an agent) and are unconditionally non-empty when
  // reached: the has-version and outcome facts always exist, which makes the
  // kipAssert empty-facts throw unreachable by construction.
  // -------------------------------------------------------------------------
  const closeWithKip = async (success, reason) => {
    if (kipEnabled) {
      const subject = `data-product:${productName}@${productVersion}`;
      const deprecated = !!(deprecationState && deprecationState.executed === true);
      const cutOver = !!(cutover && cutover.executed === true);
      const published = !!(publish && publish.published === true);
      const outcome = deprecated
        ? 'deprecated'
        : published && success
          ? 'published'
          : cutOver
            ? 'cut-over'
            : 'failed';
      const facts = [
        { subject, predicate: 'has-version', object: productVersion },
        {
          subject,
          predicate: 'outcome',
          object: outcome,
          props: {
            correctnessGatePassed: correctnessGate ? correctnessGate.passed === true : false,
            contractGatePassed: contractGate ? contractGate.passed === true : false,
            cutoverVerified: cutover ? cutover.verified === true : false,
          },
        },
      ];
      if (contract) {
        facts.push({
          subject,
          predicate: 'has-contract',
          object: contract.path,
          props: {
            fields: contract.fields,
            breaking: contract.breaking,
            publishedRef: contract.publishedRef,
          },
        });
      }
      for (const run of testRuns) {
        facts.push({
          subject,
          predicate: 'quality-family',
          object: run.family,
          props: { ran: run.ran, total: run.total, failed: run.failed, passed: run.passed },
        });
      }
      for (const profile of sourceProfiles) {
        facts.push({
          subject,
          predicate: 'source-profile',
          object: profile.source,
          props: { rowCount: profile.rowCount, anomalies: profile.anomalies },
        });
      }
      facts.push({
        subject,
        predicate: 'sla-promise',
        object: `${sla.freshnessMinutes}m/${sla.availabilityTarget}`,
        props: { breachDetected: slaBreach.detected === true, severity: slaBreach.severity },
      });
      if (slaBreach.detected === true && slaTriage) {
        facts.push({
          subject,
          predicate: 'sla-breach-lesson',
          object: `${slaBreach.severity}: ${slaTriage.rationale}`,
        });
      }
      if (deprecationState && deprecationState.requested === true) {
        facts.push({
          subject,
          predicate: 'deprecation',
          object: deprecationState.datasetRef,
          props: {
            consumers: deprecationState.consumers,
            approved: deprecationState.approved === true,
            executed: deprecationState.executed === true,
            verified: deprecationState.verified === true,
          },
        });
      }
      const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'data-product', facts });
      kipFactsAsserted = asserted.asserted;
      timeline.push({ at: nowIso(), event: 'kip-assert', detail: `${kipFactsAsserted} facts` });
    }
    return buildResult(success, reason);
  };

  // -------------------------------------------------------------------------
  // P1 — requirement intake + data-contract definition + conditional contract diff
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: requirement intake + data-contract definition');
  const intake = await ctx.task(requirementsIntakeTask, {
    dataProduct: { name: productName, version: productVersion, tier, owner: dataProduct.owner, repoRoot, warehouse },
    tier,
    requiredFamilies: mandatoryFamilies,
    contractFields,
    servingSurfaces,
    sla,
    priorKnowledge,
  });
  timeline.push({ at: nowIso(), event: 'requirements-intake', detail: `${intake.questions.length} questions, ${intake.requiredFamilies.length} mandatory families` });

  const contractPath = `${artifactsRoot}/data-contract-${productName}-${productVersion}.md`;
  const contractDef = await ctx.task(contractDefinitionTask, {
    dataProduct: { name: productName, version: productVersion, tier, owner: dataProduct.owner },
    contractPath,
    contractFields,
    sla,
    models,
    priorKnowledge,
  });
  artifacts.push(contractDef.contractPath);
  contract = {
    path: contractDef.contractPath,
    fields: contractDef.fields.length,
    breaking: false,
    publishedRef: publishedContractRef,
  };
  timeline.push({ at: nowIso(), event: 'contract-defined', detail: `${contractDef.fields.length} fields -> ${contractDef.contractPath}` });

  // Every reported classification is validated against the frozen set — unknown THROWS.
  for (const field of contractDef.fields) {
    assertFieldClassification(field.classification, `dpl.contract-definition field '${field.field}'`);
  }

  let contractDiff = null;
  if (publishedContractRef !== null) {
    contractDiff = await ctx.task(contractDiffTask, {
      dataProduct: { name: productName, version: productVersion },
      previousContractRef: publishedContractRef,
      contractPath: contractDef.contractPath,
      contractFields,
    });
    contract.breaking = contractDiff.breaking === true;
    timeline.push({ at: nowIso(), event: 'contract-diff', detail: `classification=${contractDiff.classification} breaking=${contract.breaking}` });
  }

  // -------------------------------------------------------------------------
  // P2 — source discovery + parallel profiling + lineage mapping
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P2: source discovery + parallel profiling across ${sources.length} sources`);
  const discovery = await ctx.task(sourceDiscoveryTask, {
    sources,
    composedModule: ingredientModule('catalog'),
    dataProduct: { name: productName, version: productVersion },
    priorKnowledge,
  });
  timeline.push({ at: nowIso(), event: 'source-discovery', detail: `allResolved=${discovery.allResolved === true}` });

  const profiles = await ctx.parallel.all(
    sources.map((source) => () =>
      ctx.task(sourceProfileTask, {
        source,
        checks: SOURCE_PROFILE_CHECKS,
        dataProduct: { name: productName, version: productVersion },
        priorKnowledge,
      })
    )
  );

  let profileFailClosed = null;
  for (const profile of profiles) {
    // Validate every reported check name against the frozen set — unknown check THROWS.
    for (const check of profile.checks) {
      profileCheckLabel(check.check);
    }
    const reported = profile.checks.map((c) => c.check);
    for (const required of SOURCE_PROFILE_CHECKS) {
      if (!reported.includes(required)) {
        throw new Error(
          `dpl.source-profile for '${profile.source}' omitted the required check '${required}' — ` +
          `all of ${SOURCE_PROFILE_CHECKS.join(', ')} are mandatory (no fallback check is synthesized).`
        );
      }
    }
    const anomalies = profile.checks.filter((c) => c.anomaly === true).length;
    sourceProfiles.push({
      source: profile.source,
      profiled: profile.profiled === true,
      checks: profile.checks.length,
      rowCount: profile.rowCount ?? null,
      anomalies,
    });
    timeline.push({ at: nowIso(), event: 'source-profiled', detail: `${profile.source}: profiled=${profile.profiled === true} rowCount=${profile.rowCount} anomalies=${anomalies}` });
    if (profile.profiled !== true) {
      // NO FALLBACK: the run never proceeds on an assumed schema.
      profileFailClosed =
        `source '${profile.source}' could not be profiled (profiled:false) — failing closed rather than ` +
        'proceeding on an assumed schema (no fallback profile exists).';
    }
  }
  if (profileFailClosed) {
    return buildResult(false, profileFailClosed);
  }

  const lineagePath = `${artifactsRoot}/lineage-${productName}-${productVersion}.md`;
  const lineageResult = await ctx.task(lineageMapTask, {
    dataProduct: { name: productName, version: productVersion },
    composedModule: ingredientModule('lineage'),
    lineagePath,
    sources,
    models,
    pipelines,
    sourceProfiles,
    priorKnowledge,
  });
  artifacts.push(lineageResult.lineagePath);
  lineage = {
    path: lineageResult.lineagePath,
    upstream: lineageResult.upstream.length,
    downstream: lineageResult.downstream.length,
    consumers: lineageResult.consumers,
  };
  timeline.push({ at: nowIso(), event: 'lineage-mapped', detail: `upstream=${lineage.upstream} downstream=${lineage.downstream} consumers=${lineage.consumers.length} complete=${lineageResult.consumerInventoryComplete === true}` });

  if (deprecation && deprecation.requested === true && lineageResult.consumerInventoryComplete !== true) {
    // NO FALLBACK: an unresolved consumer inventory is never treated as zero consumers.
    return buildResult(
      false,
      'lineage consumer inventory is incomplete (consumerInventoryComplete:false) while a deprecation was ' +
      'requested — failing closed rather than deprecating against an unknown consumer set.'
    );
  }

  // -------------------------------------------------------------------------
  // P3 — build: scaffold, parallel model build, parallel pipeline build, metrics,
  //      PII gate, parallel serving surfaces, query optimization
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: warehouse/project scaffold + parallel model and pipeline build');
  const scaffold = await ctx.task(warehouseProjectScaffoldTask, {
    dataProduct: { name: productName, version: productVersion, tier, owner: dataProduct.owner, repoRoot, warehouse },
    warehouseModule: ingredientModule('warehouse'),
    dbtProjectModule: ingredientModule('dbtProject'),
    models,
    pipelines,
  });
  timeline.push({ at: nowIso(), event: 'scaffold', detail: `scaffolded=${scaffold.scaffolded === true} project=${scaffold.projectPath} target=${scaffold.target}` });

  const modelResults = await ctx.parallel.all(
    models.map((model) => () =>
      ctx.task(modelBuildTask, {
        model,
        composedModule: modelPatternModule(model.pattern),
        projectPath: scaffold.projectPath,
        profiles: profiles.filter((p) => model.sources.includes(p.source)),
        contractFields,
        priorKnowledge,
      })
    )
  );
  const builtModels = [];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const built = modelResults[i];
    builds.models.push({
      model: model.name,
      pattern: model.pattern,
      built: built.built === true,
      path: built.modelPath ?? null,
    });
    builtModels.push({
      model: model.name,
      pattern: model.pattern,
      grain: built.grain,
      modelPath: built.modelPath ?? null,
      contractFieldsSatisfied: built.contractFieldsSatisfied,
    });
    timeline.push({ at: nowIso(), event: 'model-built', detail: `${model.name} (${model.pattern} -> ${modelPatternModule(model.pattern)}): built=${built.built === true}` });
  }

  const pipelineResults = await ctx.parallel.all(
    pipelines.map((pipeline) => () =>
      ctx.task(pipelineBuildTask, {
        pipeline,
        composedModule: pipelineModeModule(pipeline.mode),
        projectPath: scaffold.projectPath,
        builtModels,
      })
    )
  );
  for (let i = 0; i < pipelines.length; i++) {
    const pipeline = pipelines[i];
    const built = pipelineResults[i];
    builds.pipelines.push({ pipeline: pipeline.name, mode: pipeline.mode, built: built.built === true });
    timeline.push({ at: nowIso(), event: 'pipeline-built', detail: `${pipeline.name} (${pipeline.mode} -> ${pipelineModeModule(pipeline.mode)}): built=${built.built === true}` });
  }

  const metricsPath = `${artifactsRoot}/metrics-${productName}-${productVersion}.md`;
  const metricsResult = await ctx.task(metricsLayerBuildTask, {
    dataProduct: { name: productName, version: productVersion },
    composedModule: ingredientModule('metrics'),
    metricsPath,
    builtModels,
    contractFields,
  });
  artifacts.push(metricsResult.metricsPath);
  timeline.push({ at: nowIso(), event: 'metrics-built', detail: `${metricsResult.metrics.length} metrics -> ${metricsResult.metricsPath}` });

  // -------------------------------------------------------------------------
  // P3.5 — policy gate: PII / restricted field exposure. Raised BEFORE any serving
  // surface is built, and ONLY when a sensitive field would land in one.
  // -------------------------------------------------------------------------
  const sensitiveFields = contractFields.filter(
    (f) => f.classification === 'pii' || f.classification === 'restricted'
  );
  const exposedSensitiveFields = servingSurfaces.length > 0 ? sensitiveFields : [];
  let approvedExposure = null;
  if (exposedSensitiveFields.length > 0) {
    ctx.log?.('info', 'P3.5: policy gate — PII / restricted field exposure');
    piiExposure = {
      fields: exposedSensitiveFields.map((f) => f.field),
      gated: true,
      approved: false,
    };
    // Deliberately NO autoApproveAfterN — exposing a PII/restricted field must never
    // auto-approve; do not add it.
    const piiGate = await routedBreakpoint(ctx, {
      question: `Approve exposing ${exposedSensitiveFields.length} pii/restricted field(s) in the listed serving surfaces?`,
      fields: exposedSensitiveFields.map((f) => ({
        field: f.field,
        classification: f.classification,
        semantics: f.semantics,
        surfaces: servingSurfaces.map((s) => `${s.name} (${s.kind})`),
      })),
      contractPath: contractDef.contractPath,
      lineagePath: lineageResult.lineagePath,
    }, {
      breakpointId: 'data-product.pii-field-exposure',
      expert: 'data-privacy-officer',
      tags: ['policy-gated', 'data-product', 'privacy'],
      strategy: 'single',
    });
    recordGate('data-product.pii-field-exposure', 'P3.5', piiGate);
    if (piiGate.approved !== true) {
      // Fail closed. There is deliberately NO 'drop the field and continue' branch —
      // silently narrowing the product is a fallback and is forbidden.
      timeline.push({ at: nowIso(), event: 'pii-exposure-gate', detail: 'rejected — no serving surface built' });
      return buildResult(
        false,
        'data-product.pii-field-exposure rejected — sensitive fields not exposed and no downgraded surface is built'
      );
    }
    piiExposure.approved = true;
    approvedExposure = { fields: piiExposure.fields, approvedAt: nowIso() };
    timeline.push({ at: nowIso(), event: 'pii-exposure-gate', detail: `approved for ${piiExposure.fields.length} field(s)` });
  }

  if (servingSurfaces.length > 0) {
    const surfaceResults = await ctx.parallel.all(
      servingSurfaces.map((surface) => () =>
        ctx.task(servingSurfaceBuildTask, {
          surface,
          composedModule: servingSurfaceModule(surface.kind),
          contractFields,
          approvedExposure,
          builtModels,
          metrics: metricsResult.metrics,
        })
      )
    );
    for (let i = 0; i < servingSurfaces.length; i++) {
      const surface = servingSurfaces[i];
      const built = surfaceResults[i];
      builds.servingSurfaces.push({ name: surface.name, kind: surface.kind, built: built.built === true });
      timeline.push({ at: nowIso(), event: 'serving-surface-built', detail: `${surface.name} (${surface.kind} -> ${servingSurfaceModule(surface.kind)}): built=${built.built === true}` });
    }
  }

  const queryOptimization = await ctx.task(queryOptimizationTask, {
    dataProduct: { name: productName, version: productVersion },
    composedModule: ingredientModule('queryOptimization'),
    builtModels,
    metrics: metricsResult.metrics,
    servingSurfaces,
  });
  timeline.push({ at: nowIso(), event: 'query-optimization', detail: `optimized=${queryOptimization.optimized === true} queries=${queryOptimization.queries.length}` });

  // -------------------------------------------------------------------------
  // P4 — EXECUTED test families (parallel) + two sequential adversarial gates
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P4: executed test families (${mandatoryFamilies.join(', ')}) + adversarial gates`);
  const familyResults = await ctx.parallel.all(
    mandatoryFamilies.map((family) => () =>
      ctx.task(testFamilyRunTask, {
        family,
        composedModule: ingredientModule('quality'),
        dataProduct: { name: productName, version: productVersion, tier },
        builtModels,
        metrics: metricsResult.metrics,
        sources,
        sourceProfiles,
        contractPath: contractDef.contractPath,
        sla,
      })
    )
  );

  // Pass/fail is computed DETERMINISTICALLY by the orchestrator — the runner never scores itself.
  let anyFamilyFailed = false;
  for (let i = 0; i < mandatoryFamilies.length; i++) {
    const family = assertTestFamily(mandatoryFamilies[i]);
    const run = familyResults[i];
    assertTestFamily(run.family);
    const passed = run.ran === true && run.failed === 0;
    if (!passed) anyFamilyFailed = true;
    testRuns.push({
      family,
      ran: run.ran === true,
      total: run.total,
      failed: run.failed,
      passed,
    });
    timeline.push({ at: nowIso(), event: 'test-family', detail: `${family}: ran=${run.ran === true} total=${run.total} failed=${run.failed} passed=${passed}` });
  }

  const qualityReportPath = `${artifactsRoot}/quality-report-${productName}-${productVersion}.md`;
  artifacts.push(qualityReportPath);

  const correctnessResult = await adversarialGate(ctx, {
    gateId: 'dpl.correctness-and-reconciliation',
    artifact: {
      path: qualityReportPath,
      description: 'Executed test-family report + deterministic per-family pass/fail + reconciliation numbers',
    },
    critics: [
      {
        name: 'quality-suite-reexecution-critic',
        role: 'Data-quality suite prosecutor',
        focus: 'RE-EXECUTE the data-quality checks and contract assertions YOURSELF against real sample data and DIFF your results against the reported ones; cite the raw re-execution output per family — a green dbt/test run reported by the builder is NOT evidence, and neither is quoting the report',
      },
      {
        name: 'reconciliation-critic',
        role: 'Row-count and metric reconciliation auditor',
        focus: 'RE-COMPUTE row counts and headline metric values against the SOURCE OF TRUTH and diff them against the published numbers; cite the actual query text and the actual output for every reconciled item — the domain failure is a silently wrong answer, so an unreconciled metric is a FAIL',
      },
      {
        name: 'profile-recomputation-critic',
        role: 'Source-profile auditor',
        focus: 'RE-COMPUTE the P2 profile statistics (row count, null rates, distinct cardinalities, max freshness timestamp) from real sample data and diff them against the reported profile; any model whose grain or join assumes a cardinality your recomputation contradicts is a FAIL — cite the recomputation output and the model definition at file:line',
      },
    ],
    ironLaw: [
      'Executed evidence only: run the quality checks and the reconciliation queries yourself and cite the ACTUAL output. Reading the quality report, quoting the builder, or citing a green suite status is NOT evidence.',
      'Every model/metric claim must additionally cite the definition at file:line.',
      'The characteristic failure of this domain is a silently WRONG ANSWER, not a crash — a pipeline that ran successfully proves nothing about correctness.',
      'passed:true with empty evidence is rejected by the combinator.',
      'Pin the exact output shape at the END of the prompt: return JSON { "passed": boolean, "issues": [{ "severity": string, "description": string, "location": string }], "evidence": [string] } and nothing else.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      testRuns,
      familyResults,
      sourceProfiles,
      builtModels,
      metrics: metricsResult.metrics,
      contractPath: contractDef.contractPath,
      priorKnowledge,
    },
  });
  correctnessGate = {
    passed: correctnessResult.passed,
    attempts: correctnessResult.attempts,
    escalated: correctnessResult.escalated,
    issues: correctnessResult.issues,
  };
  if (correctnessResult.escalated) {
    breakpointsHit.push('dpl.correctness-and-reconciliation.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'correctness-gate', detail: `passed=${correctnessResult.passed} attempts=${correctnessResult.attempts} escalated=${correctnessResult.escalated}` });

  const contractGateResult = await adversarialGate(ctx, {
    gateId: 'dpl.lineage-and-contract-conformance',
    artifact: {
      path: contractDef.contractPath,
      description: 'Published data contract + lineage map + field classifications',
    },
    critics: [
      {
        name: 'contract-conformance-critic',
        role: 'Data-contract conformance prosecutor',
        focus: 'QUERY the built product yourself and prove that every contract field exists with the declared type, nullability and grain; cite the executed DESCRIBE/query output per field plus the contract line and the model definition at file:line — a field the contract promises and the product does not deliver is a FAIL',
      },
      {
        name: 'lineage-traversal-critic',
        role: 'Lineage traversal auditor',
        focus: 'TRAVERSE the lineage graph yourself from each contract field back to a profiled source column and forward to every declared consumer; cite the executed traversal output — an orphan field with no traceable source, or a consumer missing from the inventory, is a FAIL (the deprecation gate depends on this inventory being complete)',
      },
      {
        name: 'pii-classification-critic',
        role: 'Field classification auditor',
        focus: 'INSPECT actual sample values for every field and challenge its declared classification; a field carrying identifiers, contact data, or free text with personal data but classified public/internal is a FAIL. Cite the sampled values (redacted) and the classification line at file:line, and cross-check against the approved pii-field-exposure decision in context',
      },
    ],
    ironLaw: [
      'Executed evidence only: query the product and traverse the lineage yourself; reading the contract or the lineage document is NOT evidence.',
      'Cite the definition at file:line for every conformance and classification claim.',
      'passed:true with empty evidence is rejected by the combinator.',
      'Pin the exact output shape at the END of the prompt: return JSON { "passed": boolean, "issues": [{ "severity": string, "description": string, "location": string }], "evidence": [string] } and nothing else.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      contractFields,
      contractPath: contractDef.contractPath,
      lineage,
      lineageResult,
      sourceProfiles,
      builtModels,
      servingSurfaces,
      approvedExposure,
      priorKnowledge,
    },
  });
  contractGate = {
    passed: contractGateResult.passed,
    attempts: contractGateResult.attempts,
    escalated: contractGateResult.escalated,
    issues: contractGateResult.issues,
  };
  if (contractGateResult.escalated) {
    breakpointsHit.push('dpl.lineage-and-contract-conformance.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'contract-gate', detail: `passed=${contractGateResult.passed} attempts=${contractGateResult.attempts} escalated=${contractGateResult.escalated}` });

  // NO FALLBACK: a failing family or a failed gate BLOCKS cutover — the
  // data-product.production-cutover gate is NEVER raised below.
  if (anyFamilyFailed) {
    return buildResult(
      false,
      'a mandatory test family failed deterministically — production-cutover gate never raised'
    );
  }
  if (correctnessResult.passed !== true) {
    return buildResult(
      false,
      'correctness-and-reconciliation gate failed — production-cutover gate never raised'
    );
  }
  if (contractGateResult.passed !== true) {
    return buildResult(
      false,
      'lineage-and-contract-conformance gate failed — production-cutover gate never raised'
    );
  }

  // -------------------------------------------------------------------------
  // P5 — policy-gated backfill, contract-breaking-change, and production cutover
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: policy-gated backfill, breaking-change and production cutover');

  let backfillPlan = null;
  if (backfill && backfill.requested === true) {
    backfillPlan = await ctx.task(backfillPlanTask, {
      dataProduct: { name: productName, version: productVersion },
      window: backfill.window ?? null,
      cutoverStrategy,
      builtModels,
      sourceProfiles,
    });
    const rowsAffectedTotal = backfillPlan.actions.reduce(
      (sum, action) => sum + (typeof action.rowsAffectedEstimate === 'number' ? action.rowsAffectedEstimate : 0),
      0
    );
    // Destructiveness is computed by the ORCHESTRATOR, never taken from the planner alone.
    const destructive =
      backfill.destructive === true ||
      cutoverStrategy === 'in-place' ||
      backfillPlan.actions.some((a) => a.overwritesExisting === true || a.deletesExisting === true);
    backfillState = {
      planned: true,
      destructive,
      gated: destructive,
      approved: false,
      executed: false,
      verified: false,
    };
    timeline.push({ at: nowIso(), event: 'backfill-planned', detail: `${backfillPlan.actions.length} targets, destructive=${destructive}, rowsAffectedTotal=${rowsAffectedTotal}` });

    if (destructive) {
      // Deliberately NO autoApproveAfterN — an irreversible backfill must never
      // auto-approve; do not add it.
      const backfillGate = await routedBreakpoint(ctx, {
        question: `Approve IRREVERSIBLE backfill overwriting/deleting warehouse data across ${backfillPlan.actions.length} targets?`,
        plan: backfillPlan.planSummary,
        actions: backfillPlan.actions,
        verificationQueries: backfillPlan.actions.map((a) => ({ target: a.target, verificationQuery: a.verificationQuery })),
        rowsAffectedTotal,
      }, {
        breakpointId: 'data-product.destructive-backfill',
        expert: 'data-platform-lead',
        tags: ['policy-gated', 'data-product', 'backfill'],
        strategy: 'single',
      });
      recordGate('data-product.destructive-backfill', 'P5', backfillGate);
      if (backfillGate.approved !== true) {
        // Fail closed: backfillExecutionTask is NEVER invoked un-gated.
        timeline.push({ at: nowIso(), event: 'backfill-gate', detail: 'rejected — executor never invoked' });
        return buildResult(
          false,
          'data-product.destructive-backfill gate rejected — backfill not executed, nothing cut over'
        );
      }
      backfillState.approved = true;
      timeline.push({ at: nowIso(), event: 'backfill-gate', detail: 'approved' });

      // backfillExecutionTask is invoked ONLY here, inside backfillGate.approved === true —
      // no other call site exists.
      const backfillExec = await ctx.task(backfillExecutionTask, {
        dataProduct: { name: productName, version: productVersion },
        approvedPlan: backfillPlan.planSummary,
        actions: backfillPlan.actions,
      });
      for (const act of backfillExec.actions) {
        timeline.push({ at: act.timestamp, event: 'backfill-action', detail: `${act.action} -> ${act.outcome} (rows=${act.rowsAffected})` });
      }
      backfillState.executed = backfillExec.executed === true;

      const backfillVerify = await ctx.task(backfillVerificationTask, {
        dataProduct: { name: productName, version: productVersion },
        verificationQueries: backfillPlan.actions.map((a) => ({ target: a.target, verificationQuery: a.verificationQuery })),
        executedActions: backfillExec.actions,
      });
      backfillState.verified = backfillVerify.verified === true;
      timeline.push({ at: nowIso(), event: 'backfill-verified', detail: `executed=${backfillState.executed} verified=${backfillState.verified}` });

      if (backfillState.verified !== true) {
        // Fail closed: an unverified destructive backfill never reaches the cutover gate.
        return buildResult(
          false,
          'destructive backfill verification did not pass — production-cutover gate never raised'
        );
      }
    } else {
      timeline.push({ at: nowIso(), event: 'backfill-gate', detail: 'not raised — plan is non-destructive' });
    }
  }

  // Contract-breaking-change gate — raised ONLY when the P1 diff classified as major.
  if (contractDiff !== null && contractDiff.breaking === true) {
    breakingChange = { detected: true, gated: true, approved: false };
    // Deliberately NO autoApproveAfterN — shipping a breaking contract change must never
    // auto-approve; do not add it.
    const breakingGate = await routedBreakpoint(ctx, {
      question: `Approve shipping a BREAKING contract change for ${productName} v${productVersion}?`,
      classification: contractDiff.classification,
      changes: contractDiff.changes,
      consumers: lineage.consumers,
      contractPath: contractDef.contractPath,
      previousContractRef: publishedContractRef,
    }, {
      breakpointId: 'data-product.contract-breaking-change',
      expert: 'analytics-engineering-lead',
      tags: ['policy-gated', 'data-product', 'contract'],
      strategy: 'single',
    });
    recordGate('data-product.contract-breaking-change', 'P5', breakingGate);
    if (breakingGate.approved !== true) {
      // Fail closed BEFORE cutover — the production-cutover gate is never raised.
      timeline.push({ at: nowIso(), event: 'breaking-change-gate', detail: 'rejected — production-cutover gate never raised' });
      return buildResult(
        false,
        'data-product.contract-breaking-change gate rejected — production-cutover gate never raised'
      );
    }
    breakingChange.approved = true;
    timeline.push({ at: nowIso(), event: 'breaking-change-gate', detail: 'approved' });
  } else if (contractDiff !== null) {
    breakingChange = { detected: false, gated: false, approved: false };
  }

  cutover = { strategy: cutoverStrategy, gated: true, approved: false, executed: false, verified: false };
  // Deliberately NO autoApproveAfterN — cutting production consumers over must never
  // auto-approve; do not add it.
  const cutoverGate = await routedBreakpoint(ctx, {
    question: `Approve cutting consumers over to ${productName} v${productVersion} in production (strategy ${cutoverStrategy})?`,
    testRuns,
    correctnessGateEvidence: correctnessResult.evidence,
    contractGateEvidence: contractGateResult.evidence,
    reconciliation: testRuns.filter((r) => r.family.endsWith('reconciliation')),
    queryOptimization: queryOptimization.queries,
    backfillVerification: backfillState,
    contractDiff: contractDiff === null ? null : { classification: contractDiff.classification, breaking: contractDiff.breaking },
    consumers: lineage.consumers,
  }, {
    breakpointId: 'data-product.production-cutover',
    expert: 'data-platform-lead',
    tags: ['policy-gated', 'data-product', 'cutover'],
    strategy: 'single',
  });
  recordGate('data-product.production-cutover', 'P5', cutoverGate);
  if (cutoverGate.approved !== true) {
    // Fail closed: cutoverExecutionTask is NEVER invoked un-gated — nothing published.
    timeline.push({ at: nowIso(), event: 'cutover-gate', detail: 'rejected — executor never invoked' });
    return buildResult(false, 'data-product.production-cutover gate rejected — nothing cut over, nothing published');
  }
  cutover.approved = true;
  timeline.push({ at: nowIso(), event: 'cutover-gate', detail: `approved (${cutoverStrategy})` });

  // cutoverExecutionTask is invoked ONLY here, inside cutoverGate.approved === true —
  // no other call site exists.
  const cutoverExec = await ctx.task(cutoverExecutionTask, {
    dataProduct: { name: productName, version: productVersion },
    cutoverStrategy,
    consumers: lineage.consumers,
    builtModels,
  });
  for (const act of cutoverExec.actions) {
    timeline.push({ at: act.timestamp, event: 'cutover-action', detail: `${act.action} -> ${act.outcome}` });
  }
  cutover.executed = cutoverExec.executed === true;

  const cutoverVerify = await ctx.task(cutoverVerificationTask, {
    dataProduct: { name: productName, version: productVersion },
    metrics: metricsResult.metrics,
    sources,
    sourceProfiles,
    consumersCutOver: cutoverExec.consumersCutOver,
  });
  cutover.verified = cutoverVerify.verified === true;
  timeline.push({ at: nowIso(), event: 'cutover-verified', detail: `executed=${cutover.executed} verified=${cutover.verified} reconciliations=${cutoverVerify.reconciliations.length}` });

  if (cutover.verified !== true) {
    // Fail closed: an unverified cutover never publishes a catalog entry.
    return closeWithKip(
      false,
      'post-cutover reconciliation did not verify — catalog/contract publish not performed'
    );
  }

  const publishResult = await ctx.task(catalogPublishTask, {
    dataProduct: { name: productName, version: productVersion, tier, owner: dataProduct.owner },
    composedModule: ingredientModule('catalog'),
    contractPath: contractDef.contractPath,
    lineagePath: lineageResult.lineagePath,
    contractFields,
    sla,
  });
  publish = {
    catalogEntry: publishResult.catalogEntry,
    contractRef: publishResult.contractRef,
    published: publishResult.published === true,
  };
  timeline.push({ at: nowIso(), event: 'catalog-publish', detail: `published=${publish.published} entry=${publish.catalogEntry}` });

  // -------------------------------------------------------------------------
  // P6 — SLA + freshness monitoring and breach handling
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: SLA + freshness monitoring');
  const monitorSpecPath = `${artifactsRoot}/sla-monitor-${productName}-${productVersion}.md`;
  const monitorSetup = await ctx.task(slaMonitorSetupTask, {
    dataProduct: { name: productName, version: productVersion },
    monitorSpecPath,
    sla,
    pipelines,
    builtModels,
  });
  artifacts.push(monitorSetup.monitorSpecPath);
  slaMonitoring = {
    configured: monitorSetup.configured === true,
    path: monitorSetup.monitorSpecPath,
    probeRan: monitorSetup.probeRun.ran === true,
    breachDetected: monitorSetup.probeRun.breachDetected === true,
    alertingHooks: monitorSetup.alertingHooks,
  };
  timeline.push({ at: nowIso(), event: 'sla-monitor', detail: `configured=${slaMonitoring.configured} probeRan=${slaMonitoring.probeRan} breachDetected=${slaMonitoring.breachDetected} hooks=${slaMonitoring.alertingHooks.length}` });

  // The breach path is entered ONLY when the EXECUTED probe reported a live breach.
  const runBreachPath = async () => {
    ctx.log?.('info', 'P6: SLA breach path (executed probe reported a breach)');
    slaBreach.detected = true;
    slaTriage = await ctx.task(slaBreachTriageTask, {
      dataProduct: { name: productName, version: productVersion },
      probeRun: monitorSetup.probeRun,
      sla,
      alertingHooks: monitorSetup.alertingHooks,
      pipelines,
      priorKnowledge,
    });
    const severity = assertSlaSeverity(slaTriage.severity, 'dpl.sla-breach-triage');
    slaBreach.severity = severity;
    const sevTag = severity.toLowerCase();
    timeline.push({ at: nowIso(), event: 'sla-triaged', detail: `${severity}: ${slaTriage.summary} (recommend ${slaTriage.recommendation})` });

    const routing = slaBreachRouting(severity);
    if (routing.escalationPath === 'remediation-choice') {
      // SEV3/SEV4: the accept-and-fix-forward vs remediate-now call is genuinely
      // ambiguous — the ONLY non-policy breakpoint in this process (sparse-breakpoint rule).
      slaBreach.escalationRaised = true;
      const choice = await routedBreakpoint(ctx, {
        question: `${severity} SLA breach on ${productName}: accept and fix forward, or remediate now? Reply 'fix-forward' to accept; anything else proceeds to remediation.`,
        triage: {
          severity: slaTriage.severity,
          summary: slaTriage.summary,
          recommendation: slaTriage.recommendation,
          rationale: slaTriage.rationale,
        },
        probeRun: monitorSetup.probeRun,
        alertingHooks: monitorSetup.alertingHooks,
      }, {
        breakpointId: 'dpl.sla.remediation-choice',
        expert: slaBreachRouting(severity, 'escalationExpert'),
        tags: ['data-product', 'sla', sevTag],
        strategy: 'single',
      });
      recordGate('dpl.sla.remediation-choice', 'P6', choice);
      const response = String(choice.response ?? '').trim().toLowerCase();
      if (response === 'fix-forward') {
        timeline.push({ at: nowIso(), event: 'sla-remediation-choice', detail: 'fix-forward accepted — no remediation run' });
        return { remediated: false, reason: `fix-forward chosen — ${severity} SLA breach accepted, product left as published` };
      }
      timeline.push({ at: nowIso(), event: 'sla-remediation-choice', detail: 'remediate-now chosen' });
    }

    slaBreach.remediation = { attempted: false, verified: false };
    for (let attempt = 1; attempt <= maxRemediationAttempts; attempt++) {
      const remediation = await ctx.task(slaRemediationExecutionTask, {
        dataProduct: { name: productName, version: productVersion },
        severity,
        triage: slaTriage,
        pipelines,
        attempt,
      });
      slaBreach.remediation.attempted = true;
      for (const act of remediation.actions) {
        timeline.push({ at: act.timestamp ?? nowIso(), event: 'sla-remediation-action', detail: `${act.action ?? 'action'} -> ${act.outcome ?? 'unknown'}` });
      }
      if (remediation.requiresDestructiveBackfill === true) {
        // NO FALLBACK: destructive repair never runs under the SLA path — it must
        // re-enter the data-product.destructive-backfill gate in a fresh run.
        timeline.push({ at: nowIso(), event: 'sla-remediation', detail: 'requiresDestructiveBackfill — stopped, must re-enter the destructive-backfill gate' });
        return {
          remediated: false,
          reason:
            `${severity} SLA breach remediation requires a destructive backfill — stopped without executing; ` +
            'it must re-enter the data-product.destructive-backfill gate.',
        };
      }
      const remediationVerify = await ctx.task(slaRemediationVerificationTask, {
        dataProduct: { name: productName, version: productVersion },
        severity,
        sla,
        attempt,
      });
      slaBreach.remediation.verified = remediationVerify.verified === true;
      timeline.push({ at: nowIso(), event: 'sla-remediation-verified', detail: `verified=${slaBreach.remediation.verified} (attempt ${attempt})` });
      if (remediationVerify.verified === true) break;
    }
    return {
      remediated: slaBreach.remediation.verified === true,
      reason:
        slaBreach.remediation.verified === true
          ? undefined
          : `${severity} SLA breach remediation did not verify within ${maxRemediationAttempts} attempt(s)`,
    };
  };

  let breachOutcome = null;
  if (monitorSetup.probeRun.breachDetected === true) {
    breachOutcome = await runBreachPath();
  }

  // -------------------------------------------------------------------------
  // P7 — deprecation / deletion path (policy-gated, IRREVERSIBLE)
  // -------------------------------------------------------------------------
  if (deprecation && deprecation.requested === true) {
    ctx.log?.('info', 'P7: policy-gated IRREVERSIBLE dataset deprecation');
    const datasetRef = deprecation.datasetRef ?? `${productName}@${productVersion}`;
    deprecationState = {
      requested: true,
      datasetRef,
      consumers: 0,
      gated: true,
      approved: false,
      executed: false,
      verified: false,
    };

    const impact = await ctx.task(deprecationImpactAnalysisTask, {
      dataProduct: { name: productName, version: productVersion },
      datasetRef,
      reason: deprecation.reason ?? null,
      lineage,
      lineageConsumers: lineageResult.consumers,
      catalogEntry: publish.catalogEntry,
      priorKnowledge,
    });
    if (impact.inventoryResolved !== true) {
      // NO FALLBACK: an unresolved consumer inventory never becomes "zero consumers".
      timeline.push({ at: nowIso(), event: 'deprecation-impact', detail: 'inventoryResolved=false — failing closed' });
      return closeWithKip(
        false,
        `deprecation impact analysis could not resolve the consumer inventory for '${datasetRef}' — ` +
        'failing closed rather than deprecating blind (no fallback consumer inventory exists).'
      );
    }
    deprecationState.consumers = impact.consumers.length;
    timeline.push({ at: nowIso(), event: 'deprecation-impact', detail: `${impact.consumers.length} live consumers, ${impact.actions.length} planned targets` });

    // Deliberately NO autoApproveAfterN — an IRREVERSIBLE dataset deprecation must never
    // auto-approve; do not add it.
    const deprecationGate = await routedBreakpoint(ctx, {
      question: `Approve IRREVERSIBLE deprecation/drop of ${datasetRef} with ${impact.consumers.length} LIVE downstream consumers?`,
      consumers: impact.consumers,
      plan: impact.planSummary,
      actions: impact.actions,
      verificationQueries: impact.actions.map((a) => ({ target: a.target, verificationQuery: a.verificationQuery })),
      reason: deprecation.reason ?? null,
    }, {
      breakpointId: 'data-product.dataset-deprecation',
      expert: 'data-platform-lead',
      tags: ['policy-gated', 'data-product', 'deprecation'],
      strategy: 'single',
    });
    recordGate('data-product.dataset-deprecation', 'P7', deprecationGate);
    if (deprecationGate.approved !== true) {
      // Fail closed: deprecationExecutionTask is NEVER invoked un-gated. The dataset is
      // left in place and the state is surfaced.
      timeline.push({ at: nowIso(), event: 'deprecation-gate', detail: 'rejected — dataset left in place, executor never invoked' });
      return closeWithKip(
        false,
        `data-product.dataset-deprecation gate rejected for '${datasetRef}' — dataset left in place, executor never invoked`
      );
    }
    deprecationState.approved = true;
    timeline.push({ at: nowIso(), event: 'deprecation-gate', detail: 'approved' });

    // deprecationExecutionTask is invoked ONLY here, inside deprecationGate.approved === true —
    // no other call site exists.
    const deprecationExec = await ctx.task(deprecationExecutionTask, {
      dataProduct: { name: productName, version: productVersion },
      datasetRef,
      approvedPlan: impact.planSummary,
      actions: impact.actions,
    });
    for (const act of deprecationExec.actions) {
      timeline.push({ at: act.timestamp, event: 'deprecation-action', detail: `${act.action} -> ${act.outcome}` });
    }
    deprecationState.executed = deprecationExec.executed === true;

    const deprecationVerify = await ctx.task(deprecationVerificationTask, {
      dataProduct: { name: productName, version: productVersion },
      datasetRef,
      verificationQueries: impact.actions.map((a) => ({ target: a.target, verificationQuery: a.verificationQuery })),
      consumers: impact.consumers,
    });
    deprecationState.verified = deprecationVerify.verified === true;
    timeline.push({ at: nowIso(), event: 'deprecation-verified', detail: `executed=${deprecationState.executed} verified=${deprecationState.verified}` });
  }

  // -------------------------------------------------------------------------
  // P8 — kip assert at close
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: kip assert at close');
  if (breachOutcome !== null && breachOutcome.remediated !== true) {
    return closeWithKip(false, breachOutcome.reason);
  }
  const success =
    publish.published === true &&
    cutover.verified === true &&
    (deprecationState === null || deprecationState.verified === true);
  return closeWithKip(
    success,
    success ? undefined : 'data product published but the deprecation path did not verify'
  );
}
