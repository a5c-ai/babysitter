### Agent Task Example

Important: Check which subagents and agents are actually available before
assigning the name. If none, pass the general-purpose subagent. Check the
subagents and agents in the plugin (in nested folders) and to find relevant
subagents and agents to use as a reference. Specifically check subagents and
agents in folders next to the reference process file.

When executing the agent task, use the Task tool. Never use the Babysitter skill
or agent to execute the task.
When the Task tool or delegated worker accepts a timeout, use a generous budget
for real coding or verification work instead of a short default.

```javascript
export const agentTask = defineTask('agent-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Agent scoring',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'QA engineer',
      task: 'Score results 0-100',
      context: { ...args },
      instructions: ['Review', 'Score', 'Recommend'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['score']
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```

### Shell Verification Task Example

Use shell tasks for all deterministic verification gates. Shell tasks produce
binary pass/fail results via exit codes that cannot be bypassed by agent
reasoning.

```javascript
// Grep-based integration check
export const grepCheckTask = defineTask('grep-integration-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify integration points exist',
  shell: {
    command: `cd ${args.projectDir || '.'} && grep -q "${args.pattern}" ${args.file}`,
    expectedExitCode: 0,
    timeout: 10000
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Multi-check verification gate
export const verificationGateTask = defineTask('verification-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Deterministic verification gate',
  shell: {
    command: [
      `cd ${args.projectDir || '.'}`,
      'npx tsc --noEmit',
      'npx eslint src/ --max-warnings=0',
      'npx vitest run --reporter=verbose'
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 300000
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```

Use `library/processes/shared/deterministic-quality-gate.js` for composable
preset gates (createGrepCheck, createCompilationGate, createTestSuiteGate,
createRuntimeSmokeTest).

### Runtime Spec Read + Agent Prompt Example (drift defense, issue #129)

Pair a `kind: 'shell'` `cat` task with a `kind: 'agent'` task so the spec
bytes are pulled from disk at execution time and interpolated verbatim into
the agent prompt. This keeps spec text out of the process-authoring compose
pass, where token proximity bias would otherwise rewrite acceptance criteria
to match recently-built implementation artifacts.

```javascript
// Phase 1: read the spec at execution time (bytes bypass your compose pass).
export const readSpecTask = defineTask('read-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read spec ${args.specPath}`,
  shell: {
    command: `cat ${args.specPath}`,
    expectedExitCode: 0,
    timeout: 5000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// Phase 2: test-authoring agent -- prompt interpolates spec.stdout verbatim,
// and the prompt explicitly forbids reading implementation files. Author
// tests strictly from the spec. Place this phase BEFORE any implementation
// phase so tests are frozen inputs, not post-hoc rationalizations.
export const authorTestsFromSpecTask = defineTask(
  'author-tests-from-spec',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Author tests from spec (no implementation access)',
    agent: {
      name: 'general-purpose',
      prompt: {
        role: 'Test author',
        task: 'Author tests that exercise every acceptance criterion below.',
        context: {
          specVerbatim: args.specStdout,  // from readSpecTask.stdout
          testFilePath: args.testFilePath,
        },
        instructions: [
          'Treat the SPEC block below as the sole source of truth.',
          'Do not read files under src/ or implementation directories.',
          'Cite spec line numbers in each test name.',
          'If a criterion is impossible to test as written, raise a',
          '  breakpoint -- do not rewrite the criterion.',
          '',
          'SPEC (verbatim, do not paraphrase):',
          '---',
          args.specStdout,
          '---',
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
);

// Phase N: verification agent -- re-read spec AND artifacts fresh via cat/
// git show, interpolate both verbatim, and end with a direct compare
// instruction. Recency anchors the verifier's attention on source-of-truth
// rather than accumulated narrative drift.
export const verifyAgainstSpecTask = defineTask(
  'verify-against-spec',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Spec-vs-artifact verification (recency-anchored)',
    agent: {
      name: 'general-purpose',
      prompt: {
        role: 'Acceptance reviewer',
        task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
        instructions: [
          'Ignore any narrative in your context about how ARTIFACTS were built.',
          'Do not summarize either block -- compare line by line.',
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
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
);
```

The spec source can be any file -- markdown specs under `specs/`, issue body
dumps written to `/tmp/`, `bd show <id> > /tmp/spec.md`, etc. The pattern is
orthogonal to the spec-tracking tool; what matters is that the bytes are read
at execution time, not authored into the process file as a string literal.

### Skill Task Example

Important: Check which skills are actually available before assigning the skill
name. Check the skills in the plugin (in nested folders) and to find relevant
skills to use as a reference. Skills are preferred over subagents for executing
tasks.
When delegating the skill execution, use a generous timeout budget and require
the skill to execute the work and return the real result.

```javascript
export const skillTask = defineTask('analyzer-skill', (args, taskCtx) => ({
  kind: 'skill',
  title: 'Analyze codebase',

  skill: {
    name: 'codebase-analyzer',
    context: {
      scope: args.scope,
      depth: args.depth,
      analysisType: args.type,
      criteria: ['Code consistency', 'Naming conventions', 'Error handling'],
      instructions: [
        'Scan specified paths for code patterns',
        'Analyze consistency across the codebase',
        'Check naming conventions',
        'Review error handling patterns',
        'Generate structured analysis report'
      ]
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```
