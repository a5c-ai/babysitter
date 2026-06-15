/**
 * @process repo/issue-616-sdk-host-tool-discovery
 * @description Implement issue #616: propagate host tool inventory through hooks-mux AGENT_CAPABILITIES_JSON and render it in SDK process-creation prompt context.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object, delivery: object }
 *
 * @process specializations/sdk-platform-development/plugin-extension-architecture
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @process processes/shared/tdd-triplet
 * @process processes/shared/communication/source-quote-discipline
 * @agent sdk-architect specializations/sdk-platform-development/agents/sdk-architect/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readContextTask = defineTask('issue-616.read-context-and-reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Phase 0: Read issue context and run reuse audit',
  labels: ['issue-616', 'context', 'reuse-audit', 'sdk', 'hooks-mux'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- pr check ---\\n"',
      `gh pr view ${args.issueNumber} --json files,title,body,comments 2>/dev/null || true`,
      'printf "\\n--- Reuse-audit findings (REVIEW BEFORE PROCEEDING) ---\\n"',
      'printf "Keywords: AGENT_CAPABILITIES_JSON, AdapterCapabilities, ProxyCapabilities, PromptContext, host tools, tool inventory, external agents.\\n"',
      'printf "\\nExisting capability propagation surfaces:\\n"',
      'rg -n "AGENT_CAPABILITIES_JSON|AdapterCapabilities|ProxyCapabilities|buildPromptContextFromProxy|createUnifiedContext|renderToolPreferences|composeProcessCreatePrompt" packages/hooks-mux packages/sdk docs/adapters-babysitter-integrations -g "*.ts" -g "*.md"',
      'printf "\\nExisting source files on live path:\\n"',
      'sed -n "1,220p" packages/hooks-mux/core/src/types/adapter.ts',
      'sed -n "1,220p" packages/hooks-mux/adapter-claude/src/adapter.ts',
      'sed -n "1,180p" packages/hooks-mux/core/src/sdk-interface/context-reader.ts',
      'sed -n "1,180p" packages/hooks-mux/core/src/propagation/materialize.ts',
      'sed -n "1,220p" packages/sdk/src/harness/unified/capabilities.ts',
      'sed -n "1,180p" packages/sdk/src/harness/unified/promptContext.ts',
      'sed -n "1,220p" packages/sdk/src/prompts/types.ts',
      'sed -n "1,180p" packages/sdk/src/prompts/compose.ts',
      'sed -n "1,120p" packages/sdk/src/prompts/parts/toolPreferences.ts',
      'sed -n "40,145p" docs/adapters-babysitter-integrations/plugin-mode.md',
      'printf "\\nExisting tests to extend:\\n"',
      'sed -n "1,220p" packages/sdk/src/harness/unified/__tests__/capabilities.test.ts',
      'sed -n "390,475p" packages/sdk/src/harness/unified/__tests__/e2e-integration.test.ts',
      'sed -n "215,245p" packages/hooks-mux/core/src/propagation/__tests__/propagation.test.ts',
      'sed -n "338,410p" packages/hooks-mux/core/src/sdk-interface/__tests__/sdk-interface.test.ts',
      'sed -n "680,710p" packages/hooks-mux/core/src/programmatic/__tests__/engine.test.ts',
      'printf "\\nProcess-library references used:\\n"',
      'sed -n "1,140p" /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/plugin-extension-architecture.js',
      'sed -n "1,140p" /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/sdk-testing-strategy.js',
      'sed -n "1,120p" /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/tdd-triplet.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const prepareBranchTask = defineTask('issue-616.prepare-branch', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prepare implementation branch',
  labels: ['issue-616', 'git', 'branch'],
  shell: {
    command: [
      'set -euo pipefail',
      `if git rev-parse --verify "${args.branchName}" >/dev/null 2>&1; then`,
      `  git switch "${args.branchName}"`,
      'else',
      `  git switch -c "${args.branchName}" "${args.baseBranch}"`,
      'fi',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const contractDesignTask = defineTask('issue-616.contract-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design host tool inventory contract and runtime call paths',
  labels: ['issue-616', 'design', 'sdk', 'hooks-mux'],
  agent: {
    name: 'sdk-plugin-host-tool-architect',
    prompt: {
      role: 'senior TypeScript SDK and plugin-runtime architect',
      task: 'Design the smallest additive host tool inventory contract for issue #616.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this task.',
        'Trace the runtime call path from hooks-mux adapter capability creation through AGENT_CAPABILITIES_JSON serialization, SDK unified parsing, PromptContext creation, and process creation prompt rendering.',
        'Prefer extending AGENT_CAPABILITIES_JSON with an optional structured field over adding a second environment variable unless the context proves otherwise.',
        'Keep the contract optional and additive so existing adapters and SDK consumers continue to work when no tool inventory is available.',
        'Separate host-native tools from external agent discovery in naming and prompt rendering.',
        'Return JSON: { schema: object, runtimeCallPaths: string[], filesToModify: string[], testCases: string[], implementationPlan: string[], compatibilityNotes: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const writeTestsTask = defineTask('issue-616.write-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing regression tests for host tool inventory propagation',
  labels: ['issue-616', 'tdd', 'tests'],
  agent: {
    name: 'host-tool-discovery-test-writer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Write regression tests for issue #616 before implementation changes.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT DESIGN (verbatim JSON):',
        '---',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '---',
        'Edit tests only in this task.',
        'Add focused no-model tests proving a tools array on AGENT_CAPABILITIES_JSON survives hooks-mux serialization, SDK ProxyCapabilities parsing, createUnifiedContext, and process prompt rendering.',
        'Include a backward-compatibility test proving missing tools does not change existing coarse capability behavior.',
        'Prefer extending existing tests in packages/hooks-mux/core/src/*/__tests__, packages/hooks-mux/adapter-claude/src/__tests__, packages/sdk/src/harness/unified/__tests__, and packages/sdk/src/prompts/__tests__.',
        'Do not edit implementation files under src outside test directories in this task.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedInitialFailures: string[], notes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-616.implement-host-tool-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement host tool inventory propagation and prompt rendering',
  labels: ['issue-616', 'implementation', 'sdk', 'hooks-mux'],
  agent: {
    name: 'host-tool-discovery-implementer',
    prompt: {
      role: 'senior TypeScript maintainer for hooks-mux and babysitter SDK',
      task: 'Implement issue #616 against the failing tests and contract design.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT DESIGN (verbatim JSON):',
        '---',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '---',
        'TEST AUTHORING RESULT (verbatim JSON):',
        '---',
        JSON.stringify(args.testAuthoring ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Keep changes scoped to the live path identified in the contract design unless tests reveal a required adjacent prompt-composition file.',
        'Expected implementation surfaces include AdapterCapabilities typing, Claude adapter inventory population from reliable catalog/default data, SDK ProxyCapabilities preservation, PromptContext typing, concise host-tools prompt rendering, and docs if behavior is documented nearby.',
        'The tool inventory shape must be structured, optional, and safe with partial descriptors. Do not require every adapter to know a complete inventory.',
        'Do not conflate host-native tools with external agent discovery or adapters availability.',
        'Preserve unrelated worktree changes.',
        'Return JSON: { changedFiles: string[], summary: string, schemaImplemented: object, testsSatisfied: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-616.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted host tool discovery quality gates',
  labels: ['issue-616', 'verification', 'quality-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/hooks-mux/core/src/sdk-interface/__tests__/sdk-interface.test.ts packages/hooks-mux/core/src/propagation/__tests__/propagation.test.ts packages/hooks-mux/core/src/programmatic/__tests__/engine.test.ts packages/hooks-mux/adapter-claude/src/__tests__/claude-adapter.test.ts packages/sdk/src/harness/unified/__tests__/capabilities.test.ts packages/sdk/src/harness/unified/__tests__/e2e-integration.test.ts packages/sdk/src/prompts/__tests__/composer.test.ts',
      'npm run build:hooks-mux',
      'npm run build:sdk',
      'npm run check:sdk-command-templates',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const refinementTask = defineTask('issue-616.refine-after-failed-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine implementation after failed verification or review',
  labels: ['issue-616', 'refinement'],
  agent: {
    name: 'host-tool-discovery-refiner',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Fix issue #616 implementation problems reported by verification or review.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT DESIGN (verbatim JSON):',
        '---',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '---',
        'FAILED SIGNAL (verbatim JSON):',
        '---',
        JSON.stringify(args.failure ?? {}, null, 2),
        '---',
        'Edit only files needed to make the host tool inventory contract pass without broad refactors.',
        'Return JSON: { changedFiles: string[], summary: string, fixes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-616.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final artifacts for review',
  labels: ['issue-616', 'artifacts', 'review'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/hooks-mux/core/src packages/hooks-mux/adapter-claude/src packages/sdk/src docs/adapters-babysitter-integrations .a5c/processes/issue-616-sdk-host-tool-discovery.mjs .a5c/processes/issue-616-sdk-host-tool-discovery.inputs.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-616.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review host tool discovery implementation against issue #616',
  labels: ['issue-616', 'review', 'quality-gate'],
  agent: {
    name: 'host-tool-discovery-reviewer',
    prompt: {
      role: 'senior SDK reviewer',
      task: 'Review the issue #616 implementation against the issue, contract, artifacts, and verification.',
      instructions: [
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'CONTRACT DESIGN (verbatim JSON):',
        '---',
        JSON.stringify(args.contractDesign ?? {}, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification ?? {}, null, 2),
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Check that host tool inventory is optional/additive, survives AGENT_CAPABILITIES_JSON, appears in SDK process-creation prompt context, and stays distinct from external agent discovery.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliverTask = defineTask('issue-616.deliver', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, open PR, and comment on issue #616',
  labels: ['issue-616', 'delivery', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git add packages/hooks-mux/core/src packages/hooks-mux/adapter-claude/src packages/sdk/src docs/adapters-babysitter-integrations',
      'git add -f .a5c/processes/issue-616-sdk-host-tool-discovery.mjs .a5c/processes/issue-616-sdk-host-tool-discovery.inputs.json',
      'git diff --cached --check',
      'git diff --cached --quiet && { echo "No staged changes to commit" >&2; exit 1; }',
      'git commit -m "feat(sdk): expose host tool inventory in plugin mode"',
      `git push -u origin "${args.branchName}"`,
      'PR_BODY=$(cat <<EOF',
      'Fixes #616',
      '',
      '## Summary',
      '- add optional structured host tool inventory to hooks-mux capability propagation',
      '- preserve that inventory in SDK unified PromptContext creation',
      '- render concise host-native tool guidance separately from external agent discovery',
      '',
      '## Quality gates',
      '- targeted hooks-mux and SDK Vitest suites for AGENT_CAPABILITIES_JSON propagation and prompt rendering',
      '- hooks-mux build',
      '- SDK build',
      '- SDK command template sync check',
      '- git diff whitespace check',
      'EOF',
      ')',
      'PR_URL=$(gh pr create --base "${BASE_BRANCH}" --head "${BRANCH_NAME}" --title "SDK plugin mode host tool discovery" --body "$PR_BODY")',
      'gh issue comment "${ISSUE_NUMBER}" --body "Implemented host tool discovery for SDK plugin mode.\\n\\nSummary:\\n- added optional host tool inventory to AGENT_CAPABILITIES_JSON capability propagation\\n- preserved it through SDK unified prompt context creation\\n- rendered host-native tools separately from external agent discovery so process authors can choose host delegation vs external dispatch\\n\\nQuality gates:\\n- targeted hooks-mux and SDK Vitest suites\\n- hooks-mux build\\n- SDK build\\n- SDK command template check\\n- git diff whitespace check\\n\\nPR: ${PR_URL}"',
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    env: {
      BASE_BRANCH: args.baseBranch,
      BRANCH_NAME: args.branchName,
      ISSUE_NUMBER: String(args.issueNumber),
    },
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 616;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const branchName = inputs?.branchName ?? 'agent/issue-616-sdk-host-tool-discovery';

  const context = await ctx.task(readContextTask, { issueNumber }, {
    key: 'issue-616.context',
  });
  const contextStdout = taskStdout(context);

  await ctx.task(prepareBranchTask, { branchName, baseBranch }, {
    key: 'issue-616.branch',
  });

  const contractDesign = await ctx.task(contractDesignTask, { contextStdout }, {
    key: 'issue-616.contract-design',
  });

  const testAuthoring = await ctx.task(writeTestsTask, {
    contextStdout,
    contractDesign,
  }, {
    key: 'issue-616.tests',
  });

  const implementation = await ctx.task(implementTask, {
    contextStdout,
    contractDesign,
    testAuthoring,
  }, {
    key: 'issue-616.implementation',
  });

  let verification = await ctx.task(verifyTask, { implementation }, {
    key: 'issue-616.verification.1',
  });

  for (let attempt = 2; attempt <= 3 && verification?.exitCode !== 0; attempt++) {
    await ctx.task(refinementTask, {
      contextStdout,
      contractDesign,
      failure: verification,
    }, {
      key: `issue-616.refinement.${attempt}`,
    });
    verification = await ctx.task(verifyTask, { attempt }, {
      key: `issue-616.verification.${attempt}`,
    });
  }

  const artifacts = await ctx.task(readArtifactsTask, {}, {
    key: 'issue-616.artifacts.1',
  });

  let review = await ctx.task(reviewTask, {
    contextStdout,
    contractDesign,
    artifactsStdout: taskStdout(artifacts),
    verification,
  }, {
    key: 'issue-616.review.1',
  });

  if (review?.approved === false) {
    await ctx.task(refinementTask, {
      contextStdout,
      contractDesign,
      failure: review,
    }, {
      key: 'issue-616.refinement.review',
    });
    verification = await ctx.task(verifyTask, { attempt: 'post-review' }, {
      key: 'issue-616.verification.post-review',
    });
    const postReviewArtifacts = await ctx.task(readArtifactsTask, {}, {
      key: 'issue-616.artifacts.post-review',
    });
    review = await ctx.task(reviewTask, {
      contextStdout,
      contractDesign,
      artifactsStdout: taskStdout(postReviewArtifacts),
      verification,
    }, {
      key: 'issue-616.review.post-review',
    });
  }

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'branch', 'contract-design', 'tests', 'implementation', 'verification', 'review'],
      runtimeCallPaths: contractDesign?.runtimeCallPaths ?? [],
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const delivery = await ctx.task(deliverTask, { issueNumber, baseBranch, branchName }, {
    key: 'issue-616.delivery',
  });

  return {
    success: true,
    phases: ['context', 'branch', 'contract-design', 'tests', 'implementation', 'verification', 'review', 'delivery'],
    runtimeCallPaths: contractDesign?.runtimeCallPaths ?? [],
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    delivery,
  };
}
