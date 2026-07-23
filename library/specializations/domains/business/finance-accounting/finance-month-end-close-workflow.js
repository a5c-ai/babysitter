/**
 * @process finance-accounting/finance-month-end-close-workflow
 * @description Month-end close end-to-end: kip recall of prior-period close issues, close-checklist
 *   kickoff with TB validation, parallel account-group reconciliations (ctx.parallel) merged into a
 *   materiality-classified variance register, AP/accrual review + adjusting-journal drafting,
 *   adversarial close-review gate that RE-EXECUTES reconciliation math and traces material JEs to
 *   support (executed evidence), controller-gated payment release and journal posting,
 *   materiality-routed close sign-off (controller routine / CFO material via frozen throwing map),
 *   reporting package + close memo, kip assert of exceptions and close facts.
 *   Supersedes financial-statement-preparation.js.
 * @supersedes library/specializations/domains/business/finance-accounting/financial-statement-preparation.js — retire after one green run
 * @inputs {
 *   closePeriod: string,               // required, e.g. '2026-06'
 *   trialBalancePath: string,          // required — adjusted TB artifact under close
 *   materialityThreshold: number,      // required, > 0; classification boundary for variances and JEs (throw otherwise — no default materiality)
 *   accountGroups?: string[],          // override; default derived from kickoff checklist (must be non-empty or throw)
 *   accountingFramework?: string,      // 'GAAP' | 'IFRS' (default 'GAAP')
 *   apPaymentProposalRequested?: boolean, // default true; false skips the payment-release phase entirely (recorded, not defaulted around)
 *   entityName?: string,
 *   priorPeriodClosePath?: string,     // prior close binder for rollforward ties
 *   subledgerSources?: object,         // { accountGroup: sourcePath } map fed to reconciliations
 *   maxFixAttempts?: number,           // close-review fixer budget (default 2)
 *   maxParallel?: number,              // ctx.parallel.map concurrency (default 4)
 *   kipEnabled?: boolean,              // (default true)
 *   kipDir?: string,                   // (default '.a5c/kip')
 *   kipModel?: string                  // (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,                  // sign-off approved AND gate passed-or-owner-accepted
 *   checklist: object,                 // { checklistPath, accountGroups, tbHealth }
 *   reconciliation: object,            // { groups: [{ group, reconPath, variances, status }], varianceRegisterPath, materialVariances, unresolvedCount, deepDiveRefs }
 *   gateResults: object,               // { closeReview: { passed, attempts, escalated, issues, evidence } }
 *   payments: object,                  // { proposed, approved, released, failures } (all zero/false when apPaymentProposalRequested=false)
 *   journals: object,                  // { drafted, approvedForPosting, posted, failures }
 *   signoff: object,                   // { tier: 'routine'|'material', expert, approved, attempts, materialityBasis }
 *   policyDecisions: array,            // [{ actionId, approved, response, autoApproved }] for payment-release, journal-posting, close-signoff
 *   reportingPackage: object,          // { packagePath, closeMemoPath }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object                   // { processId, runId, closePeriod, breakpointsHit, timings }
 * }
 * @policyGatedActions payment-release (controller), journal-posting (controller), close-signoff (controller routine / cfo material — materiality-routed) — each via routedBreakpoint with breakpointId = actionId, tags ['policy-gated','finance'], executors guarded by approved===true
 * @example
 *   await orchestrate('finance-accounting/finance-month-end-close-workflow', {
 *     closePeriod: '2026-06',
 *     trialBalancePath: 'close/2026-06/tb.json',
 *     materialityThreshold: 50000,
 *   })
 * @graph
 *   domains: [domain:finance]
 *   specializations: [specialization:corporate-finance]
 *   skillAreas: [skill-area:financial-modeling, skill-area:budgeting-forecasting]
 *   workflows: [workflow:financial-planning]
 *   roles: [role:financial-analyst, role:controller, role:cfo]
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineTask } from '@a5c-ai/babysitter-sdk';

import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

// Deterministic kebab-case for artifact filenames — pure string mechanics, no model involved.
function kebab(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Frozen threshold-tier -> sign-off expert map. Lookup is throwing — there is
// no default expert for an unknown tier (fallbacks forbidden).
export const SIGNOFF_ROUTING = Object.freeze({
  routine: 'controller',
  material: 'cfo',
});

// Frozen map of account groups / close stages to sibling finance-accounting
// deep-dive process files BY NAME (process-id references, not ESM imports of
// the 24 modules — keeps module load light and avoids import cycles).
export const DEEP_DIVE_PROCESSES = Object.freeze({
  'audit-handoff': 'external-audit-coordination.js',
  'cash-liquidity': 'cash-flow-forecasting-liquidity.js',
  'checklist-baseline': 'month-end-close-process.js',
  'debt': 'debt-facility-covenant-compliance.js',
  'flux-analysis': 'variance-analysis-reporting.js',
  'fraud-escalation': 'fraud-risk-assessment-investigation.js',
  'fx': 'foreign-exchange-risk-management.js',
  'income-tax': 'income-tax-provision-asc740.js',
  'intercompany': 'intercompany-accounting-consolidation.js',
  'leases': 'lease-accounting-asc842.js',
  'revenue': 'revenue-recognition-asc606.js',
  'sox-controls': 'sox-compliance-testing.js',
  'tax-filing': 'tax-return-preparation.js',
  'transfer-pricing': 'transfer-pricing-documentation.js',
});

// Throwing lookup into the frozen deep-dive map — an unknown group key is a
// caller/kickoff bug, never silently tolerated.
export function deepDiveFor(group) {
  const processFile = DEEP_DIVE_PROCESSES[group];
  if (!processFile) {
    throw new Error(
      `finance-month-end-close-workflow: unknown account group ${JSON.stringify(group)} — ` +
      `no deep-dive process registered (known groups: ${Object.keys(DEEP_DIVE_PROCESSES).join(', ')})`
    );
  }
  return processFile;
}

// Validates at kickoff that every deep-dive sibling file referenced by the
// frozen map exists next to this module. A missing reference throws — no fallback.
export function validateDeepDiveSiblings() {
  for (const [group, processFile] of Object.entries(DEEP_DIVE_PROCESSES)) {
    const siblingPath = join(MODULE_DIR, processFile);
    if (!existsSync(siblingPath)) {
      throw new Error(
        `finance-month-end-close-workflow: deep-dive process file for group '${group}' is missing: ${siblingPath}`
      );
    }
  }
}

// Pure deterministic sign-off tier classifier — PROCESS CODE, not an agent.
// tier='material' iff the close-review gate escalated OR any material variance
// exists OR the summed |material JE amounts| reach the materiality threshold OR
// any reconciliation item is unresolved; else 'routine'. Returns the reasons as
// materialityBasis so the routing is auditable.
export function signoffTier(gate, materialVariances, journalEntries, materialityThreshold, unresolvedCount) {
  const materialityBasis = [];
  if (gate && gate.escalated === true) {
    materialityBasis.push('close-review gate escalated to the owner');
  }
  if (Array.isArray(materialVariances) && materialVariances.length > 0) {
    materialityBasis.push(`${materialVariances.length} material variance(s) on the register`);
  }
  const materialJeTotal = (Array.isArray(journalEntries) ? journalEntries : [])
    .filter((je) => je.material === true)
    .reduce((sum, je) => sum + Math.abs(Number(je.debit) - Number(je.credit) || Number(je.debit) || 0), 0);
  if (materialJeTotal >= materialityThreshold) {
    materialityBasis.push(`sum of |material JE amounts| (${materialJeTotal}) >= materiality threshold (${materialityThreshold})`);
  }
  if (Number(unresolvedCount) > 0) {
    materialityBasis.push(`${unresolvedCount} unresolved reconciliation item(s)`);
  }
  return {
    tier: materialityBasis.length > 0 ? 'material' : 'routine',
    materialityBasis,
  };
}

// ---------------------------------------------------------------------------
// Phase 1 — close checklist kickoff
// ---------------------------------------------------------------------------

export const closeChecklistKickoffTask = defineTask('fmc.close-checklist-kickoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Close checklist kickoff for ${args.closePeriod}`,
  agent: {
    name: 'close-manager',
    prompt: {
      role: 'Close manager kicking off the month-end close',
      task: `Build the close calendar/checklist for ${args.closePeriod}, validate the trial balance, and inventory the account groups`,
      context: args,
      instructions: [
        `Build the close calendar/checklist artifact for ${args.closePeriod} under ${args.artifactsDir} and return its path as checklistPath.`,
        `Validate the trial balance at ${args.trialBalancePath}: debits=credits, unusual/negative balances, classification sanity.`,
        `Inventory accountGroups strictly from the deep-dive map keys provided in context (deepDiveGroups: ${JSON.stringify(args.deepDiveGroups)}) — a group outside those keys is invalid.`,
        'Honor recalled prior-period exceptions in priorKnowledge by pre-flagging their groups in the checklist.',
        'Report honest tbHealth { balanced, findings } — an unbalanced TB is a finding, not a stopper you silently fix.',
      ],
      outputFormat: 'JSON with checklistPath string, accountGroups array of strings (min 1, keyed to the deep-dive map keys), tbHealth object { balanced: boolean, findings: array }',
    },
    outputSchema: {
      type: 'object',
      required: ['checklistPath', 'accountGroups', 'tbHealth'],
      properties: {
        checklistPath: { type: 'string' },
        accountGroups: { type: 'array', minItems: 1 },
        tbHealth: {
          type: 'object',
          required: ['balanced', 'findings'],
          properties: {
            balanced: { type: 'boolean' },
            findings: { type: 'array' },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'kickoff'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — per-account-group reconciliation (fan-out)
// ---------------------------------------------------------------------------

export const accountReconciliationTask = defineTask('fmc.account-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reconcile account group '${args.group}' for ${args.closePeriod}`,
  agent: {
    name: 'reconciliation-accountant',
    prompt: {
      role: 'Reconciliation accountant',
      task: `Reconcile the '${args.group}' GL balances and write the reconciliation artifact FILE`,
      context: args,
      instructions: [
        args.subledgerSource
          ? `Reconcile this group's GL balances to the subledger/source at ${args.subledgerSource}.`
          : `No subledger source was provided for this group — reconcile to the rollforward from ${args.priorPeriodClosePath} and SAY SO explicitly in the artifact.`,
        `Write the reconciliation FILE under ${args.reconDir} and return its path as reconPath — the close-review gate reperforms your math from that file, so show gl, subledger, and computed variance per account.`,
        'Never plug a variance — an unexplained difference stays status unresolved with the honest amount.',
        `This group's full drill-down process is ${args.deepDiveProcess} — cite it when the group needs a deep dive.`,
        'Honor recalled recurring exceptions for this group in priorKnowledge: check whether each recurs this period and say so.',
        'Return variances [{ account, glBalance, subledgerBalance, variance, explanation, supportRefs, status }] with status resolved|unresolved; supportRefs must be non-empty for resolved items.',
      ],
      outputFormat: 'JSON with group string, reconPath string (a written FILE — balances without a written artifact are invalid), variances array [{ account, glBalance, subledgerBalance, variance, explanation, supportRefs, status }], status string',
    },
    outputSchema: {
      type: 'object',
      required: ['group', 'reconPath', 'variances', 'status'],
      properties: {
        group: { type: 'string' },
        reconPath: { type: 'string' },
        variances: {
          type: 'array',
          items: {
            type: 'object',
            required: ['account', 'glBalance', 'subledgerBalance', 'variance', 'status'],
            properties: {
              account: { type: 'string' },
              glBalance: { type: 'number' },
              subledgerBalance: { type: 'number' },
              variance: { type: 'number' },
              explanation: { type: 'string' },
              supportRefs: { type: 'array' },
              status: { type: 'string', enum: ['resolved', 'unresolved'] },
            },
          },
        },
        status: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'reconciliation'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — variance merge
// ---------------------------------------------------------------------------

export const varianceMergeTask = defineTask('fmc.variance-merge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Merge variance register for ${args.closePeriod} (${args.reconciliations.length} groups)`,
  agent: {
    name: 'close-analyst',
    prompt: {
      role: 'Close analyst consolidating the variance register',
      task: `Consolidate every per-group variance array into ONE register artifact at ${args.varianceRegisterTargetPath}`,
      context: args,
      instructions: [
        `Consolidate all per-group variance arrays from context.reconciliations into ONE register artifact written to exactly ${args.varianceRegisterTargetPath}, returned as varianceRegisterPath.`,
        `Classify each item material strictly by |variance| >= ${args.materialityThreshold} (the materialityThreshold from context) — never your own threshold.`,
        `Map each unresolved material item to its deep-dive process from the provided map (deepDiveMap in context) as deepDiveRefs [{ group, account, process }].`,
        'Counts come from the inputs only — unresolvedCount is the exact number of unresolved items across all groups; no smoothing.',
        'Return groupsCovered: every group name that appears in the register — the orchestrator cross-checks this against the reconciliation index and throws if the merge dropped a group.',
      ],
      outputFormat: 'JSON with varianceRegisterPath string, materialVariances array [{ group, account, variance, explanation, status }], unresolvedCount number, deepDiveRefs array [{ group, account, process }], groupsCovered array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['varianceRegisterPath', 'materialVariances', 'unresolvedCount', 'deepDiveRefs', 'groupsCovered'],
      properties: {
        varianceRegisterPath: { type: 'string' },
        materialVariances: {
          type: 'array',
          items: {
            type: 'object',
            required: ['group', 'account', 'variance', 'status'],
            properties: {
              group: { type: 'string' },
              account: { type: 'string' },
              variance: { type: 'number' },
              explanation: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        unresolvedCount: { type: 'number' },
        deepDiveRefs: { type: 'array' },
        groupsCovered: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'variance-merge'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — AP/accrual review + adjusting-journal drafting
// ---------------------------------------------------------------------------

export const apAccrualReviewTask = defineTask('fmc.ap-accrual-review', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Redraft AP payment batch for ${args.closePeriod} (controller feedback)`
    : `AP/accrual review for ${args.closePeriod}`,
  agent: {
    name: 'ap-accountant',
    prompt: {
      role: 'AP accountant running cutoff and accrual review',
      task: 'AP cutoff testing, unrecorded-liability search, accrual completeness, and a DRAFT payment batch artifact',
      context: args,
      instructions: [
        'Perform AP cutoff testing and an unrecorded-liability search around the period end; report apCutoffFindings.',
        'Assess accrual completeness against the recurring-accrual history in priorKnowledge; report accrualFindings.',
        args.apPaymentProposalRequested
          ? `DRAFT the payment batch artifact under ${args.artifactsDir} — paymentBatch { batchArtifactPath, payments: [{ paymentId, vendor, amount, currency, dueDate }], total }. Nothing is released here; the payment-release policy gate decides.`
          : 'apPaymentProposalRequested is FALSE: do NOT draft a payment batch — return paymentBatch null and say so in the findings.',
        args.feedback
          ? `Redraft round: address ONLY this controller feedback on the payment batch and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no rejection feedback to address.',
      ],
      outputFormat: 'JSON with apCutoffFindings array, accrualFindings array, paymentBatch object { batchArtifactPath, payments, total } or null',
    },
    outputSchema: {
      type: 'object',
      required: ['apCutoffFindings', 'accrualFindings', 'paymentBatch'],
      properties: {
        apCutoffFindings: { type: 'array' },
        accrualFindings: { type: 'array' },
        paymentBatch: { type: ['object', 'null'] },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'ap-accrual'],
}));

export const journalEntryDraftingTask = defineTask('fmc.journal-entry-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Redraft adjusting journal entries for ${args.closePeriod} (controller feedback)`
    : `Draft adjusting journal entries for ${args.closePeriod}`,
  agent: {
    name: 'senior-accountant',
    prompt: {
      role: 'Senior accountant drafting adjusting journal entries',
      task: `Draft adjusting JEs from the variance register and accrual findings, written to ${args.jeRegisterTargetPath}`,
      context: args,
      instructions: [
        `Draft adjusting JEs from the variance register (varianceRegisterPath in context) and the accrual findings; write the JE register artifact to exactly ${args.jeRegisterTargetPath} and return it as jeRegisterPath.`,
        'Every JE = { jeId, account, debit, credit, supportRef, rationale, material } — balanced (debits=credits) and support-referenced. supportRef is REQUIRED: a JE without support is invalid; flag the gap rather than fabricating support.',
        `Classify material strictly per the context materialityThreshold (${args.materialityThreshold}).`,
        'DRAFT ONLY — the journal-posting policy gate decides; nothing is posted here.',
        args.feedback
          ? `Redraft round: address ONLY the controller's feedback and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no rejection feedback to address.',
      ],
      outputFormat: 'JSON with jeRegisterPath string, journalEntries array [{ jeId, account, debit, credit, supportRef, rationale, material }] (minItems 0 honest)',
    },
    outputSchema: {
      type: 'object',
      required: ['jeRegisterPath', 'journalEntries'],
      properties: {
        jeRegisterPath: { type: 'string' },
        journalEntries: {
          type: 'array',
          items: {
            type: 'object',
            required: ['jeId', 'account', 'debit', 'credit', 'supportRef', 'rationale', 'material'],
            properties: {
              jeId: { type: 'string' },
              account: { type: 'string' },
              debit: { type: 'number' },
              credit: { type: 'number' },
              supportRef: { type: 'string' },
              rationale: { type: 'string' },
              material: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'journal-drafting'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — payment release execution (guarded: runs ONLY under approved===true)
// ---------------------------------------------------------------------------

export const paymentReleaseExecutionTask = defineTask('fmc.payment-release-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release approved AP payment batch for ${args.closePeriod} (${args.paymentBatch.payments.length} payments)`,
  agent: {
    name: 'treasury-operator',
    prompt: {
      role: 'Treasury operator releasing the approved payment batch',
      task: 'Release EXACTLY the controller-approved payment batch and report per-payment outcomes',
      context: args,
      instructions: [
        `Release EXACTLY the approved batch at ${args.paymentBatch.batchArtifactPath} — the approved payments verbatim, no additions or edits after approval.`,
        'Report released [{ paymentId }] and failures [{ paymentId, error }] honestly — a failed release goes in failures with its error, never swallowed or retried into silence.',
      ],
      outputFormat: 'JSON with released array [{ paymentId }], failures array [{ paymentId, error }]',
    },
    outputSchema: {
      type: 'object',
      required: ['released', 'failures'],
      properties: {
        released: { type: 'array' },
        failures: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'payment-release'],
}));

// ---------------------------------------------------------------------------
// Phase 7 — journal posting execution (guarded: runs ONLY under approved===true;
// process code verifies postedJeIds is a subset of the approved set and throws
// on deviation)
// ---------------------------------------------------------------------------

export const journalPostingExecutionTask = defineTask('fmc.journal-posting-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post approved journal entries for ${args.closePeriod} (${args.approvedJeIds.length} JEs)`,
  agent: {
    name: 'senior-accountant',
    prompt: {
      role: 'Senior accountant posting the approved adjusting entries',
      task: 'Post EXACTLY the controller-approved JEs to the ledger and emit the post-posting trial balance',
      context: args,
      instructions: [
        `Post EXACTLY the approved JEs (approvedJeIds: ${JSON.stringify(args.approvedJeIds)}) from the register at ${args.jeRegisterPath} — nothing outside the approved set.`,
        `Emit the post-posting trial balance artifact under ${args.artifactsDir} and return its path as postPostingTbPath — the reporting package builds from it.`,
        'Report postedJeIds and failures [{ jeId, error }] honestly — a failed posting is surfaced with its error, not retried into silence.',
      ],
      outputFormat: 'JSON with postedJeIds array of strings, failures array [{ jeId, error }], postPostingTbPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['postedJeIds', 'failures', 'postPostingTbPath'],
      properties: {
        postedJeIds: { type: 'array' },
        failures: { type: 'array' },
        postPostingTbPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'journal-posting'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — close remediation (one pass, driven by the sign-off directive)
// ---------------------------------------------------------------------------

export const closeRemediationTask = defineTask('fmc.close-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Close remediation for ${args.closePeriod} (sign-off directive)`,
  agent: {
    name: 'close-manager',
    prompt: {
      role: 'Close manager applying the sign-off rejection directive',
      task: 'Apply ONLY the sign-off rejection directive and report exactly what changed',
      context: args,
      instructions: [
        `Apply ONLY this sign-off rejection directive: ${JSON.stringify(args.directive)} — re-open the named reconciliations/JEs with their preparers via the evidence in context.`,
        'Report exactly what changed (remediationSummary) and which artifacts were updated (updatedArtifacts, min 1 — a remediation with no touched artifact is a no-op and invalid).',
        'Never modify balances without a traceable basis.',
      ],
      outputFormat: 'JSON with remediationSummary string, updatedArtifacts array of file paths (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['remediationSummary', 'updatedArtifacts'],
      properties: {
        remediationSummary: { type: 'string' },
        updatedArtifacts: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'remediation'],
}));

// ---------------------------------------------------------------------------
// Phase 9 — reporting package + close memo
// ---------------------------------------------------------------------------

export const reportingPackageTask = defineTask('fmc.reporting-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble close reporting package for ${args.closePeriod}`,
  agent: {
    name: 'financial-reporting-specialist',
    prompt: {
      role: 'Financial reporting specialist assembling the close binder',
      task: `Assemble the close binder at ${args.packageTargetDir}`,
      context: args,
      instructions: [
        `Assemble the close binder under exactly ${args.packageTargetDir} (create it if needed) and return it as packagePath.`,
        `Build the statements from the post-posting trial balance at ${args.postPostingTbPath}: income statement, balance sheet, equity rollforward, cash-flow statement (indirect method), and a footnote summary — the absorbed financial-statement-preparation line-item guidance.`,
        'Income statement: revenue, COGS, gross profit, operating expenses by category, operating income, other income/expense, tax, net income, with prior-period comparatives where available.',
        'Balance sheet: current/non-current classification of assets and liabilities, equity section, comparative balances.',
        'Equity rollforward: beginning balances, net income, contributions/distributions, other movements, ending balances.',
        'Cash flow (indirect): net income, non-cash add-backs, working-capital changes, investing and financing sections, ending cash.',
        'Footnote summary: significant policies and the disclosure items the close surfaced (month-end close binder scope, not full filing scope).',
        `Also include the reconciliation index (${args.reconIndexPath}), the variance register (${args.varianceRegisterPath}), and the posted-JE report in the binder.`,
        'Verify A=L+E and the ending-cash tie; tieOutSummary must reference the close-review gate\'s executed evidence, not fresh assertions — report any divergence explicitly instead of adjusting.',
      ],
      outputFormat: 'JSON with packagePath string, statementsIncluded array of strings (min 1), tieOutSummary object',
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'statementsIncluded', 'tieOutSummary'],
      properties: {
        packagePath: { type: 'string' },
        statementsIncluded: { type: 'array', minItems: 1 },
        tieOutSummary: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'reporting-package'],
}));

export const closeMemoTask = defineTask('fmc.close-memo', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write close memo for ${args.closePeriod}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical writer producing the close memo',
      task: `Write the close memo at ${args.closeMemoTargetPath}`,
      context: args,
      instructions: [
        `Write the close memo to exactly ${args.closeMemoTargetPath} and return that path as closeMemoPath.`,
        'Sections, in order: Close summary (period, tier, sign-off), Gate verdicts (close-review with evidence refs), Policy decisions, Exception dispositions, Next-close insights.',
        'The Policy decisions section is MANDATORY: list EVERY policyDecisions entry from context with actionId, approved, response, and its approver-or-auto provenance (autoApproved by the harness on non-interactive runs versus decided by a human).',
        'Exception dispositions: every material variance with its resolution status and deep-dive reference where applicable.',
        'Next-close insights (min 1): each traceable to this run\'s data, never generic advice.',
      ],
      outputFormat: 'JSON with closeMemoPath string, insights array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['closeMemoPath', 'insights'],
      properties: {
        closeMemoPath: { type: 'string' },
        insights: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fmc', 'finance', 'close-memo'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    closePeriod,
    trialBalancePath,
    materialityThreshold,
    accountGroups,
    accountingFramework = 'GAAP',
    apPaymentProposalRequested = true,
    entityName,
    priorPeriodClosePath,
    subledgerSources,
    maxFixAttempts = 2,
    maxParallel = 4,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // Input guards first — throw with the got-value message on each; no fallbacks.
  if (!closePeriod) {
    throw new Error(`finance-month-end-close-workflow: closePeriod is required (got ${JSON.stringify(closePeriod)})`);
  }
  if (!trialBalancePath) {
    throw new Error(`finance-month-end-close-workflow: trialBalancePath is required (got ${JSON.stringify(trialBalancePath)})`);
  }
  if (typeof materialityThreshold !== 'number' || !(materialityThreshold > 0)) {
    throw new Error(`finance-month-end-close-workflow: materialityThreshold must be a number > 0 (got ${JSON.stringify(materialityThreshold)}) — there is no default materiality`);
  }

  // Every deep-dive sibling referenced by the frozen map must exist next to
  // this module at kickoff — a missing reference throws, no fallback.
  validateDeepDiveSiblings();

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const policyDecisions = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { closePeriod, entityName, accountingFramework, artifactsDir };

  // Records one raise of a policy-gated breakpoint into the audit array. A
  // non-interactive harness resolution carries autoApproved:true on the result;
  // that provenance is surfaced here AND in the close memo's Policy decisions section.
  const recordPolicyDecision = (actionId, result) => {
    policyDecisions.push({
      actionId,
      approved: result.approved === true,
      response: result.response || result.feedback || null,
      autoApproved: result.autoApproved === true,
    });
  };

  // Phase 0 — kip recall: prior-period close issues, recurring reconciliation
  // exceptions, and materiality history feed kickoff pre-flagging, per-group
  // reconciliation context, and the gate context.
  ctx.log?.('info', 'Phase 0: kip recall of prior finance-accounting close facts');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'finance-accounting',
      topic: `prior-period close issues, recurring reconciliation exceptions, and materiality history for ${entityName ?? 'entity'} through ${closePeriod}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — close checklist kickoff. NO breakpoint here (sparse rule): a
  // broken TB is reported as tbHealth findings that ride into the gate, not an
  // interactive stop.
  ctx.log?.('info', 'Phase 1: close checklist kickoff');
  const kickoff = await ctx.task(closeChecklistKickoffTask, {
    ...sharedArgs,
    trialBalancePath,
    deepDiveGroups: Object.keys(DEEP_DIVE_PROCESSES),
    priorKnowledge,
  });
  artifacts.push(kickoff.checklistPath);
  const groups = inputs.accountGroups ?? kickoff.accountGroups;
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error(`finance-month-end-close-workflow: accountGroups must be a non-empty array (got ${JSON.stringify(groups)})`);
  }
  // Every group must have a deep-dive entry — throwing lookup, no fallback.
  for (const group of groups) {
    deepDiveFor(group);
  }
  const checklist = {
    checklistPath: kickoff.checklistPath,
    accountGroups: groups,
    tbHealth: kickoff.tbHealth,
  };
  timings.kickoff = ctx.now() - startTime;

  // Phase 2 — parallel account-group reconciliations. Each writes a
  // reconciliation FILE; PROCESS CODE then writes the deterministic
  // reconciliations/index.json (sorted by group) the gate audits.
  ctx.log?.('info', `Phase 2: parallel account-group reconciliations (${groups.length} groups)`);
  const reconciliationsRoot = join(artifactsDir, 'reconciliations');
  const reconciliations = await ctx.parallel.map(
    groups,
    (group) => ctx.task(accountReconciliationTask, {
      ...sharedArgs,
      group,
      subledgerSource: subledgerSources?.[group] ?? null,
      trialBalancePath,
      priorPeriodClosePath,
      deepDiveProcess: deepDiveFor(group),
      reconDir: join(reconciliationsRoot, kebab(group)),
      priorKnowledge,
    }),
    { maxConcurrency: maxParallel },
  );

  // Deterministic index written by PROCESS CODE — sorted by group so critics
  // audit a stable manifest of real files, not agent summaries.
  const reconIndexPath = join(reconciliationsRoot, 'index.json');
  const indexEntries = reconciliations
    .map((recon) => ({
      group: recon.group,
      reconPath: recon.reconPath,
      status: recon.status,
      varianceCount: recon.variances.length,
    }))
    .sort((a, b) => String(a.group).localeCompare(String(b.group)));
  mkdirSync(dirname(reconIndexPath), { recursive: true });
  writeFileSync(
    reconIndexPath,
    JSON.stringify({ generatedBy: 'process-code', runId: ctx.runId, groups: indexEntries }, null, 2),
  );
  artifacts.push(reconIndexPath);
  timings.reconciliations = ctx.now() - startTime;

  // Phase 3 — variance merge into the single materiality-classified register.
  ctx.log?.('info', 'Phase 3: variance merge');
  const varianceRegisterTargetPath = join(artifactsDir, `variance-register-${kebab(closePeriod)}.json`);
  const merge = await ctx.task(varianceMergeTask, {
    ...sharedArgs,
    reconciliations: reconciliations.map((r) => ({ group: r.group, reconPath: r.reconPath, variances: r.variances })),
    materialityThreshold,
    deepDiveMap: DEEP_DIVE_PROCESSES,
    varianceRegisterTargetPath,
  });
  // Cross-check in process code: every group in the index must appear in the
  // register — a missing group means the merge dropped data (throw, no fallback).
  const coveredGroups = new Set(merge.groupsCovered);
  for (const entry of indexEntries) {
    if (!coveredGroups.has(entry.group)) {
      throw new Error(
        `finance-month-end-close-workflow: variance merge dropped group '${entry.group}' — every group in ` +
        `reconciliations/index.json must appear in the register (covered: ${JSON.stringify([...coveredGroups])})`
      );
    }
  }
  artifacts.push(merge.varianceRegisterPath);
  timings.varianceMerge = ctx.now() - startTime;

  // Phase 4 — AP/accrual review then adjusting-journal drafting, sequential.
  ctx.log?.('info', 'Phase 4: AP/accrual review + journal drafting');
  let ap = await ctx.task(apAccrualReviewTask, {
    ...sharedArgs,
    apPaymentProposalRequested,
    trialBalancePath,
    varianceRegisterPath: merge.varianceRegisterPath,
    priorKnowledge,
  });
  const jeRegisterTargetPath = join(artifactsDir, `je-register-${kebab(closePeriod)}.json`);
  let jeDraft = await ctx.task(journalEntryDraftingTask, {
    ...sharedArgs,
    varianceRegisterPath: merge.varianceRegisterPath,
    materialVariances: merge.materialVariances,
    accrualFindings: ap.accrualFindings,
    apCutoffFindings: ap.apCutoffFindings,
    materialityThreshold,
    jeRegisterTargetPath,
    priorKnowledge,
  });
  artifacts.push(jeDraft.jeRegisterPath);
  timings.apAndJournals = ctx.now() - startTime;

  // Phase 5 — adversarial close-review gate over the process-code manifest:
  // critics RE-EXECUTE reconciliation math and trace material JEs to support.
  ctx.log?.('info', 'Phase 5: adversarial close-review gate (executed evidence)');
  const closeReview = await adversarialGate(ctx, {
    gateId: 'fmc.close-review',
    artifact: {
      path: reconIndexPath,
      description: 'Index of reconciliation artifacts + JE register + variance register',
    },
    critics: [
      {
        name: 'reconciliation-reperformance-critic',
        role: 'Reconciliation reperformance reviewer',
        focus: 'recompute variance = glBalance - subledgerBalance from the ACTUAL reconciliation files; verify rollforwards foot; verify register materiality classification against materialityThreshold; executed numbers in every evidence entry',
      },
      {
        name: 'journal-support-tracing-critic',
        role: 'Journal-support tracing reviewer',
        focus: 'trace EVERY material JE to its supportRef and open the support; verify JEs balance; verify A=L+E and cash ties on the adjusted figures; a material JE whose support cannot be opened fails the gate',
      },
    ],
    ironLaw: [
      'Open and read the ACTUAL reconciliation files listed in the index — verdicts about files you did not open are protocol failures.',
      "EXECUTED EVIDENCE: every evidence entry must show the recomputed number next to the reported number with the file path and field examined; 'reviewed and looks right' is not evidence.",
      "Reperformance critic: recompute each group's variances and the register's materiality classification yourself from the artifacts; any mismatch is an issue citing both numbers.",
      'Tracing critic: for every JE with material=true, cite jeId, supportRef, and what the support shows; verify debits=credits per JE and in total.',
    ],
    maxFixAttempts,
    fixer: {
      args: {
        note: 'Fixer re-opens flagged reconciliations/JEs with the preparing agents to re-ground numbers in source data — it NEVER edits balances or JE amounts itself; unresolvable flags stay as findings.',
      },
    },
    context: {
      materialityThreshold,
      varianceRegister: {
        varianceRegisterPath: merge.varianceRegisterPath,
        materialVariances: merge.materialVariances,
        unresolvedCount: merge.unresolvedCount,
      },
      jeRegisterPath: jeDraft.jeRegisterPath,
      tbHealth: kickoff.tbHealth,
      priorKnowledge,
    },
  });
  if (closeReview.escalated) {
    breakpointsHit.push('fmc.close-review.gate-escalation');
  }
  timings.closeReview = ctx.now() - startTime;

  const reconciliationOutput = {
    groups: indexEntries.map((entry) => ({
      group: entry.group,
      reconPath: entry.reconPath,
      variances: entry.varianceCount,
      status: entry.status,
    })),
    varianceRegisterPath: merge.varianceRegisterPath,
    materialVariances: merge.materialVariances,
    unresolvedCount: merge.unresolvedCount,
    deepDiveRefs: merge.deepDiveRefs,
  };

  // Builds the always-non-empty kip fact set: the close-outcome fact exists
  // even on failed runs (object 'failed' with the reason), plus exception,
  // sign-off-tier, and per-policy-gate decision facts.
  const closeSubject = `close:${kebab(closePeriod)}`;
  const buildKipFacts = (outcome, reason, signoffRecord) => {
    const facts = [];
    facts.push({
      subject: closeSubject,
      predicate: 'close-outcome',
      object: outcome,
      props: { runId: ctx.runId, ...(reason ? { reason } : {}) },
    });
    for (const variance of merge.materialVariances) {
      facts.push({
        subject: closeSubject,
        predicate: 'recon-exception',
        object: `${variance.group}:${variance.account}`,
        props: {
          variance: variance.variance,
          resolution: variance.status === 'resolved' ? (variance.explanation ?? 'resolved') : 'unresolved',
          runId: ctx.runId,
        },
      });
      if (variance.status === 'unresolved') {
        facts.push({
          subject: closeSubject,
          predicate: 'recurring-exception',
          object: `${variance.group}:${variance.account}`,
          props: { variance: variance.variance, runId: ctx.runId },
        });
      }
    }
    if (signoffRecord) {
      facts.push({
        subject: closeSubject,
        predicate: 'signoff-tier',
        object: signoffRecord.tier,
        props: { materialityBasis: signoffRecord.materialityBasis, expert: signoffRecord.expert, runId: ctx.runId },
      });
    }
    for (const decision of policyDecisions) {
      facts.push({
        subject: closeSubject,
        predicate: 'policy-decision',
        object: decision.actionId,
        props: { approved: decision.approved, autoApproved: decision.autoApproved, runId: ctx.runId },
      });
    }
    return facts;
  };

  if (!closeReview.passed) {
    // Escalation rejected by the owner: the close is NOT fit to proceed —
    // payments are NOT released, journals are NOT posted, sign-off is never
    // raised. Record honestly and stop; never proceed silently.
    ctx.log?.('info', 'Close-review gate failed after owner rejection — halting before any release/posting');
    let kipFactsAsserted = 0;
    if (kipEnabled) {
      const capture = await kipAssert(ctx, {
        kipDir,
        kipModel,
        kind: 'finance-accounting',
        facts: buildKipFacts('failed', 'close-review gate failed and the owner rejected the escalation', null),
      });
      kipFactsAsserted = capture.asserted;
    }
    timings.close = ctx.now() - startTime;
    return {
      success: false,
      checklist,
      reconciliation: reconciliationOutput,
      gateResults: { closeReview },
      payments: { proposed: 0, approved: false, released: 0, failures: [] },
      journals: { drafted: jeDraft.journalEntries.length, approvedForPosting: 0, posted: 0, failures: [] },
      signoff: { tier: null, expert: null, approved: false, attempts: 0, materialityBasis: [] },
      policyDecisions,
      reportingPackage: { packagePath: null, closeMemoPath: null },
      kipFactsAsserted,
      artifacts,
      metadata: {
        processId: 'finance-accounting/finance-month-end-close-workflow',
        runId: ctx.runId,
        closePeriod,
        breakpointsHit,
        timings,
        reason: 'close-review gate failed and the owner rejected the escalation — payments unreleased, journals unposted, sign-off never raised',
      },
    };
  }

  // Phase 6 — policy-gated payment release. Only when a batch was requested
  // and drafted. One feedback redraft at the SAME breakpointId; a second
  // rejection means the batch is NOT released — recorded, no alternative channel.
  ctx.log?.('info', 'Phase 6: policy-gated payment release');
  const payments = { proposed: 0, approved: false, released: 0, failures: [] };
  if (apPaymentProposalRequested === true && ap.paymentBatch && Array.isArray(ap.paymentBatch.payments) && ap.paymentBatch.payments.length > 0) {
    payments.proposed = ap.paymentBatch.payments.length;
    artifacts.push(ap.paymentBatch.batchArtifactPath);
    let releaseFeedback = null;
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        ap = await ctx.task(apAccrualReviewTask, {
          ...sharedArgs,
          apPaymentProposalRequested,
          trialBalancePath,
          varianceRegisterPath: merge.varianceRegisterPath,
          priorKnowledge,
          feedback: releaseFeedback,
        });
        if (!ap.paymentBatch || !Array.isArray(ap.paymentBatch.payments)) {
          throw new Error(`fmc.ap-accrual-review redraft dropped the payment batch (got ${JSON.stringify(ap.paymentBatch)})`);
        }
        payments.proposed = ap.paymentBatch.payments.length;
        artifacts.push(ap.paymentBatch.batchArtifactPath);
      }
      const releaseDecision = await routedBreakpoint(ctx, {
        question: `Release this AP payment batch for the ${closePeriod} close (${ap.paymentBatch.payments.length} payments, total ${ap.paymentBatch.total})? Reject with feedback for one redraft; a second rejection means the batch is not released.`,
        context: {
          runId: ctx.runId,
          files: [{ path: ap.paymentBatch.batchArtifactPath, label: 'AP payment batch (draft)' }],
          payments: ap.paymentBatch.payments,
          total: ap.paymentBatch.total,
          gateVerdict: { passed: closeReview.passed, escalated: closeReview.escalated, attempts: closeReview.attempts },
        },
      }, {
        breakpointId: 'payment-release',
        expert: 'controller',
        tags: ['policy-gated', 'finance'],
        strategy: 'single',
      });
      breakpointsHit.push('payment-release');
      recordPolicyDecision('payment-release', releaseDecision);
      if (releaseDecision.approved === true) { payments.approved = true; break; }
      releaseFeedback = releaseDecision.response || releaseDecision.feedback || 'Changes requested';
    }
    // Executor runs ONLY under an explicit approval — guarded, never assumed.
    if (payments.approved === true) {
      const release = await ctx.task(paymentReleaseExecutionTask, {
        ...sharedArgs,
        paymentBatch: ap.paymentBatch,
      });
      payments.released = release.released.length;
      payments.failures = release.failures;
    }
  }
  timings.paymentRelease = ctx.now() - startTime;

  // Phase 7 — policy-gated journal posting. Same one-redraft protocol; the
  // executor is guarded by approved===true and the posted set is verified in
  // process code to be a subset of the approved set (throw on deviation).
  ctx.log?.('info', 'Phase 7: policy-gated journal posting');
  const journals = { drafted: jeDraft.journalEntries.length, approvedForPosting: 0, posted: 0, failures: [] };
  let postingApproved = false;
  let postPostingTbPath = null;
  let postedJeIds = [];
  let postingFeedback = null;
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      jeDraft = await ctx.task(journalEntryDraftingTask, {
        ...sharedArgs,
        varianceRegisterPath: merge.varianceRegisterPath,
        materialVariances: merge.materialVariances,
        accrualFindings: ap.accrualFindings,
        apCutoffFindings: ap.apCutoffFindings,
        materialityThreshold,
        jeRegisterTargetPath,
        priorKnowledge,
        feedback: postingFeedback,
      });
      artifacts.push(jeDraft.jeRegisterPath);
      journals.drafted = jeDraft.journalEntries.length;
    }
    const materialJes = jeDraft.journalEntries.filter((je) => je.material === true);
    const postingDecision = await routedBreakpoint(ctx, {
      question: `Post these ${jeDraft.journalEntries.length} adjusting journal entries for the ${closePeriod} close? Reject with feedback for one redraft; a second rejection means nothing is posted.`,
      context: {
        runId: ctx.runId,
        files: [{ path: jeDraft.jeRegisterPath, label: 'Adjusting JE register (draft)' }],
        materialJes: materialJes.map((je) => ({ jeId: je.jeId, account: je.account, debit: je.debit, credit: je.credit, supportRef: je.supportRef })),
        gateTracingEvidence: closeReview.evidence,
      },
    }, {
      breakpointId: 'journal-posting',
      expert: 'controller',
      tags: ['policy-gated', 'finance'],
      strategy: 'single',
    });
    breakpointsHit.push('journal-posting');
    recordPolicyDecision('journal-posting', postingDecision);
    if (postingDecision.approved === true) { postingApproved = true; break; }
    postingFeedback = postingDecision.response || postingDecision.feedback || 'Changes requested';
  }
  // Executor runs ONLY under an explicit approval — guarded, never assumed.
  if (postingApproved === true) {
    const approvedJeIds = jeDraft.journalEntries.map((je) => je.jeId);
    journals.approvedForPosting = approvedJeIds.length;
    const posting = await ctx.task(journalPostingExecutionTask, {
      ...sharedArgs,
      jeRegisterPath: jeDraft.jeRegisterPath,
      approvedJeIds,
    });
    // The posted set must be a subset of the approved set — a JE posted
    // outside the approved register is a policy violation, not a variance.
    const approvedIdSet = new Set(approvedJeIds);
    for (const jeId of posting.postedJeIds) {
      if (!approvedIdSet.has(jeId)) {
        throw new Error(
          `fmc.journal-posting-execution posted JE '${jeId}' outside the approved set ` +
          `(approved: ${JSON.stringify(approvedJeIds)}) — posting deviated from the controller-approved register`
        );
      }
    }
    postedJeIds = posting.postedJeIds;
    journals.posted = posting.postedJeIds.length;
    journals.failures = posting.failures;
    postPostingTbPath = posting.postPostingTbPath;
    artifacts.push(posting.postPostingTbPath);
  }
  timings.journalPosting = ctx.now() - startTime;

  // Phase 8 — materiality-routed close sign-off. Tier is computed
  // deterministically in PROCESS CODE and RECOMPUTED after remediation
  // (remediation can change the tier; recompute, don't cache). Expert comes
  // from the frozen SIGNOFF_ROUTING map via a throwing lookup.
  ctx.log?.('info', 'Phase 8: materiality-routed close sign-off');
  const signoff = { tier: null, expert: null, approved: false, attempts: 0, materialityBasis: [] };
  for (let round = 0; round < 2; round++) {
    const { tier, materialityBasis } = signoffTier(
      closeReview,
      merge.materialVariances,
      jeDraft.journalEntries,
      materialityThreshold,
      merge.unresolvedCount,
    );
    const expert = SIGNOFF_ROUTING[tier];
    if (!expert) {
      throw new Error(`finance-month-end-close-workflow: no sign-off expert routed for tier ${JSON.stringify(tier)} (frozen map: ${JSON.stringify(SIGNOFF_ROUTING)})`);
    }
    signoff.tier = tier;
    signoff.expert = expert;
    signoff.materialityBasis = materialityBasis;
    const signoffDecision = await routedBreakpoint(ctx, {
      question: `Sign off the ${closePeriod} close (tier: ${tier})? Rejection requires a directive; one remediation pass is available before the close is recorded as failed.`,
      context: {
        runId: ctx.runId,
        tier,
        materialityBasis,
        varianceRegisterPath: merge.varianceRegisterPath,
        materialVariances: merge.materialVariances,
        journals: { posted: journals.posted, failures: journals.failures, postedJeIds },
        payments,
        gateResult: { passed: closeReview.passed, escalated: closeReview.escalated, attempts: closeReview.attempts, issues: closeReview.issues },
      },
    }, {
      breakpointId: 'close-signoff',
      expert,
      tags: ['policy-gated', 'finance'],
      strategy: 'single',
    });
    breakpointsHit.push('close-signoff');
    recordPolicyDecision('close-signoff', signoffDecision);
    signoff.attempts += 1;
    if (signoffDecision.approved === true) {
      signoff.approved = true;
      break;
    }
    if (round === 0) {
      // A rejection MUST carry a directive — an undirected rejection is
      // unactionable and throws (fallbacks forbidden).
      const directive = signoffDecision.response || signoffDecision.feedback;
      if (!directive) {
        throw new Error('close-signoff rejected without a directive — remediation has nothing to apply (fallbacks forbidden).');
      }
      const remediation = await ctx.task(closeRemediationTask, {
        ...sharedArgs,
        directive,
        varianceRegisterPath: merge.varianceRegisterPath,
        jeRegisterPath: jeDraft.jeRegisterPath,
        gateEvidence: closeReview.evidence,
      });
      artifacts.push(...remediation.updatedArtifacts);
      // Loop re-raises the SAME breakpointId with the tier RECOMPUTED.
    }
  }
  timings.signoff = ctx.now() - startTime;

  if (!signoff.approved) {
    // Second rejection: honest close-failed return with the sign-off record
    // intact — no reporting package is assembled for an unsigned close.
    ctx.log?.('info', 'Close sign-off rejected twice — recording honest close-failed result');
    let kipFactsAsserted = 0;
    if (kipEnabled) {
      const capture = await kipAssert(ctx, {
        kipDir,
        kipModel,
        kind: 'finance-accounting',
        facts: buildKipFacts('failed', `close sign-off rejected twice at tier '${signoff.tier}'`, signoff),
      });
      kipFactsAsserted = capture.asserted;
    }
    timings.close = ctx.now() - startTime;
    return {
      success: false,
      checklist,
      reconciliation: reconciliationOutput,
      gateResults: { closeReview },
      payments,
      journals,
      signoff,
      policyDecisions,
      reportingPackage: { packagePath: null, closeMemoPath: null },
      kipFactsAsserted,
      artifacts,
      metadata: {
        processId: 'finance-accounting/finance-month-end-close-workflow',
        runId: ctx.runId,
        closePeriod,
        breakpointsHit,
        timings,
        reason: `close sign-off rejected twice at tier '${signoff.tier}' — close recorded as failed`,
      },
    };
  }

  // Phase 9 — reporting package + close memo + kip assert.
  ctx.log?.('info', 'Phase 9: reporting package + close memo + kip assert');
  const packageTargetDir = join(artifactsDir, `close-package-${kebab(closePeriod)}`);
  const reporting = await ctx.task(reportingPackageTask, {
    ...sharedArgs,
    packageTargetDir,
    postPostingTbPath,
    reconIndexPath,
    varianceRegisterPath: merge.varianceRegisterPath,
    postedJeIds,
    journals,
    gateResult: { passed: closeReview.passed, evidence: closeReview.evidence },
  });
  artifacts.push(reporting.packagePath);

  const closeMemoTargetPath = join(artifactsDir, `close-memo-${kebab(closePeriod)}.md`);
  const memo = await ctx.task(closeMemoTask, {
    ...sharedArgs,
    closeMemoTargetPath,
    signoff,
    policyDecisions,
    gateResults: { closeReview: { passed: closeReview.passed, escalated: closeReview.escalated, attempts: closeReview.attempts, issues: closeReview.issues, evidence: closeReview.evidence } },
    materialVariances: merge.materialVariances,
    deepDiveRefs: merge.deepDiveRefs,
    payments,
    journals,
  });
  artifacts.push(memo.closeMemoPath);

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const capture = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'finance-accounting',
      facts: buildKipFacts('signed-off', null, signoff),
    });
    kipFactsAsserted = capture.asserted;
  }
  timings.close = ctx.now() - startTime;

  return {
    success: signoff.approved === true && closeReview.passed === true,
    checklist,
    reconciliation: reconciliationOutput,
    gateResults: { closeReview },
    payments,
    journals,
    signoff,
    policyDecisions,
    reportingPackage: { packagePath: reporting.packagePath, closeMemoPath: memo.closeMemoPath },
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'finance-accounting/finance-month-end-close-workflow',
      runId: ctx.runId,
      closePeriod,
      breakpointsHit,
      timings,
    },
  };
}
