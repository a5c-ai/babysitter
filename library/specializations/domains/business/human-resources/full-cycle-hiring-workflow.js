/**
 * @process human-resources/full-cycle-hiring-workflow
 * @description Full-cycle hiring workflow — role intake + JD authoring, adversarial JD review
 *   (inclusive-language + requirements-inflation critics with JD-line evidence), policy-gated
 *   batch candidate outreach, parallel resume screening, interview-loop orchestration with a
 *   panel-calibration bias/consistency gate over actual scorecard artifacts, debrief/decision,
 *   compensation-lead-gated comp package then hiring-manager-gated offer extension, policy-gated
 *   batch rejection comms, and close with hiring retro + kip funnel memory.
 *   Supersedes full-cycle-recruiting.js.
 * @supersedes library/specializations/domains/business/human-resources/full-cycle-recruiting.js — retire after one green run
 * @inputs {
 *   roleTitle: string,             // required — role being hired for
 *   level: string,                 // required — seniority level (e.g. 'senior', 'staff')
 *   headcount?: number,            // openings to fill (default 1)
 *   department?: string,
 *   hiringManager?: string,
 *   requirementsBrief: string,     // required — raw requirements brief to interview into a hiring bar
 *   compBandHint?: object,         // { min, max, currency }
 *   sourcingChannels?: string[],   // default ['linkedin','referrals','careers-page']
 *   interviewStages?: string[],    // default ['recruiter-screen','technical','panel','final']
 *   screenBatchSize?: number,      // resume-screen batch size (default 10)
 *   maxParallel?: number,          // ctx.parallel.map concurrency (default 3)
 *   maxFixAttempts?: number,       // adversarial-gate fix budget (default 2)
 *   kipEnabled?: boolean,          // recall + assert hiring memory via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   jdPath: string,
 *   gateResults: object,           // { jdReview { passed, attempts, escalated, issues, evidence }, panelCalibration { ... } }
 *   funnel: object,                // { sourced, screened, shortlisted, interviewed, offersExtended, hires, stageConversion }
 *   policyDecisions: array,        // [{ actionId, approved, response, autoApproved }] — non-interactive auto-approvals surfaced here AND in metadata.breakpointsHit
 *   offer: object,                 // { compApproved, extended, accepted, terms }
 *   rejections: object,            // { drafted, approved, sent }
 *   calibrationFindings: array,
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, breakpointsHit, timings }
 * }
 * @policyGatedActions send-candidate-outreach (recruiting-lead), approve-compensation-package (compensation-lead), extend-offer (hiring-manager), send-rejection-comms (recruiting-lead)
 * @graph
 *   domains: [domain:human-resources]
 *   specializations: [specialization:talent-management]
 *   skillAreas: [skill-area:talent-acquisition-strategy, skill-area:performance-management, skill-area:organizational-design]
 *   workflows: [workflow:talent-acquisition-pipeline]
 *   roles: [role:hr-manager, role:talent-recruiter, role:hiring-manager]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { defineTask } from '@a5c-ai/babysitter-sdk';

import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

// Deterministic kebab-case for artifact filenames — pure string mechanics, no model involved.
function kebab(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Deterministic batching for the parallel resume-screen fan-out.
function chunk(items, size) {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

// ---------------------------------------------------------------------------
// Phase 1 — role intake + hiring bar
// ---------------------------------------------------------------------------

export const roleIntakeTask = defineTask('fch.role-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise role intake for ${args.roleTitle} (${args.level}) — ambiguity feedback`
    : `Role intake + hiring bar for ${args.roleTitle} (${args.level})`,
  agent: {
    name: 'talent-partner',
    prompt: {
      role: 'Talent partner and role-design specialist',
      task: 'Interview the requirements brief into a role profile and an explicit, rationale-backed hiring bar',
      context: args,
      instructions: [
        'Interview the requirementsBrief and produce: roleProfile (mission, responsibilities, success metrics), hiringBar, compTargetBand, and openQuestions.',
        'hiringBar is the traceability substrate for the downstream requirements-inflation critic: every entry MUST be { id, requirement, mustHave (boolean), rationale } — a requirement without a written rationale is not allowed on the bar.',
        'Separate must-have from nice-to-have honestly; do not inflate the bar with years-of-experience proxies or credential requirements the work does not justify.',
        'Sanity-check compTargetBand against priorKnowledge (recalled comp bands) and compBandHint when provided; report divergence explicitly instead of silently averaging.',
        'openQuestions: list ONLY questions that genuinely block a defensible bar — an empty array is the expected result for a clear brief.',
        args.feedback
          ? `Revision round ${args.attempt}: incorporate the hiring-manager's answers to the open questions, then re-emit the full output with openQuestions resolved: ${JSON.stringify(args.feedback)}`
          : 'First intake round: no revision feedback to address.',
      ],
      outputFormat: 'JSON with roleProfile object, hiringBar array [{ id, requirement, mustHave, rationale }], compTargetBand object { min, max, currency }, successMetrics array, openQuestions array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['roleProfile', 'hiringBar', 'compTargetBand', 'openQuestions'],
      properties: {
        roleProfile: { type: 'object' },
        hiringBar: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'requirement', 'mustHave', 'rationale'],
            properties: {
              id: { type: 'string' },
              requirement: { type: 'string' },
              mustHave: { type: 'boolean' },
              rationale: { type: 'string' },
            },
          },
        },
        compTargetBand: { type: 'object' },
        successMetrics: { type: 'array' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'intake'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — JD authoring (separate agent from intake, so the JD critics never
// review their own drafting agent's outputs)
// ---------------------------------------------------------------------------

export const jdAuthoringTask = defineTask('fch.jd-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author job description for ${args.roleTitle} (${args.level})`,
  agent: {
    name: 'jd-writer',
    prompt: {
      role: 'Job-description writer',
      task: `Write the job description markdown artifact at ${args.jdTargetPath}`,
      context: args,
      instructions: [
        `Write the full JD as markdown to exactly ${args.jdTargetPath} (create parent directories if needed) and return that path as jdPath.`,
        'Every requirement in the JD MUST map to a hiringBar entry id — report the mapping as requirementsMapped [{ jdRequirement, barId }]. A JD requirement with no bar entry is a defect, not a stylistic choice.',
        'Use inclusive, accessible language: no gendered/coded/ageist phrasing, no culture-fit euphemisms, no years-of-experience proxies beyond what the bar rationale justifies.',
        'Include: role mission, responsibilities, must-have requirements, nice-to-haves, comp band statement, and a standard contingency clause noting any offer is contingent on jurisdiction-appropriate pre-employment verification (background checks are out of scope for this workflow).',
        'Honor priorKnowledge insights (recalled comp bands and hiring outcomes) where relevant.',
      ],
      outputFormat: 'JSON with jdPath string, requirementsMapped array [{ jdRequirement, barId }]',
    },
    outputSchema: {
      type: 'object',
      required: ['jdPath', 'requirementsMapped'],
      properties: {
        jdPath: { type: 'string' },
        requirementsMapped: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'jd'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — sourcing plan, outreach drafting (policy-gated), sourcing execution
// ---------------------------------------------------------------------------

export const sourcingPlanTask = defineTask('fch.sourcing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sourcing plan for ${args.roleTitle} (${args.level})`,
  agent: {
    name: 'sourcing-strategist',
    prompt: {
      role: 'Sourcing strategist',
      task: 'Develop the candidate sourcing plan for the gate-approved JD',
      context: args,
      instructions: [
        `Plan sourcing across the requested channels (${(args.sourcingChannels || []).join(', ')}): channel selection, boolean search strings, diversity strategy, and per-channel candidate targets.`,
        'Use recalled channel-efficacy facts in priorKnowledge to weight per-channel targets; where no prior facts exist, state the assumption behind each target instead of inventing history.',
        'Plan only — no outreach is drafted or sent in this task; outbound outreach is drafted separately and policy-gated.',
      ],
      outputFormat: 'JSON with channels array, searchStrings array, diversityStrategy object, perChannelTargets array [{ channel, target, rationale }]',
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'searchStrings', 'diversityStrategy', 'perChannelTargets'],
      properties: {
        channels: { type: 'array' },
        searchStrings: { type: 'array' },
        diversityStrategy: { type: 'object' },
        perChannelTargets: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'sourcing'],
}));

export const outreachDraftingTask = defineTask('fch.outreach-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Redraft outreach batch for ${args.roleTitle} (recruiting-lead feedback)`
    : `Draft outreach batch for ${args.roleTitle}`,
  agent: {
    name: 'recruiter',
    prompt: {
      role: 'Recruiter drafting outbound candidate outreach',
      task: 'Draft ONE batch outreach artifact (templates + target segments) for recruiting-lead approval — nothing is sent in this task',
      context: args,
      instructions: [
        `Write ONE batch artifact under the artifacts directory (${args.artifactsDir}) containing the outreach templates per channel and the target segments they address, and return its path as batchArtifactPath.`,
        'This is BATCH-LEVEL drafting: templates + segments, NOT per-candidate sends. No outreach is executed here — the send-candidate-outreach policy gate decides whether these drafts ever go out.',
        'Templates must represent the company accurately: role, level, comp band statement from the approved JD, and an honest process description. No pressure tactics.',
        args.feedback
          ? `Redraft round: address ONLY this recruiting-lead feedback and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no rejection feedback to address.',
      ],
      outputFormat: 'JSON with batchArtifactPath string, templates array [{ channel, template }], targetSegments array',
    },
    outputSchema: {
      type: 'object',
      required: ['batchArtifactPath', 'templates', 'targetSegments'],
      properties: {
        batchArtifactPath: { type: 'string' },
        templates: { type: 'array' },
        targetSegments: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'outreach'],
}));

export const sourcingExecutionTask = defineTask('fch.sourcing-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: args.outreachApproved
    ? `Execute full sourcing plan for ${args.roleTitle}`
    : `Execute inbound-only sourcing for ${args.roleTitle} (outreach not approved)`,
  agent: {
    name: 'recruiter',
    prompt: {
      role: 'Recruiter executing the sourcing plan',
      task: 'Execute candidate sourcing and return the sourced candidate pipeline',
      context: args,
      instructions: [
        args.outreachApproved
          ? 'outreachApproved is TRUE: execute the full sourcing plan including the approved outbound outreach batch (use ONLY the approved templates verbatim).'
          : 'outreachApproved is FALSE: the recruiting-lead did NOT approve outbound outreach. Do NOT send any outbound messages and do NOT improvise alternative outreach — execute inbound, referral, and job-post channels only.',
        'Return candidates [{ candidateId, name, channel, profileSummary }] with per-channel channelMetrics { channel, sourced }.',
        'Report honest counts — an empty pipeline is a valid result, not something to pad.',
      ],
      outputFormat: 'JSON with candidatesSourced number, candidates array [{ candidateId, name, channel, profileSummary }], channelMetrics array [{ channel, sourced }]',
    },
    outputSchema: {
      type: 'object',
      required: ['candidatesSourced', 'candidates', 'channelMetrics'],
      properties: {
        candidatesSourced: { type: 'number' },
        candidates: { type: 'array' },
        channelMetrics: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'sourcing'],
}));

// ---------------------------------------------------------------------------
// Phase 5 — parallel resume screening (batch fan-out)
// ---------------------------------------------------------------------------

export const resumeScreenTask = defineTask('fch.resume-screen', (args, taskCtx) => ({
  kind: 'agent',
  title: `Screen resume batch ${args.batchIndex + 1}/${args.batchCount} for ${args.roleTitle}`,
  agent: {
    name: 'screening-specialist',
    prompt: {
      role: 'Resume-screening specialist',
      task: 'Screen this candidate batch strictly against the gate-approved JD and hiring bar',
      context: args,
      instructions: [
        `Score each candidate in the batch against the gate-approved JD at ${args.jdPath} and the hiringBar entries — the bar is the ONLY rubric; ad-hoc criteria are not allowed.`,
        'For every candidate return a rationale keyed to specific hiringBar entry ids (met / not met / unclear), then classify as shortlisted or rejected.',
        'Nice-to-haves may rank candidates but must never reject one; only must-have gaps reject.',
        'Report honest per-candidate reasoning — no quota for either bucket.',
      ],
      outputFormat: 'JSON with screened number, shortlisted array [{ candidateId, name, rationale }], rejected array [{ candidateId, name, rationale }]',
    },
    outputSchema: {
      type: 'object',
      required: ['screened', 'shortlisted', 'rejected'],
      properties: {
        screened: { type: 'number' },
        shortlisted: { type: 'array' },
        rejected: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'screening'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — interview plan + per-candidate interview rounds (fan-out)
// ---------------------------------------------------------------------------

export const interviewPlanTask = defineTask('fch.interview-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview plan for ${args.roleTitle} (${(args.interviewStages || []).join(' -> ')})`,
  agent: {
    name: 'interview-coordinator',
    prompt: {
      role: 'Interview coordinator',
      task: 'Design the interview panel, per-stage guides, and the shared scorecard template',
      context: args,
      instructions: [
        `Build the plan for stages ${JSON.stringify(args.interviewStages)}: panel composition (interviewer role per stage), a guide per stage, and ONE shared scorecardTemplate.`,
        'The scorecardTemplate is what makes calibration possible: competency list derived from hiringBar entries, a 1-5 scale with per-level anchors, a mandatory evidence-quote field per competency, and an overall recommendation field.',
        'Each stage guide maps its questions to hiringBar entry ids so interviewers assess the bar, not vibes.',
        'The recruiter-screen stage folds in classic phone-screen coverage (motivation, logistics, comp expectations) so it participates in calibration like every other stage.',
      ],
      outputFormat: 'JSON with panel array [{ stage, interviewer, role }], stageGuides array [{ stage, guide, barIds }], scorecardTemplate object',
    },
    outputSchema: {
      type: 'object',
      required: ['panel', 'stageGuides', 'scorecardTemplate'],
      properties: {
        panel: { type: 'array' },
        stageGuides: { type: 'array' },
        scorecardTemplate: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'interview-plan'],
}));

export const interviewRoundTask = defineTask('fch.interview-round', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview round for candidate ${args.candidate.candidateId} (${args.roleTitle})`,
  agent: {
    name: 'interview-panel',
    prompt: {
      role: 'Interview panel executing all stages for one candidate',
      task: `Run every interview stage for candidate ${args.candidate.candidateId} and write one scorecard FILE per interviewer per stage`,
      context: args,
      instructions: [
        `Run all stages in the interview plan for this candidate, in order: ${JSON.stringify((args.interviewStages || []))}.`,
        `Write ONE scorecard artifact per interviewer per stage under ${args.scorecardDir} (create it if needed), using the shared scorecardTemplate: competency scores 1-5, a verbatim evidence quote per scored competency, and a recommendation.`,
        'Scorecards are FILES, not inline JSON — the panel-calibration critics audit the actual files, so every score must live in a written artifact with its evidence.',
        'A score without an evidence quote is invalid; leave the score empty and note the gap rather than fabricating evidence.',
        'Return candidateId, the full list of scorecardPaths written (at least one), and per-stage stageOutcomes [{ stage, outcome }].',
      ],
      outputFormat: 'JSON with candidateId string, scorecardPaths array of file paths (min 1), stageOutcomes array [{ stage, outcome }]',
    },
    outputSchema: {
      type: 'object',
      required: ['candidateId', 'scorecardPaths', 'stageOutcomes'],
      properties: {
        candidateId: { type: 'string' },
        scorecardPaths: { type: 'array', minItems: 1 },
        stageOutcomes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'interview-round'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — debrief + decision
// ---------------------------------------------------------------------------

export const debriefDecisionTask = defineTask('fch.debrief-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debrief + hiring decision for ${args.roleTitle} (${args.candidateCount} candidates)`,
  agent: {
    name: 'hiring-committee',
    prompt: {
      role: 'Hiring committee running the debrief',
      task: 'Decide selected, backup, and rejected candidates from the scorecard evidence and calibration findings',
      context: args,
      instructions: [
        `Read the scorecard index at ${args.scorecardIndexPath} and base every judgment on the scorecard files it lists.`,
        `Select up to ${args.headcount} candidate(s); classify the rest as backupCandidates or rejectedCandidates.`,
        'decisionRationale MUST cite specific scorecard file paths for every selected and rejected candidate — an uncited decision is invalid.',
        'Weigh calibrationFindings explicitly: where the calibration gate flagged a scorecard, say how the flag affected (or did not affect) the decision.',
        'For each selected candidate propose compensation within the intake compTargetBand — proposals outside the band must be flagged, not smuggled.',
      ],
      outputFormat: 'JSON with selectedCandidates array [{ candidateId, name }], backupCandidates array, rejectedCandidates array [{ candidateId, name }], decisionRationale string (cites scorecard paths), compProposals array [{ candidateId, salary, equity, signOn, currency }]',
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCandidates', 'rejectedCandidates', 'decisionRationale', 'compProposals'],
      properties: {
        selectedCandidates: { type: 'array' },
        backupCandidates: { type: 'array' },
        rejectedCandidates: { type: 'array' },
        decisionRationale: { type: 'string' },
        compProposals: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'decision'],
}));

// ---------------------------------------------------------------------------
// Phase 9 — comp package (policy-gated) then offer letter + extension (policy-gated)
// ---------------------------------------------------------------------------

export const compPackageTask = defineTask('fch.comp-package', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise comp package for ${args.candidate.candidateId} (${args.roleTitle})`
    : `Draft comp package for ${args.candidate.candidateId} (${args.roleTitle})`,
  agent: {
    name: 'comp-analyst',
    prompt: {
      role: 'Compensation analyst',
      task: 'Draft the full compensation package artifact for compensation-lead approval',
      context: args,
      instructions: [
        `Draft the complete package (salary, equity, sign-on, benefits) for the selected candidate and write it as an artifact under ${args.artifactsDir}, returning its path as packageArtifactPath.`,
        'The package MUST stay within the intake compTargetBand and honor recalled comp-band facts in priorKnowledge; if the committee proposal exceeds the band, flag the excess explicitly for the compensation-lead instead of normalizing it away.',
        'Return the package itself as a structured object — this exact object is what the offer letter must reproduce verbatim if approved.',
        args.feedback
          ? `Revision round: address ONLY this feedback (compensation-lead rejection or candidate counter) and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no revision feedback to address.',
      ],
      outputFormat: 'JSON with packageArtifactPath string, package object { salary, equity, signOn, benefits, currency }',
    },
    outputSchema: {
      type: 'object',
      required: ['packageArtifactPath', 'package'],
      properties: {
        packageArtifactPath: { type: 'string' },
        package: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'compensation'],
}));

export const offerLetterTask = defineTask('fch.offer-letter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft offer letter for ${args.candidate.candidateId} (${args.roleTitle})`,
  agent: {
    name: 'recruiter',
    prompt: {
      role: 'Recruiter drafting the formal offer letter',
      task: 'Draft the offer letter using EXACTLY the approved compensation package',
      context: args,
      instructions: [
        `Write the offer letter artifact under ${args.artifactsDir} and return its path as offerLetterPath.`,
        'terms MUST equal the approvedPackage in the context VERBATIM — same fields, same values. Any deviation is a bug, not a negotiation; the orchestrator verifies this and throws on mismatch.',
        'Include the standard contingency clause: the offer is contingent on jurisdiction-appropriate pre-employment verification.',
        'The letter states the role title, level, and start-date placeholder alongside the approved terms; it invents no additional commitments.',
      ],
      outputFormat: 'JSON with offerLetterPath string, terms object (verbatim copy of the approved package)',
    },
    outputSchema: {
      type: 'object',
      required: ['offerLetterPath', 'terms'],
      properties: {
        offerLetterPath: { type: 'string' },
        terms: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'offer'],
}));

export const offerOutcomeTask = defineTask('fch.offer-outcome', (args, taskCtx) => ({
  kind: 'agent',
  title: `Track offer outcome for ${args.candidate.candidateId} (${args.roleTitle})`,
  agent: {
    name: 'recruiter',
    prompt: {
      role: 'Recruiter tracking the extended offer',
      task: 'Track the candidate response to the extended offer',
      context: args,
      instructions: [
        'Track the candidate response to the extended offer and report status: accepted, declined, or countered.',
        'On countered: report the counter terms faithfully — do NOT negotiate; counters re-enter the compensation-approval gate upstream.',
        'On accepted: report the accepted terms (they must match the extended terms) and any agreed start date.',
        'Never fabricate a response; if the outcome is genuinely unknown, that is a declined-to-answer state to surface, not a guess to make.',
      ],
      outputFormat: 'JSON with status string (accepted|declined|countered), terms object (the terms as responded-to; counter terms when countered), startDate string when accepted',
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'terms'],
      properties: {
        status: { type: 'string', enum: ['accepted', 'declined', 'countered'] },
        terms: { type: 'object' },
        startDate: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'offer'],
}));

// ---------------------------------------------------------------------------
// Phase 10 — rejection comms (policy-gated batch)
// ---------------------------------------------------------------------------

export const rejectionCommsDraftTask = defineTask('fch.rejection-comms-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Redraft rejection notices for ${args.roleTitle} (recruiting-lead feedback)`
    : `Draft rejection notices for ${args.roleTitle} (${args.candidates.length} candidates)`,
  agent: {
    name: 'recruiter',
    prompt: {
      role: 'Recruiter drafting candidate rejection communications',
      task: 'Draft ONE batch artifact of personalized rejection notices for recruiting-lead approval — nothing is sent in this task',
      context: args,
      instructions: [
        `Write ONE batch artifact under ${args.artifactsDir} containing a personalized rejection notice per interviewed non-selected candidate, and return its path as batchArtifactPath.`,
        'Each notice: respectful, specific enough to be honest (stage reached), free of fabricated feedback, and consistent with the company voice. No legal-risk phrasing (no protected-class references, no comparative rankings).',
        'This is BATCH-LEVEL drafting: the send-rejection-comms policy gate decides whether the batch goes out; nothing is sent here.',
        args.feedback
          ? `Redraft round: address ONLY this recruiting-lead feedback and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First drafting round: no rejection feedback to address.',
      ],
      outputFormat: 'JSON with batchArtifactPath string, notices array [{ candidateId, notice }]',
    },
    outputSchema: {
      type: 'object',
      required: ['batchArtifactPath', 'notices'],
      properties: {
        batchArtifactPath: { type: 'string' },
        notices: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'rejection-comms'],
}));

export const rejectionSendTask = defineTask('fch.rejection-send', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send approved rejection notices for ${args.roleTitle} (${args.notices.length} notices)`,
  agent: {
    name: 'recruiter',
    prompt: {
      role: 'Recruiter sending the approved rejection batch',
      task: 'Send exactly the approved rejection notices and report per-notice delivery',
      context: args,
      instructions: [
        `Send the approved batch at ${args.batchArtifactPath} — the notices exactly as approved, no edits after approval.`,
        'Report per-notice delivery: sent [{ candidateId }] and failures [{ candidateId, error }].',
        'NEVER swallow failures — a delivery failure goes in the failures array with its error, it is not retried into silence or dropped.',
      ],
      outputFormat: 'JSON with sent array [{ candidateId }], failures array [{ candidateId, error }]',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'failures'],
      properties: {
        sent: { type: 'array' },
        failures: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'rejection-comms'],
}));

// ---------------------------------------------------------------------------
// Phase 11 — funnel analytics + hiring retro
// ---------------------------------------------------------------------------

export const funnelAnalyticsTask = defineTask('fch.funnel-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Funnel analytics for ${args.roleTitle} (${args.level})`,
  agent: {
    name: 'recruiting-analyst',
    prompt: {
      role: 'Recruiting analyst',
      task: 'Compute funnel stage conversions and channel efficacy, compared against recalled benchmarks',
      context: args,
      instructions: [
        'From the funnel counts in context compute stageConversion [{ from, to, fromCount, toCount, rate }] for every adjacent stage pair (sourced -> screened -> shortlisted -> interviewed -> offersExtended -> hires).',
        'Compute channelEfficacy [{ channel, sourced, advanced }] from the channel metrics and screening results.',
        'Compare every conversion against the recalled benchmarks in priorKnowledge as benchmarksComparison — where no benchmark exists, say so explicitly rather than inventing a baseline.',
        'Rates come from the provided counts only; never adjust numbers to look healthier.',
      ],
      outputFormat: 'JSON with stageConversion array [{ from, to, fromCount, toCount, rate }], channelEfficacy array [{ channel, sourced, advanced }], benchmarksComparison array',
    },
    outputSchema: {
      type: 'object',
      required: ['stageConversion', 'channelEfficacy', 'benchmarksComparison'],
      properties: {
        stageConversion: { type: 'array' },
        channelEfficacy: { type: 'array' },
        benchmarksComparison: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'analytics'],
}));

export const hiringRetroTask = defineTask('fch.hiring-retro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hiring retro report for ${args.roleTitle} (run ${args.runId})`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical writer producing the hiring retrospective',
      task: `Write the hiring retro markdown report at ${args.reportTargetPath}`,
      context: args,
      instructions: [
        `Write the retro to exactly ${args.reportTargetPath} and return that path as reportPath.`,
        'Sections, in order: Funnel (counts + stage conversions), Gate verdicts (JD review and panel calibration, with their evidence references), Policy decisions, Calibration findings, Retro insights.',
        'The Policy decisions section is MANDATORY and must list EVERY policy-gated action from policyDecisions in context with its approver-or-auto provenance: actionId, approved, response, and whether it was autoApproved by the harness (non-interactive run) versus decided by a human.',
        'Retro insights: what this run should teach the next one (bar quality, gate findings, channel efficacy, comp accuracy). Insights must trace to data in this run.',
      ],
      outputFormat: 'JSON with reportPath string, insights array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'insights'],
      properties: {
        reportPath: { type: 'string' },
        insights: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'fch', 'hiring', 'retro'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    roleTitle,
    level,
    headcount = 1,
    department,
    hiringManager,
    requirementsBrief,
    compBandHint,
    sourcingChannels = ['linkedin', 'referrals', 'careers-page'],
    interviewStages = ['recruiter-screen', 'technical', 'panel', 'final'],
    screenBatchSize = 10,
    maxParallel = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: the required identity of the search is caller responsibility.
  if (!roleTitle) {
    throw new Error(`full-cycle-hiring-workflow: roleTitle is required (got ${JSON.stringify(roleTitle)})`);
  }
  if (!level) {
    throw new Error(`full-cycle-hiring-workflow: level is required (got ${JSON.stringify(level)})`);
  }
  if (!requirementsBrief) {
    throw new Error(`full-cycle-hiring-workflow: requirementsBrief is required (got ${JSON.stringify(requirementsBrief)})`);
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const policyDecisions = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { roleTitle, level, headcount, department, hiringManager, artifactsDir };

  // Records one raise of a policy-gated breakpoint into the audit array. A
  // non-interactive harness resolution carries autoApproved:true on the result;
  // that provenance is surfaced here AND in the retro's Policy decisions section.
  const recordPolicyDecision = (actionId, result) => {
    policyDecisions.push({
      actionId,
      approved: result.approved === true,
      response: result.response || result.feedback || null,
      autoApproved: result.autoApproved === true,
    });
  };

  // Phase 0 — kip recall: prior comp bands, funnel benchmarks, and channel
  // efficacy feed intake, sourcing planning, and funnel analytics.
  ctx.log?.('info', 'Phase 0: kip recall of prior hiring-recruiting facts');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'hiring-recruiting',
      topic: `comp bands, funnel pass-through benchmarks, and sourcing-channel efficacy for ${roleTitle} (${level})`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — role intake + hiring bar. SPARSE breakpoint rule: the
  // hiring-bar-ambiguity breakpoint is raised ONLY when intake reports
  // genuinely blocking open questions; a clear brief raises nothing.
  ctx.log?.('info', 'Phase 1: role intake + hiring bar');
  let intake = await ctx.task(roleIntakeTask, {
    ...sharedArgs, requirementsBrief, compBandHint, priorKnowledge,
  });
  if (Array.isArray(intake.openQuestions) && intake.openQuestions.length > 0) {
    const ambiguity = await routedBreakpoint(ctx, {
      question: `Role intake for ${roleTitle} (${level}) has ${intake.openQuestions.length} open question(s) blocking a defensible hiring bar. Please answer them.`,
      context: {
        runId: ctx.runId,
        openQuestions: intake.openQuestions,
        hiringBar: intake.hiringBar,
        compTargetBand: intake.compTargetBand,
      },
    }, {
      breakpointId: 'fch.hiring-bar-ambiguity',
      expert: 'hiring-manager',
      tags: ['hiring', 'intake'],
      strategy: 'single',
    });
    breakpointsHit.push('fch.hiring-bar-ambiguity');
    // One revision pass folds the hiring-manager response back into the bar.
    intake = await ctx.task(roleIntakeTask, {
      ...sharedArgs, requirementsBrief, compBandHint, priorKnowledge,
      feedback: ambiguity.response || ambiguity.feedback || null,
      attempt: 2,
    });
  }
  timings.intake = ctx.now() - startTime;

  // Phase 2 — JD authoring, by a separate agent from intake so the JD critics
  // never review their own drafting agent's outputs.
  ctx.log?.('info', 'Phase 2: JD authoring');
  const jdTargetPath = join(artifactsDir, `jd-${kebab(roleTitle)}.md`);
  const jd = await ctx.task(jdAuthoringTask, {
    ...sharedArgs, jdTargetPath,
    roleProfile: intake.roleProfile,
    hiringBar: intake.hiringBar,
    compTargetBand: intake.compTargetBand,
    priorKnowledge,
  });
  artifacts.push(jd.jdPath);
  timings.jdAuthoring = ctx.now() - startTime;

  // Phase 3 — adversarial JD review gate: inclusive-language and
  // requirements-inflation critics with mandatory jdPath:line evidence.
  // Must pass (or be owner-accepted at escalation) before ANY sourcing.
  ctx.log?.('info', 'Phase 3: adversarial JD review gate');
  const jdReview = await adversarialGate(ctx, {
    gateId: 'fch.jd-review',
    artifact: { path: jd.jdPath, description: 'Job description under review' },
    critics: [
      {
        name: 'inclusive-language-critic',
        role: 'Inclusive-language reviewer',
        focus: 'gendered/coded/ageist phrasing, culture-fit euphemisms, accessibility of requirements language',
      },
      {
        name: 'requirements-inflation-critic',
        role: 'Requirements-inflation reviewer',
        focus: 'every JD requirement traceable to a hiringBar entry with rationale; years-of-experience proxies and credential inflation are findings',
      },
    ],
    ironLaw: [
      'Read the JD file yourself; every issue and evidence entry MUST cite jdPath:line.',
      'Inclusive-language: flag gendered/coded/ageist phrasing, culture-fit euphemisms, inaccessible requirements phrasing.',
      'Requirements-inflation: flag every requirement not traceable to the hiring bar — cite the JD line AND the missing bar rationale; years-of-experience proxies and credential inflation fail the gate.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { hiringBar: intake.hiringBar, roleProfile: intake.roleProfile, priorKnowledge },
  });
  if (jdReview.escalated) {
    breakpointsHit.push('fch.jd-review.gate-escalation');
  }
  timings.jdReview = ctx.now() - startTime;

  if (!jdReview.passed) {
    // Escalation rejected: the JD is not fit to source against. Sourcing does
    // NOT happen on a failed JD gate — record and stop, never proceed silently.
    return {
      success: false,
      jdPath: jd.jdPath,
      gateResults: { jdReview, panelCalibration: null },
      funnel: { sourced: 0, screened: 0, shortlisted: 0, interviewed: 0, offersExtended: 0, hires: 0, stageConversion: [] },
      policyDecisions,
      offer: { compApproved: false, extended: false, accepted: false, terms: null },
      rejections: { drafted: 0, approved: false, sent: 0 },
      calibrationFindings: [],
      kipFactsAsserted: 0,
      artifacts,
      metadata: {
        processId: 'human-resources/full-cycle-hiring-workflow',
        runId: ctx.runId,
        breakpointsHit,
        timings,
        reason: 'JD review gate failed and the owner rejected the escalation — sourcing never started',
      },
    };
  }

  // Phase 4 — sourcing plan, then policy-gated outbound outreach. One batch
  // approval per outreach wave; a rejection buys exactly one redraft at the
  // SAME breakpointId; a second rejection means outbound outreach is NOT
  // executed (no alternative send) and sourcing runs inbound-only.
  ctx.log?.('info', 'Phase 4: sourcing plan + policy-gated outreach');
  const sourcingPlan = await ctx.task(sourcingPlanTask, {
    ...sharedArgs, sourcingChannels, jdPath: jd.jdPath, hiringBar: intake.hiringBar, priorKnowledge,
  });

  let outreach = await ctx.task(outreachDraftingTask, {
    ...sharedArgs, sourcingPlan, jdPath: jd.jdPath, compTargetBand: intake.compTargetBand,
  });
  let outreachApproved = false;
  let outreachFeedback = null;
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      outreach = await ctx.task(outreachDraftingTask, {
        ...sharedArgs, sourcingPlan, jdPath: jd.jdPath, compTargetBand: intake.compTargetBand,
        feedback: outreachFeedback,
      });
    }
    const decision = await routedBreakpoint(ctx, {
      question: `Approve sending this candidate outreach batch for ${roleTitle} (${level})? One approval covers the whole wave. Reject with feedback for one redraft; a second rejection means no outbound outreach is sent.`,
      context: {
        runId: ctx.runId,
        files: [{ path: outreach.batchArtifactPath, label: 'Outreach batch artifact' }],
        templates: outreach.templates,
        targetSegments: outreach.targetSegments,
      },
    }, {
      breakpointId: 'send-candidate-outreach',
      expert: 'recruiting-lead',
      tags: ['policy-gated', 'hiring'],
      strategy: 'single',
    });
    breakpointsHit.push('send-candidate-outreach');
    recordPolicyDecision('send-candidate-outreach', decision);
    if (decision.approved) { outreachApproved = true; break; }
    outreachFeedback = decision.response || decision.feedback || 'Changes requested';
  }
  artifacts.push(outreach.batchArtifactPath);

  const sourcing = await ctx.task(sourcingExecutionTask, {
    ...sharedArgs,
    sourcingPlan,
    outreachApproved,
    outreachBatch: outreachApproved ? outreach : null,
    jdPath: jd.jdPath,
  });
  timings.sourcing = ctx.now() - startTime;

  // Phase 5 — parallel resume screening. Deterministic batching in process
  // code, then a bounded fan-out; results merged by plain concatenation.
  ctx.log?.('info', `Phase 5: parallel resume screening (${sourcing.candidates.length} candidates)`);
  const batches = chunk(sourcing.candidates, screenBatchSize)
    .map((batch, batchIndex) => ({ batch, batchIndex }));
  const screenResults = await ctx.parallel.map(
    batches,
    ({ batch, batchIndex }) => ctx.task(resumeScreenTask, {
      ...sharedArgs,
      batch,
      batchIndex,
      batchCount: batches.length,
      hiringBar: intake.hiringBar,
      jdPath: jd.jdPath,
    }),
    { maxConcurrency: maxParallel },
  );
  const screenedCount = screenResults.reduce((sum, r) => sum + r.screened, 0);
  const shortlist = screenResults.flatMap((r) => r.shortlisted);
  const screenRejected = screenResults.flatMap((r) => r.rejected);
  timings.screening = ctx.now() - startTime;

  // Phase 6 — interview plan + per-candidate interview rounds. Every round
  // writes scorecard FILES; process code then writes the deterministic
  // scorecards/index.json the calibration critics audit.
  ctx.log?.('info', `Phase 6: interview loop (${shortlist.length} candidates)`);
  const interviewPlan = await ctx.task(interviewPlanTask, {
    ...sharedArgs, interviewStages, hiringBar: intake.hiringBar, jdPath: jd.jdPath,
  });
  const scorecardsRoot = join(artifactsDir, 'scorecards');
  const interviewRounds = await ctx.parallel.map(
    shortlist,
    (candidate) => ctx.task(interviewRoundTask, {
      ...sharedArgs,
      candidate,
      interviewStages,
      interviewPlan,
      hiringBar: intake.hiringBar,
      scorecardDir: join(scorecardsRoot, String(candidate.candidateId)),
    }),
    { maxConcurrency: maxParallel },
  );

  // Deterministic index written by PROCESS CODE — sorted, so critics audit a
  // stable manifest of real files rather than an interviewer's summary.
  const scorecardIndexPath = join(scorecardsRoot, 'index.json');
  const indexEntries = interviewRounds
    .map((round) => ({
      candidateId: round.candidateId,
      scorecardPaths: [...round.scorecardPaths].sort(),
      stageOutcomes: round.stageOutcomes,
    }))
    .sort((a, b) => String(a.candidateId).localeCompare(String(b.candidateId)));
  mkdirSync(dirname(scorecardIndexPath), { recursive: true });
  writeFileSync(
    scorecardIndexPath,
    JSON.stringify({ generatedBy: 'process-code', runId: ctx.runId, candidates: indexEntries }, null, 2),
  );
  artifacts.push(scorecardIndexPath);
  timings.interviews = ctx.now() - startTime;

  // Phase 7 — panel-calibration adversarial gate over the ACTUAL scorecard
  // files. Findings (resolved or not) ride into the debrief and kipAssert.
  ctx.log?.('info', 'Phase 7: panel-calibration adversarial gate');
  const panelCalibration = await adversarialGate(ctx, {
    gateId: 'fch.panel-calibration',
    artifact: { path: scorecardIndexPath, description: 'Index of all interview scorecard artifacts' },
    critics: [
      {
        name: 'interviewer-bias-critic',
        role: 'Interviewer-bias reviewer',
        focus: 'halo/horns, evidence-free scores, asymmetric criteria application, language drift across candidates',
      },
      {
        name: 'score-consistency-critic',
        role: 'Score-consistency reviewer',
        focus: 'rubric drift across interviewers, recommendation-vs-score contradictions, cross-candidate score drift for equivalent evidence',
      },
    ],
    ironLaw: [
      'Open and read the ACTUAL scorecard files listed in the index — verdicts about scorecards you did not open are protocol failures.',
      'PER-SCORECARD EVIDENCE: every evidence entry must cite a specific scorecard file path and the field/line examined; every issue names the scorecard(s).',
      'Bias critic: halo/horns, evidence-free scores, asymmetric criteria application, language differences across demographics.',
      'Consistency critic: rubric drift across interviewers, recommendation-vs-score contradictions, cross-candidate score drift for equivalent evidence.',
    ],
    maxFixAttempts,
    fixer: {
      args: {
        note: 'Fixer re-opens debrief items with flagged interviewers to re-ground scores in evidence — it NEVER rewrites scores itself; unresolvable flags stay as findings.',
      },
    },
    context: { hiringBar: intake.hiringBar, interviewPlan },
  });
  if (panelCalibration.escalated) {
    breakpointsHit.push('fch.panel-calibration.gate-escalation');
  }
  const calibrationFindings = panelCalibration.issues;
  timings.panelCalibration = ctx.now() - startTime;

  // Phase 8 — debrief + decision. No breakpoint here: the two offer gates are
  // the approvals. Calibration findings are weighed explicitly in the decision.
  ctx.log?.('info', 'Phase 8: debrief + decision');
  const decision = await ctx.task(debriefDecisionTask, {
    ...sharedArgs,
    scorecardIndexPath,
    candidateCount: shortlist.length,
    calibrationFindings,
    compTargetBand: intake.compTargetBand,
    hiringBar: intake.hiringBar,
    priorKnowledge,
  });
  timings.decision = ctx.now() - startTime;

  // Phase 9 — comp approval THEN offer extension, sequenced policy gates.
  // The compensation-lead gate is a hard pre-gate of any offer artifact: a
  // second rejection means NO offer exists, honestly recorded — never a
  // work-around package. Candidate counters re-enter the SAME comp gate id
  // for at most one re-negotiation cycle.
  ctx.log?.('info', 'Phase 9: comp approval + offer extension');
  const offer = { compApproved: false, extended: false, accepted: false, terms: null };
  let offersExtended = 0;
  let offerOutcomeStatus = null;
  const selectedCandidate = decision.selectedCandidates[0] ?? null;

  // Extends one offer for an already-approved package: letter (verbatim-terms
  // verified in process code), the extend-offer gate, then outcome tracking.
  const runOfferExtension = async (approvedPackage, cycle) => {
    const letter = await ctx.task(offerLetterTask, {
      ...sharedArgs, candidate: selectedCandidate, approvedPackage, cycle,
    });
    // The letter's terms must equal the approved package VERBATIM — a
    // deviation here is a bug in the drafting agent, never a negotiation.
    if (JSON.stringify(letter.terms) !== JSON.stringify(approvedPackage)) {
      throw new Error(
        `fch.offer-letter terms deviate from the approved compensation package (cycle ${cycle}): ` +
        `approved=${JSON.stringify(approvedPackage)} letter=${JSON.stringify(letter.terms)}`
      );
    }
    artifacts.push(letter.offerLetterPath);
    const extendDecision = await routedBreakpoint(ctx, {
      question: `Extend this offer to candidate ${selectedCandidate.candidateId} for ${roleTitle} (${level})? The terms are exactly the compensation-lead-approved package.`,
      context: {
        runId: ctx.runId,
        files: [{ path: letter.offerLetterPath, label: 'Offer letter' }],
        candidate: selectedCandidate,
        terms: letter.terms,
        cycle,
      },
    }, {
      breakpointId: 'extend-offer',
      expert: 'hiring-manager',
      tags: ['policy-gated', 'hiring'],
      strategy: 'single',
    });
    breakpointsHit.push('extend-offer');
    recordPolicyDecision('extend-offer', extendDecision);
    if (!extendDecision.approved) {
      // Rejected extension: the offer is NOT extended — recorded, no re-route.
      return { extended: false, letter, outcome: null };
    }
    offersExtended += 1;
    const outcome = await ctx.task(offerOutcomeTask, {
      ...sharedArgs, candidate: selectedCandidate, extendedTerms: letter.terms, cycle,
    });
    return { extended: true, letter, outcome };
  };

  // Raises the approve-compensation-package gate once (same id every time).
  const raiseCompGate = async (pkg, label) => {
    const compDecision = await routedBreakpoint(ctx, {
      question: `Approve this compensation package for candidate ${selectedCandidate.candidateId} (${roleTitle}, ${level})? ${label}`,
      context: {
        runId: ctx.runId,
        files: [{ path: pkg.packageArtifactPath, label: 'Compensation package' }],
        candidate: selectedCandidate,
        package: pkg.package,
        compTargetBand: intake.compTargetBand,
      },
    }, {
      breakpointId: 'approve-compensation-package',
      expert: 'compensation-lead',
      tags: ['policy-gated', 'hiring'],
      strategy: 'single',
    });
    breakpointsHit.push('approve-compensation-package');
    recordPolicyDecision('approve-compensation-package', compDecision);
    return compDecision;
  };

  if (selectedCandidate) {
    const compProposal = decision.compProposals.find(
      (p) => p.candidateId === selectedCandidate.candidateId,
    ) ?? null;
    let compPkg = await ctx.task(compPackageTask, {
      ...sharedArgs,
      candidate: selectedCandidate,
      compProposal,
      compTargetBand: intake.compTargetBand,
      priorKnowledge,
    });
    let compFeedback = null;
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        compPkg = await ctx.task(compPackageTask, {
          ...sharedArgs,
          candidate: selectedCandidate,
          compProposal,
          compTargetBand: intake.compTargetBand,
          priorKnowledge,
          feedback: compFeedback,
        });
      }
      const compDecision = await raiseCompGate(
        compPkg,
        round === 0
          ? 'Rejection feedback buys one revision; a second rejection means no offer is extended.'
          : 'Revised package after your feedback; a rejection here means no offer is extended.',
      );
      if (compDecision.approved) { offer.compApproved = true; break; }
      compFeedback = compDecision.response || compDecision.feedback || 'Changes requested';
    }
    if (compPkg.packageArtifactPath) artifacts.push(compPkg.packageArtifactPath);

    if (offer.compApproved) {
      let extension = await runOfferExtension(compPkg.package, 0);
      offer.extended = extension.extended;
      if (extension.extended) {
        offer.terms = extension.letter.terms;
        let outcome = extension.outcome;
        if (outcome.status === 'countered') {
          // The counter re-enters the SAME comp gate — max ONE re-negotiation cycle.
          const revisedPkg = await ctx.task(compPackageTask, {
            ...sharedArgs,
            candidate: selectedCandidate,
            compProposal,
            compTargetBand: intake.compTargetBand,
            priorKnowledge,
            feedback: { candidateCounter: outcome.terms },
          });
          const counterDecision = await raiseCompGate(
            revisedPkg,
            'Candidate countered the extended offer; this is the single re-negotiation cycle.',
          );
          if (revisedPkg.packageArtifactPath) artifacts.push(revisedPkg.packageArtifactPath);
          if (counterDecision.approved) {
            const secondExtension = await runOfferExtension(revisedPkg.package, 1);
            if (secondExtension.extended) {
              offer.terms = secondExtension.letter.terms;
              outcome = secondExtension.outcome;
            }
          }
          // Counter rejected by the compensation-lead: the countered offer is
          // NOT re-extended — the original outcome (countered) stands, recorded.
        }
        offer.accepted = outcome.status === 'accepted';
        offerOutcomeStatus = outcome.status;
      }
    }
  }
  timings.offer = ctx.now() - startTime;

  // Phase 10 — policy-gated batch rejection comms for interviewed non-selected
  // candidates. One redraft at the same breakpointId; a second rejection means
  // the batch is NOT sent, recorded — never an alternative channel.
  ctx.log?.('info', 'Phase 10: policy-gated rejection comms');
  const selectedIds = new Set(decision.selectedCandidates.map((c) => c.candidateId));
  const interviewedNonSelected = shortlist.filter((c) => !selectedIds.has(c.candidateId));
  const rejections = { drafted: 0, approved: false, sent: 0 };
  let rejectionFailures = [];
  if (interviewedNonSelected.length > 0) {
    let rejectionDraft = await ctx.task(rejectionCommsDraftTask, {
      ...sharedArgs, candidates: interviewedNonSelected, decisionRationale: decision.decisionRationale,
    });
    rejections.drafted = rejectionDraft.notices.length;
    let rejectionFeedback = null;
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        rejectionDraft = await ctx.task(rejectionCommsDraftTask, {
          ...sharedArgs, candidates: interviewedNonSelected, decisionRationale: decision.decisionRationale,
          feedback: rejectionFeedback,
        });
        rejections.drafted = rejectionDraft.notices.length;
      }
      const sendDecision = await routedBreakpoint(ctx, {
        question: `Approve sending these ${rejectionDraft.notices.length} rejection notice(s) for ${roleTitle}? One approval covers the whole batch. Reject with feedback for one redraft; a second rejection means the batch is not sent.`,
        context: {
          runId: ctx.runId,
          files: [{ path: rejectionDraft.batchArtifactPath, label: 'Rejection notices batch' }],
          notices: rejectionDraft.notices,
        },
      }, {
        breakpointId: 'send-rejection-comms',
        expert: 'recruiting-lead',
        tags: ['policy-gated', 'hiring'],
        strategy: 'single',
      });
      breakpointsHit.push('send-rejection-comms');
      recordPolicyDecision('send-rejection-comms', sendDecision);
      if (sendDecision.approved) { rejections.approved = true; break; }
      rejectionFeedback = sendDecision.response || sendDecision.feedback || 'Changes requested';
    }
    artifacts.push(rejectionDraft.batchArtifactPath);
    if (rejections.approved) {
      const delivery = await ctx.task(rejectionSendTask, {
        ...sharedArgs,
        batchArtifactPath: rejectionDraft.batchArtifactPath,
        notices: rejectionDraft.notices,
      });
      rejections.sent = delivery.sent.length;
      rejectionFailures = delivery.failures;
    }
  }
  timings.rejections = ctx.now() - startTime;

  // Phase 11 — funnel analytics, hiring retro, kip assert.
  ctx.log?.('info', 'Phase 11: funnel analytics + hiring retro + kip assert');
  const hires = offer.accepted ? 1 : 0;
  const funnelCounts = {
    sourced: sourcing.candidatesSourced,
    screened: screenedCount,
    shortlisted: shortlist.length,
    interviewed: interviewRounds.length,
    offersExtended,
    hires,
  };
  const analytics = await ctx.task(funnelAnalyticsTask, {
    ...sharedArgs,
    funnelCounts,
    channelMetrics: sourcing.channelMetrics,
    screenRejectedCount: screenRejected.length,
    priorKnowledge,
  });

  const reportTargetPath = join(artifactsDir, `hiring-retro-${ctx.runId}.md`);
  const retro = await ctx.task(hiringRetroTask, {
    ...sharedArgs,
    runId: ctx.runId,
    reportTargetPath,
    funnelCounts,
    stageConversion: analytics.stageConversion,
    channelEfficacy: analytics.channelEfficacy,
    benchmarksComparison: analytics.benchmarksComparison,
    gateResults: { jdReview, panelCalibration },
    policyDecisions,
    calibrationFindings,
    offer,
    rejections,
    rejectionFailures,
  });
  artifacts.push(retro.reportPath);

  // kip assert — the facts array is ALWAYS non-empty: the offer-outcome fact
  // exists even on no-offer runs (status 'none' with the reason), satisfying
  // kipAssert's non-empty invariant without padding.
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const roleSubject = `role:${kebab(roleTitle)}-${kebab(level)}`;
    const facts = [];
    facts.push({
      subject: roleSubject,
      predicate: 'offer-outcome',
      object: offer.extended ? (offerOutcomeStatus ?? 'unknown') : 'none',
      props: {
        termsBand: offer.terms
          ? { salary: offer.terms.salary, currency: offer.terms.currency }
          : null,
        accepted: offer.accepted,
        runId: ctx.runId,
        ...(offer.extended
          ? {}
          : { reason: offer.compApproved ? 'offer extension not approved or no candidate' : 'compensation package not approved or no candidate selected' }),
      },
    });
    for (const conversion of analytics.stageConversion) {
      facts.push({
        subject: roleSubject,
        predicate: 'stage-conversion',
        object: `${conversion.from}->${conversion.to}`,
        props: { rate: conversion.rate, fromCount: conversion.fromCount, toCount: conversion.toCount, runId: ctx.runId },
      });
    }
    for (let i = 0; i < calibrationFindings.length; i++) {
      const finding = calibrationFindings[i];
      facts.push({
        subject: roleSubject,
        predicate: 'calibration-finding',
        object: `finding-${i + 1}`,
        props: {
          description: finding.description,
          critic: finding.critic,
          scorecardRefs: finding.location ?? null,
          runId: ctx.runId,
        },
      });
    }
    for (const channel of analytics.channelEfficacy) {
      facts.push({
        subject: roleSubject,
        predicate: 'channel-efficacy',
        object: `channel:${kebab(channel.channel)}`,
        props: { channel: channel.channel, sourced: channel.sourced, advanced: channel.advanced, runId: ctx.runId },
      });
    }
    const capture = await kipAssert(ctx, { kipDir, kipModel, kind: 'hiring-recruiting', facts });
    kipFactsAsserted = capture.asserted;
  }
  timings.close = ctx.now() - startTime;

  return {
    success: offer.accepted === true,
    jdPath: jd.jdPath,
    gateResults: { jdReview, panelCalibration },
    funnel: { ...funnelCounts, stageConversion: analytics.stageConversion },
    policyDecisions,
    offer,
    rejections,
    calibrationFindings,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'human-resources/full-cycle-hiring-workflow',
      runId: ctx.runId,
      breakpointsHit,
      timings,
    },
  };
}
