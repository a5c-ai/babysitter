/**
 * @process repo/issue-878-sessions-adapter
 * @description Plan and execute issue #878: unified Atlas-driven persistent session adapters for native and plugin targets.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttempts: number, targetAgents: string[], targetFiles: string[], fixtureTargets: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: array, verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - methodologies/spec-kit/spec-kit-implementation
 * - methodologies/atdd-tdd/atdd-tdd
 * - methodologies/gsd/iterative-convergence
 * - docs/adapters/reference/07-session-manager.md
 * - docs/adapters/tutorials/sessions.md
 * - packages/adapters/core/src/session-manager.ts
 * - packages/adapters/core/src/adapter-types.ts
 * - packages/adapters/codecs/src/session-fs.ts
 * - packages/adapters/codecs/src/claude-adapter.ts
 * - packages/adapters/codecs/src/codex-adapter.ts
 * - packages/adapters/codecs/src/pi-adapter.ts
 * - packages/adapters/gateway/src/runs/manager.ts
 * - packages/atlas/graph/lifecycle/session-semantics/*.yaml
 * - packages/atlas/graph/extensions/plugin-artifacts/plugin-target-*.yaml
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Session parsing/listing already exists through adapter-level `sessionDir()`, `listSessionFiles()`, and `parseSessionFile()` in packages/adapters/core/src/adapter-types.ts plus per-target implementations under packages/adapters/codecs/src/*-adapter.ts. Extend or wrap this contract instead of adding an unrelated session subsystem.
 * - SessionManagerImpl already centralizes list/get/search/export/diff and unified/native ID helpers in packages/adapters/core/src/session-manager.ts. Route the unified session adapter registry through this live call path.
 * - Gateway session content has a direct native-session fallback in packages/adapters/gateway/src/runs/manager.ts. Update it to consume the shared contract so gateway behavior does not diverge from SDK/CLI sessions.
 * - Shared JSONL and filesystem parsing helpers already exist in packages/adapters/codecs/src/session-fs.ts. Preserve target-specific codec functions where native formats differ, but register them through a common interface.
 * - Atlas already exposes SessionSemantics and PluginTarget metadata through packages/atlas/src/catalog/sdk.ts (`getSessionConfig`, `getPluginTargetDescriptor`, `listPluginTargetDescriptors`) and graph YAML under packages/atlas/graph/lifecycle/session-semantics/ and packages/atlas/graph/extensions/plugin-artifacts/. Treat this as the metadata input instead of duplicating directory/path knowledge in runtime code.
 * - Existing docs and tests cover the current adapter-delegated model: docs/adapters/reference/07-session-manager.md, docs/adapters/tutorials/sessions.md, and packages/adapters/codecs/tests/*adapter*.test.ts. Revise these with the new contract and fixture matrix.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const maxAttempts = inputs.maxAttempts ?? 3;

  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-878.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-878.reuse-audit',
  });

  const architectureTrace = await ctx.task(traceArchitectureTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-878.architecture-trace',
  });

  const contractSpec = await ctx.task(authorContractSpecTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
  }, {
    key: 'issue-878.contract-spec',
  });

  const fixturePlan = await ctx.task(buildFixtureMatrixTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    contractSpec,
  }, {
    key: 'issue-878.fixture-matrix',
  });

  const testPlan = await ctx.task(authorFrozenTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    contractSpec,
    fixturePlan,
  }, {
    key: 'issue-878.frozen-tests',
  });

  const design = await ctx.task(designImplementationTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    contractSpec,
    fixturePlan,
    testPlan,
  }, {
    key: 'issue-878.implementation-design',
  });

  let implementation = null;
  let docs = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementSharedSessionAdapterTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      contractSpec,
      fixturePlan,
      testPlan,
      design,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-878.implementation.${attempt}`,
    });

    docs = await ctx.task(updateDocumentationTask, {
      inputs,
      issueContext,
      contractSpec,
      fixturePlan,
      design,
      implementation,
      attempt,
    }, {
      key: `issue-878.docs.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      contractSpec,
      fixturePlan,
      testPlan,
      design,
      implementation,
      docs,
      attempt,
    }, {
      key: `issue-878.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityTask, {
      inputs,
      issueContext,
      reuseAudit,
      architectureTrace,
      contractSpec,
      fixturePlan,
      testPlan,
      design,
      implementation,
      docs,
      verification,
      attempt,
    }, {
      key: `issue-878.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, docs, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architectureTrace,
    contractSpec,
    fixturePlan,
    testPlan,
    design,
    implementation,
    docs,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-878.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #878 Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended compatibility contract', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-878', 'adapters', 'sessions', 'atlas'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'runtime-call-path-trace',
      'contract-spec',
      'fixture-matrix',
      'frozen-tests',
      'implementation-design',
      'implementation-loop',
      'documentation',
      'verification-gate',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: architectureTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    architectureTrace,
    contractSpec,
    fixturePlan,
    testPlan,
    design,
    implementation,
    docs,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-878.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #878 and extract authoritative requirements',
  labels: ['issue-878', 'adapters', 'sessions', 'issue-context'],
  agent: {
    name: 'session-adapter-requirements-reader',
    prompt: {
      role: 'senior Babysitter adapters maintainer',
      task: 'Read the GitHub issue and return the authoritative feature spec. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Also run: gh pr view ${args.issueNumber} --json files,title,body,comments; if GitHub says there is no PR with that number, record that result and continue.`,
        'Treat the issue body, every comment, and labels as source of truth.',
        'Preserve the triage summary, affected files, recommended approach, acceptance criteria, and risk analysis from the issue comments.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, priority, risks, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-878.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Phase 0 reuse audit for session adapter infrastructure',
  labels: ['issue-878', 'reuse-audit', 'adapters', 'atlas'],
  agent: {
    name: 'session-adapter-reuse-auditor',
    prompt: {
      role: 'senior monorepo reuse auditor',
      task: 'Find existing infrastructure that must be reused or extended before planning new session adapter code. Do not edit files.',
      instructions: [
        'Use these keywords: session, sessions, persistent session, parseSessionFile, listSessionFiles, sessionDir, SessionManager, gateway sessions, PluginTarget, SessionSemantics, Atlas, fixture, resume, unified ID, native ID.',
        'Inspect existing adapter runtime files, Atlas catalog APIs, graph YAML, CLI/gateway session endpoints, docs, tests, package scripts, imports, and environment variable use.',
        'Pay special attention to packages/adapters/core/src/session-manager.ts, packages/adapters/core/src/adapter-types.ts, packages/adapters/codecs/src/session-fs.ts, packages/adapters/codecs/src/*-adapter.ts, packages/adapters/gateway/src/runs/manager.ts, packages/atlas/src/catalog/sdk.ts, packages/atlas/graph/lifecycle/session-semantics/*.yaml, and packages/atlas/graph/extensions/plugin-artifacts/plugin-target-*.yaml.',
        'Report the reuse-audit findings in a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Return JSON: { findingsMarkdown, reusableRuntimeSurfaces, reusableAtlasSurfaces, reusableTests, reusableDocs, duplicateRisks, recommendedReuseStrategy }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceArchitectureTask = defineTask('issue-878.trace-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace current session parsing and listing call paths',
  labels: ['issue-878', 'runtime-trace', 'adapters', 'gateway'],
  agent: {
    name: 'session-runtime-architect',
    prompt: {
      role: 'senior adapters runtime architect',
      task: 'Trace the live session-management architecture before implementation. Do not edit files.',
      instructions: [
        'Use the issue context and reuse audit JSON below as inputs.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Trace SDK/core list/get/search/export/diff paths through SessionManagerImpl, adapter registry lookup, adapter listSessionFiles/parseSessionFile, shared codecs, and unified/native ID helpers.',
        'Trace gateway /api/v1/sessions content loading through RunManager list/get/full/message paths and the direct native-session fallback.',
        'Trace Atlas metadata access from graph YAML to catalog SDK helpers used by codecs, including getSessionConfig and plugin target descriptor access.',
        'Identify the exact compatibility boundary: which existing adapter methods remain public, which new shared registry/interface should be introduced, and where plugin-generated targets should plug in.',
        'Return JSON: { runtimeCallPaths, targetImplementationFiles, targetTestFiles, targetDocsFiles, currentContract, proposedContractBoundary, migrationSequence, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractSpecTask = defineTask('issue-878.author-contract-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author unified session adapter contract spec',
  labels: ['issue-878', 'spec', 'atlas', 'sessions'],
  agent: {
    name: 'session-contract-spec-author',
    prompt: {
      role: 'senior API contract author',
      task: 'Create or update the specification for the unified persistent session adapter contract. Edit spec/docs files only.',
      instructions: [
        'Use the issue context, reuse audit, and architecture trace as the source for this task.',
        'Define the unified session adapter contract: metadata inputs, session directory resolution, file listing, parser selection, native ID preservation, unified ID mapping, parser error handling, and read-only responsibilities.',
        'Specify how Atlas SessionSemantics and PluginTarget metadata feed the runtime registry while target-specific codecs remain responsible for native formats.',
        'Specify compatibility behavior for existing adapter sessionDir/listSessionFiles/parseSessionFile callers during migration.',
        'Specify acceptance criteria for claude-code, codex, pi, gemini, opencode, and one plugin-generated target.',
        'Do not edit implementation files in this task.',
        'Return JSON: { changedFiles, contractSummary, acceptanceCriteria, compatibilityRules, parserResponsibilities, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const buildFixtureMatrixTask = defineTask('issue-878.fixture-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build stable session fixture matrix',
  labels: ['issue-878', 'fixtures', 'tests', 'adapters'],
  agent: {
    name: 'session-fixture-curator',
    prompt: {
      role: 'senior adapters test-fixture engineer',
      task: 'Create or update stable session fixtures and fixture documentation before implementation changes.',
      instructions: [
        'Own fixture files and fixture docs only. Do not edit runtime implementation in this task.',
        'Target agents:',
        JSON.stringify(args.inputs.fixtureTargets ?? args.inputs.targetAgents, null, 2),
        'Create a representative matrix for claude-code, codex, pi, gemini, opencode, and at least one plugin-generated target.',
        'Fixtures must cover native session IDs, generated unified IDs, created/updated timestamps, cwd/workspace metadata where available, malformed/unparseable rows, empty sessions, and resume-relevant identifiers.',
        'Preserve real native-shape examples while removing secrets, absolute private paths, and user-identifying content.',
        'Return JSON: { changedFiles, fixtureMatrix, fixtureCoverage, redactions, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorFrozenTestsTask = defineTask('issue-878.frozen-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author frozen contract tests before implementation',
  labels: ['issue-878', 'tests', 'tdd', 'contracts'],
  agent: {
    name: 'session-contract-test-author',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing contract, unit, and e2e tests from the spec and fixtures before runtime implementation. Do not modify implementation files.',
      instructions: [
        'Use the contract spec and fixture matrix as the test source. Do not read implementation directories for expected behavior.',
        'Author tests that prove parser registration, Atlas metadata projection, fixture parsing for each target, native/unified ID separation, SessionManager list/get/export behavior, gateway /api/v1/sessions behavior, and CLI adapters sessions list/read/full/export behavior.',
        'Include regression coverage that existing per-adapter methods still work until the public API migration is complete.',
        'Tests should initially fail for missing unified session adapter registry/interface or missing Atlas-driven wiring, not because fixtures are invalid.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, verificationCommands, coverageByAcceptanceCriterion, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designImplementationTask = defineTask('issue-878.design-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design incremental shared session adapter implementation',
  labels: ['issue-878', 'design', 'adapters', 'atlas'],
  agent: {
    name: 'session-adapter-implementation-designer',
    prompt: {
      role: 'senior platform architect',
      task: 'Design a scoped implementation sequence that satisfies the frozen tests without broad unrelated refactors. Do not edit files.',
      instructions: [
        'Use the architecture trace, contract spec, fixture matrix, and frozen tests as inputs.',
        'Prefer adding a shared session adapter registry/interface in adapters core/codecs that consumes Atlas metadata and delegates target-specific parsing to existing codecs.',
        'Plan updates to SessionManagerImpl and gateway native-session loading to use the same shared contract.',
        'Plan Atlas catalog projection tests proving SessionSemantics and PluginTarget metadata used by the runtime match graph records.',
        'Keep existing adapter APIs compatible unless the spec explicitly calls for a staged deprecation.',
        'Return JSON: { implementationMilestones, targetFiles, dependencyOrder, compatibilityStrategy, riskMitigations, expectedChangedFiles, verificationPlan }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSharedSessionAdapterTask = defineTask('issue-878.implement-shared-session-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement unified session adapter attempt ${args.attempt}`,
  labels: ['issue-878', 'implementation', 'adapters', 'atlas'],
  agent: {
    name: 'session-adapter-implementer',
    prompt: {
      role: 'senior TypeScript adapters engineer',
      task: 'Implement the unified persistent session adapter layer for issue #878.',
      instructions: [
        'You own only files required by the contract spec, frozen tests, and implementation design. Do not weaken frozen tests to fit the implementation.',
        'Before creating any planned new file under scripts/, src/server/, src/lib/, or package source roots, check whether the exact path already exists; if it exists, read it and report how you will reuse or extend it.',
        'Implement the shared session adapter registry/interface and Atlas metadata wiring, preserving target-specific codec parsers for native formats.',
        'Update SessionManagerImpl and gateway native-session content loading to use the shared contract.',
        'Update native adapters to register/consume the shared contract while keeping sessionDir/listSessionFiles/parseSessionFile compatibility.',
        'Support the fixture matrix targets: claude-code, codex, pi, gemini, opencode, and one plugin-generated target.',
        'Preserve native session IDs separately from unified IDs and keep resume/session lookup behavior compatible.',
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Return JSON: { changedFiles, summary, contractImplemented, atlasMetadataUsed, compatibilityNotes, risksRemaining }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const updateDocumentationTask = defineTask('issue-878.update-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update session adapter docs attempt ${args.attempt}`,
  labels: ['issue-878', 'docs', 'adapters'],
  agent: {
    name: 'session-docs-maintainer',
    prompt: {
      role: 'senior technical documentation maintainer',
      task: 'Update user and reference documentation for the unified session adapter contract.',
      instructions: [
        'Update docs only as needed to match the implemented contract and acceptance criteria.',
        'Cover SDK, CLI, gateway, Atlas metadata, native/plugin target behavior, fixture expectations, compatibility notes, and troubleshooting for parser/listing failures.',
        'Do not introduce marketing copy or unrelated doc restructuring.',
        'Return JSON: { changedFiles, docsUpdated, examplesUpdated, compatibilityNotes, remainingDocsGaps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-878.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run verification gate attempt ${args.attempt}`,
  labels: ['issue-878', 'verification', 'quality-gate'],
  agent: {
    name: 'session-adapter-verification-engineer',
    prompt: {
      role: 'senior adapters verification engineer',
      task: 'Run the required verification commands and report exact results.',
      instructions: [
        'Run every command below from the repository root. Do not skip failures; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Also run any targeted commands recommended by the frozen test plan if they are not already included.',
        'Verify contract/unit/e2e tests, Atlas metadata projection tests, docs checks where docs changed, package builds for affected workspaces, and metadata verification.',
        'Confirm no source implementation files outside the design scope changed unexpectedly.',
        'Return JSON: { passed, commands, failures, changedFiles, coverageSummary, residualRisk }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCompatibilityTask = defineTask('issue-878.review-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review compatibility and architecture attempt ${args.attempt}`,
  labels: ['issue-878', 'review', 'compatibility', 'architecture'],
  agent: {
    name: 'session-adapter-compatibility-reviewer',
    prompt: {
      role: 'senior adapters compatibility reviewer',
      task: 'Review the implementation against the issue, contract spec, frozen tests, and architecture constraints.',
      instructions: [
        'Review the working tree diff and verification results.',
        'Block approval for regressions in existing adapter APIs, SessionManager list/get/export/diff behavior, gateway session APIs, native/unified ID handling, Atlas metadata drift, parser fixture coverage, or docs/spec mismatch.',
        'Check that target-specific parsers remain isolated and that Atlas metadata is not duplicated in a second hard-coded registry.',
        'Check that plugin-generated targets have a defined path into the registry.',
        'Return JSON: { approved, blockingIssues, nonBlockingIssues, compatibilityAssessment, architectureAssessment, testAssessment, docsAssessment, recommendedNextStep }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-878.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #878',
  labels: ['issue-878', 'final-gate', 'adapters', 'sessions'],
  agent: {
    name: 'session-adapter-final-acceptance',
    prompt: {
      role: 'release-minded adapters maintainer',
      task: 'Decide whether the issue #878 implementation is complete and ready for PR review.',
      instructions: [
        'Compare the issue context, reuse audit, architecture trace, contract spec, fixture matrix, frozen tests, implementation, docs, verification, and compatibility review.',
        'Pass only if specs, docs, unit tests, e2e tests, Atlas projection tests, and implementation all cover the acceptance criteria for every target in scope.',
        'If a semantic decision remains unresolved, set needsMaintainerDecision true and ask one concise question.',
        'Return JSON: { passed, needsMaintainerDecision, question, changedFiles, acceptanceCoverage, verificationSummary, blockingIssues, readyForReview }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
