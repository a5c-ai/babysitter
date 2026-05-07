/**
 * @process methodologies/quality-gated-six-phase
 * @description Six-phase quality-gated development methodology:
 *   design → planning → implementation (subagent-TDD) → verification → debugging → finishing.
 *
 *   Distilled from joe-habu/superbabysitter@531a39c1. Each phase is exported
 *   individually so downstream processes can compose them piecemeal. The
 *   unified end-to-end process lives in
 *   library/contrib/joe-habu/superbabysitter/quality-gated-development.js.
 *
 *   Every phase task is fronted by a `ctx.breakpoint()` gate with a canonical
 *   breakpointId so users can auto-approve via rules. Reviewer/fixer loops
 *   inside the implementation phase use the robust-rejection escalation
 *   primitive `nStrikesEscalation`.
   * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:acceptance-testing, skill-area:integration-testing, skill-area:e2e-testing]
 *   workflows: [workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development]
 *   roles: [role:qa-engineer, role:tech-lead]
 */
import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Phase 1: Design -- produce a design document answering "what are we building
 * and why". Gated by a human breakpoint before planning.
 */
export const designPhaseTask = defineTask({
  id: 'qg6.design',
  kind: 'agent',
  title: 'Phase 1: Design',
  labels: ['qg6', 'design'],
  outputSchema: {
    type: 'object',
    required: ['designDoc', 'goals', 'nonGoals', 'risks'],
    properties: {
      designDoc: { type: 'string' },
      goals: { type: 'array', items: { type: 'string' } },
      nonGoals: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'Produce a design document for the requested feature.',
    'Identify goals, explicit non-goals, and the top risks.',
    'Do NOT write implementation code in this phase.',
  ].join('\n'),
});

/**
 * Phase 2: Planning -- decompose the design into an ordered, dependency-aware
 * task list suitable for the subagent-TDD loop.
 */
export const planningPhaseTask = defineTask({
  id: 'qg6.planning',
  kind: 'agent',
  title: 'Phase 2: Planning',
  labels: ['qg6', 'planning'],
  outputSchema: {
    type: 'object',
    required: ['tasks'],
    properties: {
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            context: { type: 'string' },
            dependsOn: { type: 'array', items: { type: 'number' } },
            parallelSafe: { type: 'boolean' },
          },
        },
      },
    },
  },
  instructions: [
    'Decompose the design into discrete implementation tasks.',
    'Each task must have a clear name and optional context.',
    'Declare dependsOn (task numbers) and parallelSafe where applicable.',
  ].join('\n'),
});

/**
 * Phase 3: Implementation -- per-task TDD loop with independent spec-reviewer
 * and quality-reviewer subagents, a dedicated fixer, and N-strikes escalation.
 * This is the meat of the methodology; see the unified process for the full
 * orchestration around `nStrikesEscalation` + `buildSceneContext`.
 */
export const implementationPhaseTask = defineTask({
  id: 'qg6.implementation.agent',
  kind: 'agent',
  title: 'Phase 3: Implementation (subagent-TDD)',
  labels: ['qg6', 'tdd', 'implementer'],
  outputSchema: {
    type: 'object',
    required: ['summary', 'filesChanged'],
    properties: {
      summary: { type: 'string' },
      filesChanged: { type: 'array', items: { type: 'string' } },
      architecturalDecisions: { type: 'array', items: { type: 'string' } },
      concerns: { type: 'array', items: { type: 'string' } },
      selfReviewFindings: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'Implement the assigned task using TDD: write failing tests first, then make them pass.',
    'Commit your work at the end of implementation.',
    'IRON LAW: be honest about concerns and self-review findings -- reviewers will verify.',
  ].join('\n'),
});

export const specReviewerTask = defineTask({
  id: 'qg6.spec-reviewer',
  kind: 'agent',
  title: 'Spec Compliance Reviewer',
  labels: ['qg6', 'reviewer', 'spec'],
  outputSchema: {
    type: 'object',
    required: ['passed', 'issues'],
    properties: {
      passed: { type: 'boolean' },
      issues: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'IRON LAW: Do NOT trust the implementer report. Read the actual code.',
    'Verify the implementation meets the spec and the implementer-declared concerns/selfReviewFindings.',
    'Return passed=false with specific issues if anything is missing or incorrect.',
  ].join('\n'),
});

export const qualityReviewerTask = defineTask({
  id: 'qg6.quality-reviewer',
  kind: 'agent',
  title: 'Quality Reviewer',
  labels: ['qg6', 'reviewer', 'quality'],
  outputSchema: {
    type: 'object',
    required: ['passed', 'issues'],
    properties: {
      passed: { type: 'boolean' },
      issues: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'IRON LAW: Do NOT trust the implementer report. Read the actual code.',
    'Evaluate code quality: readability, test coverage, error handling, idiomatic patterns.',
    'Return passed=false with specific issues if quality is unacceptable.',
  ].join('\n'),
});

export const fixerTask = defineTask({
  id: 'qg6.fixer',
  kind: 'agent',
  title: 'Dedicated Fixer',
  labels: ['qg6', 'fixer'],
  outputSchema: {
    type: 'object',
    required: ['summary', 'filesChanged'],
    properties: {
      summary: { type: 'string' },
      filesChanged: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'Fix ONLY the listed issues. Do not refactor unrelated code.',
    'Preserve the prior implementation where it was correct.',
  ].join('\n'),
});

/**
 * Phase 4: Verification -- deterministic gates (lint/typecheck/test-suite) after
 * implementation is complete for a batch or the whole plan.
 */
export const verificationPhaseTask = defineTask({
  id: 'qg6.verification',
  kind: 'agent',
  title: 'Phase 4: Verification',
  labels: ['qg6', 'verification'],
  outputSchema: {
    type: 'object',
    required: ['passed', 'failures'],
    properties: {
      passed: { type: 'boolean' },
      failures: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'Run the repository verification suite (lint, typecheck, unit tests, relevant e2e).',
    'Report passed=false with specific failure excerpts if anything breaks.',
  ].join('\n'),
});

/**
 * Phase 5: Debugging -- invoked only if verification fails. Diagnose and fix
 * with minimum scope. On repeated failure, escalate to a human breakpoint.
 */
export const debuggingPhaseTask = defineTask({
  id: 'qg6.debugging',
  kind: 'agent',
  title: 'Phase 5: Debugging',
  labels: ['qg6', 'debugging'],
  outputSchema: {
    type: 'object',
    required: ['resolved', 'changes'],
    properties: {
      resolved: { type: 'boolean' },
      changes: { type: 'array', items: { type: 'string' } },
      residualIssues: { type: 'array', items: { type: 'string' } },
    },
  },
  instructions: [
    'Diagnose the verification failures. Produce the minimum fix.',
    'Do not introduce new features or refactor unrelated code.',
  ].join('\n'),
});

/**
 * Phase 6: Finishing -- docs, changelog, commit hygiene, final breakpoint.
 */
export const finishingPhaseTask = defineTask({
  id: 'qg6.finishing',
  kind: 'agent',
  title: 'Phase 6: Finishing',
  labels: ['qg6', 'finishing'],
  outputSchema: {
    type: 'object',
    required: ['docsUpdated', 'commitSha'],
    properties: {
      docsUpdated: { type: 'array', items: { type: 'string' } },
      commitSha: { type: 'string' },
      changelogEntry: { type: 'string' },
    },
  },
  instructions: [
    'Update docs + changelog. Ensure commits are clean and messages informative.',
  ].join('\n'),
});

export const phases = {
  design: designPhaseTask,
  planning: planningPhaseTask,
  implementation: implementationPhaseTask,
  specReviewer: specReviewerTask,
  qualityReviewer: qualityReviewerTask,
  fixer: fixerTask,
  verification: verificationPhaseTask,
  debugging: debuggingPhaseTask,
  finishing: finishingPhaseTask,
};
