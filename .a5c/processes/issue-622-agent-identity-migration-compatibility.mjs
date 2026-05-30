/**
 * @process repo/issue-622-agent-identity-migration-compatibility
 * @description Implement issue #622: AgentStack backward compatibility, AgentDefinition dispatch targets, migration tooling, deprecation warnings, and web/MCP target parity.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, specFiles: string[], targetSurfaces: object, verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, compatibilityReview: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/krate/docs/agent-identity/01-resource-model.md
 * - packages/krate/docs/agent-identity/02-migration.md
 * - .a5c/processes/issue-620-agent-identity-decoupling.mjs
 * - .a5c/processes/issue-621-agent-identity-web-console.mjs
 * - library/methodologies/superpowers/test-driven-development.js
 * - library/methodologies/superpowers/verification-before-completion.js
 * - library/specializations/software-architecture/migration-strategy.js
 *
 * Note: .a5c/process-library/ was absent in this checkout. This process follows
 * adjacent Krate identity plans and uses agent tasks only; it does not create
 * kind: 'shell' subtasks.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, { key: 'issue-622.issue-context' });
  const audit = await ctx.task(reuseAuditTask, { inputs, issueContext }, { key: 'issue-622.reuse-audit' });
  const tests = await ctx.task(authorCompatibilityTestsTask, { inputs, issueContext, audit }, { key: 'issue-622.tests' });
  const implementation = await ctx.task(implementCompatibilityTask, { inputs, issueContext, audit, tests }, { key: 'issue-622.implementation' });
  const verification = await ctx.task(verifyTask, { inputs, implementation }, { key: 'issue-622.verification' });
  const compatibilityReview = await ctx.task(reviewTask, { inputs, implementation, verification }, { key: 'issue-622.review' });
  return {
    success: verification?.passed === true && compatibilityReview?.approved === true,
    phases: ['issue-context', 'reuse-audit', 'tests', 'implementation', 'verification', 'compatibility-review'],
    changedFiles: implementation?.changedFiles || [],
    verification,
    compatibilityReview,
  };
}

export const readIssueContextTask = defineTask('issue-622.read-context', (args) => ({
  kind: 'agent',
  title: 'Read issue #622 and identity migration specs',
  labels: ['issue-622', 'krate', 'agent-identity', 'research'],
  context: args,
  spec: {
    task: 'Read the issue, comments, labels, and agent identity migration docs. Return acceptance criteria, dependencies, and concrete target surfaces.',
    outputContract: { type: 'object', required: ['acceptanceCriteria', 'dependencies', 'targetSurfaces', 'risks'] },
  },
}));

export const reuseAuditTask = defineTask('issue-622.reuse-audit', (args) => ({
  kind: 'agent',
  title: 'Audit existing Krate identity and dispatch surfaces',
  labels: ['issue-622', 'reuse-audit', 'compatibility'],
  context: args,
  spec: {
    task: 'Inspect existing AgentStack, AgentPersona, AgentDefinition, dispatch, TriggerRule, web, CLI MCP, Atlas MCP, and migration-helper code before edits.',
    outputContract: { type: 'object', required: ['existingSupport', 'gaps', 'filesToChange', 'compatibilityRisks'] },
  },
}));

export const authorCompatibilityTestsTask = defineTask('issue-622.tests', (args) => ({
  kind: 'agent',
  title: 'Author focused compatibility tests',
  labels: ['issue-622', 'tests', 'tdd'],
  context: args,
  spec: {
    task: 'Add focused tests for migration dry-run/apply ordering, legacy warning behavior, prompt preservation, TriggerRule target parity, and MCP dispatch target parity.',
    outputContract: { type: 'object', required: ['testsAdded', 'expectedCoverage'] },
  },
}));

export const implementCompatibilityTask = defineTask('issue-622.implementation', (args) => ({
  kind: 'agent',
  title: 'Implement migration and compatibility changes',
  labels: ['issue-622', 'implementation', 'krate-core', 'triggers', 'mcp'],
  context: args,
  spec: {
    task: 'Implement the smallest package-scoped changes that satisfy #622 while preserving legacy AgentStack dispatch behavior indefinitely.',
    outputContract: { type: 'object', required: ['changedFiles', 'implementedBehaviors', 'compatibilityNotes'] },
  },
}));

export const verifyTask = defineTask('issue-622.verify', (args) => ({
  kind: 'agent',
  title: 'Verify Krate identity migration compatibility',
  labels: ['issue-622', 'verification'],
  context: args,
  spec: {
    task: 'Run targeted package tests and any relevant package-level checks. Report commands, pass/fail status, and skipped checks.',
    outputContract: { type: 'object', required: ['passed', 'commands', 'failures', 'skipped'] },
  },
}));

export const reviewTask = defineTask('issue-622.review', (args) => ({
  kind: 'agent',
  title: 'Review compatibility and migration safety',
  labels: ['issue-622', 'review', 'compatibility'],
  context: args,
  spec: {
    task: 'Review the diff for legacy dispatch regressions, destructive migration behavior, target contract divergence, missing tests, and broad unrelated changes.',
    outputContract: { type: 'object', required: ['approved', 'findings', 'remainingRisks'] },
  },
}));
