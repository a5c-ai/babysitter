/**
 * @process krate/agent-identity-web-console
 * @description Implement issue #621: Krate agent identity web console directory, profile pages, creation wizard, typed persona APIs, and persona-aware existing UI.
 * @references specializations/web-development/nextjs-fullstack-app.js
 * @references specializations/web-development/react-app-development.js
 * @references specializations/web-development/api-integration-testing.js
 * @references specializations/web-development/unit-testing-react.js
 * @references specializations/web-development/e2e-testing-playwright.js
 * @references specializations/web-development/accessibility-audit-remediation.js
 * @references processes/shared/tdd-triplet.js
 * @references specializations/collaboration/github/pr-policies.js
 * @agent api-architect specializations/web-development/agents/api-architect/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @agent component-developer specializations/web-development/agents/component-developer/AGENT.md
 * @agent e2e-testing specializations/web-development/agents/e2e-testing/AGENT.md
 * @agent accessibility-testing specializations/web-development/agents/accessibility-testing/AGENT.md
 * @agent code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const PROCESS_ID = 'krate/agent-identity-web-console';

export async function process(inputs, ctx) {
  const startTime = ctx.now();
  const {
    issueNumber = 621,
    dependencyIssueNumber = 620,
    maxImplementationIterations = 3,
    targetQuality = 90,
  } = inputs;

  ctx.log('info', `Starting ${PROCESS_ID} for issue #${issueNumber}`);

  const specBundle = await ctx.task(readSpecBundleTask, {
    issueNumber,
    dependencyIssueNumber,
    specPaths: inputs.specPaths,
  });

  const repositoryMap = await ctx.task(traceKrateAgentWebRuntimeTask, {
    specStdout: specBundle.stdout,
    repositoryPaths: inputs.repositoryPaths,
  });

  const dependencyAssessment = await ctx.task(assessIdentityCoreDependencyTask, {
    specStdout: specBundle.stdout,
    repositoryMap,
    dependencyIssueNumber,
  });

  if (dependencyAssessment?.requiresBreakpoint) {
    await ctx.breakpoint({
      title: 'Core Identity Dependency Check',
      question: `Issue #${dependencyIssueNumber} appears incomplete or incompatible. Proceed only if a compatible core identity branch is available in this checkout.`,
      context: {
        dependencyIssueNumber,
        assessment: dependencyAssessment,
      },
      tags: ['dependency', 'agent-identity', 'critical-gate'],
    });
  }

  const testPlan = await ctx.task(authorAcceptanceTestsTask, {
    specStdout: specBundle.stdout,
    repositoryMap,
    testCommands: inputs.testCommands,
  });

  await ctx.task(runFocusedWebTestsTask, {
    command: inputs.testCommands.web,
    phase: 'red-or-existing-baseline',
    allowFailure: true,
  });

  const implementationResults = [];
  let qualityScore = 0;
  let lastFeedback = null;

  for (let iteration = 1; iteration <= maxImplementationIterations && qualityScore < targetQuality; iteration++) {
    const apiResult = await ctx.task(implementPersonaApiRoutesTask, {
      specStdout: specBundle.stdout,
      repositoryMap,
      testPlan,
      iteration,
      previousFeedback: lastFeedback,
      apiRoutes: inputs.apiRoutes,
    });

    const uiResult = await ctx.task(implementDirectoryProfileWizardTask, {
      specStdout: specBundle.stdout,
      repositoryMap,
      testPlan,
      apiResult,
      iteration,
      previousFeedback: lastFeedback,
      pages: inputs.pages,
      components: inputs.components,
    });

    const integrationResult = await ctx.task(integratePersonaReferencesTask, {
      specStdout: specBundle.stdout,
      repositoryMap,
      testPlan,
      apiResult,
      uiResult,
      iteration,
      previousFeedback: lastFeedback,
      existingUiTargets: inputs.existingUiTargets,
    });

    const checks = await ctx.parallel.all([
      () => ctx.task(runFocusedWebTestsTask, {
        command: inputs.testCommands.web,
        phase: `iteration-${iteration}-web-tests`,
        allowFailure: false,
      }),
      () => ctx.task(runBuildGateTask, {
        command: inputs.testCommands.webBuild,
        phase: `iteration-${iteration}-web-build`,
      }),
      () => ctx.task(runStaticStructureGateTask, {
        command: inputs.testCommands.staticStructure,
        phase: `iteration-${iteration}-static-structure`,
      }),
      () => ctx.task(runRoutePresenceGateTask, {
        pages: inputs.pages,
        apiRoutes: inputs.apiRoutes,
        components: inputs.components,
        phase: `iteration-${iteration}-route-component-presence`,
      }),
    ]);

    const artifactBundle = await ctx.task(readArtifactBundleTask, {
      phase: `iteration-${iteration}`,
    });

    const quality = await ctx.task(scoreImplementationQualityTask, {
      specStdout: specBundle.stdout,
      artifactStdout: artifactBundle.stdout,
      repositoryMap,
      checks,
      iteration,
      targetQuality,
    });

    qualityScore = Number(quality?.overallScore || 0);
    lastFeedback = quality?.recommendations || quality?.summary || null;
    implementationResults.push({
      iteration,
      apiResult,
      uiResult,
      integrationResult,
      checks,
      quality,
    });
  }

  const finalChecks = await ctx.parallel.all([
    () => ctx.task(runFocusedWebTestsTask, {
      command: inputs.testCommands.web,
      phase: 'final-web-tests',
      allowFailure: false,
    }),
    () => ctx.task(runBuildGateTask, {
      command: inputs.testCommands.webBuild,
      phase: 'final-web-build',
    }),
    () => ctx.task(runStaticStructureGateTask, {
      command: inputs.testCommands.staticStructure,
      phase: 'final-static-structure',
    }),
    () => ctx.task(runOptionalE2eGateTask, {
      command: inputs.testCommands.e2e,
      phase: 'final-e2e',
      required: Boolean(inputs.requireE2e),
    }),
  ]);

  const finalArtifacts = await ctx.task(readArtifactBundleTask, {
    phase: 'final',
  });

  const finalReview = await ctx.task(finalSpecComplianceReviewTask, {
    specStdout: specBundle.stdout,
    artifactStdout: finalArtifacts.stdout,
    repositoryMap,
    finalChecks,
  });

  if (!finalReview?.approved) {
    await ctx.breakpoint({
      title: 'Final Spec Compliance Review',
      question: 'The final review found unresolved spec gaps. Approve another implementation iteration or pause for human direction?',
      context: {
        review: finalReview,
        qualityScore,
      },
      tags: ['final-review', 'spec-compliance'],
    });
  }

  return {
    success: Boolean(finalReview?.approved),
    processId: PROCESS_ID,
    issueNumber,
    dependencyIssueNumber,
    qualityScore,
    implementationResults,
    finalChecks,
    finalReview,
    runtimeCallPaths: repositoryMap?.runtimeCallPaths || [],
    durationMs: ctx.now() - startTime,
  };
}

export const readSpecBundleTask = defineTask('read-agent-identity-web-spec-bundle', (args, taskCtx) => {
  const paths = (args.specPaths || []).map((p) => JSON.stringify(p)).join(' ');
  const command = [
    `printf '%s\\n' 'ISSUE #${args.issueNumber}'`,
    `gh issue view ${Number(args.issueNumber)} --json title,body,labels,comments`,
    `printf '%s\\n' 'DEPENDENCY ISSUE #${args.dependencyIssueNumber}'`,
    `gh issue view ${Number(args.dependencyIssueNumber)} --json title,state,body,labels,comments`,
    `printf '%s\\n' 'SPEC FILES'`,
    `cat ${paths}`,
  ].join(' && ');
  return shellTask(taskCtx, {
    title: 'Read issue and specification bundle',
    command,
    timeout: 120000,
    labels: ['spec', 'github', 'runtime-read'],
  });
});

export const traceKrateAgentWebRuntimeTask = defineTask('trace-krate-agent-web-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace Krate agent web runtime paths',
  agent: {
    name: 'web-runtime-architect',
    prompt: {
      role: 'senior Next.js and Krate platform architect',
      task: 'Trace the existing live runtime paths that issue #621 must modify before implementation begins.',
      context: {
        repositoryPaths: args.repositoryPaths,
      },
      instructions: [
        'Inspect the listed repository paths and any directly imported files needed to understand current behavior.',
        'Record runtimeCallPaths from route entry points through data loading, API route handlers, components, and shared helpers.',
        'Identify existing patterns for org-scoped resource access, page barrels, component exports, tests, and API error handling.',
        'Do not implement code in this task.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON with runtimeCallPaths, liveFiles, missingSurfaces, implementationBoundaries, riskNotes, and recommendedTestFiles.',
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'liveFiles', 'implementationBoundaries'],
      properties: {
        runtimeCallPaths: { type: 'array' },
        liveFiles: { type: 'array' },
        missingSurfaces: { type: 'array' },
        implementationBoundaries: { type: 'array' },
        riskNotes: { type: 'array' },
        recommendedTestFiles: { type: 'array' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['analysis', 'runtime-call-paths', 'brownfield'],
}));

export const assessIdentityCoreDependencyTask = defineTask('assess-agent-identity-core-dependency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess dependency issue #${args.dependencyIssueNumber}`,
  agent: {
    name: 'krate-core-contract-reviewer',
    prompt: {
      role: 'principal Krate API contract reviewer',
      task: 'Determine whether the checkout contains enough core identity support for issue #621 to proceed without inventing UI-only storage.',
      context: {
        dependencyIssueNumber: args.dependencyIssueNumber,
        repositoryMap: args.repositoryMap,
      },
      instructions: [
        'Inspect the current repo for AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, and AgentDefinition support in SDK/resource APIs.',
        'If core support is missing, recommend either pausing, rebasing onto the core branch, or implementing only compatibility scaffolding explicitly allowed by the spec.',
        'Set requiresBreakpoint true when proceeding could cause duplicate storage logic, UI-only state, or incompatible contracts.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON with ready, requiresBreakpoint, missingContracts, compatibilityPath, and recommendation.',
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'requiresBreakpoint', 'recommendation'],
      properties: {
        ready: { type: 'boolean' },
        requiresBreakpoint: { type: 'boolean' },
        missingContracts: { type: 'array' },
        compatibilityPath: { type: 'string' },
        recommendation: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['dependency', 'core-contracts'],
}));

export const authorAcceptanceTestsTask = defineTask('author-agent-identity-web-acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author acceptance tests before implementation',
  agent: {
    name: 'web-tdd-test-author',
    prompt: {
      role: 'senior test engineer for Next.js applications',
      task: 'Add or update tests that encode issue #621 behavior before implementation.',
      context: {
        repositoryMap: args.repositoryMap,
        testCommands: args.testCommands,
      },
      instructions: [
        'Do not read files under implementation directories except existing test utilities and test files.',
        'Author tests strictly from the spec text below and current public route/API conventions.',
        'Cover page structure for directory/profile/wizard routes, component file/export structure, typed API route existence/auth/dynamic conventions, persona identity resolution helpers, dispatch/run/session/persona label rendering, and wizard partial-failure behavior.',
        'Prefer existing node:test static tests and lightweight route-handler tests before adding new frameworks.',
        'Commit no implementation in this task beyond tests and test fixtures.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON with testFiles, coverageMap, expectedInitialFailures, commandsToRun, and notes.',
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'coverageMap', 'commandsToRun'],
      properties: {
        testFiles: { type: 'array' },
        coverageMap: { type: 'array' },
        expectedInitialFailures: { type: 'array' },
        commandsToRun: { type: 'array' },
        notes: { type: 'array' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['tdd', 'tests-first', 'web'],
}));

export const implementPersonaApiRoutesTask = defineTask('implement-persona-api-routes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement typed persona API routes (iteration ${args.iteration})`,
  agent: {
    name: 'api-architect',
    prompt: {
      role: 'Krate web API implementation engineer',
      task: 'Implement issue #621 typed persona, soul, appearance, voice, definition, avatar, preview, and wizard create API routes using existing org-scoped resource patterns.',
      context: {
        repositoryMap: args.repositoryMap,
        testPlan: args.testPlan,
        apiRoutes: args.apiRoutes,
        previousFeedback: args.previousFeedback,
      },
      instructions: [
        'Use existing org-scoped resource/controller helpers and API error/auth/cache patterns.',
        'Do not create bespoke storage or contracts that conflict with the core identity model.',
        'Implement transactional or compensating behavior for multi-resource wizard creation; add failure-path coverage when needed.',
        'Keep binary/avatar and TTS preview provider work behind route boundaries with testable fallback behavior when provider contracts are unavailable.',
        'Update API explorer metadata only if this repo already keeps typed route docs there.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON with filesModified, apiContracts, rollbackBehavior, testsSatisfied, and remainingRisks.',
    },
    outputSchema: implementationSchema(),
  },
  io: taskIo(taskCtx),
  labels: ['implementation', 'api', 'krate-web'],
}));

export const implementDirectoryProfileWizardTask = defineTask('implement-directory-profile-wizard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement directory, profile, and wizard UI (iteration ${args.iteration})`,
  agent: {
    name: 'react-developer',
    prompt: {
      role: 'senior React and Next.js product engineer',
      task: 'Implement the agent directory, profile pages, multi-step creation wizard, and component set for issue #621.',
      context: {
        repositoryMap: args.repositoryMap,
        testPlan: args.testPlan,
        apiResult: args.apiResult,
        pages: args.pages,
        components: args.components,
        previousFeedback: args.previousFeedback,
      },
      instructions: [
        'Follow existing Krate page, PageFrame, barrel export, component naming, and client/server component patterns.',
        'Build the actual management experience as route content: directory cards, full profile sections, editor controls, and seven-step wizard.',
        'Keep the UI operational with empty, loading/degraded, error, validation, and partial-save states.',
        'Use stable layout dimensions and accessible controls; no marketing hero pages.',
        'Wire UI to the typed API routes and org-scoped data model, not static fixtures.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON with filesModified, pagesImplemented, componentsImplemented, accessibilityNotes, testsSatisfied, and remainingRisks.',
    },
    outputSchema: implementationSchema(),
  },
  io: taskIo(taskCtx),
  labels: ['implementation', 'react', 'nextjs', 'ui'],
}));

export const integratePersonaReferencesTask = defineTask('integrate-persona-references-existing-ui', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate persona references across existing UI (iteration ${args.iteration})`,
  agent: {
    name: 'component-developer',
    prompt: {
      role: 'Krate frontend integration engineer',
      task: 'Replace stack-centric labels with resolved persona identity in existing agent UI while preserving legacy stack fallback.',
      context: {
        repositoryMap: args.repositoryMap,
        testPlan: args.testPlan,
        apiResult: args.apiResult,
        uiResult: args.uiResult,
        existingUiTargets: args.existingUiTargets,
        previousFeedback: args.previousFeedback,
      },
      instructions: [
        'Add a shared identity resolution helper for persona display name, avatar, role, definition, and stack fallback.',
        'Integrate the helper into dispatch controls, run lists, session headers/details, notifications, command palette, and any adjacent live agent references found in runtime tracing.',
        'Keep AgentStack legacy behavior working when AgentDefinition or AgentPersona data is absent.',
        'Avoid broad refactors outside the traced live paths.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
      ],
      outputFormat: 'JSON with filesModified, helperContract, integratedSurfaces, fallbackBehavior, testsSatisfied, and remainingRisks.',
    },
    outputSchema: implementationSchema(),
  },
  io: taskIo(taskCtx),
  labels: ['implementation', 'integration', 'persona-resolution'],
}));

export const runFocusedWebTestsTask = defineTask('run-focused-krate-web-tests', (args, taskCtx) => {
  const command = args.allowFailure ? `${args.command} || true` : args.command;
  return shellTask(taskCtx, {
    title: `Run Krate web tests: ${args.phase}`,
    command,
    timeout: 300000,
    labels: ['verification', 'tests', args.phase],
  });
});

export const runBuildGateTask = defineTask('run-krate-web-build-gate', (args, taskCtx) => shellTask(taskCtx, {
  title: `Run Krate web build: ${args.phase}`,
  command: args.command,
  timeout: 600000,
  labels: ['verification', 'build', args.phase],
}));

export const runStaticStructureGateTask = defineTask('run-static-structure-gate', (args, taskCtx) => shellTask(taskCtx, {
  title: `Run static structure checks: ${args.phase}`,
  command: args.command,
  timeout: 300000,
  labels: ['verification', 'static-structure', args.phase],
}));

export const runRoutePresenceGateTask = defineTask('run-route-component-presence-gate', (args, taskCtx) => {
  const pageChecks = (args.pages || []).map((route) => `test -f ${JSON.stringify(`packages/krate/web/app/orgs/[org]${route}/page.jsx`)}`);
  const apiChecks = (args.apiRoutes || []).map((route) => `test -f ${JSON.stringify(`packages/krate/web/app/api/orgs/[org]${route}/route.js`)}`);
  const componentChecks = (args.components || []).map((component) => `test -f ${JSON.stringify(`packages/krate/web/app/components/agent/${component}`)}`);
  return shellTask(taskCtx, {
    title: `Verify route and component presence: ${args.phase}`,
    command: [...pageChecks, ...apiChecks, ...componentChecks].join(' && '),
    timeout: 120000,
    labels: ['verification', 'routes', 'components', args.phase],
  });
});

export const runOptionalE2eGateTask = defineTask('run-optional-agent-identity-e2e-gate', (args, taskCtx) => {
  const command = args.required ? args.command : `${args.command} || true`;
  return shellTask(taskCtx, {
    title: `Run optional e2e gate: ${args.phase}`,
    command,
    timeout: 900000,
    labels: ['verification', 'e2e', args.phase],
  });
});

export const readArtifactBundleTask = defineTask('read-agent-identity-artifact-bundle', (args, taskCtx) => shellTask(taskCtx, {
  title: `Read implementation artifacts for review: ${args.phase}`,
  command: [
    `printf '%s\\n' 'GIT DIFF STAT'`,
    `git diff --stat`,
    `printf '%s\\n' 'GIT DIFF NAME STATUS'`,
    `git diff --name-status`,
    `printf '%s\\n' 'GIT DIFF'`,
    `git diff -- packages/krate/web packages/krate/core packages/krate/sdk packages/krate/charts packages/krate/docs`,
  ].join(' && '),
  timeout: 120000,
  labels: ['runtime-read', 'artifacts', args.phase],
}));

export const scoreImplementationQualityTask = defineTask('score-agent-identity-web-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score implementation quality (iteration ${args.iteration})`,
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'principal engineer and quality reviewer',
      task: 'Score the current implementation against the spec, tests, build, accessibility, API consistency, and backward compatibility.',
      context: {
        repositoryMap: args.repositoryMap,
        checks: args.checks,
        iteration: args.iteration,
        targetQuality: args.targetQuality,
      },
      instructions: [
        'Report blocking issues first and give a 0-100 score.',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactStdout,
        '---',
      ],
      outputFormat: 'JSON with overallScore, passed, blockingIssues, recommendations, coveredCriteria, missingCriteria, and summary.',
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passed', 'blockingIssues', 'recommendations', 'summary'],
      properties: {
        overallScore: { type: 'number' },
        passed: { type: 'boolean' },
        blockingIssues: { type: 'array' },
        recommendations: { type: 'array' },
        coveredCriteria: { type: 'array' },
        missingCriteria: { type: 'array' },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['quality', 'review', 'spec-compliance'],
}));

export const finalSpecComplianceReviewTask = defineTask('final-agent-identity-web-spec-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final spec compliance review',
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'principal release reviewer',
      task: 'Make the final pass/fail decision for issue #621 implementation readiness.',
      context: {
        repositoryMap: args.repositoryMap,
        finalChecks: args.finalChecks,
      },
      instructions: [
        'Return approved true only when the implementation satisfies the spec, preserves legacy AgentStack behavior, and all required deterministic checks passed.',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactStdout,
        '---',
      ],
      outputFormat: 'JSON with approved, verdict, blockingIssues, residualRisks, followUps, and releaseNotes.',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'verdict', 'blockingIssues', 'residualRisks'],
      properties: {
        approved: { type: 'boolean' },
        verdict: { type: 'string' },
        blockingIssues: { type: 'array' },
        residualRisks: { type: 'array' },
        followUps: { type: 'array' },
        releaseNotes: { type: 'array' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['final-review', 'spec-compliance', 'release-gate'],
}));

function shellTask(taskCtx, { title, command, timeout = 300000, labels = [] }) {
  return {
    kind: 'shell',
    title,
    command,
    expectedExitCode: 0,
    shell: {
      command,
      timeout,
      outputPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    io: taskIo(taskCtx),
    labels,
  };
}

function taskIo(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

function implementationSchema() {
  return {
    type: 'object',
    required: ['filesModified', 'testsSatisfied', 'remainingRisks'],
    properties: {
      filesModified: { type: 'array' },
      apiContracts: { type: 'array' },
      rollbackBehavior: { type: 'string' },
      pagesImplemented: { type: 'array' },
      componentsImplemented: { type: 'array' },
      accessibilityNotes: { type: 'array' },
      helperContract: { type: 'object' },
      integratedSurfaces: { type: 'array' },
      fallbackBehavior: { type: 'string' },
      testsSatisfied: { type: 'array' },
      remainingRisks: { type: 'array' },
    },
  };
}
