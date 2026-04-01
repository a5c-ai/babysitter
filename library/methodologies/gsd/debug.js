/**
 * @process gsd/debug
 * @description Systematic debugging using scientific method with persistent debug sessions. Phase 0: Root-cause diagnosis with git diff analysis, 2+ evidence signals, no code changes.
 * @inputs { issue: string, sessionId: string, projectDir: string }
 * @outputs { success: boolean, resolved: boolean, rootCause: string, fixCommits: array, sessionPath: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';


/**
 * Debug Process
 *
 * GSD Methodology: Scientific method debugging with persistent session tracking.
 * Creates .planning/debug/{slug}.md tracking file. Maintains hypothesis -> test ->
 * conclusion cycle across context resets. Spawns gsd-debugger agent with full
 * codebase access.
 *
 * Agents referenced from agents/ directory:
 *   - gsd-debugger: Investigates using scientific method (hypothesis -> test -> conclude)
 *   - gsd-executor: Implements confirmed fixes with atomic commits
 *   - gsd-verifier: Confirms fix resolves issue without regressions
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config, slug generation, path ops
 *   - state-management: STATE.md debug session tracking
 *   - template-scaffolding: Debug session file template
 *   - git-integration: Atomic commits for fixes
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.issue - Issue description (or prompt via breakpoint)
 * @param {string} inputs.sessionId - Existing debug session ID to resume (optional)
 * @param {string} inputs.projectDir - Project root directory (default: '.')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with debug outcome
 */
export async function process(inputs, ctx) {
  const {
    issue: issueDescription,
    sessionId,
    projectDir = '.'
  } = inputs;

  // ============================================================================
  // PHASE 1: INITIALIZE
  // ============================================================================

  ctx.log('Initializing debug session...');

  const initResult = await ctx.task(initializeDebugTask, {
    projectDir,
    sessionId
  });

  const existingSessions = initResult.existingSessions || [];
  const resuming = !!sessionId && existingSessions.some(s => s.id === sessionId);

  // ============================================================================
  // PHASE 2: CAPTURE ISSUE
  // ============================================================================

  let description = issueDescription;

  if (!description && !resuming) {
    await ctx.breakpoint({
      question: 'Describe the issue you are debugging. Include: what you expected, what happened instead, and steps to reproduce if known.',
      title: 'Debug: Describe Issue',
      context: {
        runId: ctx.runId,
        files: existingSessions.length > 0
          ? [{ path: '.planning/debug/', format: 'text', label: 'Existing Debug Sessions' }]
          : []
      }
    });

    description = inputs.issueFromBreakpoint || 'unknown-issue';
  }

  let slug;
  let sessionPath;

  if (resuming) {
    const session = existingSessions.find(s => s.id === sessionId);
    slug = session.slug;
    sessionPath = session.path;
    description = description || session.description;
    ctx.log(`Resuming debug session: ${slug}`);
  } else {
    const slugResult = await ctx.task(generateDebugSlugTask, {
      description,
      projectDir
    });

    slug = slugResult.slug;
    sessionPath = `.planning/debug/${slug}.md`;

    // Create debug session file from template
    await ctx.task(createSessionFileTask, {
      slug,
      sessionPath,
      description,
      projectDir
    });

    ctx.log(`Created debug session: ${slug}`);
  }

  // ============================================================================
  // PHASE 3: INVESTIGATE (Hypothesis -> Test -> Conclusion cycle)
  // ============================================================================

  ctx.log('Starting investigation...');

  let resolved = false;
  let rootCause = null;
  let iteration = 0;
  const maxIterations = 5;
  const findings = [];

  while (!resolved && iteration < maxIterations) {
    iteration++;
    ctx.log(`Investigation iteration ${iteration}/${maxIterations}`);

    const investigateResult = await ctx.task(investigateTask, {
      slug,
      sessionPath,
      description,
      iteration,
      previousFindings: findings,
      projectDir
    });

    findings.push({
      iteration,
      hypothesis: investigateResult.hypothesis,
      testPerformed: investigateResult.testPerformed,
      testResult: investigateResult.testResult,
      conclusion: investigateResult.conclusion,
      confidenceLevel: investigateResult.confidenceLevel
    });

    if (investigateResult.rootCauseIdentified) {
      rootCause = investigateResult.rootCause;
      resolved = true;
      ctx.log(`Root cause identified: ${rootCause.substring(0, 100)}...`);
    }

    // ============================================================================
    // PHASE 4: CHECKPOINT (user confirms or provides context)
    // ============================================================================

    if (!resolved) {
      await ctx.breakpoint({
        question: `Investigation iteration ${iteration}: ${investigateResult.conclusion}\n\nHypothesis: ${investigateResult.hypothesis}\nConfidence: ${investigateResult.confidenceLevel}%\n\nConfirm findings, provide additional context, or suggest a different hypothesis.`,
        title: `Debug Checkpoint: ${slug} (iter ${iteration})`,
        context: {
          runId: ctx.runId,
          files: [
            { path: sessionPath, format: 'markdown', label: 'Debug Session' }
          ]
        }
      });
    }
  }

  if (!resolved) {
    // Could not identify root cause within iteration limit
    await ctx.breakpoint({
      question: `Could not identify root cause after ${maxIterations} iterations. Review debug session and decide: continue with more iterations, try different approach, or escalate.`,
      title: `Debug Stalled: ${slug}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: sessionPath, format: 'markdown', label: 'Debug Session' }
        ]
      }
    });

    return {
      success: false,
      resolved: false,
      slug,
      sessionPath,
      description,
      findings,
      iterations: iteration,
      fixCommits: [],
      metadata: {
        processId: 'gsd/debug',
        timestamp: ctx.now()
      }
    };
  }

  // ============================================================================
  // PHASE 5: FIX (implement fix with atomic commits)
  // ============================================================================

  ctx.log('Implementing fix...');

  await ctx.breakpoint({
    question: `Root cause identified: ${rootCause}\n\nProceed with implementing the fix?`,
    title: `Confirm Fix: ${slug}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: sessionPath, format: 'markdown', label: 'Debug Session' }
      ]
    }
  });

  const fixResult = await ctx.task(implementFixTask, {
    slug,
    sessionPath,
    description,
    rootCause,
    findings,
    projectDir
  });

  const fixCommits = fixResult.commits || [];

  // ============================================================================
  // PHASE 6: VERIFY FIX
  // ============================================================================

  ctx.log('Verifying fix...');

  const verifyResult = await ctx.task(verifyFixTask, {
    slug,
    sessionPath,
    description,
    rootCause,
    fixResult,
    projectDir
  });

  if (!verifyResult.verified) {
    await ctx.breakpoint({
      question: `Fix verification failed: ${verifyResult.rationale}\n\nReview and decide: retry fix, investigate further, or accept partial fix.`,
      title: `Fix Verification Failed: ${slug}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: sessionPath, format: 'markdown', label: 'Debug Session' },
          { path: `${sessionPath.replace('.md', '')}-VERIFICATION.md`, format: 'markdown', label: 'Verification Report' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 7: UPDATE STATE
  // ============================================================================

  ctx.log('Updating state...');

  await ctx.task(updateDebugStateTask, {
    slug,
    sessionPath,
    description,
    rootCause,
    resolved: verifyResult.verified,
    fixCommits,
    projectDir
  });

  return {
    success: true,
    resolved: verifyResult.verified,
    slug,
    sessionPath,
    description,
    rootCause,
    findings,
    iterations: iteration,
    fixCommits,
    filesModified: fixResult.filesModified || [],
    verified: verifyResult.verified,
    artifacts: {
      session: sessionPath,
      verification: `${sessionPath.replace('.md', '')}-VERIFICATION.md`
    },
    metadata: {
      processId: 'gsd/debug',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const initializeDebugTask = defineTask('initialize-debug', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Initialize debug environment',
  description: 'Load config, ensure .planning/debug/ exists, list existing sessions',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'initialize',
      projectDir: args.projectDir,
      ensureDir: '.planning/debug/',
      listSessions: args.sessionId || ''
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'debug', 'init']
}));

export const generateDebugSlugTask = defineTask('generate-debug-slug', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Generate debug session slug',
  description: 'Create kebab-case slug for debug session',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'generate-slug',
      description: args.description,
      projectDir: args.projectDir,
      namespace: 'debug'
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'debug', 'slug']
}));

export const createSessionFileTask = defineTask('create-session-file', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Create debug session: ${args.slug}`,
  description: 'Scaffold debug session file from template',

  orchestratorTask: {
    payload: {
      skill: 'template-scaffolding',
      operation: 'scaffold',
      template: 'debug',
      outputPath: args.sessionPath,
      vars: {
        slug: args.slug,
        description: args.description,
        createdAt: new Date().toISOString()
      },
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'debug', 'template']
}));

export const investigateTask = defineTask('investigate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Investigate: ${args.slug} (iter ${args.iteration})`,
  description: 'Scientific method investigation: hypothesis -> test -> conclusion',

  agent: {
    name: 'gsd-debugger',
    prompt: {
      role: 'Expert Debugging Engineer',
      task: 'Investigate the bug using scientific method: form hypothesis, design test, execute, conclude',
      context: {
        slug: args.slug,
        sessionPath: args.sessionPath,
        description: args.description,
        iteration: args.iteration,
        previousFindings: args.previousFindings
      },
      instructions: [
        'PHASE 0 RULE: Before forming any hypothesis, run `git diff` and `git log --oneline -20` to identify what changed recently that could have introduced this issue',
        'PHASE 0 RULE: You MUST NOT make any code changes during investigation. This is diagnosis only.',
        'PHASE 0 RULE: You must gather at least 2 independent evidence signals before drawing conclusions. Evidence examples: git blame output, test output, log comparison, config diff.',
        'Read existing debug session file if resuming',
        'Review previous findings to avoid repeating investigations',
        'Form a specific, testable hypothesis about the root cause',
        'Design a minimal test to validate or invalidate the hypothesis',
        'Execute the test (read code, run commands, check logs)',
        'Record the result objectively',
        'Draw a conclusion: hypothesis confirmed, refuted, or refined',
        'If root cause identified, describe it precisely with code references',
        'Update debug session file with iteration findings',
        'Assess confidence level (0-100) in current understanding'
      ],
      outputFormat: 'JSON with hypothesis (string), testPerformed (string), testResult (string), conclusion (string), confidenceLevel (number), rootCauseIdentified (boolean), rootCause (string|null), affectedFiles (array), codeReferences (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['hypothesis', 'testPerformed', 'testResult', 'conclusion', 'confidenceLevel', 'rootCauseIdentified', 'evidenceSignals'],
      properties: {
        hypothesis: { type: 'string' },
        testPerformed: { type: 'string' },
        testResult: { type: 'string' },
        conclusion: { type: 'string' },
        confidenceLevel: { type: 'number', minimum: 0, maximum: 100 },
        rootCauseIdentified: { type: 'boolean' },
        rootCause: { type: 'string' },
        evidenceSignals: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          description: 'At least 2 independent evidence signals supporting the conclusion'
        },
        gitDiffSummary: {
          type: 'string',
          description: 'Summary of git diff/log findings that identified the breaking change'
        },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        codeReferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              snippet: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'debug', 'investigation', `iteration-${args.iteration}`]
}));

export const implementFixTask = defineTask('implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix: ${args.slug}`,
  description: 'Implement fix for identified root cause with atomic commits',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'Senior Software Engineer with fresh context',
      task: 'Implement the fix for the identified root cause with atomic git commits',
      context: {
        slug: args.slug,
        sessionPath: args.sessionPath,
        description: args.description,
        rootCause: args.rootCause,
        findings: args.findings,
        projectDir: args.projectDir
      },
      instructions: [
        'Read the debug session file for full context',
        'Implement the fix addressing the identified root cause',
        'Make minimal, focused changes - fix the bug, do not refactor',
        'Create atomic git commit via git-integration skill',
        'Use commit message format: fix(scope): description',
        'Include regression guard if straightforward',
        'Document what was changed and why in the debug session file',
        'Return list of files modified and commit details'
      ],
      outputFormat: 'JSON with filesModified (array), commits (array of {hash, message}), summary (string), regressionGuard (string|null)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        commits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hash: { type: 'string' },
              message: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' },
        regressionGuard: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'debug', 'fix']
}));

export const verifyFixTask = defineTask('verify-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify fix: ${args.slug}`,
  description: 'Confirm fix resolves issue without regressions',

  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'Senior QA Engineer',
      task: 'Verify the fix resolves the original issue without introducing regressions',
      context: {
        slug: args.slug,
        sessionPath: args.sessionPath,
        description: args.description,
        rootCause: args.rootCause,
        fixResult: args.fixResult,
        projectDir: args.projectDir
      },
      instructions: [
        'Reproduce the original issue scenario',
        'Verify the fix prevents the issue',
        'Check for regressions in modified files and related code',
        'Run any existing tests that cover the affected area',
        'Verify no new warnings or errors introduced',
        'Write verification report',
        'Provide verified (boolean) with detailed rationale'
      ],
      outputFormat: 'JSON with verified (boolean), rationale (string), originalIssueFixed (boolean), regressionsFound (array), testsRun (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'rationale'],
      properties: {
        verified: { type: 'boolean' },
        rationale: { type: 'string' },
        originalIssueFixed: { type: 'boolean' },
        regressionsFound: { type: 'array', items: { type: 'string' } },
        testsRun: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'debug', 'verify-fix']
}));

export const updateDebugStateTask = defineTask('update-debug-state', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Update STATE.md with debug resolution',
  description: 'Record debug session outcome in STATE.md and archive if resolved',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'update-debug-session',
      slug: args.slug,
      sessionPath: args.sessionPath,
      description: args.description,
      rootCause: args.rootCause || '',
      resolved: args.resolved,
      commits: args.fixCommits,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'debug', 'state']
}));
