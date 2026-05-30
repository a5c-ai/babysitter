/**
 * @process repo/issue-628-jitsi-agent-sidecar-runtime
 * @description Implement the Krate Jitsi agent sidecar runtime with staged IPC, Jitsi, audio, and integration gates.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string, maxImplementationAttempts?: number }
 * @outputs { success, phases, summary, runtimeCallPaths, verification, review, publish }
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/claudekit/claudekit-spec-workflow
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @process specializations/web-development/websocket-realtime
 * @process specializations/web-development/secrets-management
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent security-auditor methodologies/metaswarm/agents/security-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const processFile = '.a5c/processes/issue-628-jitsi-agent-sidecar-runtime.mjs';
const inputsFile = '.a5c/processes/issue-628-jitsi-agent-sidecar-runtime.inputs.json';

const defaultSpecPaths = [
  'packages/krate/docs/jitsi/01-architecture.md',
  'packages/krate/docs/jitsi/02-helm-deployment.md',
  'packages/krate/docs/jitsi/03-crds-and-controllers.md',
  'packages/krate/docs/jitsi/06-agent-meeting-participation.md',
  'packages/krate/docs/jitsi/07-agent-meeting-runtime.md',
  'packages/krate/docs/agent-identity/04-meeting-integration.md',
];

const defaultQualityCommands = [
  'git diff --check',
  'npm run test --workspace=@a5c-ai/krate',
  'npm run build:krate',
  'npm run verify:metadata',
];

const asText = value => (typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2));

const readSpecTask = defineTask('issue-628.read-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #628 and Jitsi runtime specs',
  labels: ['issue-628', 'jitsi', 'spec', 'context'],
  agent: {
    name: 'jitsi-sidecar-spec-reader',
    prompt: {
      role: 'senior Krate implementation planner',
      task: 'Read the authoritative issue and runtime specifications for issue #628 before any implementation work.',
      instructions: [
        `Run and preserve the important details from: gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
        `Confirm whether #${args.issueNumber} is a PR by attempting: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        `List related planning or implementation PRs with: gh pr list --state all --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,state,headRefName,baseRefName,url,body --limit 20`,
        'Read every path in args.specPaths when present. Record missing files explicitly.',
        'Treat packages/krate/docs/jitsi/07-agent-meeting-runtime.md as the primary runtime contract, while also reconciling Helm, controller, and agent meeting participation docs.',
        'Return JSON: { title, state, labels, issueUrl, comments, relatedPullRequests, specFilesRead, missingSpecFiles, acceptanceCriteria, nonGoals, risks, dependencyStatus, rawContextSummary }.',
      ],
      args: {
        issueNumber: args.issueNumber,
        specPaths: args.specPaths,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reuseAuditTask = defineTask('issue-628.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 REUSE-AUDIT for Jitsi sidecar runtime',
  labels: ['issue-628', 'reuse-audit', 'brownfield'],
  agent: {
    name: 'jitsi-sidecar-reuse-auditor',
    prompt: {
      role: 'senior brownfield architecture investigator',
      task: 'Run the mandatory Phase 0 reuse audit before proposing new runtime infrastructure.',
      instructions: [
        'Extract keywords from the issue and specs: jitsi, sidecar, socket, ipc, ndjson, stt, tts, vad, puppeteer, chromium, agent meeting, transcript, participant, speak_tts, AGENT_SOCKET_PATH, JITSI_ROOM_URL.',
        'Check for .a5c/reuse-audit.json. If absent, say so explicitly and use targeted Krate/Jitsi globs.',
        'Render a top-level section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Scan for matching docs, source files, tests, environment variables, dependency declarations, imports, routes, Kubernetes Job spec code, Helm values, and existing sidecar/socket code.',
        'Use ripgrep or repository-native search tools to gather evidence, but keep this task as an agent task under the repo policy.',
        'If no runnable sidecar exists, include a concise "No matching existing runtime sidecar found" note while still listing adjacent reusable Krate infrastructure.',
        'Return JSON: { heading, keywords, configFound, directMatches, adjacentInfrastructure, packageAndDependencyMatches, envVarMatches, testMatches, noMatchNotes, reuseRecommendations, risks }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const processLibraryResearchTask = defineTask('issue-628.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process methodologies and specializations',
  labels: ['issue-628', 'process-library', 'methodology'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process architect',
      task: 'Research the local process library for methodologies and specializations that should shape the #628 implementation process.',
      instructions: [
        'Inspect .a5c/process-library/ if present. If it is absent, state that explicitly.',
        'Inspect nearby methodology or specialization directories if present, including methodologies/, specializations/, and repo-local .a5c/processes examples.',
        'Prefer patterns relevant to brownfield feature work, tests-first implementation, realtime/WebRTC/socket systems, Kubernetes/container delivery, security/secrets, and quality gates.',
        'Do not edit source code.',
        'Return JSON: { processLibraryPresent: boolean, filesRead: string[], matchingMethodologies: string[], matchingSpecializations: string[], fallbackExamples: string[], processShapeRecommendation: string, authoringConstraints: string[] }.',
        '',
        'ISSUE_CONTEXT:',
        asText(args.issueContext),
        '',
        'REUSE_AUDIT:',
        asText(args.reuseAudit),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const traceRuntimeTask = defineTask('issue-628.trace-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate runtime call paths before implementation',
  labels: ['issue-628', 'brownfield', 'runtime-trace'],
  agent: {
    name: 'krate-runtime-tracer',
    prompt: {
      role: 'senior Krate platform engineer',
      task: 'Trace the live runtime paths that issue #628 must integrate with before any implementation work.',
      instructions: [
        'Read the repository directly.',
        'Do not edit files.',
        'Use the SPEC, REUSE-AUDIT, and PROCESS-LIBRARY RESEARCH blocks as authoritative context.',
        'Map the runtime path from meeting-aware AgentStack/AgentDispatchRun inputs through controller dispatch, agent-mux Job creation, Helm values, container env vars, shared volumes, and tests.',
        'Identify which files are docs-only contract surfaces and which files are executable runtime surfaces.',
        'Return JSON: { runtimeCallPaths: string[], existingInfrastructure: string[], implementationSurfaces: string[], nonGoals: string[], risks: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        '',
        'REUSE-AUDIT (verbatim):',
        '---',
        args.reuseAuditText,
        '---',
        '',
        'PROCESS-LIBRARY RESEARCH (verbatim):',
        '---',
        args.processLibraryText,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const architecturePlanTask = defineTask('issue-628.architecture-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design staged Jitsi sidecar implementation plan',
  labels: ['issue-628', 'architecture', 'planning'],
  agent: {
    name: 'jitsi-sidecar-architect',
    prompt: {
      role: 'senior infrastructure/runtime architect',
      task: 'Produce the implementation architecture and task decomposition for issue #628.',
      instructions: [
        'Do not edit files.',
        'Base the design on the verbatim SPEC, reuse audit, and traced runtime call paths.',
        'Plan a staged v1 that stabilizes IPC, Jitsi connection, command/event relay, lifecycle, packaging, and contract alignment before audio provider depth.',
        'Call out capability gates, provider credentials, socket permissions, transcript handling, resource profiles, local-Jitsi dependency handling, and rollback/operability concerns.',
        'Return JSON: { phases: object[], testPlan: object[], qualityGates: string[], implementationOrder: string[], breakpoints: object[], residualRisks: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        '',
        'REUSE-AUDIT (verbatim):',
        '---',
        args.reuseAuditText,
        '---',
        '',
        'PROCESS-LIBRARY RESEARCH (verbatim):',
        '---',
        args.processLibraryText,
        '---',
        '',
        'RUNTIME TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorTestsTask = defineTask('issue-628.author-tests-first', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing tests from spec before implementation',
  labels: ['issue-628', 'tests-first', 'tdd'],
  agent: {
    name: 'jitsi-sidecar-test-engineer',
    prompt: {
      role: 'senior test engineer',
      task: 'Author tests for issue #628 before implementation.',
      instructions: [
        'Edit the repository directly.',
        'Read existing test harnesses and package/workspace patterns before adding tests.',
        'Do not read newly-created implementation directories for the sidecar runtime; author tests strictly from the spec text and existing contract surfaces.',
        'Tests must freeze IPC NDJSON framing and validation, Unix socket behavior, command/event contracts, reconnect/lifecycle behavior, provider capability gating, container/package smoke behavior, Krate Job sidecar/env/volume integration, Helm values alignment, and local-Jitsi integration when configured.',
        'Name or structure tests so failures clearly cite the matching spec/source surface.',
        'Return JSON: { changedFiles: string[], testCommands: string[], expectedFailures: string[], summary: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        '',
        'IMPLEMENTATION PLAN (verbatim):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const redGateTask = defineTask('issue-628.red-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify tests fail before implementation',
  labels: ['issue-628', 'tdd', 'red-gate'],
  agent: {
    name: 'jitsi-sidecar-red-gate-runner',
    prompt: {
      role: 'tests-first quality engineer',
      task: 'Verify that the newly authored issue #628 tests fail before implementation.',
      instructions: [
        'Inspect git status and the testsResult to identify the new test files.',
        `Run the configured red test command: ${args.testCommand}`,
        'This gate passes only if the new issue #628 tests fail for the expected missing implementation reasons.',
        'If the command passes unexpectedly, mark passed false and explain which tests need to be strengthened before implementation.',
        'Return JSON: { passed: boolean, command: string, exitStatus: number|null, expectedFailureConfirmed: boolean, outputSummary: string, blockingIssues: string[] }.',
        '',
        'TEST AUTHORING RESULT:',
        asText(args.testsResult),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-628.implement-sidecar-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Jitsi sidecar runtime',
  labels: ['issue-628', 'implementation', 'krate', 'jitsi'],
  agent: {
    name: 'jitsi-sidecar-implementer',
    prompt: {
      role: 'senior Node/Kubernetes runtime engineer',
      task: 'Implement issue #628 using the tests-first plan and existing Krate patterns.',
      instructions: [
        'Edit the repository directly.',
        'Keep changes scoped to files on the traced runtime path and the new sidecar package/image/test surfaces required by the spec.',
        'Do not modify unrelated plugin/config files.',
        'Use existing workspace, controller, chart, and test conventions.',
        'Implement in staged order: sidecar workspace/package, Dockerfile, IPC server, validation/state, Jitsi adapter lifecycle/reconnect, chat/participant/hand/reaction commands, transcript cache, capability-gated STT/TTS/VAD adapters, Krate sidecar injection/env/volume alignment, docs if behavior diverges from existing docs.',
        'Treat STT/TTS/VAD provider calls as adapter boundaries with explicit configuration and credentials; avoid requiring external paid services for unit tests.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], residualRisks: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        '',
        'REUSE-AUDIT (verbatim):',
        '---',
        args.reuseAuditText,
        '---',
        '',
        'PROCESS-LIBRARY RESEARCH (verbatim):',
        '---',
        args.processLibraryText,
        '---',
        '',
        'RUNTIME TRACE (verbatim):',
        '---',
        JSON.stringify(args.runtimeTrace, null, 2),
        '---',
        '',
        'ARCHITECTURE PLAN (verbatim):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        '',
        'TEST AUTHORING RESULT (verbatim):',
        '---',
        JSON.stringify(args.testsResult, null, 2),
        '---',
        '',
        'PREVIOUS REVIEW OR FAILURE (verbatim):',
        '---',
        args.previousFeedback || 'None',
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verificationTask = defineTask('issue-628.verify-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic implementation quality gates',
  labels: ['issue-628', 'verification', 'quality-gate'],
  agent: {
    name: 'jitsi-sidecar-quality-runner',
    prompt: {
      role: 'senior runtime verification engineer',
      task: 'Run and report the deterministic quality gates for the issue #628 implementation.',
      instructions: [
        'Run git status --short first and record changed files.',
        'Run every command in args.qualityCommands in order. A nonzero exit is blocking unless the command is explicitly unavailable and the final review accepts the bounded skip.',
        'Detect whether a sidecar package/image and Dockerfile were added. If Docker is available and a sidecar Dockerfile exists, run a Docker build smoke test for krate/jitsi-agent-sidecar:test.',
        `If ${args.localJitsiEnvVar} is set, run the configured local-Jitsi integration command. If it is unset, record the #623/local-Jitsi dependency explicitly as a bounded external skip.`,
        'Return JSON: { passed: boolean, gitStatus: string[], commandResults: object[], dockerSmoke: object, localJitsi: object, skipped: object[], blockingIssues: string[] }.',
      ],
      args: {
        qualityCommands: args.qualityCommands,
        localJitsiEnvVar: args.localJitsiEnvVar,
        localJitsiCommand: args.localJitsiCommand,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-628.read-artifacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read final implementation artifacts for spec comparison',
  labels: ['issue-628', 'artifacts', 'review'],
  agent: {
    name: 'jitsi-sidecar-artifact-reader',
    prompt: {
      role: 'implementation artifact analyst',
      task: 'Read final changed artifacts and summarize them for independent spec review.',
      instructions: [
        'Inspect git status, git diff --stat, and the full relevant diff, excluding unrelated .agents/plugins/marketplace.json, .codex/**, and plugins/babysitter/** changes.',
        'Search changed files and relevant packages for key runtime terms: jitsi-agent-sidecar, /tmp/jitsi-agent.sock, AGENT_SOCKET_PATH, JITSI_AGENT_SOCKET, JITSI_ROOM_URL, speak_tts, send_chat, raise_hand, lower_hand, get_transcript, get_participants, participant_joined, recording_started, Puppeteer, chromium, STT, TTS, VAD, preStop, SIGTERM, NDJSON.',
        'Do not edit files.',
        'Return JSON: { gitStatus: string[], diffStat: string, changedFiles: string[], artifactSummary: string, keyRuntimeMatches: object[], omittedOrUnrelatedChanges: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-628.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against issue #628 and Jitsi specs',
  labels: ['issue-628', 'review', 'acceptance'],
  agent: {
    name: 'jitsi-sidecar-final-reviewer',
    prompt: {
      role: 'independent senior reviewer for Krate runtime changes',
      task: 'Decide whether the final artifacts satisfy issue #628.',
      instructions: [
        'Assess correctness, completeness, security, test coverage, operability, and scope control.',
        'A missing local-Jitsi run is acceptable only if the implementation provides the bounded integration path and clearly records the #623/local-Jitsi dependency.',
        'Return JSON: { approved: boolean, findings: string[], missingRequirements: string[], residualRisks: string[], summary: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsText,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-628.publish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-628', 'publish', 'github'],
  agent: {
    name: 'jitsi-sidecar-publisher',
    prompt: {
      role: 'release handoff engineer',
      task: 'Publish the approved implementation branch and link it back to issue #628.',
      instructions: [
        'Inspect git status and stage only files in args.changedFiles plus any directly required lockfile/package metadata produced by those implementation files.',
        'Do not stage unrelated .agents, .codex, or plugins/babysitter changes.',
        'Commit with message: feat(krate): add Jitsi agent sidecar runtime.',
        'Push args.branchName to origin.',
        'If no PR exists for args.branchName, create one against args.baseBranch titled "Implement Jitsi agent sidecar runtime" with a body that closes the issue and summarizes implementation, tests, and bounded external skips.',
        'Post an issue comment linking the PR and summarizing the implementation outcome.',
        'Return JSON: { published: boolean, commitSha: string|null, prUrl: string|null, issueCommentUrl: string|null, skippedReason: string|null }.',
      ],
      args: {
        issueNumber: args.issueNumber,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        changedFiles: args.changedFiles,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 628;
  const branchName = inputs?.branchName ?? 'feature/issue-628-jitsi-agent-sidecar-runtime';
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const specPaths = inputs?.specPaths ?? defaultSpecPaths;
  const qualityCommands = inputs?.qualityCommands ?? defaultQualityCommands;
  const redTestCommand = inputs?.redTestCommand ?? 'npm run test --workspace=@a5c-ai/krate';
  const localJitsiEnvVar = inputs?.localJitsiEnvVar ?? 'JITSI_LOCAL_TEST_URL';
  const localJitsiCommand = inputs?.localJitsiCommand ?? 'npm run test --workspace=@a5c-ai/krate -- --runInBand --testNamePattern=local-jitsi';
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? 3;

  const spec = await ctx.task(readSpecTask, { issueNumber, specPaths });
  const reuseAudit = await ctx.task(reuseAuditTask, { issueContext: spec });
  const processLibrary = await ctx.task(processLibraryResearchTask, {
    issueContext: spec,
    reuseAudit,
  });
  const runtimeTrace = await ctx.task(traceRuntimeTask, {
    specText: asText(spec),
    reuseAuditText: asText(reuseAudit),
    processLibraryText: asText(processLibrary),
  });
  const architecturePlan = await ctx.task(architecturePlanTask, {
    specText: asText(spec),
    reuseAuditText: asText(reuseAudit),
    processLibraryText: asText(processLibrary),
    runtimeTrace,
  });
  const testsResult = await ctx.task(authorTestsTask, {
    specText: asText(spec),
    architecturePlan,
  });
  const redGate = await ctx.task(redGateTask, {
    testCommand: redTestCommand,
    testsResult,
  });

  let implementation = null;
  let verification = null;
  let artifacts = null;
  let review = null;
  let previousFeedback = '';

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    implementation = await ctx.task(implementTask, {
      specText: asText(spec),
      reuseAuditText: asText(reuseAudit),
      processLibraryText: asText(processLibrary),
      runtimeTrace,
      architecturePlan,
      testsResult,
      previousFeedback,
    });

    verification = await ctx.task(verificationTask, {
      qualityCommands,
      localJitsiEnvVar,
      localJitsiCommand,
    });
    artifacts = await ctx.task(readArtifactsTask, {});
    review = await ctx.task(finalReviewTask, {
      specText: asText(spec),
      artifactsText: asText(artifacts),
    });

    if (review?.approved) {
      break;
    }

    previousFeedback = JSON.stringify({ attempt, review, verification }, null, 2);
  }

  if (!review?.approved) {
    await ctx.breakpoint({
      title: 'Issue #628 Review Gate',
      question: 'The implementation did not pass final spec review after the configured attempts. Continue with another refinement pass or stop for maintainer review?',
      context: {
        runId: ctx.runId,
        files: [
          { path: processFile, format: 'code', language: 'javascript' },
          { path: inputsFile, format: 'code', language: 'json' },
        ],
      },
    });
  }

  const changedFiles = [
    ...(implementation?.changedFiles ?? []),
    ...(testsResult?.changedFiles ?? []),
  ].filter((file, index, files) => file && files.indexOf(file) === index);

  const publish = review?.approved && inputs?.publish !== false
    ? await ctx.task(publishTask, {
        issueNumber,
        branchName,
        baseBranch,
        changedFiles,
      })
    : null;

  return {
    success: Boolean(review?.approved),
    phases: [
      'reuse-audit',
      'process-library-research',
      'runtime-trace',
      'architecture-plan',
      'tests-first',
      'red-gate',
      'implementation',
      'verification',
      'final-review',
      ...(publish ? ['publish'] : []),
    ],
    summary: review?.summary ?? 'Issue #628 implementation process completed without final approval.',
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    processLibrary,
    verification,
    review,
    redGate,
    publish,
  };
}
