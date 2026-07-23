/**
 * @process release-engineering/release-lifecycle
 * @description Flagship end-to-end release lifecycle with policy-gated production deploy,
 *   stage-promotion approvals, severity-routed rollback escalation, adversarial
 *   readiness/post-release gates that EXECUTE the built artifact, and kip-backed release
 *   memory. Complements devops-sre-platform/post-deploy-visual-check.js (visual
 *   spot-check) — this process owns the release lifecycle itself.
 * @inputs {
 *   release: {                      // required
 *     serviceName: string,          // required — the service being released
 *     repoRoot?: string,            // repository root (default '.')
 *     baseRef: string,              // required — ref the release is cut from
 *     versionHint?: 'major'|'minor'|'patch'|null // null => derived from commits; unknown value THROWS
 *   },
 *   smokeProbes: Array<{ name: string, command?: string, url?: string, expectation: string }>,
 *                                   // required non-empty; readiness/post-release critics and
 *                                   // stage verification run against these; empty THROWS
 *                                   // (a release with no smoke definition is unverifiable, not defaulted)
 *   stagesOverride?: string[]|null, // must be a strict prefix-ordered subset of ROLLOUT_STAGES;
 *                                   // unknown stage name THROWS (no fallback stage plan)
 *   rollbackPolicy?: { maxRollbackAttempts?: number }, // default 1
 *   maxFixAttempts?: number,        // fixer budget per adversarial gate (default 2)
 *   kipEnabled?: boolean,           // recall + assert release memory via kip (default true)
 *   kipDir?: string,                // kip store directory (default '.a5c/kip')
 *   kipModel?: string,              // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string           // where changelog/reports land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,
 *   releaseId: string,
 *   version: string|null,
 *   changelog: { path: string|null, entries: number },
 *   preflight: { built: boolean, artifactRef: string|null, testsPassed: boolean }|null,
 *   readinessGate: { passed, attempts, escalated, issues }|null,
 *   stages: Array<{ stage, gate: 'production-deploy'|'stage-promotion', approved, deployed, verified, deployRef?, probesRun? }>,
 *   postReleaseGate: { passed, attempts, escalated, issues }|null,
 *   regression: { detected: boolean, severity: string|null, escalationRaised: boolean,
 *                 rollback: { gated, approved, executed, verified }|null },
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty):
 *                                   // every harness-level auto-approval surfaced, fail-closed posture
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId: 'release-engineering/release-lifecycle', runId,
 *               timeline (orchestrator-accumulated, agents never write it), breakpointsHit, reason? }
 * }
 * @graph
 *   domains: [domain:release-engineering, domain:software-engineering]
 *   specializations: [specialization:release-engineering, specialization:devops-sre-platform]
 *   workflows: [workflow:release-management, workflow:deployment]
 *   roles: [role:release-manager, role:sre, role:platform-engineer]
 *   skillAreas: [skill-area:ci-cd, skill-area:deployment-automation, skill-area:release-versioning]
 * @policyGatedActions production-deploy, stage-promotion, production-rollback
 *
 * ROLLOUT_STAGE_POLICY (reproduced verbatim — the frozen const below is the implementation):
 *   canary:  trafficPercent 5   | bake 30m | entryGate production-deploy | expert release-manager
 *   partial: trafficPercent 50  | bake 60m | entryGate stage-promotion   | expert sre-lead
 *   full:    trafficPercent 100 | bake 60m | entryGate stage-promotion   | expert sre-lead
 *
 * REGRESSION_ROUTING (reproduced verbatim — the frozen const below is the implementation):
 *   SEV1: immediate-rollback (no escalation expert — straight to the production-rollback gate)
 *   SEV2: immediate-rollback (no escalation expert — straight to the production-rollback gate)
 *   SEV3: remediation-choice via sre-lead (roll-forward vs rollback breakpoint first)
 *   SEV4: remediation-choice via sre-lead (roll-forward vs rollback breakpoint first)
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every gate/verification
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown
 * stage, unknown severity, unknown versionHint, and never-raised routing lookups all
 * THROW; the deploy/rollback executors are guarded by gate.approved === true and have no
 * alternate invocation path; the timeline is accumulated in the ORCHESTRATOR only (never
 * inside agents) so the changelog-consistency-critic has ground truth to diff.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Stage model — frozen rollout + regression-routing tables, throwing lookups
// ---------------------------------------------------------------------------

/** Ordered rollout stages. stagesOverride must be a strict prefix-ordered subset. */
export const ROLLOUT_STAGES = Object.freeze(['canary', 'partial', 'full']);

/**
 * Per-stage rollout policy: traffic slice, bake window, and the policy gate that
 * guards entry into the stage. Lookup via stagePolicy(stage) — unknown stages throw;
 * there is deliberately no fallback stage policy.
 */
export const ROLLOUT_STAGE_POLICY = Object.freeze({
  canary: Object.freeze({ trafficPercent: 5, bakeTimeMinutes: 30, entryGate: 'production-deploy', entryExpert: 'release-manager' }),
  partial: Object.freeze({ trafficPercent: 50, bakeTimeMinutes: 60, entryGate: 'stage-promotion', entryExpert: 'sre-lead' }),
  full: Object.freeze({ trafficPercent: 100, bakeTimeMinutes: 60, entryGate: 'stage-promotion', entryExpert: 'sre-lead' }),
});

/** Regression severities — model borrowed from incident-management/incident-lifecycle.js severity routing. */
export const REGRESSION_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);

/**
 * Regression escalation routing. SEV1/SEV2 go straight to the production-rollback
 * gate (escalationExpert is null — looking it up is an orchestrator bug and throws);
 * SEV3/SEV4 first raise a severity-routed remediation-choice breakpoint
 * (roll-forward vs rollback) with sre-lead.
 */
export const REGRESSION_ROUTING = Object.freeze({
  SEV1: Object.freeze({ escalationPath: 'immediate-rollback', escalationExpert: null }),
  SEV2: Object.freeze({ escalationPath: 'immediate-rollback', escalationExpert: null }),
  SEV3: Object.freeze({ escalationPath: 'remediation-choice', escalationExpert: 'sre-lead' }),
  SEV4: Object.freeze({ escalationPath: 'remediation-choice', escalationExpert: 'sre-lead' }),
});

/**
 * Stage-policy lookup. THROWS on unknown stage — there is deliberately no fallback
 * policy (fallbacks are forbidden).
 *
 * @param {string} stage - 'canary'|'partial'|'full'
 * @returns {{ trafficPercent: number, bakeTimeMinutes: number, entryGate: string, entryExpert: string }}
 */
export function stagePolicy(stage) {
  if (!Object.prototype.hasOwnProperty.call(ROLLOUT_STAGE_POLICY, stage)) {
    throw new Error(
      `ROLLOUT_STAGE_POLICY: unknown stage '${stage}'. ` +
      `Known stages: ${ROLLOUT_STAGES.join(', ')} — no fallback policy exists.`
    );
  }
  return ROLLOUT_STAGE_POLICY[stage];
}

/**
 * Regression-routing lookup. THROWS on unknown severity, and — mirroring the
 * incident-lifecycle routingExpert null handling — THROWS when the escalationExpert
 * is requested for an immediate-rollback severity (that request is an orchestrator
 * bug; no fallback expert exists).
 *
 * @param {string} severity - 'SEV1'|'SEV2'|'SEV3'|'SEV4'
 * @param {string} [request] - Pass 'escalationExpert' to resolve the expert route (throws when null)
 * @returns {object|string} The frozen routing row, or the expert when requested
 */
export function regressionRouting(severity, request) {
  if (!Object.prototype.hasOwnProperty.call(REGRESSION_ROUTING, severity)) {
    throw new Error(
      `REGRESSION_ROUTING: unknown severity '${severity}'. ` +
      `Known severities: ${REGRESSION_SEVERITIES.join(', ')} — no fallback route exists.`
    );
  }
  const row = REGRESSION_ROUTING[severity];
  if (request === 'escalationExpert') {
    if (row.escalationExpert === null) {
      throw new Error(
        `REGRESSION_ROUTING: severity '${severity}' routes to immediate-rollback — ` +
        'requesting its escalationExpert is an orchestrator bug (no fallback expert exists).'
      );
    }
    return row.escalationExpert;
  }
  if (request !== undefined) {
    throw new Error(
      `REGRESSION_ROUTING: unknown request '${request}' — only 'escalationExpert' is resolvable.`
    );
  }
  return row;
}

/**
 * Severity assertion. Accepts SEV1..SEV4 or 'none'; anything else THROWS naming the
 * source. No fallback severity is applied.
 *
 * @param {string} value - Candidate severity
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated value
 */
export function assertRegressionSeverity(value, source) {
  if (value === 'none') return value;
  if (!REGRESSION_SEVERITIES.includes(value)) {
    throw new Error(
      `Unknown severity '${value}' from ${source} — expected one of ` +
      `${REGRESSION_SEVERITIES.join('|')}|none. No fallback severity is applied.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// P1 — release cut + versioning
// ---------------------------------------------------------------------------

export const releaseCutTask = defineTask('rel.release-cut', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cut release for ${args.serviceName} from ${args.baseRef}`,
  agent: {
    name: 'release-cutter',
    prompt: {
      role: 'Release cutter',
      task: 'Derive the semver bump from commit history, mint the releaseId, and produce the cut plan',
      context: args,
      instructions: [
        'Derive the semver bump from the commit history since the last tag: breaking => major, feature => minor, fix => patch.',
        'When versionHint is provided, honor it — the orchestrator already validated it against major|minor|patch.',
        `Mint a stable kebab-case releaseId of the form ${args.serviceName}-v<version>.`,
        'Produce the cut plan: tag name, release branch, and artifact coordinates.',
        'Honor priorKnowledge release facts (prior versions, rollback lessons) — cite matches instead of rediscovering them.',
        'DO NOT build or deploy anything — this task cuts and plans only.',
        'Evidence entries must cite the commits/tags grounding the bump decision — at least one entry.',
      ],
      outputFormat: 'JSON with releaseId string, version string, bump string (major|minor|patch), cutPlan object, commitCount number, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['releaseId', 'version', 'bump', 'cutPlan', 'commitCount', 'evidence'],
      properties: {
        releaseId: { type: 'string' },
        version: { type: 'string' },
        bump: { type: 'string', enum: ['major', 'minor', 'patch'] },
        cutPlan: { type: 'object' },
        commitCount: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rel', 'release', 'cut'],
}));

// ---------------------------------------------------------------------------
// P2 — parallel strands: changelog + pre-flight verification
// ---------------------------------------------------------------------------

export const changelogTask = defineTask('rel.changelog', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate changelog for ${args.releaseId}`,
  agent: {
    name: 'changelog-author',
    prompt: {
      role: 'Changelog author',
      task: 'Write the release changelog from the actual commit log since the last tag',
      context: args,
      instructions: [
        `Write the changelog markdown to ${args.changelogPath} and report that exact path back as changelogPath.`,
        'Every entry must map to a real commit/PR ref — a critic will diff the entries against the commit log; no invented entries.',
        'Group entries by category: added / changed / fixed / breaking.',
        'Breaking changes must be flagged explicitly in the changelog AND listed in breakingChanges.',
        'Evidence entries must cite the commit refs behind the changelog — at least one entry.',
      ],
      outputFormat: 'JSON with changelogPath string, entries array of { ref, summary, category } (minItems 1), breakingChanges array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['changelogPath', 'entries', 'breakingChanges', 'evidence'],
      properties: {
        changelogPath: { type: 'string' },
        entries: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['ref', 'summary', 'category'] },
        },
        breakingChanges: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rel', 'release', 'changelog'],
}));

export const preflightVerificationTask = defineTask('rel.preflight-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-flight build + test verification for ${args.releaseId}`,
  agent: {
    name: 'preflight-verifier',
    prompt: {
      role: 'Pre-flight verifier',
      task: 'Actually BUILD the release artifact and RUN the test suite — executed evidence only',
      context: args,
      instructions: [
        'Actually BUILD the artifact from the cut plan and RUN the full test suite — report the raw command outputs as evidence.',
        'built:true requires a fresh successful build in THIS task, not a cached claim.',
        'Report the built artifact coordinates as artifactRef (null only when the build failed).',
        `Write a verification report markdown to ${args.verificationReportPath} and report that exact path back as verificationReportPath.`,
        'Never fabricate outputs; a failed build or failed tests are reported honestly with built:false / testsPassed:false.',
        'Evidence entries must be the raw build/test command outputs — executed evidence; at least one entry.',
      ],
      outputFormat: 'JSON with built boolean, artifactRef string|null, testsPassed boolean, testSummary object, verificationReportPath string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['built', 'artifactRef', 'testsPassed', 'testSummary', 'verificationReportPath', 'evidence'],
      properties: {
        built: { type: 'boolean' },
        artifactRef: { type: ['string', 'null'] },
        testsPassed: { type: 'boolean' },
        testSummary: { type: 'object' },
        verificationReportPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rel', 'release', 'preflight', 'verification'],
}));

// ---------------------------------------------------------------------------
// P4 — staged rollout: gated deploy + per-stage verification
// ---------------------------------------------------------------------------

export const deployStageTask = defineTask('rel.deploy-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy ${args.releaseId} to ${args.stage} (${args.trafficPercent}%)`,
  agent: {
    name: 'stage-deployer',
    prompt: {
      role: 'Stage deployer',
      task: 'Deploy EXACTLY the approved artifact at the approved traffic slice — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER its entry gate (production-deploy or stage-promotion) approved this exact stage in context.',
        'Deploy exactly the approved artifactRef at the approved trafficPercent — nothing more, no extra changes.',
        'Log every action with an ISO timestamp and its outcome — these entries feed the orchestrator timeline.',
        'If a step fails, stop and report deployed:false honestly — the orchestrator routes to regression triage; you do not improvise a rollback.',
        'Evidence entries must be the raw deploy command/console outputs — at least one entry.',
      ],
      outputFormat: 'JSON with deployed boolean, stage string, deployRef string, actions array of { action, timestamp, outcome }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['deployed', 'stage', 'deployRef', 'actions', 'evidence'],
      properties: {
        deployed: { type: 'boolean' },
        stage: { type: 'string' },
        deployRef: { type: 'string' },
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
  labels: ['agent', 'rel', 'release', 'deploy', 'policy-gated'],
}));

export const stageVerificationTask = defineTask('rel.stage-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.stage} stage of ${args.releaseId} (bake ${args.bakeTimeMinutes}m)`,
  agent: {
    name: 'stage-verifier',
    prompt: {
      role: 'Stage verifier',
      task: 'EXECUTE every smoke probe against the stage deployment across the bake window',
      context: args,
      instructions: [
        'EXECUTE every provided smokeProbe against the stage deployment and watch error/latency signals across the bake window.',
        'Every probesRun entry is a probe you actually executed, with its pass/fail and detail.',
        'healthy:true requires all probes passing across the window — anything less is healthy:false with a regressionSignals summary.',
        args.stage === 'full'
          ? `This is the 'full' stage: also write the post-release report markdown to ${args.postReleaseReportPath} and report that exact path back as reportPath.`
          : 'reportPath is only required for the full stage; omit it here.',
        'Evidence entries must be executed probe outputs — a claim without a run is not evidence; at least one entry.',
      ],
      outputFormat: 'JSON with healthy boolean, stage string, probesRun array of { name, passed, detail } (minItems 1), regressionSignals array, reportPath string (required for the full stage), evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['healthy', 'stage', 'probesRun', 'regressionSignals', 'evidence'],
      properties: {
        healthy: { type: 'boolean' },
        stage: { type: 'string' },
        probesRun: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'passed', 'detail'] },
        },
        regressionSignals: { type: 'array' },
        reportPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rel', 'release', 'verification'],
}));

// ---------------------------------------------------------------------------
// P6 — regression path: triage + gated rollback
// ---------------------------------------------------------------------------

export const regressionTriageTask = defineTask('rel.regression-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage release regression at ${args.stage} for ${args.releaseId}`,
  agent: {
    name: 'regression-triager',
    prompt: {
      role: 'Regression triager',
      task: 'Classify the regression severity and recommend rollback or roll-forward',
      context: args,
      instructions: [
        'Classify severity with the incident-style matrix:',
        'SEV1: user-facing outage or data loss/corruption risk.',
        'SEV2: significant ongoing degradation.',
        'SEV3: partial/limited impact.',
        'SEV4: internal-only, no user impact.',
        'Ground the classification in the failing probes and regression signals in context.',
        'Cross-reference priorKnowledge rollback lessons and cite matches.',
        'Recommend rollback or roll-forward with a rationale — this is a RECOMMENDATION only; execution is gate-controlled.',
        'Evidence entries must cite the failing probes/signals behind the classification — at least one entry.',
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
  labels: ['agent', 'rel', 'release', 'regression', 'triage'],
}));

export const executeRollbackTask = defineTask('rel.execute-rollback', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved rollback of ${args.releaseId} (${args.severity})`,
  agent: {
    name: 'rollback-executor',
    prompt: {
      role: 'Rollback executor',
      task: 'Restore EXACTLY the previous released version — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the production-rollback policy gate approved the rollback in context.',
        'Restore exactly the previous released version/deployRef given as the restore target — no improvised extras.',
        'Log every action with an ISO timestamp and its outcome.',
        'If a step fails, stop and report rolledBack:false honestly.',
        'Evidence entries are the raw command outputs of the executed rollback — at least one entry.',
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
  labels: ['agent', 'rel', 'release', 'rollback', 'policy-gated'],
}));

export const rollbackVerificationTask = defineTask('rel.rollback-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify rollback of ${args.releaseId}`,
  agent: {
    name: 'rollback-verifier',
    prompt: {
      role: 'Rollback verifier',
      task: 'Prove the restored version is serving traffic and the regression symptom is gone',
      context: args,
      instructions: [
        'EXECUTE the smokeProbes against production and prove the restored version is serving (version endpoint / deploy marker).',
        'Confirm the original regression symptom is gone — re-check the probes/signals that failed.',
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
  labels: ['agent', 'rel', 'release', 'rollback', 'verification'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    release,
    smokeProbes,
    stagesOverride = null,
    rollbackPolicy = {},
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -------------------------------------------------------------------------
  // Input validation — no fallbacks: unknown/missing values throw.
  // -------------------------------------------------------------------------
  if (!release || !release.serviceName || !release.baseRef) {
    throw new Error(
      'release-lifecycle requires release { serviceName, baseRef } — refusing to guess missing fields.'
    );
  }
  const serviceName = release.serviceName;
  const baseRef = release.baseRef;
  const repoRoot = release.repoRoot ?? '.';
  const versionHint = release.versionHint ?? null;
  if (versionHint !== null && !['major', 'minor', 'patch'].includes(versionHint)) {
    throw new Error(
      `release.versionHint '${versionHint}' is unknown — expected major|minor|patch|null. ` +
      'No fallback bump is applied.'
    );
  }
  if (!Array.isArray(smokeProbes) || smokeProbes.length === 0) {
    throw new Error(
      'release-lifecycle requires a non-empty smokeProbes array — a release with no smoke ' +
      'definition is unverifiable; no default probes are synthesized.'
    );
  }
  for (const probe of smokeProbes) {
    if (!probe || !probe.name || !probe.expectation) {
      throw new Error(
        `smokeProbes entries require { name, expectation } (got ${JSON.stringify(probe)}) — ` +
        'no fallback probe definition exists.'
      );
    }
  }
  let stages = ROLLOUT_STAGES;
  if (stagesOverride !== null) {
    if (!Array.isArray(stagesOverride) || stagesOverride.length === 0) {
      throw new Error(
        'stagesOverride must be a non-empty string[] (a strict prefix-ordered subset of ' +
        `${ROLLOUT_STAGES.join(' -> ')}) or null — no fallback stage plan exists.`
      );
    }
    stagesOverride.forEach((stage, index) => {
      if (!ROLLOUT_STAGES.includes(stage)) {
        throw new Error(
          `stagesOverride: unknown stage '${stage}'. Known stages: ${ROLLOUT_STAGES.join(', ')} — ` +
          'no fallback stage plan exists.'
        );
      }
      if (ROLLOUT_STAGES[index] !== stage) {
        throw new Error(
          `stagesOverride must be a strict prefix-ordered subset of ${ROLLOUT_STAGES.join(' -> ')} ` +
          `(position ${index} is '${stage}', expected '${ROLLOUT_STAGES[index]}').`
        );
      }
    });
    stages = stagesOverride;
  }
  const maxRollbackAttempts = rollbackPolicy.maxRollbackAttempts ?? 1;

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();

  // Timeline is accumulated HERE, in the orchestrator — agents never write it. The
  // changelog-consistency-critic uses it as ground truth for what actually shipped.
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
  let releaseId = null;
  let version = null;
  let releaseCut = null;
  let changelogOut = { path: null, entries: 0 };
  let preflight = null;
  let readinessGate = null;
  let postReleaseGate = null;
  const stageRecords = [];
  const regression = { detected: false, severity: null, escalationRaised: false, rollback: null };
  let regressionTriage = null;
  let kipFactsAsserted = 0;
  const artifacts = [];

  const buildResult = (success, reason) => ({
    success,
    releaseId,
    version,
    changelog: changelogOut,
    preflight: preflight
      ? { built: preflight.built === true, artifactRef: preflight.artifactRef, testsPassed: preflight.testsPassed === true }
      : null,
    readinessGate,
    stages: stageRecords,
    postReleaseGate,
    regression,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'release-engineering/release-lifecycle',
      runId: ctx.runId,
      timeline,
      breakpointsHit,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall of prior release memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior release memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: `release signature: ${serviceName}@${baseRef}`,
      kipModel,
      kind: 'release-engineering',
    });
    timeline.push({ at: nowIso(), event: 'kip-recall', detail: `factCount=${priorKnowledge.factCount}` });
  }

  // -------------------------------------------------------------------------
  // P1 — release cut + versioning (versionHint already validated above)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: release cut + versioning');
  releaseCut = await ctx.task(releaseCutTask, {
    serviceName,
    baseRef,
    repoRoot,
    versionHint,
    priorKnowledge,
  });
  releaseId = releaseCut.releaseId;
  version = releaseCut.version;
  timeline.push({ at: nowIso(), event: 'release-cut', detail: `${releaseId} v${version} (${releaseCut.bump}, ${releaseCut.commitCount} commits)` });

  // -------------------------------------------------------------------------
  // P2 — parallel changelog + pre-flight verification (independent strands)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: parallel changelog + pre-flight verification');
  const [changelog, preflightResult] = await ctx.parallel.all([
    () => ctx.task(changelogTask, {
      releaseId,
      serviceName,
      baseRef,
      repoRoot,
      cutPlan: releaseCut.cutPlan,
      changelogPath: `${artifactsRoot}/changelog-${releaseId}.md`,
    }),
    () => ctx.task(preflightVerificationTask, {
      releaseId,
      serviceName,
      baseRef,
      repoRoot,
      cutPlan: releaseCut.cutPlan,
      verificationReportPath: `${artifactsRoot}/preflight-${releaseId}.md`,
    }),
  ]);
  preflight = preflightResult;
  changelogOut = { path: changelog.changelogPath, entries: changelog.entries.length };
  artifacts.push(changelog.changelogPath);
  artifacts.push(preflight.verificationReportPath);
  timeline.push({ at: nowIso(), event: 'changelog', detail: `${changelog.entries.length} entries -> ${changelog.changelogPath}` });
  timeline.push({ at: nowIso(), event: 'preflight', detail: `built=${preflight.built} testsPassed=${preflight.testsPassed} artifactRef=${preflight.artifactRef}` });

  // -------------------------------------------------------------------------
  // P3 — adversarial release-readiness gate (executes the built artifact)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: adversarial release-readiness gate');
  const readinessResult = await adversarialGate(ctx, {
    gateId: 'rel.release-readiness',
    artifact: {
      path: preflight.verificationReportPath,
      description: 'Pre-flight verification report + built artifact',
    },
    critics: [
      {
        name: 'artifact-execution-critic',
        role: 'Release artifact prosecutor',
        focus: 'EXECUTE the built artifact yourself (start/run it via artifactRef) and run every smokeProbe against it; cite raw execution outputs per probe — a build-log citation without a fresh execution in THIS review is not evidence',
      },
      {
        name: 'changelog-accuracy-critic',
        role: 'Changelog auditor',
        focus: 'diff every changelog entry against the actual commit log since the last tag — EXECUTE the comparison; cite each verified/missing/invented entry; breaking changes must be flagged in the changelog',
      },
      {
        name: 'version-policy-critic',
        role: 'Versioning auditor',
        focus: 'the semver bump matches the commit contents (breaking=>major, feature=>minor, fix=>patch), the tag/branch plan is consistent, and the version does not collide with an existing tag — cite the commits and tag list checked',
      },
    ],
    ironLaw: [
      'Executed evidence only: run the artifact and the probes yourself — reading the preflight report is not evidence.',
      'You must EXECUTE the built artifact (run it / start it) and run the smokeProbes against it — a build log citation without a fresh execution is not evidence.',
      'Cite file:line or raw executed-check output for every claim; passed:true with empty evidence is rejected by the combinator.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { releaseCut, changelog, preflight, smokeProbes, priorKnowledge },
  });
  readinessGate = {
    passed: readinessResult.passed,
    attempts: readinessResult.attempts,
    escalated: readinessResult.escalated,
    issues: readinessResult.issues,
  };
  if (readinessResult.escalated) {
    breakpointsHit.push('rel.release-readiness.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'readiness-gate', detail: `passed=${readinessResult.passed} attempts=${readinessResult.attempts} escalated=${readinessResult.escalated}` });
  if (readinessResult.passed !== true) {
    // Fail closed: the production-deploy gate is NEVER raised on a failed readiness gate.
    return buildResult(false, 'release-readiness gate failed — production-deploy gate never raised');
  }

  // -------------------------------------------------------------------------
  // P7 helper — kip assert at close. Facts are built DETERMINISTICALLY here in the
  // orchestrator (never inside an agent) and are unconditionally non-empty when
  // reached: the has-version and outcome facts always exist, which makes the
  // kipAssert empty-facts throw unreachable by construction.
  // -------------------------------------------------------------------------
  const closeWithKip = async (success, reason) => {
    if (kipEnabled) {
      const subject = `release:${releaseId}`;
      const facts = [
        { subject, predicate: 'has-version', object: version },
        {
          subject,
          predicate: 'outcome',
          object: success ? 'released' : 'failed',
          props: {
            stagesCompleted: stageRecords.filter((s) => s.verified === true).length,
            readinessGatePassed: readinessGate ? readinessGate.passed === true : false,
            postReleaseGatePassed: postReleaseGate ? postReleaseGate.passed === true : false,
          },
        },
      ];
      for (const record of stageRecords) {
        if (record.verified === true) {
          facts.push({
            subject,
            predicate: 'reached-stage',
            object: record.stage,
            props: { trafficPercent: stagePolicy(record.stage).trafficPercent },
          });
        }
      }
      if (regression.rollback && regression.rollback.executed === true) {
        facts.push({
          subject,
          predicate: 'rollback-lesson',
          object: regressionTriage.summary,
          props: { severity: regression.severity, rollbackVerified: regression.rollback.verified === true },
        });
      }
      if (readinessGate && Array.isArray(readinessGate.issues) && readinessGate.issues.length > 0) {
        const first = readinessGate.issues[0];
        facts.push({
          subject,
          predicate: 'readiness-lesson',
          object: `${first.critic}: ${first.description}`,
        });
      }
      const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'release-engineering', facts });
      kipFactsAsserted = asserted.asserted;
      timeline.push({ at: nowIso(), event: 'kip-assert', detail: `${kipFactsAsserted} facts` });
    }
    return buildResult(success, reason);
  };

  // -------------------------------------------------------------------------
  // P6 — regression path: severity-routed escalation + gated rollback. Entered
  // ONLY when a stage verification or the post-release gate fails.
  // Returns { terminal: 'reject'|'roll-forward'|'done', reason }.
  // -------------------------------------------------------------------------
  const runRegressionPath = async (failedStage, source, failingVerification, restoreTargetRef) => {
    ctx.log?.('info', `P6: regression path (${source} at ${failedStage})`);
    regression.detected = true;
    regressionTriage = await ctx.task(regressionTriageTask, {
      releaseId,
      stage: failedStage,
      source,
      failingVerification,
      smokeProbes,
      priorKnowledge,
    });
    const severity = assertRegressionSeverity(regressionTriage.severity, 'rel.regression-triage');
    regression.severity = severity;
    const sevTag = severity.toLowerCase();
    timeline.push({ at: nowIso(), event: 'regression-triaged', detail: `${severity}: ${regressionTriage.summary} (recommend ${regressionTriage.recommendation})` });

    const routing = regressionRouting(severity);
    if (routing.escalationPath === 'remediation-choice') {
      // SEV3/SEV4: the roll-forward vs rollback call is genuinely ambiguous — the
      // single non-policy breakpoint in this process (sparse-breakpoint rule).
      regression.escalationRaised = true;
      const choice = await routedBreakpoint(ctx, {
        question: `${severity} regression at ${failedStage} of ${releaseId}: roll forward or roll back? Reply 'roll-forward' to accept the regression and fix forward; anything else proceeds to the production-rollback gate.`,
        triage: {
          severity: regressionTriage.severity,
          summary: regressionTriage.summary,
          recommendation: regressionTriage.recommendation,
          rationale: regressionTriage.rationale,
        },
        failingProbes: failingVerification.probesRun,
        regressionSignals: failingVerification.regressionSignals,
      }, {
        breakpointId: 'rel.regression.remediation-choice',
        expert: regressionRouting(severity, 'escalationExpert'),
        tags: ['release-engineering', 'regression', sevTag],
        strategy: 'single',
      });
      recordGate('rel.regression.remediation-choice', 'P6', choice);
      const response = String(choice.response ?? '').trim().toLowerCase();
      if (response === 'roll-forward') {
        timeline.push({ at: nowIso(), event: 'remediation-choice', detail: 'roll-forward chosen — no rollback gate raised' });
        return { terminal: 'roll-forward', reason: `roll-forward chosen — regression accepted at ${failedStage}` };
      }
      timeline.push({ at: nowIso(), event: 'remediation-choice', detail: 'rollback path chosen — proceeding to the production-rollback gate' });
    }

    // Policy gate: production-rollback.
    // Deliberately NO autoApproveAfterN — a production rollback must never
    // auto-approve; do not add it.
    regression.rollback = { gated: true, approved: false, executed: false, verified: false };
    const rollbackGate = await routedBreakpoint(ctx, {
      question: `Approve rollback of ${releaseId} (${severity} regression at ${failedStage})?`,
      triage: {
        severity: regressionTriage.severity,
        summary: regressionTriage.summary,
        recommendation: regressionTriage.recommendation,
      },
      failingProbes: failingVerification.probesRun,
      restoreTargetRef,
    }, {
      breakpointId: 'production-rollback',
      expert: 'release-manager',
      tags: ['policy-gated', 'release-engineering', sevTag],
      strategy: 'single',
    });
    recordGate('production-rollback', 'P6', rollbackGate);
    if (rollbackGate.approved !== true) {
      // Fail closed: the rollback executor is NEVER invoked un-gated — there is no
      // alternate invocation path.
      timeline.push({ at: nowIso(), event: 'rollback-gate', detail: 'rejected — release left at current stage' });
      return { terminal: 'reject', reason: 'production-rollback gate rejected — release left at current stage, state surfaced' };
    }
    regression.rollback.approved = true;
    timeline.push({ at: nowIso(), event: 'rollback-gate', detail: 'approved' });

    let rollbackVerify = null;
    for (let attempt = 1; attempt <= maxRollbackAttempts; attempt++) {
      // executeRollbackTask is invoked ONLY here, inside rollbackGate.approved === true —
      // no other call site exists.
      const rollbackExec = await ctx.task(executeRollbackTask, {
        releaseId,
        severity,
        stage: failedStage,
        restoreTargetRef,
        triage: regressionTriage,
        attempt,
      });
      for (const act of rollbackExec.actions) {
        timeline.push({ at: act.timestamp, event: 'rollback-action', detail: `${act.action} -> ${act.outcome}` });
      }
      regression.rollback.executed = rollbackExec.rolledBack === true;
      rollbackVerify = await ctx.task(rollbackVerificationTask, {
        releaseId,
        severity,
        restoredRef: rollbackExec.restoredRef,
        smokeProbes,
        originalSymptom: regressionTriage.summary,
        attempt,
      });
      regression.rollback.verified = rollbackVerify.verified === true;
      timeline.push({ at: nowIso(), event: 'rollback-verified', detail: `verified=${rollbackVerify.verified} (attempt ${attempt})` });
      if (rollbackVerify.verified === true) break;
    }
    return {
      terminal: 'done',
      reason: `regression at ${failedStage} (${severity}) — rollback ${regression.rollback.executed ? 'executed' : 'failed'}, verified=${regression.rollback.verified}`,
    };
  };

  // -------------------------------------------------------------------------
  // P4 — staged rollout canary -> partial -> full with entry gates
  // -------------------------------------------------------------------------
  let previousVerification = null;
  let postReleaseReportPath = null;
  let regressionOutcome = null;

  for (const stage of stages) {
    const policy = stagePolicy(stage);
    ctx.log?.('info', `P4: ${policy.entryGate} gate for ${stage} stage`);
    const stageRecord = { stage, gate: policy.entryGate, approved: false, deployed: false, verified: false };
    stageRecords.push(stageRecord);

    // Deliberately NO autoApproveAfterN — the production-deploy and stage-promotion
    // gates must never auto-approve; do not add it.
    const entryGate = await routedBreakpoint(ctx, {
      question: policy.entryGate === 'production-deploy'
        ? `Approve the FIRST production deploy of ${releaseId} v${version} to ${stage} (${policy.trafficPercent}%, ${policy.bakeTimeMinutes}m bake)?`
        : `Promote ${releaseId} v${version} to ${stage} (${policy.trafficPercent}%, ${policy.bakeTimeMinutes}m bake)?`,
      version,
      releaseId,
      stage,
      trafficPercent: policy.trafficPercent,
      bakeTimeMinutes: policy.bakeTimeMinutes,
      cutPlan: releaseCut.cutPlan,
      readinessGateEvidence: readinessResult.evidence,
      previousStageVerification: previousVerification
        ? {
            stage: previousVerification.stage,
            probesRun: previousVerification.probesRun,
            regressionSignals: previousVerification.regressionSignals,
            evidence: previousVerification.evidence,
          }
        : null,
    }, {
      breakpointId: policy.entryGate,
      expert: policy.entryExpert,
      tags: policy.entryGate === 'production-deploy'
        ? ['policy-gated', 'release-engineering']
        : ['policy-gated', 'release-engineering', stage],
      strategy: 'single',
    });
    recordGate(policy.entryGate, 'P4', entryGate);

    if (entryGate.approved !== true) {
      timeline.push({ at: nowIso(), event: `${policy.entryGate}-rejected`, detail: `rollout halted at ${stage}` });
      if (policy.entryGate === 'production-deploy') {
        // Fail closed: nothing was deployed and there is no alternate deploy path.
        return buildResult(false, 'production-deploy gate rejected — nothing deployed');
      }
      // Stage-promotion rejection halts at the current stage. The release is NOT
      // auto-rolled-back — rollback has its own gate.
      return buildResult(
        false,
        `stage-promotion gate rejected at ${stage} — rollout halted, release NOT auto-rolled-back (rollback has its own gate)`
      );
    }
    stageRecord.approved = true;
    timeline.push({ at: nowIso(), event: `${policy.entryGate}-approved`, detail: `${stage} @ ${policy.trafficPercent}%` });

    // deployStageTask is invoked ONLY here, inside entryGate.approved === true —
    // no other call site exists.
    const deploy = await ctx.task(deployStageTask, {
      releaseId,
      version,
      stage,
      trafficPercent: policy.trafficPercent,
      artifactRef: preflight.artifactRef,
      cutPlan: releaseCut.cutPlan,
    });
    for (const act of deploy.actions) {
      timeline.push({ at: act.timestamp, event: 'deploy-action', detail: `${stage}: ${act.action} -> ${act.outcome}` });
    }
    stageRecord.deployed = deploy.deployed === true;
    stageRecord.deployRef = deploy.deployRef;
    timeline.push({ at: nowIso(), event: 'deployed', detail: `${stage}: deployed=${deploy.deployed} ref=${deploy.deployRef}` });

    if (deploy.deployed !== true) {
      // Deploy failure routes into the regression path — the deployer never
      // improvises a rollback.
      regressionOutcome = await runRegressionPath(stage, 'deploy-failure', {
        stage,
        probesRun: [],
        regressionSignals: [{ signal: 'deploy-failed', detail: `deploy of ${stage} reported deployed:false` }],
        evidence: deploy.evidence,
      }, baseRef);
      break;
    }

    const verification = await ctx.task(stageVerificationTask, {
      releaseId,
      version,
      stage,
      bakeTimeMinutes: policy.bakeTimeMinutes,
      deployRef: deploy.deployRef,
      smokeProbes,
      postReleaseReportPath: stage === 'full' ? `${artifactsRoot}/post-release-${releaseId}.md` : null,
    });
    stageRecord.verified = verification.healthy === true;
    stageRecord.probesRun = verification.probesRun;
    timeline.push({ at: nowIso(), event: 'stage-verified', detail: `${stage}: healthy=${verification.healthy} probes=${verification.probesRun.length}` });

    if (verification.healthy !== true) {
      // Verification failure jumps to the regression path — no next promotion is
      // ever raised.
      regressionOutcome = await runRegressionPath(stage, 'stage-verification', verification, baseRef);
      break;
    }

    if (stage === 'full') {
      if (!verification.reportPath) {
        // A missing report path is an error, never synthesized — the post-release
        // gate has no artifact without it.
        throw new Error(
          "stage verification for 'full' did not report reportPath — the post-release gate " +
          'artifact is missing; refusing to synthesize one.'
        );
      }
      postReleaseReportPath = verification.reportPath;
      artifacts.push(postReleaseReportPath);
    }
    previousVerification = verification;
  }

  // -------------------------------------------------------------------------
  // P5 — adversarial post-release gate (only after full-stage verification passed)
  // -------------------------------------------------------------------------
  if (!regressionOutcome && postReleaseReportPath) {
    ctx.log?.('info', 'P5: adversarial post-release gate');
    const postReleaseResult = await adversarialGate(ctx, {
      gateId: 'rel.post-release',
      artifact: {
        path: postReleaseReportPath,
        description: 'Post-release verification report',
      },
      critics: [
        {
          name: 'smoke-execution-critic',
          role: 'Production smoke prosecutor',
          focus: 're-EXECUTE the smokeProbes against production yourself and confirm the deployed version marker matches the release — raw outputs cited per probe',
        },
        {
          name: 'regression-signal-critic',
          role: 'Regression-signal auditor',
          focus: 'error/latency signals across the full-stage bake window show no regression vs the pre-release baseline; every claim in the report is backed by a query/output you re-ran or verified',
        },
        {
          name: 'changelog-consistency-critic',
          role: 'Release-record auditor',
          focus: 'what actually shipped (deployRefs, stages, version) matches the changelog and cut plan — diff report vs orchestrator timeline in context; cite mismatches',
        },
      ],
      ironLaw: [
        'Executed evidence only — re-run the smokeProbes against production yourself and cite raw outputs; a skim of the report is not evidence.',
        'passed:true with empty evidence is rejected by the combinator.',
      ],
      maxFixAttempts,
      fixer: {},
      context: {
        releaseCut,
        changelog,
        smokeProbes,
        timeline,
        stages: stageRecords,
        priorKnowledge,
      },
    });
    postReleaseGate = {
      passed: postReleaseResult.passed,
      attempts: postReleaseResult.attempts,
      escalated: postReleaseResult.escalated,
      issues: postReleaseResult.issues,
    };
    if (postReleaseResult.escalated) {
      breakpointsHit.push('rel.post-release.gate-escalation');
    }
    timeline.push({ at: nowIso(), event: 'post-release-gate', detail: `passed=${postReleaseResult.passed} attempts=${postReleaseResult.attempts} escalated=${postReleaseResult.escalated}` });

    if (postReleaseResult.passed !== true) {
      // A failed post-release gate routes into the regression path instead of
      // ending silently.
      const fullVerification = previousVerification ?? { stage: 'full', probesRun: [], regressionSignals: [], evidence: [] };
      regressionOutcome = await runRegressionPath('full', 'post-release-gate', {
        stage: 'full',
        probesRun: fullVerification.probesRun,
        regressionSignals: postReleaseResult.issues.map((issue) => ({ signal: 'post-release-gate-issue', detail: `${issue.critic}: ${issue.description}` })),
        evidence: fullVerification.evidence,
      }, baseRef);
    }
  }

  // -------------------------------------------------------------------------
  // Terminal routing + P7 — kip assert at close
  // -------------------------------------------------------------------------
  if (regressionOutcome) {
    if (regressionOutcome.terminal === 'roll-forward' || regressionOutcome.terminal === 'reject') {
      return buildResult(false, regressionOutcome.reason);
    }
    ctx.log?.('info', 'P7: kip assert at close (regression path)');
    return closeWithKip(false, regressionOutcome.reason);
  }

  ctx.log?.('info', 'P7: kip assert at close');
  const success = postReleaseGate !== null && postReleaseGate.passed === true;
  return closeWithKip(success, success ? undefined : 'run ended without a passed post-release gate');
}
