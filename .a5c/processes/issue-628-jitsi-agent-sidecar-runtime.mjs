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

const readSpecTask = defineTask('issue-628.read-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #628 and Jitsi runtime specs',
  labels: ['issue-628', 'jitsi', 'spec', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
      'printf "\\n--- related pull requests mentioning issue ---\\n"',
      `gh pr list --state all --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,state,headRefName,baseRefName,url,body --limit 20 || true`,
      'printf "\\n--- Jitsi docs/spec files ---\\n"',
      `for f in ${args.specPaths.map(path => `'${path}'`).join(' ')}; do`,
      '  if test -f "$f"; then',
      '    printf "\\n### %s\\n" "$f"',
      '    sed -n "1,260p" "$f"',
      '  else',
      '    printf "\\n### missing: %s\\n" "$f"',
      '  fi',
      'done',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reuseAuditTask = defineTask('issue-628.reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Phase 0 REUSE-AUDIT for Jitsi sidecar runtime',
  labels: ['issue-628', 'reuse-audit', 'brownfield'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "## Reuse-audit findings (REVIEW BEFORE PROCEEDING)\\n\\n"',
      'printf "Keywords: jitsi, sidecar, socket, ipc, ndjson, stt, tts, vad, puppeteer, chromium, agent meeting, transcript, participant, speak_tts, AGENT_SOCKET_PATH, JITSI_ROOM_URL\\n\\n"',
      'if test -f .a5c/reuse-audit.json; then',
      '  printf "Existing .a5c/reuse-audit.json found:\\n"',
      '  cat .a5c/reuse-audit.json',
      '  printf "\\n\\n"',
      'else',
      '  printf "No .a5c/reuse-audit.json found; using targeted Krate/Jitsi scan globs.\\n\\n"',
      'fi',
      'printf "### Source and docs matches\\n"',
      'rg -n "jitsi-agent-sidecar|/tmp/jitsi-agent\\.sock|speak_tts|JITSI_ROOM_URL|JITSI_JWT|JITSI_ROOM_ID|AGENT_SOCKET_PATH|JITSI_AGENT_SOCKET|meetingContext|participant_joined|recording_started|Whisper|Deepgram|Piper|ElevenLabs|Puppeteer|Chromium|lib-jitsi|NDJSON|Unix socket|sidecar" packages .a5c docs package.json 2>/dev/null || true',
      'printf "\\n### Route/API matches\\n"',
      'rg -n "jitsi|meeting|sidecar|socket|transcript|participant" packages/**/src packages/**/api src/app/api 2>/dev/null || true',
      'printf "\\n### Env var matches\\n"',
      'rg -n "process\\.env\\.[A-Z0-9_]*(JITSI|AGENT_SOCKET|OPENAI|DEEPGRAM|ELEVENLABS|WHISPER|TTS|STT|VAD)[A-Z0-9_]*" packages src 2>/dev/null || true',
      'printf "\\n### Dependency/import matches\\n"',
      'rg -n "\\"(puppeteer|puppeteer-core|playwright|lib-jitsi-meet|ws|zod|ajv|openai|deepgram|elevenlabs|whisper)\\"|from [\\x27\\"](puppeteer|puppeteer-core|playwright|lib-jitsi-meet|ws|zod|ajv|openai|@deepgram|elevenlabs)" package.json packages 2>/dev/null || true',
      'printf "\\n### Existing tests/workspaces\\n"',
      'rg -n "krate|jitsi|meeting|agent-mux|sidecar|socket|Job spec|helm" package.json packages/**/package.json packages/**/test packages/**/__tests__ 2>/dev/null || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
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
        'Use the SPEC and REUSE-AUDIT blocks as authoritative context.',
        'Map the runtime path from meeting-aware AgentStack/AgentDispatchRun inputs through controller dispatch, agent-mux Job creation, Helm values, container env vars, shared volumes, and tests.',
        'Identify which files are docs-only contract surfaces and which files are executable runtime surfaces.',
        'Return JSON: { runtimeCallPaths: string[], existingInfrastructure: string[], implementationSurfaces: string[], nonGoals: string[], risks: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'REUSE-AUDIT (verbatim):',
        '---',
        args.reuseAuditStdout,
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
        args.specStdout,
        '---',
        '',
        'REUSE-AUDIT (verbatim):',
        '---',
        args.reuseAuditStdout,
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
        args.specStdout,
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
  kind: 'shell',
  title: 'Verify tests fail before implementation',
  labels: ['issue-628', 'tdd', 'red-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "Tests created by test-authoring phase:\\n"',
      'git status --short',
      'set +e',
      args.testCommand,
      'status=$?',
      'set -e',
      'if [ "$status" -eq 0 ]; then',
      '  printf "Expected newly-authored issue #628 tests to fail before implementation, but command passed.\\n"',
      '  exit 1',
      'fi',
      'printf "RED gate passed: test command failed before implementation with status %s.\\n" "$status"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
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
        args.specStdout,
        '---',
        '',
        'REUSE-AUDIT (verbatim):',
        '---',
        args.reuseAuditStdout,
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
  kind: 'shell',
  title: 'Run deterministic implementation quality gates',
  labels: ['issue-628', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'printf "## Git status\\n"',
      'git status --short',
      'printf "\\n## Required quality commands\\n"',
      ...args.qualityCommands.map(command => `printf "\\n### ${command.replace(/"/g, '\\"')}\\n"\n${command}`),
      'printf "\\n## Sidecar package/container smoke\\n"',
      'if git ls-files --others --exclude-standard --cached packages | rg "jitsi|sidecar" >/dev/null || rg -n "jitsi-agent-sidecar" packages package.json >/dev/null; then',
      '  if command -v docker >/dev/null 2>&1 && rg -n "jitsi-agent-sidecar|FROM node|chromium|puppeteer" -g "Dockerfile*" packages . >/dev/null; then',
      '    docker build -t krate/jitsi-agent-sidecar:test -f "$(rg -l "jitsi-agent-sidecar|chromium|puppeteer" -g "Dockerfile*" packages . | head -1)" .',
      '  else',
      '    printf "Docker unavailable or no sidecar Dockerfile located; recording bounded skip.\\n"',
      '  fi',
      'else',
      '  printf "No sidecar package/image changes detected; downstream review must fail if implementation omitted required runtime.\\n"',
      'fi',
      'printf "\\n## Local Jitsi integration gate\\n"',
      `if [ -n "\${${args.localJitsiEnvVar}:-}" ]; then`,
      `  ${args.localJitsiCommand}`,
      'else',
      `  printf "${args.localJitsiEnvVar} is not set; record #623/local-Jitsi dependency in final review.\\n"`,
      'fi',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-628.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final implementation artifacts for spec comparison',
  labels: ['issue-628', 'artifacts', 'review'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- diff stats ---\\n"',
      'git diff --stat',
      'printf "\\n--- full diff ---\\n"',
      'git diff -- . ":(exclude).agents/plugins/marketplace.json" ":(exclude).codex/**" ":(exclude)plugins/babysitter/**"',
      'printf "\\n--- key runtime matches ---\\n"',
      'rg -n "jitsi-agent-sidecar|/tmp/jitsi-agent\\.sock|AGENT_SOCKET_PATH|JITSI_AGENT_SOCKET|JITSI_ROOM_URL|speak_tts|send_chat|raise_hand|lower_hand|get_transcript|get_participants|participant_joined|recording_started|Puppeteer|chromium|STT|TTS|VAD|preStop|SIGTERM|NDJSON" packages package.json 2>/dev/null || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
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
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
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
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-628', 'publish', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      `git add ${args.changedFiles.map(file => `'${file}'`).join(' ')}`,
      `if ! git diff --cached --quiet; then git commit -m "feat(krate): add Jitsi agent sidecar runtime"; fi`,
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Implement Jitsi agent sidecar runtime" --body "Closes #${args.issueNumber}\\n\\nImplements the Jitsi agent sidecar runtime, IPC protocol, staged audio pipeline, and Krate job/chart integration described in issue #${args.issueNumber}.")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented issue #%s Jitsi agent sidecar runtime.\\n\\n- Added the sidecar runtime package/image and Unix-socket NDJSON IPC.\\n- Added Jitsi lifecycle/command/event handling and capability-gated audio adapter surfaces.\\n- Aligned Krate job/chart contract and added deterministic tests plus optional local-Jitsi integration.\\n\\nPR: %s' "${args.issueNumber}" "$PR_URL")"`,
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
  const reuseAudit = await ctx.task(reuseAuditTask, {});
  const runtimeTrace = await ctx.task(traceRuntimeTask, {
    specStdout: spec?.stdout ?? '',
    reuseAuditStdout: reuseAudit?.stdout ?? '',
  });
  const architecturePlan = await ctx.task(architecturePlanTask, {
    specStdout: spec?.stdout ?? '',
    reuseAuditStdout: reuseAudit?.stdout ?? '',
    runtimeTrace,
  });
  const testsResult = await ctx.task(authorTestsTask, {
    specStdout: spec?.stdout ?? '',
    architecturePlan,
  });
  const redGate = await ctx.task(redGateTask, { testCommand: redTestCommand });

  let implementation = null;
  let verification = null;
  let artifacts = null;
  let review = null;
  let previousFeedback = '';

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    implementation = await ctx.task(implementTask, {
      specStdout: spec?.stdout ?? '',
      reuseAuditStdout: reuseAudit?.stdout ?? '',
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
      specStdout: spec?.stdout ?? '',
      artifactsStdout: artifacts?.stdout ?? '',
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
    verification,
    review,
    redGate,
    publish,
  };
}
