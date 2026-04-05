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
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
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
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
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
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```

Use `library/processes/shared/deterministic-quality-gate.js` for composable
preset gates (createGrepCheck, createCompilationGate, createTestSuiteGate,
createRuntimeSmokeTest).

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
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));
```
