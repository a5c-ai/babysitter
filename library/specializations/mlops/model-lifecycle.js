/**
 * @process mlops/model-lifecycle
 * @description Flagship end-to-end model lifecycle: dataset governance intake (parallel
 *   per-dataset lineage/consent/retention checks) -> eval-harness design -> executed
 *   training/eval runs -> an adversarial eval-review gate that RE-RUNS a sampled eval and
 *   diffs metrics -> a policy-gated model promotion with an executed serving smoke ->
 *   drift-monitoring setup with an executed drift-detection stub -> an adversarial
 *   drift-review gate -> a drift path with severity-routed escalation and a policy-gated
 *   rollback/retirement -> kip-backed model-registry memory. model-lifecycle owns the
 *   governance/eval/promotion/drift/retirement lifecycle AROUND a trained candidate;
 *   training itself can be delegated to the data-science-ml near-misses
 *   (model-training-pipeline.js, automl-pipeline.js) — see the README composition map.
 *   Those are callable upstream stages, NOT superseded by this process.
 * @inputs {
 *   model: {                          // required
 *     modelName: string,              // required — the model under lifecycle
 *     modelVersion: string,           // required — the candidate version under evaluation
 *     artifactRef: string,            // required — resolvable candidate artifact/checkpoint
 *     repoRoot?: string,              // repository root (default '.')
 *     currentProductionRef?: string|null // restore/supersede target; null when none in production yet
 *   },
 *   datasets: Array<{                 // required non-empty; EMPTY THROWS (ungovernable lifecycle)
 *     name: string, uri: string,
 *     purpose: 'train'|'eval'|'holdout',
 *     lineageRef?: string, consentBasis?: string, retentionPolicy?: string
 *   }>,
 *   evalSuites: Array<{               // required non-empty; EMPTY THROWS (unpromotable model)
 *     name: string, command?: string, dataset: string, metrics: string[]
 *   }>,
 *   regressionThresholds: object,     // required — metric -> { min?, max?, baseline?, maxRegression? };
 *                                     // a metric referenced by an evalSuite with no entry THROWS
 *   promotionTargetStage?: string,    // member of MODEL_STAGES beyond 'development' (default 'production');
 *                                     // unknown value THROWS (no fallback stage)
 *   retrain?: boolean,                // (re)train the candidate from the governed datasets (default false);
 *                                     // when false the provided model.artifactRef is used
 *   driftPolicy?: { maxRollbackAttempts?: number, baselineWindow?: string, checkWindow?: string }, // maxRollbackAttempts default 1
 *   maxFixAttempts?: number,          // fixer budget per adversarial gate (default 2)
 *   kipEnabled?: boolean,             // recall + assert model-registry memory via kip (default true)
 *   kipDir?: string,                  // kip store directory (default '.a5c/kip')
 *   kipModel?: string,                // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string             // where harness/monitor specs land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,
 *   modelName: string,
 *   modelVersion: string|null,
 *   datasetGovernance: { checksRun: number, allCleared: boolean,
 *     retentionActions: Array<{ dataset, action, gated, approved, executed }> },
 *   evalHarness: { path: string|null, suites: number }|null,
 *   evalRuns: Array<{ suite, metrics: object, passedThresholds: boolean }>,
 *   evalReviewGate: { passed, attempts, escalated, issues }|null,
 *   promotion: { targetStage: string|null, gated: boolean, approved: boolean, deployed: boolean, verified: boolean }|null,
 *   driftMonitoring: { configured: boolean, path: string|null, baselineCaptured: boolean, alertingHooks: string[] }|null,
 *   driftReviewGate: { passed, attempts, escalated, issues }|null,
 *   driftIncident: { detected: boolean, severity: string|null, escalationRaised: boolean,
 *     rollback: { gated, approved, executed, verified }|null },
 *   retirement: { requested: boolean, gated: boolean, approved: boolean, executed: boolean }|null,
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty), fail-closed posture
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId: 'mlops/model-lifecycle', runId,
 *               timeline (orchestrator-accumulated, agents never write it), breakpointsHit, reason? }
 * }
 * @graph
 *   domains: [domain:mlops, domain:machine-learning-engineering]
 *   specializations: [specialization:mlops, specialization:data-science-ml]
 *   workflows: [workflow:model-lifecycle, workflow:model-promotion, workflow:drift-monitoring]
 *   roles: [role:ml-engineering-lead, role:data-governance-officer, role:ml-engineer]
 *   skillAreas: [skill-area:model-evaluation, skill-area:drift-detection, skill-area:dataset-governance]
 * @policyGatedActions dataset-retention-action, model-promotion-approval, model-rollback-approval
 *
 * STAGE_PROMOTION_POLICY (reproduced verbatim — the frozen const below is the implementation):
 *   staging:    entryGate model-promotion-approval | expert ml-engineering-lead
 *   production: entryGate model-promotion-approval | expert ml-engineering-lead
 *
 * DRIFT_ROUTING (reproduced verbatim — the frozen const below is the implementation):
 *   SEV1: immediate-rollback (no escalation expert — straight to the model-rollback-approval gate)
 *   SEV2: immediate-rollback (no escalation expert — straight to the model-rollback-approval gate)
 *   SEV3: remediation-choice via ml-engineering-lead (accept-drift/roll-forward vs rollback first)
 *   SEV4: remediation-choice via ml-engineering-lead (accept-drift/roll-forward vs rollback first)
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every gate/verification/executed-run
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown stage,
 * unknown drift severity, unknown governance-check name, unknown promotion target, and never-raised
 * routing lookups all THROW naming the source; the retention/promotion/rollback executors are
 * guarded solely by gate.approved === true and have no alternate invocation path; the timeline is
 * accumulated in the ORCHESTRATOR only (never inside agents).
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Model + drift + governance tables — frozen, with throwing lookups (no fallbacks)
// ---------------------------------------------------------------------------

/** Ordered model lifecycle stages; promotion advances one stage toward production. */
export const MODEL_STAGES = Object.freeze(['development', 'staging', 'production']);

/**
 * Per-target-stage promotion policy: the entry gate that guards promotion into the
 * stage and the accountable expert. Lookup via stagePromotionPolicy(stage) — unknown
 * stages throw; there is deliberately no fallback stage policy.
 */
export const STAGE_PROMOTION_POLICY = Object.freeze({
  staging: Object.freeze({ entryGate: 'model-promotion-approval', entryExpert: 'ml-engineering-lead' }),
  production: Object.freeze({ entryGate: 'model-promotion-approval', entryExpert: 'ml-engineering-lead' }),
});

/** The three governance checks run per dataset (borrowed from dsar-lifecycle compliance-check shape). */
export const DATASET_GOVERNANCE_CHECKS = Object.freeze(['lineage', 'consent', 'retention']);

/** Drift-incident severities (incident-style model, mirrored from release-lifecycle REGRESSION_SEVERITIES). */
export const DRIFT_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);

/**
 * Drift escalation routing. SEV1/SEV2 go straight to the model-rollback-approval gate
 * (escalationExpert is null — looking it up is an orchestrator bug and throws);
 * SEV3/SEV4 first raise a remediation-choice breakpoint (accept-drift/roll-forward vs
 * rollback) with ml-engineering-lead.
 */
export const DRIFT_ROUTING = Object.freeze({
  SEV1: Object.freeze({ escalationPath: 'immediate-rollback', escalationExpert: null }),
  SEV2: Object.freeze({ escalationPath: 'immediate-rollback', escalationExpert: null }),
  SEV3: Object.freeze({ escalationPath: 'remediation-choice', escalationExpert: 'ml-engineering-lead' }),
  SEV4: Object.freeze({ escalationPath: 'remediation-choice', escalationExpert: 'ml-engineering-lead' }),
});

/**
 * Stage-promotion-policy lookup. THROWS on unknown stage — there is deliberately no
 * fallback policy (fallbacks are forbidden).
 *
 * @param {string} stage - 'staging'|'production'
 * @returns {{ entryGate: string, entryExpert: string }}
 */
export function stagePromotionPolicy(stage) {
  if (!Object.prototype.hasOwnProperty.call(STAGE_PROMOTION_POLICY, stage)) {
    throw new Error(
      `STAGE_PROMOTION_POLICY: unknown stage '${stage}'. ` +
      `Known promotion targets: ${Object.keys(STAGE_PROMOTION_POLICY).join(', ')} — no fallback policy exists.`
    );
  }
  return STAGE_PROMOTION_POLICY[stage];
}

/**
 * Drift-routing lookup. THROWS on unknown severity, and — mirroring the release-lifecycle
 * regressionRouting null handling — THROWS when the escalationExpert is requested for an
 * immediate-rollback severity (that request is an orchestrator bug; no fallback expert exists).
 *
 * @param {string} severity - 'SEV1'|'SEV2'|'SEV3'|'SEV4'
 * @param {string} [request] - Pass 'escalationExpert' to resolve the expert route (throws when null)
 * @returns {object|string} The frozen routing row, or the expert when requested
 */
export function driftRouting(severity, request) {
  if (!Object.prototype.hasOwnProperty.call(DRIFT_ROUTING, severity)) {
    throw new Error(
      `DRIFT_ROUTING: unknown severity '${severity}'. ` +
      `Known severities: ${DRIFT_SEVERITIES.join(', ')} — no fallback route exists.`
    );
  }
  const row = DRIFT_ROUTING[severity];
  if (request === 'escalationExpert') {
    if (row.escalationExpert === null) {
      throw new Error(
        `DRIFT_ROUTING: severity '${severity}' routes to immediate-rollback — ` +
        'requesting its escalationExpert is an orchestrator bug (no fallback expert exists).'
      );
    }
    return row.escalationExpert;
  }
  if (request !== undefined) {
    throw new Error(
      `DRIFT_ROUTING: unknown request '${request}' — only 'escalationExpert' is resolvable.`
    );
  }
  return row;
}

/**
 * Drift-severity assertion. Accepts SEV1..SEV4 or 'none'; anything else THROWS naming the
 * source. No fallback severity is applied.
 *
 * @param {string} value - Candidate severity
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated value
 */
export function assertDriftSeverity(value, source) {
  if (value === 'none') return value;
  if (!DRIFT_SEVERITIES.includes(value)) {
    throw new Error(
      `Unknown drift severity '${value}' from ${source} — expected one of ` +
      `${DRIFT_SEVERITIES.join('|')}|none. No fallback severity is applied.`
    );
  }
  return value;
}

/**
 * Governance-check-name assertion. Validates a check name against
 * DATASET_GOVERNANCE_CHECKS; THROWS on an unknown check (no fallback check).
 *
 * @param {string} check - 'lineage'|'consent'|'retention'
 * @returns {string} The validated check name
 */
export function governanceCheckLabel(check) {
  if (!DATASET_GOVERNANCE_CHECKS.includes(check)) {
    throw new Error(
      `DATASET_GOVERNANCE_CHECKS: unknown check '${check}'. ` +
      `Known checks: ${DATASET_GOVERNANCE_CHECKS.join(', ')} — no fallback check exists.`
    );
  }
  return check;
}

// ---------------------------------------------------------------------------
// P1 — dataset governance intake (parallel per-dataset checks) + gated retention
// ---------------------------------------------------------------------------

export const datasetGovernanceCheckTask = defineTask('mlo.dataset-governance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance check for dataset ${args.dataset.name}`,
  agent: {
    name: 'dataset-governance-checker',
    prompt: {
      role: 'Dataset governance checker',
      task: 'Run all three governance checks for one dataset — lineage, consent, retention',
      context: args,
      instructions: [
        'Run all three DATASET_GOVERNANCE_CHECKS for this dataset: lineage (provenance/traceability), consent (legal basis for use), retention (retention-policy status).',
        'Return one checks[] entry per check with cleared:boolean and a detail string — exactly the three checks lineage, consent, retention.',
        'Set retentionActionRequired:true ONLY when the retention check surfaces a required deletion/retention-enforcement action; set proposedAction to that action string (null otherwise).',
        'Cross-reference priorKnowledge governance facts and cite matches instead of rediscovering them.',
        'DO NOT delete or enforce anything — this task inspects and reports only; execution is a separately gated task.',
        'Evidence entries must cite the provenance/consent/retention records grounding each verdict — at least one entry.',
      ],
      outputFormat: 'JSON with dataset string, checks array of { check (lineage|consent|retention), cleared boolean, detail string } (minItems 3), retentionActionRequired boolean, proposedAction string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['dataset', 'checks', 'retentionActionRequired', 'proposedAction', 'evidence'],
      properties: {
        dataset: { type: 'string' },
        checks: {
          type: 'array',
          minItems: 3,
          items: {
            type: 'object',
            required: ['check', 'cleared', 'detail'],
            properties: {
              check: { type: 'string', enum: ['lineage', 'consent', 'retention'] },
              cleared: { type: 'boolean' },
              detail: { type: 'string' },
            },
          },
        },
        retentionActionRequired: { type: 'boolean' },
        proposedAction: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'governance', 'dataset'],
}));

export const retentionExecutionTask = defineTask('mlo.retention-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved retention action for ${args.dataset}`,
  agent: {
    name: 'retention-executor',
    prompt: {
      role: 'Dataset retention executor',
      task: 'Execute EXACTLY the approved dataset deletion/retention-enforcement action — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the dataset-retention-action policy gate approved this exact action in context.',
        'Execute exactly the approved proposedAction against the named dataset — no improvised extras, no other datasets.',
        'Log every action with an ISO timestamp and its outcome — these entries feed the orchestrator timeline.',
        'If a step fails, stop and report executed:false honestly — do not improvise an alternate action.',
        'Evidence entries are the raw command/console outputs of the executed action — at least one entry.',
      ],
      outputFormat: 'JSON with executed boolean, dataset string, action string, actions array of { action, timestamp, outcome }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'dataset', 'action', 'actions', 'evidence'],
      properties: {
        executed: { type: 'boolean' },
        dataset: { type: 'string' },
        action: { type: 'string' },
        actions: {
          type: 'array',
          items: { type: 'object', required: ['action', 'timestamp', 'outcome'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'governance', 'retention', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P2 — eval-harness design
// ---------------------------------------------------------------------------

export const evalHarnessDesignTask = defineTask('mlo.eval-harness-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design eval harness for ${args.modelName}@${args.modelVersion}`,
  agent: {
    name: 'eval-harness-designer',
    prompt: {
      role: 'Eval-harness designer',
      task: 'Author the benchmark-suite harness spec + regression-threshold table markdown',
      context: args,
      instructions: [
        `Write the eval-harness spec markdown to ${args.harnessPath} and report that exact path back as harnessPath.`,
        'For every evalSuite, spell out its dataset, metrics, and run command in the harness spec.',
        'Every evalSuite metric must map to a regressionThresholds entry — surface any metric with no threshold as a hard error, never invent a threshold.',
        'Render the regression-threshold table (metric -> min/max/baseline/maxRegression) as thresholdTable and in the markdown.',
        'DO NOT run the suites here — this task designs the harness; execution is a separate gated set of runs.',
        'Evidence entries must cite the evalSuites/regressionThresholds behind the harness — at least one entry.',
      ],
      outputFormat: 'JSON with harnessPath string, suites array of { name, dataset, metrics } (minItems 1), thresholdTable object, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['harnessPath', 'suites', 'thresholdTable', 'evidence'],
      properties: {
        harnessPath: { type: 'string' },
        suites: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'dataset', 'metrics'] },
        },
        thresholdTable: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'eval', 'harness'],
}));

// ---------------------------------------------------------------------------
// P3 — optional training + executed eval runs (parallel suites)
// ---------------------------------------------------------------------------

export const trainingRunTask = defineTask('mlo.training-run', (args, taskCtx) => ({
  kind: 'agent',
  title: `Train candidate ${args.modelName}@${args.modelVersion}`,
  agent: {
    name: 'model-trainer',
    prompt: {
      role: 'Model trainer',
      task: 'Actually RUN training on the governed datasets and produce the candidate artifact — executed evidence only',
      context: args,
      instructions: [
        'Actually RUN the training job from the governed training datasets and report the raw training-command output as evidence.',
        'trained:true requires a fresh successful training run in THIS task, not a cached claim.',
        'Report the produced candidate coordinates as artifactRef (null only when training failed).',
        'This training stage is delegable to the data-science-ml near-misses (model-training-pipeline.js / automl-pipeline.js) per the README composition map — cite which was used when delegated.',
        'Never fabricate a checkpoint; a failed run reports trained:false honestly.',
        'Evidence entries must be the raw training-command outputs — executed evidence; at least one entry.',
      ],
      outputFormat: 'JSON with trained boolean, artifactRef string|null, trainingSummary object, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['trained', 'artifactRef', 'trainingSummary', 'evidence'],
      properties: {
        trained: { type: 'boolean' },
        artifactRef: { type: ['string', 'null'] },
        trainingSummary: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'training'],
}));

export const evalRunTask = defineTask('mlo.eval-run', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run eval suite ${args.suite.name} against ${args.modelName}@${args.modelVersion}`,
  agent: {
    name: 'eval-runner',
    prompt: {
      role: 'Eval runner',
      task: 'ACTUALLY RUN one benchmark suite against the candidate and capture raw metric outputs',
      context: args,
      instructions: [
        'ACTUALLY RUN this benchmark suite against the candidate artifactRef and capture the raw metric outputs — executed evidence only.',
        'Report one numeric value per declared metric in the metrics object; ran:true requires a fresh run in THIS task.',
        'Never fabricate metrics — a failed run reports ran:false honestly with whatever partial output was produced.',
        'DO NOT compute pass/fail against thresholds — the orchestrator does that deterministically; you report the raw measured metrics only.',
        'Evidence entries must be the raw eval-command outputs behind the metrics — at least one entry.',
      ],
      outputFormat: 'JSON with suite string, metrics object (metric -> number), ran boolean, evidence array (minItems 1, raw eval-command outputs)',
    },
    outputSchema: {
      type: 'object',
      required: ['suite', 'metrics', 'ran', 'evidence'],
      properties: {
        suite: { type: 'string' },
        metrics: { type: 'object' },
        ran: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'eval', 'run'],
}));

// ---------------------------------------------------------------------------
// P5 — policy-gated promotion: gated deploy + executed serving smoke
// ---------------------------------------------------------------------------

export const promotionDeployTask = defineTask('mlo.promotion-deploy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Promote ${args.modelName}@${args.modelVersion} to ${args.targetStage}`,
  agent: {
    name: 'promotion-deployer',
    prompt: {
      role: 'Model promotion deployer',
      task: 'Promote EXACTLY the evaluated modelVersion to the approved target stage — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the model-promotion-approval gate approved this exact promotion in context.',
        'Promote exactly the evaluated modelVersion (artifactRef) to the approved targetStage in the registry/serving surface — nothing more, no extra changes.',
        'Log every action with an ISO timestamp and its outcome — these entries feed the orchestrator timeline.',
        'If a step fails, stop and report promoted:false honestly — do not improvise a rollback; the orchestrator owns that path.',
        'Report the promoted reference as promotedRef.',
        'Evidence entries must be the raw promotion command/console outputs — at least one entry.',
      ],
      outputFormat: 'JSON with promoted boolean, targetStage string, promotedRef string, actions array of { action, timestamp, outcome }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['promoted', 'targetStage', 'promotedRef', 'actions', 'evidence'],
      properties: {
        promoted: { type: 'boolean' },
        targetStage: { type: 'string' },
        promotedRef: { type: 'string' },
        actions: {
          type: 'array',
          items: { type: 'object', required: ['action', 'timestamp', 'outcome'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'promotion', 'deploy', 'policy-gated'],
}));

export const promotionVerificationTask = defineTask('mlo.promotion-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify promoted ${args.modelName}@${args.modelVersion} serves at ${args.targetStage}`,
  agent: {
    name: 'promotion-verifier',
    prompt: {
      role: 'Promotion verifier',
      task: 'EXECUTE a serving smoke against the promoted version proving it serves at the target stage',
      context: args,
      instructions: [
        'EXECUTE a serving smoke against the promoted version: a version-marker probe (the serving surface reports the promoted modelVersion) AND a sampled eval probe (a small slice of an evalSuite returns sane predictions).',
        'Every probesRun entry is a probe you actually executed, with its pass/fail and detail.',
        'verified:true requires every probe passing PLUS a confirmed promotedRef match; anything less is verified:false, honestly reported.',
        'Evidence entries must be executed probe outputs — a claim without a run is not evidence; at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, probesRun array of { name, passed, detail } (minItems 1), promotedRefConfirmed boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'probesRun', 'promotedRefConfirmed', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        probesRun: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'passed', 'detail'] },
        },
        promotedRefConfirmed: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'promotion', 'verification'],
}));

// ---------------------------------------------------------------------------
// P6 — drift-monitoring setup + executed drift-detection run
// ---------------------------------------------------------------------------

export const driftMonitorSetupTask = defineTask('mlo.drift-monitor-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure drift monitoring for ${args.modelName}@${args.modelVersion}`,
  agent: {
    name: 'drift-monitor-engineer',
    prompt: {
      role: 'Drift-monitoring engineer',
      task: 'Configure data + prediction drift detectors and alerting hooks, capture the baseline, and ACTUALLY RUN the drift-detection stub',
      context: args,
      instructions: [
        `Write the drift-monitor spec markdown to ${args.monitorSpecPath} and report that exact path back as monitorSpecPath.`,
        'Configure both a data-drift detector and a prediction-drift detector plus at least one alerting hook.',
        'Capture the post-promotion baseline (set baselineCaptured accordingly).',
        'ACTUALLY RUN the drift-detection stub over baselineWindow vs checkWindow and report driftRun { dataDrift, predictionDrift, breachDetected } from the executed run.',
        'breachDetected:true requires an actual drift breach in the executed run — never a guess; report the raw drift-metric outputs as evidence.',
        'Evidence entries must be the raw executed drift-detection outputs — at least one entry.',
      ],
      outputFormat: 'JSON with configured boolean, monitorSpecPath string, baselineCaptured boolean, alertingHooks array (minItems 1), driftRun { dataDrift object, predictionDrift object, breachDetected boolean }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'monitorSpecPath', 'baselineCaptured', 'alertingHooks', 'driftRun', 'evidence'],
      properties: {
        configured: { type: 'boolean' },
        monitorSpecPath: { type: 'string' },
        baselineCaptured: { type: 'boolean' },
        alertingHooks: { type: 'array', minItems: 1 },
        driftRun: {
          type: 'object',
          required: ['dataDrift', 'predictionDrift', 'breachDetected'],
          properties: {
            dataDrift: { type: 'object' },
            predictionDrift: { type: 'object' },
            breachDetected: { type: 'boolean' },
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
  labels: ['agent', 'mlo', 'drift', 'monitor'],
}));

// ---------------------------------------------------------------------------
// P7 — drift path: triage + gated rollback / retirement
// ---------------------------------------------------------------------------

export const driftTriageTask = defineTask('mlo.drift-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage drift incident for ${args.modelName}@${args.modelVersion}`,
  agent: {
    name: 'drift-triager',
    prompt: {
      role: 'Drift triager',
      task: 'Classify the drift severity and recommend rollback or accept-drift/roll-forward',
      context: args,
      instructions: [
        'Classify severity with the incident-style matrix, grounded in the EXECUTED drift metrics in context:',
        'SEV1: severe live degradation / user-facing prediction failure or data-loss risk.',
        'SEV2: significant ongoing prediction degradation.',
        'SEV3: partial/limited drift impact.',
        'SEV4: internal-only drift signal, no user impact.',
        'Cross-reference priorKnowledge drift incidents and cite matches.',
        'Recommend rollback or roll-forward with a rationale — this is a RECOMMENDATION only; execution is gate-controlled.',
        'Evidence entries must cite the executed drift metrics behind the classification — at least one entry.',
      ],
      outputFormat: 'JSON with severity string (SEV1|SEV2|SEV3|SEV4), summary string, recommendation string (rollback|roll-forward), rationale string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['severity', 'summary', 'recommendation', 'rationale', 'evidence'],
      properties: {
        severity: { type: 'string', enum: ['SEV1', 'SEV2', 'SEV3', 'SEV4'] },
        summary: { type: 'string' },
        recommendation: { type: 'string', enum: ['rollback', 'roll-forward'] },
        rationale: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'drift', 'triage'],
}));

export const rollbackExecutionTask = defineTask('mlo.rollback-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved ${args.intent} for ${args.modelName} (${args.severity})`,
  agent: {
    name: 'rollback-executor',
    prompt: {
      role: 'Model rollback executor',
      task: 'Restore EXACTLY currentProductionRef (or retire the superseded version) — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the model-rollback-approval policy gate approved this action in context.',
        args.intent === 'retire'
          ? 'Retire exactly the superseded prior production version given as the restore target — no improvised extras.'
          : 'Restore exactly the currentProductionRef given as the restore target — no improvised extras.',
        'Log every action with an ISO timestamp and its outcome.',
        'If a step fails, stop and report rolledBack:false honestly.',
        'Evidence entries are the raw command outputs of the executed action — at least one entry.',
      ],
      outputFormat: 'JSON with rolledBack boolean, restoredRef string|null, actions array of { action, timestamp, outcome }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['rolledBack', 'restoredRef', 'actions', 'evidence'],
      properties: {
        rolledBack: { type: 'boolean' },
        restoredRef: { type: ['string', 'null'] },
        actions: {
          type: 'array',
          items: { type: 'object', required: ['action', 'timestamp', 'outcome'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'rollback', 'policy-gated'],
}));

export const rollbackVerificationTask = defineTask('mlo.rollback-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify rollback of ${args.modelName} (${args.severity})`,
  agent: {
    name: 'rollback-verifier',
    prompt: {
      role: 'Rollback verifier',
      task: 'Prove the restored version serves and the drift symptom is gone',
      context: args,
      instructions: [
        'EXECUTE serving probes against the restored version and prove it is serving (version marker matches the restore target).',
        'Confirm the original drift symptom is gone — re-check the drift signal that triggered the incident.',
        'verified:true requires every probe passing PLUS a confirmed restoredRef match; anything less is verified:false, honestly reported.',
        'Evidence entries must be executed probe outputs — executed evidence only; at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, probesRun array of { name, passed, detail } (minItems 1), restoredRefConfirmed boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'probesRun', 'restoredRefConfirmed', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        probesRun: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'passed', 'detail'] },
        },
        restoredRefConfirmed: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mlo', 'rollback', 'verification'],
}));

// ---------------------------------------------------------------------------
// Deterministic threshold evaluation (orchestrator-only ground truth)
// ---------------------------------------------------------------------------

/**
 * Deterministically decide whether a measured metric value clears its threshold row.
 * Higher-is-better regression semantics: a value dropping below baseline by more than
 * maxRegression fails. Non-numeric values fail. No fallback threshold is applied.
 */
function metricPassesThreshold(value, threshold, metric, source) {
  if (!threshold || typeof threshold !== 'object') {
    throw new Error(
      `regressionThresholds: no threshold for metric '${metric}' referenced by ${source} — ` +
      'refusing to score an eval without a threshold (no fallback threshold).'
    );
  }
  if (typeof value !== 'number' || Number.isNaN(value)) return false;
  if (threshold.min !== undefined && value < threshold.min) return false;
  if (threshold.max !== undefined && value > threshold.max) return false;
  if (threshold.baseline !== undefined && threshold.maxRegression !== undefined) {
    if (threshold.baseline - value > threshold.maxRegression) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    model,
    datasets,
    evalSuites,
    regressionThresholds,
    promotionTargetStage = 'production',
    retrain = false,
    driftPolicy = {},
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -------------------------------------------------------------------------
  // Input validation — no fallbacks: unknown/missing values throw.
  // -------------------------------------------------------------------------
  if (!model || !model.modelName || !model.modelVersion || !model.artifactRef) {
    throw new Error(
      'model-lifecycle requires model { modelName, modelVersion, artifactRef } — refusing to guess missing fields.'
    );
  }
  const modelName = model.modelName;
  const modelVersion = model.modelVersion;
  const repoRoot = model.repoRoot ?? '.';
  const currentProductionRef = model.currentProductionRef ?? null;

  if (!Array.isArray(datasets) || datasets.length === 0) {
    throw new Error(
      'model-lifecycle requires a non-empty datasets array — a lifecycle with no dataset ' +
      'governance surface is ungovernable; no default datasets are synthesized.'
    );
  }
  for (const dataset of datasets) {
    if (!dataset || !dataset.name || !dataset.uri || !dataset.purpose) {
      throw new Error(
        `datasets entries require { name, uri, purpose } (got ${JSON.stringify(dataset)}) — ` +
        'no fallback dataset definition exists.'
      );
    }
    if (!['train', 'eval', 'holdout'].includes(dataset.purpose)) {
      throw new Error(
        `dataset '${dataset.name}' has unknown purpose '${dataset.purpose}' — expected train|eval|holdout. ` +
        'No fallback purpose is applied.'
      );
    }
  }

  if (!Array.isArray(evalSuites) || evalSuites.length === 0) {
    throw new Error(
      'model-lifecycle requires a non-empty evalSuites array — a model with no eval definition ' +
      'is unpromotable; no default suites are synthesized.'
    );
  }
  for (const suite of evalSuites) {
    if (!suite || !suite.name || !suite.dataset || !Array.isArray(suite.metrics) || suite.metrics.length === 0) {
      throw new Error(
        `evalSuites entries require { name, dataset, metrics[] } (got ${JSON.stringify(suite)}) — ` +
        'no fallback suite definition exists.'
      );
    }
  }

  if (!regressionThresholds || typeof regressionThresholds !== 'object') {
    throw new Error(
      'model-lifecycle requires a regressionThresholds object mapping metric -> threshold — ' +
      'refusing to score evals without thresholds (no fallback thresholds).'
    );
  }

  // promotionTargetStage must be a member of MODEL_STAGES beyond 'development'.
  if (!MODEL_STAGES.includes(promotionTargetStage) || promotionTargetStage === 'development') {
    throw new Error(
      `promotionTargetStage '${promotionTargetStage}' is unknown — expected a MODEL_STAGES member beyond ` +
      `'development' (${MODEL_STAGES.slice(1).join(' | ')}). No fallback stage is applied.`
    );
  }

  const maxRollbackAttempts = driftPolicy.maxRollbackAttempts ?? 1;
  const baselineWindow = driftPolicy.baselineWindow ?? null;
  const checkWindow = driftPolicy.checkWindow ?? null;

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
  const datasetGovernance = { checksRun: 0, allCleared: true, retentionActions: [] };
  let evalHarness = null;
  const evalRuns = [];
  let evalReviewGate = null;
  let promotion = null;
  let driftMonitoring = null;
  let driftReviewGate = null;
  const driftIncident = { detected: false, severity: null, escalationRaised: false, rollback: null };
  let driftTriage = null;
  let retirement = null;
  let kipFactsAsserted = 0;
  const artifacts = [];

  const buildResult = (success, reason) => ({
    success,
    modelName,
    modelVersion,
    datasetGovernance,
    evalHarness,
    evalRuns,
    evalReviewGate,
    promotion,
    driftMonitoring,
    driftReviewGate,
    driftIncident,
    retirement,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'mlops/model-lifecycle',
      runId: ctx.runId,
      timeline,
      breakpointsHit,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall of prior model memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior model memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: `model registry: ${modelName}@${modelVersion}`,
      kipModel,
      kind: 'mlops-model-registry',
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
      const subject = `model:${modelName}@${modelVersion}`;
      const rolledBack = !!(driftIncident.rollback && driftIncident.rollback.executed === true);
      const promoted = !!(promotion && promotion.deployed === true);
      const outcome = rolledBack ? 'rolled-back' : promoted && success ? 'promoted' : 'failed';
      const facts = [
        { subject, predicate: 'has-version', object: modelVersion },
        {
          subject,
          predicate: 'outcome',
          object: outcome,
          props: {
            evalReviewPassed: evalReviewGate ? evalReviewGate.passed === true : false,
            promoted,
            driftDetected: driftIncident.detected === true,
          },
        },
      ];
      for (const run of evalRuns) {
        facts.push({
          subject,
          predicate: 'eval-metric',
          object: run.suite,
          props: { thresholdsPassed: run.passedThresholds === true },
        });
      }
      if (promotion) {
        facts.push({
          subject,
          predicate: 'promotion-decision',
          object: promotion.deployed === true ? `promoted-to-${promotion.targetStage}` : 'not-promoted',
          props: { approved: promotion.approved === true, verified: promotion.verified === true },
        });
      }
      if (driftIncident.detected === true && driftTriage) {
        facts.push({
          subject,
          predicate: 'drift-incident',
          object: driftTriage.summary,
          props: {
            severity: driftIncident.severity,
            rollbackVerified: driftIncident.rollback ? driftIncident.rollback.verified === true : false,
          },
        });
        facts.push({
          subject,
          predicate: 'rollback-lesson',
          object: `${driftIncident.severity}: ${driftTriage.rationale}`,
        });
      }
      const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'mlops-model-registry', facts });
      kipFactsAsserted = asserted.asserted;
      timeline.push({ at: nowIso(), event: 'kip-assert', detail: `${kipFactsAsserted} facts` });
    }
    return buildResult(success, reason);
  };

  // -------------------------------------------------------------------------
  // P1 — dataset governance intake (parallel per-dataset checks) + gated retention
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P1: dataset governance intake across ${datasets.length} datasets`);
  const governanceResults = await ctx.parallel.all(
    datasets.map((dataset) => () =>
      ctx.task(datasetGovernanceCheckTask, {
        dataset,
        checks: DATASET_GOVERNANCE_CHECKS,
        priorKnowledge,
      })
    )
  );

  let governanceFailClosed = null;
  for (const gov of governanceResults) {
    // Validate every reported check name against the frozen set — unknown check THROWS.
    for (const check of gov.checks) {
      governanceCheckLabel(check.check);
    }
    datasetGovernance.checksRun += gov.checks.length;
    const dsSpec = datasets.find((d) => d.name === gov.dataset) ?? null;
    const isRequiredSet = dsSpec !== null; // every governed dataset is a required train/eval/holdout set
    const allChecksCleared = gov.checks.every((c) => c.cleared === true);
    if (!allChecksCleared) datasetGovernance.allCleared = false;
    timeline.push({ at: nowIso(), event: 'governance-checked', detail: `${gov.dataset}: allCleared=${allChecksCleared} retentionActionRequired=${gov.retentionActionRequired === true}` });

    // Retention action (if flagged) is policy-gated.
    if (gov.retentionActionRequired === true) {
      const record = { dataset: gov.dataset, action: gov.proposedAction, gated: true, approved: false, executed: false };
      // Policy gate: dataset-retention-action.
      // Deliberately NO autoApproveAfterN — a dataset deletion/retention action must
      // never auto-approve; do not add it.
      const retentionGate = await routedBreakpoint(ctx, {
        question: `Approve the proposed retention action on dataset ${gov.dataset}: ${gov.proposedAction}?`,
        dataset: gov.dataset,
        proposedAction: gov.proposedAction,
        checks: gov.checks,
        priorKnowledgeGovernance: priorKnowledge.facts,
      }, {
        breakpointId: 'dataset-retention-action',
        expert: 'data-governance-officer',
        tags: ['policy-gated', 'mlops', 'dataset-governance'],
        strategy: 'single',
      });
      recordGate('dataset-retention-action', 'P1', retentionGate);
      if (retentionGate.approved === true) {
        record.approved = true;
        // retentionExecutionTask is invoked ONLY here, inside retentionGate.approved === true —
        // no other call site exists.
        const retentionExec = await ctx.task(retentionExecutionTask, {
          dataset: gov.dataset,
          action: gov.proposedAction,
          checks: gov.checks,
        });
        for (const act of retentionExec.actions) {
          timeline.push({ at: act.timestamp, event: 'retention-action', detail: `${gov.dataset}: ${act.action} -> ${act.outcome}` });
        }
        record.executed = retentionExec.executed === true;
        timeline.push({ at: nowIso(), event: 'retention-gate', detail: `${gov.dataset}: approved, executed=${record.executed}` });
      } else {
        // Fail closed: the retention executor is NEVER invoked un-gated. An un-actioned
        // required training/eval set means the lifecycle stops before eval.
        timeline.push({ at: nowIso(), event: 'retention-gate', detail: `${gov.dataset}: rejected — action not executed` });
        if (isRequiredSet) {
          governanceFailClosed =
            `dataset-retention-action rejected for required dataset '${gov.dataset}' — the flagged action was not executed; ` +
            'failing closed before eval (an un-actioned required dataset never reaches promotion).';
        }
      }
      datasetGovernance.retentionActions.push(record);
    }

    // A cleared:false lineage/consent check has no remediation path — fail closed.
    for (const check of gov.checks) {
      if (check.cleared !== true && (check.check === 'lineage' || check.check === 'consent')) {
        governanceFailClosed =
          `dataset '${gov.dataset}' failed the ${check.check} governance check (cleared:false) with no approved remediation — ` +
          'failing closed before eval (an ungoverned training set never reaches promotion).';
      }
    }
  }

  if (governanceFailClosed) {
    // Fail closed BEFORE eval — the eval harness and promotion gate are never reached.
    return buildResult(false, governanceFailClosed);
  }

  // -------------------------------------------------------------------------
  // P2 — eval-harness design (+ orchestrator validates every metric has a threshold)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: eval-harness design');
  const harness = await ctx.task(evalHarnessDesignTask, {
    modelName,
    modelVersion,
    evalSuites,
    regressionThresholds,
    harnessPath: `${artifactsRoot}/eval-harness-${modelName}-${modelVersion}.md`,
  });
  evalHarness = { path: harness.harnessPath, suites: evalSuites.length };
  artifacts.push(harness.harnessPath);
  timeline.push({ at: nowIso(), event: 'eval-harness', detail: `${evalSuites.length} suites -> ${harness.harnessPath}` });

  // Every evalSuite metric MUST map to a regressionThresholds entry — missing THROWS
  // before any run (no fallback threshold).
  for (const suite of evalSuites) {
    for (const metric of suite.metrics) {
      if (!Object.prototype.hasOwnProperty.call(regressionThresholds, metric)) {
        throw new Error(
          `evalSuite '${suite.name}' references metric '${metric}' with no regressionThresholds entry — ` +
          'refusing to run eval without a threshold (no fallback threshold exists).'
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // P3 — optional training + executed eval runs (parallel suites)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: training + executed eval runs');
  let candidateArtifactRef = model.artifactRef;
  if (retrain === true) {
    const training = await ctx.task(trainingRunTask, {
      modelName,
      modelVersion,
      repoRoot,
      datasets: datasets.filter((d) => d.purpose === 'train'),
      priorKnowledge,
    });
    if (training.trained === true && training.artifactRef) {
      candidateArtifactRef = training.artifactRef;
    }
    timeline.push({ at: nowIso(), event: 'training-run', detail: `trained=${training.trained} artifactRef=${training.artifactRef}` });
  }

  const suiteRuns = await ctx.parallel.all(
    evalSuites.map((suite) => () =>
      ctx.task(evalRunTask, {
        modelName,
        modelVersion,
        artifactRef: candidateArtifactRef,
        suite,
        thresholds: suite.metrics.reduce((acc, metric) => {
          acc[metric] = regressionThresholds[metric];
          return acc;
        }, {}),
      })
    )
  );

  // Per-threshold pass/fail is computed DETERMINISTICALLY by the orchestrator — the
  // eval-runner never scores itself; this is ground truth for the promotion payload.
  const thresholdDetail = [];
  for (let i = 0; i < evalSuites.length; i++) {
    const suite = evalSuites[i];
    const run = suiteRuns[i];
    let suitePassed = run.ran === true;
    for (const metric of suite.metrics) {
      const value = run.metrics ? run.metrics[metric] : undefined;
      const passed = metricPassesThreshold(value, regressionThresholds[metric], metric, `evalSuite '${suite.name}'`);
      if (!passed) suitePassed = false;
      thresholdDetail.push({ suite: suite.name, metric, value: value ?? null, passed });
    }
    evalRuns.push({ suite: suite.name, metrics: run.metrics ?? {}, passedThresholds: suitePassed });
    timeline.push({ at: nowIso(), event: 'eval-run', detail: `${suite.name}: ran=${run.ran} passedThresholds=${suitePassed}` });
  }

  // -------------------------------------------------------------------------
  // P4 — adversarial eval-review gate (RE-RUNS a sampled eval, diffs metrics)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: adversarial eval-review gate');
  const evalReviewResult = await adversarialGate(ctx, {
    gateId: 'mlo.eval-review',
    artifact: {
      path: harness.harnessPath,
      description: 'Eval report: per-suite metrics + deterministic threshold pass/fail',
    },
    critics: [
      {
        name: 'sampled-eval-reexecution-critic',
        role: 'Sampled-eval prosecutor',
        focus: 'RE-RUN a sampled subset of an evalSuite yourself and DIFF the fresh metrics against the reported metrics; cite raw re-execution outputs per sampled metric — a citation of the reported number without a fresh run is NOT evidence',
      },
      {
        name: 'regression-threshold-critic',
        role: 'Regression-threshold auditor',
        focus: 'recompute every metric against regressionThresholds (min/max/baseline/maxRegression) and flag any breach the run under-reported; cite the recomputation',
      },
      {
        name: 'eval-integrity-critic',
        role: 'Eval-integrity auditor',
        focus: 'the eval datasets are the governed holdout with no train/eval leakage — cross-check against the P1 lineage clearance in context; cite the datasets checked',
      },
    ],
    ironLaw: [
      'Executed evidence only: re-run a sampled eval yourself and diff — reading the eval report is not evidence.',
      'passed:true with empty evidence is rejected by the combinator.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      evalRuns,
      thresholdDetail,
      regressionThresholds,
      evalSuites,
      governance: governanceResults,
      priorKnowledge,
    },
  });
  evalReviewGate = {
    passed: evalReviewResult.passed,
    attempts: evalReviewResult.attempts,
    escalated: evalReviewResult.escalated,
    issues: evalReviewResult.issues,
  };
  if (evalReviewResult.escalated) {
    breakpointsHit.push('mlo.eval-review.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'eval-review-gate', detail: `passed=${evalReviewResult.passed} attempts=${evalReviewResult.attempts} escalated=${evalReviewResult.escalated}` });
  if (evalReviewResult.passed !== true) {
    // Fail closed: the model-promotion-approval gate is NEVER raised on a failed eval-review.
    return buildResult(false, 'eval-review gate failed — model-promotion-approval gate never raised');
  }

  // -------------------------------------------------------------------------
  // P5 — policy-gated model promotion (only after a passed eval-review gate)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: policy-gated model promotion');
  const promotionPolicy = stagePromotionPolicy(promotionTargetStage);
  promotion = { targetStage: promotionTargetStage, gated: true, approved: false, deployed: false, verified: false };

  // Deliberately NO autoApproveAfterN — the model-promotion-approval gate must never
  // auto-approve; do not add it.
  const promotionGate = await routedBreakpoint(ctx, {
    question: `Approve promoting ${modelName}@${modelVersion} to ${promotionTargetStage}?`,
    modelName,
    modelVersion,
    targetStage: promotionTargetStage,
    evalRuns,
    thresholdDetail,
    evalReviewEvidence: evalReviewResult.evidence,
    governanceClearance: { checksRun: datasetGovernance.checksRun, allCleared: datasetGovernance.allCleared },
  }, {
    breakpointId: promotionPolicy.entryGate,
    expert: promotionPolicy.entryExpert,
    tags: ['policy-gated', 'mlops', 'promotion'],
    strategy: 'single',
  });
  recordGate(promotionPolicy.entryGate, 'P5', promotionGate);
  if (promotionGate.approved !== true) {
    // Fail closed: nothing is promoted and there is no alternate promotion path.
    timeline.push({ at: nowIso(), event: 'promotion-gate', detail: 'rejected — nothing promoted' });
    return buildResult(false, 'model-promotion-approval gate rejected — nothing promoted');
  }
  promotion.approved = true;
  timeline.push({ at: nowIso(), event: 'promotion-gate', detail: `approved -> ${promotionTargetStage}` });

  // promotionDeployTask is invoked ONLY here, inside promotionGate.approved === true —
  // no other call site exists.
  const promotionDeploy = await ctx.task(promotionDeployTask, {
    modelName,
    modelVersion,
    artifactRef: candidateArtifactRef,
    targetStage: promotionTargetStage,
  });
  for (const act of promotionDeploy.actions) {
    timeline.push({ at: act.timestamp, event: 'promotion-action', detail: `${act.action} -> ${act.outcome}` });
  }
  promotion.deployed = promotionDeploy.promoted === true;
  timeline.push({ at: nowIso(), event: 'promotion-deployed', detail: `deployed=${promotion.deployed} ref=${promotionDeploy.promotedRef}` });

  if (promotion.deployed !== true) {
    // A failed promotion deploy ends the run — no serving smoke, no drift monitoring on
    // an unpromoted model.
    return closeWithKip(false, 'promotion deploy reported promoted:false — nothing serving at the target stage');
  }

  const promotionVerify = await ctx.task(promotionVerificationTask, {
    modelName,
    modelVersion,
    targetStage: promotionTargetStage,
    promotedRef: promotionDeploy.promotedRef,
    evalSuites,
  });
  promotion.verified = promotionVerify.verified === true;
  timeline.push({ at: nowIso(), event: 'promotion-verified', detail: `verified=${promotion.verified} probes=${promotionVerify.probesRun.length}` });

  // -------------------------------------------------------------------------
  // P6 — drift-monitoring setup + adversarial drift-review gate
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: drift-monitoring setup + adversarial drift-review gate');
  const driftSetup = await ctx.task(driftMonitorSetupTask, {
    modelName,
    modelVersion,
    promotedRef: promotionDeploy.promotedRef,
    baselineWindow,
    checkWindow,
    monitorSpecPath: `${artifactsRoot}/drift-monitor-${modelName}-${modelVersion}.md`,
  });
  driftMonitoring = {
    configured: driftSetup.configured === true,
    path: driftSetup.monitorSpecPath,
    baselineCaptured: driftSetup.baselineCaptured === true,
    alertingHooks: driftSetup.alertingHooks,
  };
  artifacts.push(driftSetup.monitorSpecPath);
  timeline.push({ at: nowIso(), event: 'drift-monitor', detail: `configured=${driftMonitoring.configured} breachDetected=${driftSetup.driftRun.breachDetected} hooks=${driftMonitoring.alertingHooks.length}` });

  const driftReviewResult = await adversarialGate(ctx, {
    gateId: 'mlo.drift-review',
    artifact: {
      path: driftSetup.monitorSpecPath,
      description: 'Drift-monitor spec + executed drift-detection run',
    },
    critics: [
      {
        name: 'drift-detection-reexecution-critic',
        role: 'Drift-detection prosecutor',
        focus: 'RE-RUN the drift-detection stub yourself over baselineWindow vs checkWindow and DIFF your drift scores against the reported ones; cite raw executed outputs — a read of the reported drift score is not evidence',
      },
      {
        name: 'alerting-hook-critic',
        role: 'Alerting-hook auditor',
        focus: 'prove each configured alerting hook ACTUALLY FIRES on a synthetic drift breach (executed); cite the fired-alert output per hook',
      },
    ],
    ironLaw: [
      'Executed evidence only: re-run the drift-detection stub and fire the hooks yourself; reading the monitor spec is not evidence.',
      'passed:true with empty evidence is rejected by the combinator.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      driftRun: driftSetup.driftRun,
      alertingHooks: driftSetup.alertingHooks,
      baselineWindow,
      checkWindow,
      priorKnowledge,
    },
  });
  driftReviewGate = {
    passed: driftReviewResult.passed,
    attempts: driftReviewResult.attempts,
    escalated: driftReviewResult.escalated,
    issues: driftReviewResult.issues,
  };
  if (driftReviewResult.escalated) {
    breakpointsHit.push('mlo.drift-review.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'drift-review-gate', detail: `passed=${driftReviewResult.passed} attempts=${driftReviewResult.attempts} escalated=${driftReviewResult.escalated}` });

  // -------------------------------------------------------------------------
  // P7 — drift path: triage + severity-routed escalation + gated rollback. Entered
  // ONLY when the executed drift run surfaced a live breach.
  // Returns { terminal: 'reject'|'roll-forward'|'done', reason }.
  // -------------------------------------------------------------------------
  const runDriftPath = async () => {
    ctx.log?.('info', 'P7: drift path (executed drift breach)');
    driftIncident.detected = true;
    driftTriage = await ctx.task(driftTriageTask, {
      modelName,
      modelVersion,
      driftRun: driftSetup.driftRun,
      alertingHooks: driftSetup.alertingHooks,
      driftReviewEvidence: driftReviewResult.evidence,
      priorKnowledge,
    });
    const severity = assertDriftSeverity(driftTriage.severity, 'mlo.drift-triage');
    driftIncident.severity = severity;
    const sevTag = severity.toLowerCase();
    timeline.push({ at: nowIso(), event: 'drift-triaged', detail: `${severity}: ${driftTriage.summary} (recommend ${driftTriage.recommendation})` });

    const routing = driftRouting(severity);
    if (routing.escalationPath === 'remediation-choice') {
      // SEV3/SEV4: the accept-drift/roll-forward vs rollback call is genuinely ambiguous —
      // the single non-policy breakpoint in this process (sparse-breakpoint rule).
      driftIncident.escalationRaised = true;
      const choice = await routedBreakpoint(ctx, {
        question: `${severity} drift on ${modelName}@${modelVersion}: accept-drift/roll-forward or roll back? Reply 'roll-forward' to accept the drift and fix forward; anything else proceeds to the model-rollback-approval gate.`,
        triage: {
          severity: driftTriage.severity,
          summary: driftTriage.summary,
          recommendation: driftTriage.recommendation,
          rationale: driftTriage.rationale,
        },
        driftRun: driftSetup.driftRun,
        alertingHooks: driftSetup.alertingHooks,
      }, {
        breakpointId: 'mlo.drift.remediation-choice',
        expert: driftRouting(severity, 'escalationExpert'),
        tags: ['mlops', 'drift', sevTag],
        strategy: 'single',
      });
      recordGate('mlo.drift.remediation-choice', 'P7', choice);
      const response = String(choice.response ?? '').trim().toLowerCase();
      if (response === 'roll-forward') {
        timeline.push({ at: nowIso(), event: 'remediation-choice', detail: 'roll-forward chosen — no rollback gate raised' });
        return { terminal: 'roll-forward', reason: `roll-forward chosen — ${severity} drift accepted, model left at current version` };
      }
      timeline.push({ at: nowIso(), event: 'remediation-choice', detail: 'rollback path chosen — proceeding to the model-rollback-approval gate' });
    }

    // Policy gate: model-rollback-approval.
    // Deliberately NO autoApproveAfterN — a production rollback must never auto-approve;
    // do not add it.
    driftIncident.rollback = { gated: true, approved: false, executed: false, verified: false };
    const rollbackGate = await routedBreakpoint(ctx, {
      question: `Approve rolling ${modelName} back to ${currentProductionRef} (${severity} drift)?`,
      triage: {
        severity: driftTriage.severity,
        summary: driftTriage.summary,
        recommendation: driftTriage.recommendation,
      },
      driftRun: driftSetup.driftRun,
      restoreTargetRef: currentProductionRef,
    }, {
      breakpointId: 'model-rollback-approval',
      expert: 'ml-engineering-lead',
      tags: ['policy-gated', 'mlops', sevTag],
      strategy: 'single',
    });
    recordGate('model-rollback-approval', 'P7', rollbackGate);
    if (rollbackGate.approved !== true) {
      // Fail closed: the rollback executor is NEVER invoked un-gated — no alternate path.
      timeline.push({ at: nowIso(), event: 'rollback-gate', detail: 'rejected — model left at current version' });
      return { terminal: 'reject', reason: 'model-rollback-approval gate rejected — model left at current version, state surfaced' };
    }
    driftIncident.rollback.approved = true;
    timeline.push({ at: nowIso(), event: 'rollback-gate', detail: 'approved' });

    let rollbackVerify = null;
    for (let attempt = 1; attempt <= maxRollbackAttempts; attempt++) {
      // rollbackExecutionTask is invoked ONLY here, inside rollbackGate.approved === true —
      // no other call site exists.
      const rollbackExec = await ctx.task(rollbackExecutionTask, {
        modelName,
        severity,
        intent: 'rollback',
        restoreTargetRef: currentProductionRef,
        triage: driftTriage,
        attempt,
      });
      for (const act of rollbackExec.actions) {
        timeline.push({ at: act.timestamp, event: 'rollback-action', detail: `${act.action} -> ${act.outcome}` });
      }
      driftIncident.rollback.executed = rollbackExec.rolledBack === true;
      rollbackVerify = await ctx.task(rollbackVerificationTask, {
        modelName,
        severity,
        restoredRef: rollbackExec.restoredRef,
        originalSymptom: driftTriage.summary,
        attempt,
      });
      driftIncident.rollback.verified = rollbackVerify.verified === true;
      timeline.push({ at: nowIso(), event: 'rollback-verified', detail: `verified=${rollbackVerify.verified} (attempt ${attempt})` });
      if (rollbackVerify.verified === true) break;
    }
    return {
      terminal: 'done',
      reason: `${severity} drift — rollback ${driftIncident.rollback.executed ? 'executed' : 'failed'}, verified=${driftIncident.rollback.verified}`,
    };
  };

  if (driftSetup.driftRun.breachDetected === true) {
    const driftOutcome = await runDriftPath();
    if (driftOutcome.terminal === 'roll-forward' || driftOutcome.terminal === 'reject') {
      return buildResult(false, driftOutcome.reason);
    }
    ctx.log?.('info', 'P8: kip assert at close (drift path)');
    return closeWithKip(false, driftOutcome.reason);
  }

  // -------------------------------------------------------------------------
  // P7 (retirement) — a clean promotion to production that superseded a prior
  // production version retires the superseded version via the SAME gate surface
  // (model-rollback-approval), tagged retirement.
  // -------------------------------------------------------------------------
  if (promotionTargetStage === 'production' && currentProductionRef !== null) {
    ctx.log?.('info', 'P7: retirement of superseded production version');
    retirement = { requested: true, gated: true, approved: false, executed: false };
    // Deliberately NO autoApproveAfterN — retiring a production version must never
    // auto-approve; do not add it.
    const retirementGate = await routedBreakpoint(ctx, {
      question: `Approve retiring the superseded production version ${currentProductionRef} of ${modelName} (replaced by ${modelVersion})?`,
      modelName,
      supersededRef: currentProductionRef,
      replacedByVersion: modelVersion,
    }, {
      breakpointId: 'model-rollback-approval',
      expert: 'ml-engineering-lead',
      tags: ['policy-gated', 'mlops', 'retirement'],
      strategy: 'single',
    });
    recordGate('model-rollback-approval', 'P7', retirementGate);
    if (retirementGate.approved === true) {
      retirement.approved = true;
      // rollbackExecutionTask is invoked ONLY here (retirement intent), inside
      // retirementGate.approved === true — no other call site exists.
      const retireExec = await ctx.task(rollbackExecutionTask, {
        modelName,
        severity: 'none',
        intent: 'retire',
        restoreTargetRef: currentProductionRef,
        attempt: 1,
      });
      for (const act of retireExec.actions) {
        timeline.push({ at: act.timestamp, event: 'retirement-action', detail: `${act.action} -> ${act.outcome}` });
      }
      retirement.executed = retireExec.rolledBack === true;
      timeline.push({ at: nowIso(), event: 'retirement-gate', detail: `approved, executed=${retirement.executed}` });
    } else {
      timeline.push({ at: nowIso(), event: 'retirement-gate', detail: 'rejected — superseded version left in place' });
    }
  }

  // -------------------------------------------------------------------------
  // P8 — kip assert at close (happy path)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: kip assert at close');
  const success = promotion.deployed === true && promotion.verified === true;
  return closeWithKip(success, success ? undefined : 'model promoted but serving verification did not pass');
}
