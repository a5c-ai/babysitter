/**
 * @process observability/slo-lifecycle
 * @description Flagship end-to-end SLO practice for the observability specialization:
 *   kip recall of prior SLO/alerting memory -> service inventory -> parallel per-service
 *   SLI selection + SLO drafting -> cross-service error-budget policy -> adversarial
 *   SLO-design gate (EXECUTES budget math + measurement-query validation) ->
 *   slo-change-approval policy gate -> instrumentation plan -> collector/pipeline config ->
 *   adversarial telemetry gate (EXECUTES the pipeline dry-run/validate) ->
 *   telemetry-pipeline-deploy policy gate -> staged pipeline rollout with per-stage
 *   verification (release-lifecycle staged-verification pattern, sequential stages) ->
 *   alert noise audit -> parallel per-alert-family burn-rate redesign -> adversarial
 *   alert-tuning gate (EXECUTES rule validation + burn-rate simulation) ->
 *   alert-policy-change policy gate -> staged alert rollout (shadow canary -> paging-enabled
 *   full) -> error-budget review cadence -> kip assert of learned thresholds and outcomes.
 * @inputs {
 *   services?: Array<{ name: string, tier?: string, repoRoot?: string, userJourneys?: string[] }>,
 *   discover?: boolean,                 // discover services from the repo when true and services is absent
 *   telemetryStack: {                   // REQUIRED — absent telemetryStack THROWS, no default stack
 *     metricsBackend: string,
 *     tracingBackend?: string,
 *     collector: string,
 *     alertRuleFormat: string
 *   },
 *   alertSources?: Array<{ system: string, ref: string }>,
 *   sloHorizon?: { windowDays: number }, // default { windowDays: 28 }, applied explicitly at the top
 *   maxFixAttempts?: number,             // adversarial-gate fixer budget (default 2)
 *   kipEnabled?: boolean,                // recall + assert observability memory (default true)
 *   kipDir?: string,                     // kip store directory (default '.a5c/kip')
 *   kipModel?: string,                   // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string                // where SLO/pipeline/alert artifacts land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,
 *   sloPack: { services: Array, policyPath: string|null, adopted: boolean }|null,
 *   sloDesignGate: { passed, attempts, escalated, issues }|null,
 *   telemetry: { planPath, configPaths, gate, deployApproved, stages: Array<{ stage, deployed, verified, deployRef? }> }|null,
 *   alerting: { auditPath, families, gate, changeApproved, stages: Array<{ stage, deployed, verified, pagingEnabled }> }|null,
 *   reviewCadence: { cadencePath, reportTemplatePath }|null,
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty) — fail-closed surfacing
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId, runId, timeline, breakpointsHit, reason? }
 * }
 * @graph
 *   domains: [domain:observability]
 *   specializations: [specialization:observability]
 *   skillAreas: [skill-area:sli-slo-management, skill-area:alerting-oncall, skill-area:observability-instrumentation]
 *   workflows: [workflow:slo-management, workflow:alert-tuning]
 *   roles: [role:sre, role:observability-engineer, role:service-owner, role:platform-engineer]
 * @policyGatedActions slo-change-approval, alert-policy-change, telemetry-pipeline-deploy
 *
 * POLICY_GATE_ROUTING (reproduced verbatim — the frozen const below is the implementation):
 *   slo-change-approval:      service-owner            (Approve creation/modification of a service SLO + error-budget policy)
 *   alert-policy-change:      sre-lead                 (Approve changes to production alerting rules/thresholds/routing before rollout)
 *   telemetry-pipeline-deploy: platform-engineering-lead (Approve deployment of telemetry/collector pipeline config to production)
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every evidence-carrying
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown
 * policy-gate action throws, unknown rollout stage throws, absent telemetryStack throws,
 * SLI archetypes outside SLI_CATALOG are gate issues (never silently accepted), executors
 * run ONLY inside approved===true branches (no alternate invocation path), and the
 * timeline is accumulated in the ORCHESTRATOR (never inside agents) so gates have ground
 * truth to diff. Combinators (routedBreakpoint, adversarialGate, kipRecall, kipAssert) are
 * imported and used as-is — never re-implemented.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Frozen policy tables + throwing lookups (incident-management pattern)
// ---------------------------------------------------------------------------

/**
 * Policy-gate routing: actionId -> { expert, description }. Lookup via gateExpert()
 * THROWS on unknown actionId — there is deliberately no default expert and no fallback
 * route (mirrors routingExpert in incident-management/incident-lifecycle.js).
 */
export const POLICY_GATE_ROUTING = Object.freeze({
  'slo-change-approval': Object.freeze({
    expert: 'service-owner',
    description: 'Approve creation or modification of a service SLO and its error-budget policy',
  }),
  'alert-policy-change': Object.freeze({
    expert: 'sre-lead',
    description: 'Approve changes to production alerting rules, thresholds, or routing before rollout',
  }),
  'telemetry-pipeline-deploy': Object.freeze({
    expert: 'platform-engineering-lead',
    description: 'Approve deployment of telemetry/collector pipeline configuration to production',
  }),
});

/**
 * Policy-gate expert lookup. THROWS on unknown action — no default expert exists.
 *
 * @param {string} actionId - One of the policy-gated action ids
 * @returns {string} The accountable expert route for the gate
 */
export function gateExpert(actionId) {
  const row = POLICY_GATE_ROUTING[actionId];
  if (!row) {
    throw new Error(
      `POLICY_GATE_ROUTING: unknown policy-gated action '${actionId}'. ` +
      `Known actions: ${Object.keys(POLICY_GATE_ROUTING).join(', ')} — no fallback route exists.`
    );
  }
  return row.expert;
}

/**
 * Ordered telemetry rollout stages. Alert rollout reuses the SAME stage table with
 * shadow-mode (canary, paging-disabled) -> paging-enabled (full) semantics.
 */
export const TELEMETRY_ROLLOUT_STAGES = Object.freeze(['canary', 'full']);

/**
 * Per-stage rollout policy: scope slice and bake window. Lookup via stagePolicy() THROWS
 * on unknown stage — there is deliberately no fallback stage plan (release-lifecycle.js
 * pattern). For the alert rollout: canary => shadow-mode/paging-disabled, full => paging-enabled.
 */
export const TELEMETRY_STAGE_POLICY = Object.freeze({
  canary: Object.freeze({ scopePercent: 10, bakeTimeMinutes: 30 }),
  full: Object.freeze({ scopePercent: 100, bakeTimeMinutes: 60 }),
});

/**
 * Stage-policy lookup. THROWS on unknown stage — no fallback stage plan exists.
 *
 * @param {string} stage - 'canary'|'full'
 * @returns {{ scopePercent: number, bakeTimeMinutes: number }}
 */
export function stagePolicy(stage) {
  if (!Object.prototype.hasOwnProperty.call(TELEMETRY_STAGE_POLICY, stage)) {
    throw new Error(
      `TELEMETRY_STAGE_POLICY: unknown stage '${stage}'. ` +
      `Known stages: ${TELEMETRY_ROLLOUT_STAGES.join(', ')} — no fallback policy exists.`
    );
  }
  return TELEMETRY_STAGE_POLICY[stage];
}

/**
 * Admissible SLI archetypes with their required-measurement notes. An sli-selection
 * output naming an archetype outside this catalog is an issue the SLO-design gate critics
 * MUST flag — it is never silently accepted (no fallback archetype).
 */
export const SLI_CATALOG = Object.freeze({
  availability: 'Ratio of successful requests/probes to total; requires a good-event vs total-event definition and a request/probe counter.',
  latency: 'Fraction of requests faster than a threshold; requires a latency histogram/distribution and an explicit percentile+threshold.',
  correctness: 'Fraction of outputs that are correct/valid; requires a validation signal (checksum, reconciliation, schema check) emitting good/bad events.',
  freshness: 'Fraction of data served within a max staleness bound; requires an event/emit timestamp and a serve/observe timestamp to compute lag.',
  durability: 'Fraction of stored objects retained without loss/corruption; requires an audit/scrub signal counting intact vs lost objects.',
  throughput: 'Fraction of time sustained processing rate meets a floor; requires a processed-units counter over a time window.',
});

/** Frozen list of admissible SLI archetype names. */
export const SLI_ARCHETYPES = Object.freeze(Object.keys(SLI_CATALOG));

/** The SLI catalogue guidance block embedded into the sli-selection prompt. */
const SLI_CATALOG_GUIDANCE = SLI_ARCHETYPES.map(
  (archetype) => `- ${archetype}: ${SLI_CATALOG[archetype]}`
).join(' ');

// ---------------------------------------------------------------------------
// P1 — SLO design tasks
// ---------------------------------------------------------------------------

export const serviceInventoryTask = defineTask('slo.service-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: args.discover
    ? 'Discover + inventory services for SLO coverage'
    : `Inventory ${args.services.length} declared services for SLO coverage`,
  agent: {
    name: 'service-inventory-builder',
    prompt: {
      role: 'Service inventory builder',
      task: 'Build the service list the SLO practice will cover, with tiers, user journeys, dependencies, and existing telemetry',
      context: args,
      instructions: [
        'Build one entry per service the SLO practice must cover.',
        args.discover
          ? 'Discovery mode: enumerate services from the repo (manifests, deploy configs, service directories) under the given repoRoot — do NOT invent services.'
          : 'Declared mode: use inputs.services as the authoritative list; enrich each with tier, user journeys, dependencies, and existing telemetry actually found.',
        'For each service record: name, tier (criticality), userJourneys, dependencies (services in its failure path), existingTelemetry (metrics/traces/logs already emitted).',
        'Thread priorKnowledge facts (prior SLO targets for these services) into the enrichment and cite matches.',
        'Every evidence entry must cite the concrete file/manifest/input grounding a service entry — at least one entry; never fabricate a service.',
      ],
      outputFormat: 'JSON with services array of { name, tier, userJourneys, dependencies, existingTelemetry } and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'evidence'],
      properties: {
        services: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'tier', 'userJourneys', 'dependencies', 'existingTelemetry'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'slo', 'inventory'],
}));

export const sliSelectionTask = defineTask('slo.sli-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Re-select SLIs for ${args.service.name} (gate feedback)`
    : `Select SLIs + SLO targets for ${args.service.name}`,
  agent: {
    name: 'sli-selector',
    prompt: {
      role: 'SLI/SLO drafter',
      task: `Draft the SLIs, SLO targets, and measurement queries for service ${args.service.name}`,
      context: args,
      instructions: [
        `Every SLI archetype MUST come from the SLI catalog: ${SLI_CATALOG_GUIDANCE}`,
        'Naming an archetype outside the catalog is a hard error the SLO-design gate will flag — do not do it.',
        'Map every tier-critical user journey of the service to at least one SLI; avoid vanity SLIs (measured but not user-observable).',
        'For each SLI produce: archetype, indicator, measurementQuery (valid for the declared telemetry stack), target, window, rationale.',
        'measurementQuery must be syntactically valid for the declared telemetry stack and satisfiable from an existing or planned emit point.',
        'Thread priorKnowledge (prior SLO targets, known-good thresholds) as starting points and cite them; use errorBudgetDefaults as the horizon guidance.',
        args.feedback
          ? `Re-draft round: address ONLY this gate/approval feedback: ${JSON.stringify(args.feedback)}. Return the full SLI set with the flagged items revised.`
          : 'First drafting round: no feedback to address.',
        'Every evidence entry must cite the user-journey or telemetry fact grounding each target — at least one entry.',
      ],
      outputFormat: 'JSON with service string, slis array of { archetype, indicator, measurementQuery, target, window, rationale }, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['service', 'slis', 'evidence'],
      properties: {
        service: { type: 'string' },
        slis: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['archetype', 'indicator', 'measurementQuery', 'target', 'window', 'rationale'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'slo', 'sli-selection'],
}));

export const errorBudgetPolicyTask = defineTask('slo.error-budget-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? 'Re-compose cross-service error-budget policy (gate feedback)'
    : 'Compose cross-service error-budget policy',
  agent: {
    name: 'error-budget-policy-author',
    prompt: {
      role: 'Error-budget policy author',
      task: `Compose the cross-service error-budget policy and write it under ${args.artifactsDir}`,
      context: args,
      instructions: [
        `Write the policy (markdown + machine-readable json) under ${args.artifactsDir} and report the exact policyPath back.`,
        'For each SLI target+window compute the allowed error budget (allowed downtime / bad-event budget) — show the arithmetic.',
        'Define multi-window burnThresholds (fast-burn and slow-burn) consistent with the computed budgets.',
        'Define freezeRules (when budget exhaustion freezes change) and escalation ownership per the POLICY_GATE_ROUTING experts.',
        'Thread priorKnowledge known-good burn-rate thresholds and cite them.',
        args.feedback
          ? `Re-compose round: address ONLY this feedback: ${JSON.stringify(args.feedback)}.`
          : 'First composition round: no feedback to address.',
        'Every evidence entry must show the recomputed budget number or cite the SLI target it derives from — at least one entry.',
      ],
      outputFormat: 'JSON with policyPath string, budgets array, burnThresholds object, freezeRules array, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['policyPath', 'budgets', 'burnThresholds', 'freezeRules', 'evidence'],
      properties: {
        policyPath: { type: 'string' },
        budgets: { type: 'array' },
        burnThresholds: { type: 'object' },
        freezeRules: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'slo', 'error-budget'],
}));

// ---------------------------------------------------------------------------
// P2 — instrumentation + telemetry pipeline tasks
// ---------------------------------------------------------------------------

export const instrumentationPlanTask = defineTask('slo.instrumentation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map approved SLIs to concrete instrumentation',
  agent: {
    name: 'instrumentation-planner',
    prompt: {
      role: 'Instrumentation planner',
      task: `Map every approved SLI to concrete instrumentation and write the plan under ${args.artifactsDir}`,
      context: args,
      instructions: [
        `Write the instrumentation plan under ${args.artifactsDir} and report the exact planPath back.`,
        'For every approved SLI produce one item: { signalType (metric|span|log), emitPoint (where in the code/service), attributes, samplingPolicy }.',
        'Honor the per-service existingTelemetry: reuse existing emit points where they satisfy the SLI; only propose new emit points where there is a real gap.',
        'Record gaps (SLIs with no existing or plannable emit point) explicitly — do not paper over an unmeasurable target.',
        'Enforce a cardinalityBudget: flag any attribute set that would explode label cardinality.',
        'Every evidence entry must cite the SLI and the code/telemetry location the item maps to — at least one entry.',
      ],
      outputFormat: 'JSON with planPath string, items array of { sli, signalType, emitPoint, attributes, samplingPolicy }, gaps array, cardinalityBudget object, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'items', 'gaps', 'cardinalityBudget', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        items: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['sli', 'signalType', 'emitPoint', 'attributes', 'samplingPolicy'] },
        },
        gaps: { type: 'array' },
        cardinalityBudget: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'telemetry', 'instrumentation'],
}));

export const pipelineConfigTask = defineTask('slo.pipeline-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate collector/pipeline config for ${args.telemetryStack.collector}`,
  agent: {
    name: 'pipeline-config-generator',
    prompt: {
      role: 'Telemetry pipeline config generator',
      task: `Generate the collector/pipeline configuration files under ${args.artifactsDir} for the declared telemetry stack`,
      context: args,
      instructions: [
        `Generate the collector/pipeline config files under ${args.artifactsDir} and report every generated path in configPaths.`,
        'Wire every instrumentation-plan item to a concrete pipeline route/processor/exporter for the declared metricsBackend / tracingBackend.',
        'Every approved SLI measurementQuery must be satisfiable from the configured outputs — no silent signal drops.',
        'Report validationCommand: the EXACT dry-run/validate invocation (e.g. the collector validate subcommand or the repo config-check entrypoint) the gate critics must execute against these configs.',
        'Do NOT deploy anything — generation only; deployment happens through a policy gate you do not control.',
        'Every evidence entry must cite the instrumentation item each config route implements — at least one entry.',
      ],
      outputFormat: 'JSON with configPaths array (minItems 1), validationCommand string, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['configPaths', 'validationCommand', 'evidence'],
      properties: {
        configPaths: { type: 'array', minItems: 1 },
        validationCommand: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'telemetry', 'pipeline-config'],
}));

// Guarded executor: invoked ONLY inside if (telemetryGateResult.approved === true).
export const pipelineDeployExecutorTask = defineTask('slo.pipeline-deploy-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy telemetry pipeline to ${args.stage} (${args.stagePolicy.scopePercent}% scope)`,
  agent: {
    name: 'pipeline-deploy-executor',
    prompt: {
      role: 'Telemetry pipeline deploy executor',
      task: `Deploy the approved collector/pipeline config to the ${args.stage} scope`,
      context: args,
      instructions: [
        'This task only ever runs AFTER the telemetry-pipeline-deploy policy gate approved this deployment in context — the approvalProvenance is in your context.',
        `Deploy the exact configPaths to the ${args.stage} scope (${args.stagePolicy.scopePercent}% of targets); do not improvise config changes.`,
        'Log every apply/rollout command with an ISO timestamp and its outcome; report the concrete deployRef (release id / revision) of what you applied.',
        'If an apply fails, stop and report deployed:false honestly — do not force a partial state.',
        'Every evidence entry must be the raw executed deploy/apply command output — at least one entry.',
      ],
      outputFormat: 'JSON with deployed boolean, deployRef string, stage string, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['deployed', 'deployRef', 'stage', 'evidence'],
      properties: {
        deployed: { type: 'boolean' },
        deployRef: { type: 'string' },
        stage: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'telemetry', 'deploy', 'policy-gated'],
}));

// Shared by the P2 telemetry rollout and the P3 alert rollout, parameterized by kind.
export const stageVerificationTask = defineTask('slo.stage-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.kind} ${args.stage} stage (bake ${args.stagePolicy.bakeTimeMinutes}m)`,
  agent: {
    name: 'stage-verifier',
    prompt: {
      role: 'Staged rollout verifier',
      task: `EXECUTE the verification probes for the ${args.stage} stage of the ${args.kind} rollout`,
      context: args,
      instructions: [
        args.kind === 'telemetry'
          ? 'Telemetry rollout: EXECUTE the probe queries against the deployed scope and confirm the SLI signals actually flow (non-empty, expected shape) across the bake window.'
          : 'Alert-rules rollout: EXECUTE the firing-behavior checks — confirm the rules load and that firing behavior matches expectations (shadow/paging-disabled at canary, paging-enabled at full).',
        `deployRef under verification: ${args.deployRef}. Hold for the bake window of ${args.stagePolicy.bakeTimeMinutes} minutes.`,
        'Every probesRun entry is a probe you ACTUALLY executed: { name, executed: true, passed, detail }. An entry without an executed run is invalid and will be rejected.',
        'verified:true requires every probe passing across the bake window; anything less is verified:false, honestly reported (this halts promotion).',
        'Every evidence entry must be executed probe output — a claim without a run is not evidence; at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, probesRun array of { name, executed, passed, detail } (minItems 1), stage string, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'probesRun', 'stage', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        probesRun: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'executed', 'passed', 'detail'] },
        },
        stage: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'verification', 'staged-rollout'],
}));

// ---------------------------------------------------------------------------
// P3 — alert tuning tasks
// ---------------------------------------------------------------------------

export const alertNoiseAuditTask = defineTask('slo.alert-noise-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit existing alerts + classify noise into families',
  agent: {
    name: 'alert-noise-auditor',
    prompt: {
      role: 'Alert noise auditor',
      task: `Inventory existing alerts, classify noise, and group into alert families; write the audit report under ${args.artifactsDir}`,
      context: args,
      instructions: [
        `Write the noise-audit report under ${args.artifactsDir} and report the exact auditPath back.`,
        'Enumerate existing alerts from inputs.alertSources over the lookback window; compute fireStats (fire counts) and actionabilityRate (ack/actioned vs fired).',
        'Group alerts into families and assign each a verdict: keep (already SLO-aligned), retune (redesign onto burn-rate), or delete (pure noise, no coverage loss).',
        'Thread priorKnowledge past tuning outcomes and cite them.',
        'Every evidence entry must cite the fire counts / actionability data grounding a verdict — at least one entry.',
      ],
      outputFormat: 'JSON with families array of { familyId, alerts, fireStats, actionabilityRate, verdict }, noiseFindings array, auditPath string, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['families', 'noiseFindings', 'evidence'],
      properties: {
        families: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['familyId', 'alerts', 'fireStats', 'actionabilityRate', 'verdict'],
            properties: {
              familyId: { type: 'string' },
              alerts: { type: 'array' },
              fireStats: { type: 'object' },
              actionabilityRate: { type: ['number', 'string'] },
              verdict: { type: 'string', enum: ['keep', 'retune', 'delete'] },
            },
          },
        },
        noiseFindings: { type: 'array' },
        auditPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'alerting', 'noise-audit'],
}));

export const alertFamilyTuningTask = defineTask('slo.alert-family-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Re-tune alert family ${args.family.familyId} (gate feedback)`
    : `Tune alert family ${args.family.familyId} onto SLO burn-rate`,
  agent: {
    name: 'alert-family-tuner',
    prompt: {
      role: 'Alert burn-rate tuner',
      task: `Redesign alert family ${args.family.familyId} onto SLO burn-rate alerting and write the rules under ${args.artifactsDir}`,
      context: args,
      instructions: [
        `Write the tuned rule files under ${args.artifactsDir} and report every path in rulePaths.`,
        'Redesign the family as multi-window multi-burn-rate alerting derived from the approved error-budget policy burnThresholds (fast-burn pages, slow-burn tickets).',
        'Rules must be in the declared alertRuleFormat and reference the approved SLIs/measurementQueries.',
        'Report validationCommand: the EXACT rule-lint invocation (promtool / vendor linter / repo rule-check) the gate critics must execute.',
        'Report simulationSpec: the sample-traffic assumptions and expected firing outcomes the gate critics must drive the burn-rate simulation with.',
        'Thread priorKnowledge tuned-alert facts and cite them.',
        args.feedback
          ? `Re-tune round: address ONLY this feedback: ${JSON.stringify(args.feedback)}.`
          : 'First tuning round: no feedback to address.',
        'Every evidence entry must cite the burn-rate arithmetic / budget derivation grounding each threshold — at least one entry.',
      ],
      outputFormat: 'JSON with familyId string, rules array, rulePaths array (minItems 1), validationCommand string, simulationSpec object, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['familyId', 'rules', 'rulePaths', 'validationCommand', 'simulationSpec', 'evidence'],
      properties: {
        familyId: { type: 'string' },
        rules: { type: 'array', minItems: 1 },
        rulePaths: { type: 'array', minItems: 1 },
        validationCommand: { type: 'string' },
        simulationSpec: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'alerting', 'burn-rate-tuning'],
}));

// Guarded executor: invoked ONLY inside if (alertGateResult.approved === true).
export const alertRolloutExecutorTask = defineTask('slo.alert-rollout-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Roll out tuned alert rules to ${args.stage} (paging ${args.stage === 'full' ? 'enabled' : 'disabled'})`,
  agent: {
    name: 'alert-rollout-executor',
    prompt: {
      role: 'Alert rollout executor',
      task: `Deploy the approved tuned rule files at the ${args.stage} stage`,
      context: args,
      instructions: [
        'This task only ever runs AFTER the alert-policy-change policy gate approved this rollout in context — the approvalProvenance is in your context.',
        args.stage === 'canary'
          ? 'Canary stage: ship the rules in SHADOW mode with paging DISABLED — rules evaluate and record but never page.'
          : 'Full stage: enable paging on the rules — this is the production-paging cutover.',
        'Deploy exactly the rulePaths in context; do not improvise rule edits. Report the concrete stage and whether pagingEnabled is true.',
        'If the apply fails, stop and report deployed:false honestly.',
        'Every evidence entry must be the raw executed apply/reload command output — at least one entry.',
      ],
      outputFormat: 'JSON with deployed boolean, stage string, pagingEnabled boolean, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['deployed', 'stage', 'pagingEnabled', 'evidence'],
      properties: {
        deployed: { type: 'boolean' },
        stage: { type: 'string' },
        pagingEnabled: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'alerting', 'rollout', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P4 — error-budget review cadence task
// ---------------------------------------------------------------------------

export const reviewCadenceTask = defineTask('slo.error-budget-review-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose error-budget review cadence + report template',
  agent: {
    name: 'review-cadence-author',
    prompt: {
      role: 'Error-budget review cadence author',
      task: `Compose the recurring error-budget review artifact and template under ${args.artifactsDir}`,
      context: args,
      instructions: [
        `Write the cadence document and the report template under ${args.artifactsDir}; report cadencePath and reportTemplatePath.`,
        'The report template is a per-service budget-burn report (target, budget consumed, burn trend).',
        'Derive the review meeting cadence from budget volatility: WEEKLY while any service burned >25% of its budget last window, otherwise MONTHLY.',
        'Assign ownership per the POLICY_GATE_ROUTING experts in context.',
        'State the standing rule that budget exhaustion re-enters the SLO practice at P1 for target renegotiation via a fresh slo-change-approval gate.',
        'Every evidence entry must cite the adopted SLO targets / tuning outcomes grounding the cadence choice — at least one entry.',
      ],
      outputFormat: 'JSON with cadencePath string, cadence object, reportTemplatePath string, and evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['cadencePath', 'cadence', 'reportTemplatePath', 'evidence'],
      properties: {
        cadencePath: { type: 'string' },
        cadence: { type: 'object' },
        reportTemplatePath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'observability', 'slo', 'review-cadence'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    services = null,
    discover = false,
    telemetryStack,
    alertSources = [],
    sloHorizon = { windowDays: 28 },
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // No fallbacks: the telemetry stack is never guessed. Absent stack throws before any
  // config is generated against a hypothetical backend.
  if (!telemetryStack || !telemetryStack.metricsBackend || !telemetryStack.collector || !telemetryStack.alertRuleFormat) {
    throw new Error(
      'slo-lifecycle requires inputs.telemetryStack { metricsBackend, collector, alertRuleFormat } — ' +
      'refusing to generate telemetry/alert configs against a guessed stack (no default stack exists).'
    );
  }
  if (services === null && discover !== true) {
    throw new Error(
      'slo-lifecycle requires either inputs.services or inputs.discover === true — ' +
      'the service scope is never invented.'
    );
  }

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();
  const horizon = sloHorizon && typeof sloHorizon.windowDays === 'number' ? sloHorizon : { windowDays: 28 };

  // Timeline is accumulated HERE, in the orchestrator — agents never write it.
  const timeline = [{ at: nowIso(), event: 'slo-lifecycle-start', detail: discover ? 'discover mode' : `${services.length} declared services` }];
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];
  const artifacts = [];

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };
  const wasAutoApproved = (result) =>
    !!(result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true)));

  // Mutable run state referenced by buildResult (terminal returns carry full state).
  let sloPack = null;
  let sloDesignGate = null;
  let telemetry = null;
  let alerting = null;
  let reviewCadence = null;
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    sloPack,
    sloDesignGate,
    telemetry,
    alerting,
    reviewCadence,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'observability/slo-lifecycle',
      runId: ctx.runId,
      timeline,
      breakpointsHit,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall of prior SLO/alerting memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior observability memory');
  const serviceScope = discover
    ? 'repo-discovered services'
    : services.map((s) => s.name).join(', ');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: `observability slo/alerting practice: ${serviceScope}`,
      kipModel,
      kind: 'observability',
    });
    timeline.push({ at: nowIso(), event: 'kip-recall', detail: `factCount=${priorKnowledge.factCount}` });
  }

  // -------------------------------------------------------------------------
  // P1 — SLO design: inventory -> parallel SLI selection -> error-budget policy
  //       -> adversarial slo-design gate -> slo-change-approval policy gate
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: service inventory');
  const inventory = await ctx.task(serviceInventoryTask, {
    services: services ?? [],
    discover,
    repoRoot: (services && services[0] && services[0].repoRoot) || ctx.repoRoot || '.',
    priorKnowledge,
  });
  timeline.push({ at: nowIso(), event: 'service-inventory', detail: `${inventory.services.length} services` });

  const draftSlisAndPolicy = async (feedback) => {
    ctx.log?.('info', 'P1: parallel per-service SLI selection');
    const perService = await ctx.parallel.map(inventory.services, (service) =>
      ctx.task(sliSelectionTask, {
        service,
        priorKnowledge,
        errorBudgetDefaults: horizon,
        artifactsDir: artifactsRoot,
        ...(feedback ? { feedback } : {}),
      })
    );
    ctx.log?.('info', 'P1: cross-service error-budget policy');
    const policy = await ctx.task(errorBudgetPolicyTask, {
      sliPacks: perService,
      sloHorizon: horizon,
      priorKnowledge,
      artifactsDir: artifactsRoot,
      ...(feedback ? { feedback } : {}),
    });
    return { perService, policy };
  };

  let sliPacks = null;
  let budgetPolicy = null;
  let adopted = false;
  let sloFeedback = null;
  for (let round = 0; round < 2; round++) {
    const drafted = await draftSlisAndPolicy(round > 0 ? sloFeedback : null);
    sliPacks = drafted.perService;
    budgetPolicy = drafted.policy;
    timeline.push({ at: nowIso(), event: round > 0 ? 'slo-pack-redrafted' : 'slo-pack-drafted', detail: budgetPolicy.policyPath });

    ctx.log?.('info', 'P1: adversarial slo-design gate');
    const designGate = await adversarialGate(ctx, {
      gateId: 'slo.gate.slo-design',
      artifact: { path: budgetPolicy.policyPath, description: 'SLO pack: per-service SLIs/targets + error-budget policy' },
      critics: [
        {
          name: 'slo-math-critic',
          role: 'SLO/error-budget correctness reviewer',
          focus: 'EXECUTE the budget math: recompute allowed downtime / bad-event budget from each target+window and verify burnThresholds and freezeRules are mutually consistent; verify every SLI archetype is in the SLI_CATALOG and every measurementQuery is syntactically valid for the declared telemetry stack (run the query linter/validator where one exists)',
        },
        {
          name: 'slo-coverage-critic',
          role: 'Coverage and user-journey reviewer',
          focus: 'every tier-critical user journey from the service inventory maps to at least one SLI; flag vanity SLIs (measured but not user-observable) and unmeasurable targets (no existing or planned emit point)',
        },
      ],
      ironLaw: [
        'Evidence must include EXECUTED checks: recomputed budget numbers and validator/linter command outputs — quoting the config back is not evidence.',
        'Every SLI archetype outside the SLI_CATALOG (availability, latency, correctness, freshness, durability, throughput) is a hard issue.',
        'Pin the exact verdict JSON shape at the END of the prompt: {"passed": boolean, "issues": [{"severity", "description", "location"}], "evidence": [string]}.',
      ],
      maxFixAttempts,
      fixer: {},
      context: {
        sliCatalog: SLI_ARCHETYPES,
        telemetryStack,
        sliPacks,
        inventory: inventory.services,
        burnThresholds: budgetPolicy.burnThresholds,
        freezeRules: budgetPolicy.freezeRules,
      },
    });
    sloDesignGate = {
      passed: designGate.passed,
      attempts: designGate.attempts,
      escalated: designGate.escalated,
      issues: designGate.issues,
    };
    if (designGate.escalated) {
      breakpointsHit.push('slo.gate.slo-design.gate-escalation');
    }
    timeline.push({ at: nowIso(), event: 'slo-design-gate', detail: `passed=${designGate.passed} attempts=${designGate.attempts} escalated=${designGate.escalated}` });

    if (!designGate.passed) {
      if (round < 1) {
        sloFeedback = { reason: 'slo-design gate failed', issues: designGate.issues };
        continue;
      }
      return buildResult(false, 'slo-design gate failed after the bounded re-draft round');
    }

    // Policy gate: slo-change-approval. Never auto-approves by design.
    ctx.log?.('info', 'P1: slo-change-approval policy gate');
    const approval = await routedBreakpoint(ctx, {
      question: `Approve the SLO pack + error-budget policy for [${serviceScope}]? Adoption is a production-policy change.`,
      services: sliPacks,
      policyPath: budgetPolicy.policyPath,
      burnThresholds: budgetPolicy.burnThresholds,
      freezeRules: budgetPolicy.freezeRules,
      sloDesignGateEvidence: designGate.evidence,
    }, {
      breakpointId: 'slo-change-approval',
      expert: gateExpert('slo-change-approval'),
      tags: ['policy-gated', 'observability', 'slo'],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — SLO adoption must never auto-approve.
    });
    recordGate('slo-change-approval', 'P1', approval);
    if (approval.approved === true) {
      adopted = true;
      break;
    }
    sloFeedback = { reason: 'slo-change-approval rejected', response: approval.response || approval.feedback || 'SLO pack rejected' };
    timeline.push({ at: nowIso(), event: 'slo-change-approval-rejected', detail: String(sloFeedback.response) });
  }

  if (!adopted) {
    // Fail closed: there is no unapproved-adoption path.
    return buildResult(false, 'slo-change-approval rejected twice — SLO pack not adopted');
  }

  sloPack = {
    services: inventory.services.map((svc) => {
      const pack = sliPacks.find((p) => p.service === svc.name);
      return { name: svc.name, tier: svc.tier, userJourneys: svc.userJourneys, slis: pack ? pack.slis : [] };
    }),
    policyPath: budgetPolicy.policyPath,
    adopted: true,
  };
  artifacts.push(budgetPolicy.policyPath);
  timeline.push({ at: nowIso(), event: 'slo-pack-adopted', detail: budgetPolicy.policyPath });

  // -------------------------------------------------------------------------
  // P2 — instrumentation plan -> pipeline config -> telemetry gate ->
  //       telemetry-pipeline-deploy policy gate -> staged pipeline rollout
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: instrumentation plan');
  const instrumentation = await ctx.task(instrumentationPlanTask, {
    sloPack,
    telemetryStack,
    existingTelemetry: inventory.services.map((s) => ({ name: s.name, existingTelemetry: s.existingTelemetry })),
    artifactsDir: artifactsRoot,
  });
  artifacts.push(instrumentation.planPath);
  timeline.push({ at: nowIso(), event: 'instrumentation-planned', detail: `${instrumentation.items.length} items, ${instrumentation.gaps.length} gaps` });

  ctx.log?.('info', 'P2: pipeline config generation');
  const pipelineConfig = await ctx.task(pipelineConfigTask, {
    instrumentation,
    telemetryStack,
    artifactsDir: artifactsRoot,
  });
  for (const p of pipelineConfig.configPaths) {
    artifacts.push(p);
  }
  timeline.push({ at: nowIso(), event: 'pipeline-config-generated', detail: `${pipelineConfig.configPaths.length} configs` });

  ctx.log?.('info', 'P2: adversarial telemetry gate');
  const telemetryGate = await adversarialGate(ctx, {
    gateId: 'slo.gate.telemetry-pipeline',
    artifact: { path: pipelineConfig.configPaths[0], description: 'Generated collector/pipeline configs' },
    critics: [
      {
        name: 'pipeline-dryrun-critic',
        role: 'Pipeline configuration executor',
        focus: 'EXECUTE the validationCommand reported by slo.pipeline-config (collector validate / dry-run) against every configPath and quote the command outputs; any validation error or unexecuted config is a FAIL',
      },
      {
        name: 'instrumentation-fidelity-critic',
        role: 'Plan-to-config fidelity reviewer',
        focus: 'every instrumentation-plan item has a corresponding pipeline route/processor and every approved SLI measurementQuery is satisfiable from the configured outputs; flag cardinality-budget violations and silent signal drops',
      },
    ],
    ironLaw: [
      'A PASS without the dry-run/validate command actually executed and its output quoted is invalid.',
      'Pin the exact verdict JSON shape at the END of the prompt: {"passed": boolean, "issues": [{"severity", "description", "location"}], "evidence": [string]}.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      validationCommand: pipelineConfig.validationCommand,
      configPaths: pipelineConfig.configPaths,
      instrumentationItems: instrumentation.items,
      cardinalityBudget: instrumentation.cardinalityBudget,
      sloPack,
    },
  });
  if (telemetryGate.escalated) {
    breakpointsHit.push('slo.gate.telemetry-pipeline.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'telemetry-gate', detail: `passed=${telemetryGate.passed} attempts=${telemetryGate.attempts} escalated=${telemetryGate.escalated}` });

  telemetry = {
    planPath: instrumentation.planPath,
    configPaths: pipelineConfig.configPaths,
    gate: { passed: telemetryGate.passed, attempts: telemetryGate.attempts, escalated: telemetryGate.escalated, issues: telemetryGate.issues },
    deployApproved: false,
    stages: [],
  };

  if (!telemetryGate.passed) {
    return buildResult(false, 'telemetry-pipeline gate failed — pipeline not deployed');
  }

  ctx.log?.('info', 'P2: telemetry-pipeline-deploy policy gate');
  const deployGate = await routedBreakpoint(ctx, {
    question: `Approve production deployment of the telemetry/collector pipeline configs? Staged rollout: ${TELEMETRY_ROLLOUT_STAGES.join(' -> ')}.`,
    configPaths: pipelineConfig.configPaths,
    telemetryGateEvidence: telemetryGate.evidence,
    rolloutStages: TELEMETRY_ROLLOUT_STAGES,
    stagePlan: TELEMETRY_STAGE_POLICY,
  }, {
    breakpointId: 'telemetry-pipeline-deploy',
    expert: gateExpert('telemetry-pipeline-deploy'),
    tags: ['policy-gated', 'observability', 'telemetry'],
    strategy: 'single',
    // Deliberately NO autoApproveAfterN — production pipeline deploys never auto-approve.
  });
  recordGate('telemetry-pipeline-deploy', 'P2', deployGate);

  if (deployGate.approved !== true) {
    // Fail closed: the executor is NEVER invoked — SLO pack stays adopted but undelivered.
    timeline.push({ at: nowIso(), event: 'telemetry-deploy-rejected', detail: 'pipeline left undeployed (fail-closed)' });
    return buildResult(false, 'telemetry-pipeline-deploy rejected');
  }
  telemetry.deployApproved = true;

  // Executor invoked ONLY inside this approved === true branch — no alternate path.
  const deployProvenance = {
    breakpointId: 'telemetry-pipeline-deploy',
    approved: true,
    autoApproved: wasAutoApproved(deployGate),
  };
  for (const stage of TELEMETRY_ROLLOUT_STAGES) {
    const policy = stagePolicy(stage);
    ctx.log?.('info', `P2: telemetry rollout stage ${stage}`);
    const deploy = await ctx.task(pipelineDeployExecutorTask, {
      configPaths: pipelineConfig.configPaths,
      stage,
      stagePolicy: policy,
      approvalProvenance: deployProvenance,
    });
    const verify = await ctx.task(stageVerificationTask, {
      kind: 'telemetry',
      stage,
      stagePolicy: policy,
      deployRef: deploy.deployRef,
      expectations: { sloPack, configPaths: pipelineConfig.configPaths },
    });
    telemetry.stages.push({ stage, deployed: deploy.deployed === true, verified: verify.verified === true, deployRef: deploy.deployRef });
    timeline.push({ at: nowIso(), event: 'telemetry-stage', detail: `${stage}: deployed=${deploy.deployed} verified=${verify.verified}` });
    if (verify.verified !== true) {
      // A failed stage verification halts promotion — no silent continue.
      return buildResult(false, `telemetry rollout halted: ${stage} stage verification failed`);
    }
  }

  // -------------------------------------------------------------------------
  // P3 — alert noise audit -> parallel family tuning -> alert-tuning gate ->
  //       alert-policy-change policy gate -> staged alert rollout
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: alert noise audit');
  const noiseAudit = await ctx.task(alertNoiseAuditTask, {
    alertSources,
    lookbackWindowDays: horizon.windowDays,
    priorKnowledge,
    artifactsDir: artifactsRoot,
  });
  if (noiseAudit.auditPath) {
    artifacts.push(noiseAudit.auditPath);
  }
  timeline.push({ at: nowIso(), event: 'alert-noise-audit', detail: `${noiseAudit.families.length} families` });

  const tunableFamilies = noiseAudit.families.filter((f) => f.verdict === 'retune' || f.verdict === 'keep');

  const tuneFamilies = async (feedback) => {
    ctx.log?.('info', 'P3: parallel per-alert-family tuning');
    return ctx.parallel.map(tunableFamilies, (family) =>
      ctx.task(alertFamilyTuningTask, {
        family,
        burnThresholds: budgetPolicy.burnThresholds,
        priorKnowledge,
        artifactsDir: artifactsRoot,
        ...(feedback ? { feedback } : {}),
      })
    );
  };

  let tunedFamilies = null;
  let alertTuningGate = null;
  let changeApproved = false;
  let alertChangeAutoApproved = false;
  let alertFeedback = null;
  for (let round = 0; round < 2; round++) {
    tunedFamilies = await tuneFamilies(round > 0 ? alertFeedback : null);
    for (const fam of tunedFamilies) {
      for (const p of fam.rulePaths) {
        if (!artifacts.includes(p)) artifacts.push(p);
      }
    }
    timeline.push({ at: nowIso(), event: round > 0 ? 'alert-families-retuned' : 'alert-families-tuned', detail: `${tunedFamilies.length} families` });

    ctx.log?.('info', 'P3: adversarial alert-tuning gate');
    const gate = await adversarialGate(ctx, {
      gateId: 'slo.gate.alert-tuning',
      artifact: { path: tunedFamilies[0].rulePaths[0], description: 'Tuned rule files + noise-audit report' },
      critics: [
        {
          name: 'alert-rule-executor-critic',
          role: 'Alert rule validation executor',
          focus: "EXECUTE each family's validationCommand (promtool/vendor rule linter) over rulePaths and quote outputs; then EXECUTE the burn-rate simulation from simulationSpec (drive the thresholds with the sample traffic assumptions) and verify page-worthy burn fires fast and slow-burn tickets do not page",
        },
        {
          name: 'noise-regression-critic',
          role: 'Noise and coverage regression reviewer',
          focus: 'diff old vs new rule set: every deleted alert is justified by the noise audit, every kept family maps to an SLO or an explicit non-SLO rationale, no coverage hole is opened on a tier-critical journey, and routing targets resolve to real receivers',
        },
      ],
      ironLaw: [
        'Evidence must include executed linter output AND simulation results — restating threshold arithmetic from the rule file is not evidence.',
        'Pin the exact verdict JSON shape at the END of the prompt: {"passed": boolean, "issues": [{"severity", "description", "location"}], "evidence": [string]}.',
      ],
      maxFixAttempts,
      fixer: {},
      context: {
        tunedFamilies,
        noiseAudit: { families: noiseAudit.families, noiseFindings: noiseAudit.noiseFindings, auditPath: noiseAudit.auditPath },
        burnThresholds: budgetPolicy.burnThresholds,
        sloPack,
      },
    });
    alertTuningGate = { passed: gate.passed, attempts: gate.attempts, escalated: gate.escalated, issues: gate.issues };
    if (gate.escalated) {
      breakpointsHit.push('slo.gate.alert-tuning.gate-escalation');
    }
    timeline.push({ at: nowIso(), event: 'alert-tuning-gate', detail: `passed=${gate.passed} attempts=${gate.attempts} escalated=${gate.escalated}` });

    if (!gate.passed) {
      if (round < 1) {
        alertFeedback = { reason: 'alert-tuning gate failed', issues: gate.issues };
        continue;
      }
      alerting = {
        auditPath: noiseAudit.auditPath ?? null,
        families: tunedFamilies,
        gate: alertTuningGate,
        changeApproved: false,
        stages: [],
      };
      return buildResult(false, 'alert-tuning gate failed after the bounded re-tune round');
    }

    // Policy gate: alert-policy-change. Never auto-approves by design.
    ctx.log?.('info', 'P3: alert-policy-change policy gate');
    const approval = await routedBreakpoint(ctx, {
      question: `Approve the tuned alert rule set + routing changes? Staged rollout: shadow canary -> paging-enabled full.`,
      families: tunedFamilies.map((f) => ({ familyId: f.familyId, rulePaths: f.rulePaths })),
      alertTuningGateEvidence: gate.evidence,
      noiseAuditPath: noiseAudit.auditPath,
      rolloutStages: TELEMETRY_ROLLOUT_STAGES,
    }, {
      breakpointId: 'alert-policy-change',
      expert: gateExpert('alert-policy-change'),
      tags: ['policy-gated', 'observability', 'alerting'],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — production alerting changes never auto-approve.
    });
    recordGate('alert-policy-change', 'P3', approval);
    if (approval.approved === true) {
      changeApproved = true;
      alertChangeAutoApproved = wasAutoApproved(approval);
      break;
    }
    alertFeedback = { reason: 'alert-policy-change rejected', response: approval.response || approval.feedback || 'tuned rules rejected' };
    timeline.push({ at: nowIso(), event: 'alert-policy-change-rejected', detail: String(alertFeedback.response) });
  }

  alerting = {
    auditPath: noiseAudit.auditPath ?? null,
    families: tunedFamilies,
    gate: alertTuningGate,
    changeApproved,
    stages: [],
  };

  if (!changeApproved) {
    // Fail closed: the rollout executor is NEVER invoked on rejected rules.
    return buildResult(false, 'alert-policy-change rejected twice — tuned rules not rolled out');
  }

  const allRulePaths = tunedFamilies.reduce((acc, f) => acc.concat(f.rulePaths), []);
  const alertProvenance = {
    breakpointId: 'alert-policy-change',
    approved: true,
    autoApproved: alertChangeAutoApproved,
  };
  // Executor invoked ONLY inside this approved === true branch — no alternate path.
  for (const stage of TELEMETRY_ROLLOUT_STAGES) {
    const policy = stagePolicy(stage);
    ctx.log?.('info', `P3: alert rollout stage ${stage}`);
    const deploy = await ctx.task(alertRolloutExecutorTask, {
      rulePaths: allRulePaths,
      stage,
      stagePolicy: policy,
      approvalProvenance: alertProvenance,
    });
    const verify = await ctx.task(stageVerificationTask, {
      kind: 'alert-rules',
      stage,
      stagePolicy: policy,
      deployRef: `alert-rollout:${stage}`,
      expectations: { pagingEnabled: stage === 'full', rulePaths: allRulePaths },
    });
    alerting.stages.push({ stage, deployed: deploy.deployed === true, verified: verify.verified === true, pagingEnabled: deploy.pagingEnabled === true });
    timeline.push({ at: nowIso(), event: 'alert-stage', detail: `${stage}: deployed=${deploy.deployed} verified=${verify.verified} paging=${deploy.pagingEnabled}` });
    if (verify.verified !== true) {
      // A failed canary/full verification halts promotion — no silent continue.
      return buildResult(false, `alert rollout halted: ${stage} stage verification failed`);
    }
  }

  // -------------------------------------------------------------------------
  // P4 — error-budget review cadence (documentation, no breakpoint)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: error-budget review cadence');
  const cadence = await ctx.task(reviewCadenceTask, {
    sloPack,
    tuningOutcomes: tunedFamilies,
    rolloutResults: { telemetry: telemetry.stages, alerting: alerting.stages },
    owners: POLICY_GATE_ROUTING,
    artifactsDir: artifactsRoot,
  });
  reviewCadence = { cadencePath: cadence.cadencePath, reportTemplatePath: cadence.reportTemplatePath };
  artifacts.push(cadence.cadencePath, cadence.reportTemplatePath);
  timeline.push({ at: nowIso(), event: 'review-cadence-composed', detail: cadence.cadencePath });

  // -------------------------------------------------------------------------
  // P5 — kip assert of learned SLO targets + tuning outcomes
  // -------------------------------------------------------------------------
  if (kipEnabled) {
    ctx.log?.('info', 'P5: kip assert');
    const facts = [];
    for (const svc of sloPack.services) {
      for (const sli of svc.slis) {
        facts.push({
          subject: `service:${svc.name}`,
          predicate: 'has-slo',
          object: `sli:${sli.archetype}`,
          props: { target: sli.target, window: sli.window, approvedBy: 'slo-change-approval' },
        });
      }
    }
    for (const fam of tunedFamilies) {
      const famStage = alerting.stages.length > 0 ? alerting.stages[alerting.stages.length - 1].stage : null;
      facts.push({
        subject: `alert-family:${fam.familyId}`,
        predicate: 'tuned-alert',
        object: `burn-rate:${(fam.rules || []).length}-windows`,
        props: { thresholds: budgetPolicy.burnThresholds, noiseDelta: null, rolloutStage: famStage },
      });
    }
    // Always present — the run-outcome fact guarantees kipAssert is never called empty.
    facts.push({
      subject: 'process:observability/slo-lifecycle',
      predicate: 'run-outcome',
      object: ctx.runId,
      props: {
        gates: ['slo.gate.slo-design', 'slo.gate.telemetry-pipeline', 'slo.gate.alert-tuning'],
        attempts: {
          sloDesign: sloDesignGate ? sloDesignGate.attempts : null,
          telemetry: telemetry.gate ? telemetry.gate.attempts : null,
          alertTuning: alertTuningGate ? alertTuningGate.attempts : null,
        },
        autoApprovals: autoApprovals.length,
      },
    });
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'observability', facts });
    kipFactsAsserted = asserted.asserted;
    timeline.push({ at: nowIso(), event: 'kip-assert', detail: `${kipFactsAsserted} facts` });
  }

  timeline.push({ at: nowIso(), event: 'slo-lifecycle-complete', detail: `${artifacts.length} artifacts` });

  const success =
    sloPack.adopted === true &&
    telemetry.deployApproved === true &&
    telemetry.stages.every((s) => s.verified === true) &&
    alerting.changeApproved === true &&
    alerting.stages.every((s) => s.verified === true);
  return buildResult(success);
}
