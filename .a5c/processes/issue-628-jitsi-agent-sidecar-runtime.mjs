/**
 * @process repo/issue-628-jitsi-agent-sidecar-runtime
 * @description Implement issue #628: Krate Jitsi agent sidecar runtime with Unix-socket NDJSON IPC, Puppeteer Jitsi client, staged audio, container packaging, and tests.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, specPaths: string[], verificationCommands: string[], localJitsiRequired?: boolean, publish?: boolean }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - methodologies/spec-driven-development.js
 * - methodologies/ccpm/ccpm-task-decomposition.js
 * - specializations/ai-agents-conversational/voice-enabled-conversational.js
 * - specializations/devops-sre-platform/container-image-management.js
 * - specializations/web-development/api-integration-testing.js
 * - library/reference/ADVANCED_PATTERNS.md
 *
 * @process methodologies/spec-driven-development
 * @process methodologies/ccpm/ccpm-task-decomposition
 * @process specializations/ai-agents-conversational/voice-enabled-conversational
 * @process specializations/devops-sre-platform/container-image-management
 * @process specializations/web-development/api-integration-testing
 * @agent platform-architect methodologies/maestro/agents/architect/AGENT.md
 * @agent task-analyst methodologies/ccpm/agents/task-analyst/AGENT.md
 * @agent api-developer methodologies/ccpm/agents/api-developer/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent dependency-audit specializations/web-development/agents/dependency-audit/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 628;
  const localJitsiRequired = inputs?.localJitsiRequired ?? false;

  const spec = await ctx.task(readSpecAndReuseAuditTask, {
    issueNumber,
    specPaths: inputs?.specPaths ?? [],
  }, {
    key: 'issue-628.read-spec-and-reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceKrateJitsiRuntimeTask, {
    specStdout: spec?.stdout ?? '',
    targetPaths: inputs?.targetPaths ?? [],
  }, {
    key: 'issue-628.trace-runtime',
  });

  const architecture = await ctx.task(designSidecarArchitectureTask, {
    specStdout: spec?.stdout ?? '',
    runtimeTrace,
  }, {
    key: 'issue-628.architecture',
  });

  const taskPlan = await ctx.task(decomposeSidecarWorkTask, {
    specStdout: spec?.stdout ?? '',
    runtimeTrace,
    architecture,
  }, {
    key: 'issue-628.task-decomposition',
  });

  const tests = await ctx.task(authorContractAndIntegrationTestsTask, {
    specStdout: spec?.stdout ?? '',
    runtimeTrace,
    architecture,
    taskPlan,
  }, {
    key: 'issue-628.tests-first',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementSidecarRuntimeTask, {
      specStdout: spec?.stdout ?? '',
      runtimeTrace,
      architecture,
      taskPlan,
      tests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-628.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      commands: inputs?.verificationCommands ?? [],
      localJitsiRequired,
      implementation,
      attempt,
    }, {
      key: `issue-628.verification.${attempt}`,
    });

    review = await ctx.task(reviewAgainstSpecTask, {
      specStdout: spec?.stdout ?? '',
      runtimeTrace,
      architecture,
      taskPlan,
      tests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-628.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    specStdout: spec?.stdout ?? '',
    runtimeTrace,
    architecture,
    taskPlan,
    tests,
    implementation,
    verification,
    review,
    attempts,
    localJitsiRequired,
  }, {
    key: 'issue-628.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #628 Maintainer Decision',
      question: finalGate.question,
      options: finalGate.options ?? ['Proceed with recommended path', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-628', 'jitsi'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  const publish = inputs?.publish
    ? await ctx.task(publishImplementationTask, {
        issueNumber,
        baseBranch: inputs?.baseBranch ?? 'staging',
        targetBranch: inputs?.targetBranch ?? 'agent/issue-628-jitsi-sidecar',
        finalGate,
      }, {
        key: 'issue-628.publish',
      })
    : null;

  return {
    success: finalGate?.passed === true,
    phases: [
      'reuse-audit-and-spec',
      'runtime-call-path-trace',
      'sidecar-architecture',
      'task-decomposition',
      'tests-first',
      'implementation-loop',
      'verification-gates',
      'spec-review',
      'final-acceptance',
      ...(inputs?.publish ? ['publish'] : []),
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    verification,
    review,
    attempts,
    finalGate,
    publish,
  };
}

export const readSpecAndReuseAuditTask = defineTask('issue-628.read-spec-and-reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #628, Jitsi specs, and reuse-audit findings',
  labels: ['issue-628', 'jitsi', 'reuse-audit', 'spec'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "=== GitHub issue ===\\n"',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n=== Reuse-audit findings (REVIEW BEFORE PROCEEDING) ===\\n"',
      'printf "Keywords: jitsi-agent-sidecar, /tmp/jitsi-agent.sock, NDJSON, speak_tts, JITSI_ROOM_URL, AGENT_SOCKET_PATH, meetingContext, Puppeteer, STT, TTS, VAD\\n"',
      'rg -n "jitsi-agent-sidecar|/tmp/jitsi-agent.sock|NDJSON|speak_tts|JITSI_ROOM_URL|AGENT_SOCKET_PATH|meetingContext|Puppeteer|lib-jitsi|Deepgram|Whisper|ElevenLabs|Piper|VAD|sidecar" packages/krate .a5c/processes docs -S || true',
      'printf "\\nNo matching runnable sidecar package should be assumed unless source files outside docs are found above.\\n"',
      'printf "\\n=== Runtime specs ===\\n"',
      ...(args.specPaths ?? []).map(path => `printf "\\n--- ${path} ---\\n"; sed -n '1,260p' ${path}`),
      'printf "\\n=== Relevant source surfaces ===\\n"',
      'rg -n "createAgentJob|createManualDispatch|AgentStack|AgentDispatchRun|meetingRef|meetingContext|sidecar|agentSidecarImage|JITSI_" packages/krate/core packages/krate/charts packages/krate/docs -S || true',
      'printf "\\n=== Package and test commands ===\\n"',
      'node -e "const p=require(\'./package.json\'); console.log(JSON.stringify({workspaces:p.workspaces,scripts:p.scripts}, null, 2))"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceKrateJitsiRuntimeTask = defineTask('issue-628.trace-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate dispatch, Job, and sidecar runtime paths',
  labels: ['issue-628', 'jitsi', 'runtime-trace'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Krate runtime architect',
      task: 'Trace the live code paths that issue #628 must integrate with before any implementation.',
      instructions: [
        'SPEC AND REUSE AUDIT (verbatim):',
        '---',
        args.specStdout,
        '---',
        'Inspect the repository directly and trace the dispatch path from AgentStack/AgentDispatchRun creation through agent-mux Job manifest generation and chart values.',
        'Trace any existing Jitsi docs, resource model fields, tests, Helm values, and controller surfaces that constrain the sidecar package.',
        'Confirm whether runnable sidecar, IPC server, Puppeteer/lib-jitsi client, audio pipeline, or tests already exist. Reuse matching code if found.',
        'Record runtimeCallPaths as file/function-level paths, not broad directories.',
        'Identify source files that are on the live execution path and files that are docs-only references.',
        'Return JSON: { runtimeCallPaths, existingInfrastructure, missingRuntimePieces, affectedFiles, testFiles, dependencyRisks, outOfScope, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designSidecarArchitectureTask = defineTask('issue-628.design-sidecar-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design staged Jitsi sidecar architecture',
  labels: ['issue-628', 'jitsi', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Node, Kubernetes, and WebRTC architect',
      task: 'Design the implementation architecture for the issue #628 sidecar runtime.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        'Design a staged v1 that satisfies the issue while controlling risk: package/image scaffold, Unix-socket NDJSON IPC, Jitsi browser client, lifecycle/reconnect, command/event mapping, transcript cache, audio capability gates, and bounded local-Jitsi integration.',
        'Do not silently cut scope. If a deliverable must be gated by #623 or provider credentials, state the gate and the fallback test strategy explicitly.',
        'Specify exact candidate files to create or edit, package/workspace shape, dependency choices, env vars, socket permissions, signal handling, and resource-profile alignment.',
        'Include security controls for JWT/API keys/transcripts/socket access and container hardening.',
        'Return JSON: { architectureSummary, packagePlan, runtimeModules, envContract, ipcContract, audioPlan, lifecyclePlan, securityPlan, resourceProfiles, integrationPlan, changedFilePlan, risks, decisionsNeeded }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const decomposeSidecarWorkTask = defineTask('issue-628.decompose-work', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose Jitsi sidecar implementation into quality-gated work streams',
  labels: ['issue-628', 'jitsi', 'ccpm', 'task-decomposition'],
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'CCPM-style task decomposition specialist',
      task: 'Break issue #628 into ordered work streams with dependencies and acceptance gates.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        'ARCHITECTURE JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Create staged work streams: package/container, IPC protocol, Jitsi client/lifecycle, command/event integration, audio STT/TTS/VAD, Krate job/chart contract alignment, test/integration, security/docs.',
        'Mark which streams can run in parallel after tests are frozen and which must remain sequential.',
        'For each task, define acceptance criteria mapped to the spec text above and deterministic verification where possible.',
        'Return JSON: { streams, tasks, dependencyGraph, acceptanceMatrix, qualityGates, breakpointRecommendations }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractAndIntegrationTestsTask = defineTask('issue-628.author-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing IPC, sidecar, container, and Jitsi integration tests first',
  labels: ['issue-628', 'jitsi', 'tests', 'tdd'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior Node test engineer',
      task: 'Author tests before implementation changes for issue #628.',
      instructions: [
        'Do not read files under new implementation directories that do not exist yet. Author tests strictly from the spec text and runtime trace below.',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        'ARCHITECTURE JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'TASK PLAN JSON:',
        JSON.stringify(args.taskPlan ?? {}, null, 2),
        'Add tests that initially fail without the implementation and cannot be satisfied by docs-only changes.',
        'Cover NDJSON parsing/framing, socket permissions/path defaults, multiple client handling, command validation, event serialization, transcript cache, disconnect/SIGTERM behavior, Jitsi client adapter contract using fakes, audio provider capability gates, Docker/package smoke checks, Krate job env/socket-volume contract, and a bounded local-Jitsi integration test that is skipped or marked blocked only when #623/local Jitsi is unavailable.',
        'Use the repo existing Node ESM and node:test patterns unless the sidecar package establishes a narrower local test command.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, localJitsiGate, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSidecarRuntimeTask = defineTask('issue-628.implement-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Jitsi sidecar runtime attempt ${args.attempt}`,
  labels: ['issue-628', 'jitsi', 'implementation'],
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'senior Node.js, Kubernetes, and Krate engineer',
      task: 'Implement the issue #628 sidecar runtime against the frozen tests and architecture.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        'ARCHITECTURE JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'TASK PLAN JSON:',
        JSON.stringify(args.taskPlan ?? {}, null, 2),
        'FROZEN TESTS JSON:',
        JSON.stringify(args.tests ?? {}, null, 2),
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        'PREVIOUS REVIEW JSON:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
        'Edit the repository directly. Do not weaken tests to match implementation behavior.',
        'Keep changes scoped to the traced runtime call paths plus the new sidecar package/image/tests and necessary package metadata.',
        'Implement the sidecar as a staged but runnable v1: chat/participant IPC path must work without audio providers; STT/TTS/VAD must be real adapter boundaries with explicit capability/env gates, test fakes, and clear unsupported/provider-missing errors rather than silent no-ops.',
        'Add Dockerfile and package scripts, align chart/job sidecar image/env/socket-volume behavior with #627 docs, and preserve existing Krate tests.',
        'Return JSON: { changedFiles, summary, implementedCapabilities, deferredGates, testsExpectedToPass, securityNotes, resourceProfileNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-628.run-verification', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run issue #628 deterministic verification attempt ${args.attempt}`,
  labels: ['issue-628', 'jitsi', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      ...((args.commands ?? []).length > 0 ? args.commands : [
        'npm run test --workspace=@a5c-ai/krate',
        'npm run build:krate',
        'npm run verify:metadata',
      ]),
      'if [ -f packages/krate/jitsi-agent-sidecar/Dockerfile ] && command -v docker >/dev/null 2>&1; then docker build -f packages/krate/jitsi-agent-sidecar/Dockerfile packages/krate/jitsi-agent-sidecar; else printf "docker build skipped: docker unavailable or sidecar Dockerfile missing\\n"; fi',
      args.localJitsiRequired
        ? 'test -n "${JITSI_LOCAL_TEST_URL:-}" && npm run test:local-jitsi --workspace=@a5c-ai/krate-jitsi-agent-sidecar'
        : 'if [ -n "${JITSI_LOCAL_TEST_URL:-}" ]; then npm run test:local-jitsi --workspace=@a5c-ai/krate-jitsi-agent-sidecar; else printf "local Jitsi integration skipped: JITSI_LOCAL_TEST_URL unset\\n"; fi',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewAgainstSpecTask = defineTask('issue-628.review-against-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Jitsi sidecar implementation against spec attempt ${args.attempt}`,
  labels: ['issue-628', 'jitsi', 'review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior reviewer for WebRTC sidecars, Kubernetes runtimes, and Krate',
      task: 'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      instructions: [
        'Run git diff and inspect changed files directly before reporting.',
        'Prioritize bugs, security risks, behavior regressions, missing tests, container/runtime failures, and contract drift with #627.',
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        'ARCHITECTURE JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'TESTS JSON:',
        JSON.stringify(args.tests ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved, findings, missingTests, securityRisks, runtimeRisks, dependencyRisks, requiredChanges, changedFiles }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-628.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #628',
  labels: ['issue-628', 'jitsi', 'final-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release-minded Krate maintainer',
      task: 'Decide whether issue #628 is complete and ready for maintainer review.',
      instructions: [
        'Inspect the final diff and test output directly.',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'RUNTIME TRACE JSON:',
        JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        'ARCHITECTURE JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'TASK PLAN JSON:',
        JSON.stringify(args.taskPlan ?? {}, null, 2),
        'TESTS JSON:',
        JSON.stringify(args.tests ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        'ATTEMPTS JSON:',
        JSON.stringify(args.attempts ?? [], null, 2),
        'Pass only if the Dockerfile, IPC server, Jitsi client, STT/TTS/VAD capability gates, lifecycle handling, resource-profile alignment, unit tests, and local-Jitsi integration strategy match the spec.',
        'If #623/local Jitsi is unavailable, pass only when deterministic unit/adapter/container tests cover the behavior and the final result explicitly documents the blocked external integration gate.',
        'Set needsHumanDecision true if a scope, provider, dependency, resource, or local-Jitsi decision cannot be made safely from the issue/docs.',
        'Return JSON: { passed, needsHumanDecision, question, options, acceptanceResults, changedFiles, verificationSummary, reviewSummary, blockedExternalGates, releaseNotesCandidate, followUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const publishImplementationTask = defineTask('issue-628.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Publish issue #628 implementation branch and PR',
  labels: ['issue-628', 'jitsi', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `git push -u origin ${args.targetBranch}`,
      `PR_URL="$(gh pr list --head ${args.targetBranch} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.targetBranch} --title "Implement Jitsi agent sidecar runtime" --body "Closes #${args.issueNumber}\\n\\nImplements the Krate Jitsi agent sidecar runtime with Unix-socket NDJSON IPC, Puppeteer-based Jitsi client lifecycle, staged audio capability gates, container packaging, and verification coverage.")"; fi`,
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
