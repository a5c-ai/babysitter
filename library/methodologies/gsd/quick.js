/**
 * @process gsd/quick
 * @description Ad-hoc task execution with GSD guarantees (atomic commits, state tracking) but skip optional agents
 * @inputs { task: string, fullMode: boolean, projectDir: string }
 * @outputs { success: boolean, taskSlug: string, planPath: string, summaryPath: string, commits: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Quick Task Execution Process
 *
 * GSD Methodology: Streamlined path for ad-hoc tasks with GSD guarantees.
 * get task description -> plan in quick mode -> optional plan check (--full)
 * -> execute -> optional verify (--full) -> update STATE.md quick tasks table.
 *
 * Agents referenced from agents/ directory:
 *   - gsd-planner: Creates quick-mode plan
 *   - gsd-executor: Executes plan with atomic commits
 *   - gsd-plan-checker: Verifies plan correctness (--full mode only)
 *   - gsd-verifier: Goal-backward verification (--full mode only)
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config, slug generation, path ops
 *   - state-management: STATE.md quick tasks table
 *   - template-scaffolding: Plan and summary templates
 *   - git-integration: Atomic commits
 *   - model-profile-resolution: Agent model selection
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task description (or prompt via breakpoint)
 * @param {boolean} inputs.fullMode - Enable plan checking and verification (default: false)
 * @param {string} inputs.projectDir - Project root directory (default: '.')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with task execution outcome
 */
export async function process(inputs, ctx) {
  const {
    task: taskDescription,
    fullMode = false,
    projectDir = '.'
  } = inputs;

  // ============================================================================
  // PHASE 1: INITIALIZE
  // ============================================================================

  ctx.log('Initializing quick task execution...');

  const initResult = await ctx.task(initializeTask, {
    projectDir
  });

  const config = initResult.config;
  const modelProfile = initResult.modelProfile;

  // ============================================================================
  // PHASE 2: CAPTURE TASK
  // ============================================================================

  let description = taskDescription;

  if (!description) {
    await ctx.breakpoint({
      question: 'What task would you like to execute? Describe what needs to be done.',
      title: 'Quick Task: Describe Task',
      context: {
        runId: ctx.runId,
        files: []
      }
    });

    // After breakpoint, task description comes from user response
    description = inputs.taskFromBreakpoint || 'unnamed-task';
  }

  ctx.log(`Task captured: ${description.substring(0, 80)}...`);

  const slugResult = await ctx.task(generateSlugTask, {
    description,
    projectDir
  });

  const taskSlug = slugResult.slug;
  const taskNumber = slugResult.taskNumber;
  const taskDir = `.planning/quick/${taskNumber}-${taskSlug}`;

  // ============================================================================
  // PHASE 3: PLAN (QUICK MODE)
  // ============================================================================

  ctx.log(`Planning quick task: ${taskSlug}`);

  const planResult = await ctx.task(quickPlanTask, {
    description,
    taskSlug,
    taskDir,
    projectDir,
    modelProfile,
    config
  });

  const planPath = `${taskDir}/PLAN.md`;

  // ============================================================================
  // PHASE 4: CHECK PLAN (--full mode only)
  // ============================================================================

  if (fullMode) {
    ctx.log('Full mode: checking plan...');

    let planApproved = false;
    let revisionCount = 0;
    const maxRevisions = 2;

    while (!planApproved && revisionCount < maxRevisions) {
      const checkResult = await ctx.task(checkPlanTask, {
        planPath,
        taskDir,
        description,
        planResult
      });

      if (checkResult.approved) {
        planApproved = true;
        ctx.log('Plan approved by checker');
      } else {
        revisionCount++;
        ctx.log(`Plan revision ${revisionCount}/${maxRevisions}: ${checkResult.feedback}`);

        if (revisionCount < maxRevisions) {
          // Revise the plan
          await ctx.task(revisePlanTask, {
            planPath,
            taskDir,
            feedback: checkResult.feedback,
            originalPlan: planResult
          });
        }
      }
    }

    if (!planApproved) {
      await ctx.breakpoint({
        question: `Plan for "${taskSlug}" did not pass checker after ${maxRevisions} revisions. Review and decide: proceed anyway, or revise manually?`,
        title: `Plan Check Warning: ${taskSlug}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: planPath, format: 'markdown', label: 'Task Plan' }
          ]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 5: EXECUTE
  // ============================================================================

  ctx.log(`Executing quick task: ${taskSlug}`);

  const executeResult = await ctx.task(executeQuickTask, {
    description,
    taskSlug,
    taskDir,
    planPath,
    planResult,
    projectDir,
    modelProfile
  });

  const commits = executeResult.commits || [];

  // ============================================================================
  // PHASE 6: VERIFY (--full mode only)
  // ============================================================================

  let verifyResult = null;

  if (fullMode) {
    ctx.log('Full mode: verifying task...');

    verifyResult = await ctx.task(verifyQuickTask, {
      description,
      taskSlug,
      taskDir,
      executeResult
    });

    if (!verifyResult.verified) {
      await ctx.breakpoint({
        question: `Verification found issues with "${taskSlug}". Review findings and decide next steps.`,
        title: `Verification Issues: ${taskSlug}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `${taskDir}/VERIFICATION.md`, format: 'markdown', label: 'Verification Report' }
          ]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 7: UPDATE STATE
  // ============================================================================

  ctx.log('Updating STATE.md with quick task...');

  const [stateResult, summaryResult] = await ctx.parallel.all([
    () => ctx.task(updateStateTask, {
      taskSlug,
      taskNumber,
      description,
      status: 'completed',
      commits,
      projectDir
    }),
    () => ctx.task(writeSummaryTask, {
      taskSlug,
      taskDir,
      description,
      executeResult,
      verifyResult
    })
  ]);

  const summaryPath = `${taskDir}/SUMMARY.md`;

  return {
    success: true,
    taskSlug,
    taskNumber,
    description,
    fullMode,
    planPath,
    summaryPath,
    taskDir,
    commits,
    filesCreated: executeResult.filesCreated || [],
    filesModified: executeResult.filesModified || [],
    verified: fullMode ? (verifyResult?.verified ?? false) : null,
    artifacts: {
      plan: planPath,
      summary: summaryPath,
      verification: fullMode ? `${taskDir}/VERIFICATION.md` : null
    },
    metadata: {
      processId: 'gsd/quick',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const initializeTask = defineTask('initialize', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Initialize quick task environment',
  description: 'Load config, ensure .planning/quick/ exists, resolve model profile',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'initialize',
      projectDir: args.projectDir,
      ensureDir: '.planning/quick/',
      resolveProfile: true
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'quick', 'init']
}));

export const generateSlugTask = defineTask('generate-slug', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Generate task slug and number',
  description: 'Create kebab-case slug and sequential task number',

  orchestratorTask: {
    payload: {
      skill: 'gsd-tools',
      operation: 'generate-slug',
      description: args.description,
      projectDir: args.projectDir,
      namespace: 'quick'
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'quick', 'slug']
}));

export const quickPlanTask = defineTask('quick-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan: ${args.taskSlug}`,
  description: 'Create quick-mode plan with minimal ceremony',

  agent: {
    name: 'gsd-planner',
    prompt: {
      role: 'Senior Technical Lead',
      task: 'Create a quick-mode executable plan for a single task',
      context: {
        description: args.description,
        taskSlug: args.taskSlug,
        taskDir: args.taskDir,
        projectDir: args.projectDir,
        modelProfile: args.modelProfile,
        config: args.config
      },
      instructions: [
        'Read project context (PROJECT.md, STATE.md) if available',
        'Create a single plan file with XML task structure',
        'Keep plan minimal - one wave, direct execution',
        'Include specific file changes and verification command',
        'Use template-scaffolding skill for PLAN.md format',
        'Write plan to taskDir/PLAN.md'
      ],
      outputFormat: 'JSON with planMarkdown (string), tasks (array), verifyCommand (string), filesTargeted (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['planMarkdown', 'tasks'],
      properties: {
        planMarkdown: { type: 'string' },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              action: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        verifyCommand: { type: 'string' },
        filesTargeted: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'quick', 'planning']
}));

export const checkPlanTask = defineTask('check-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check plan: ${args.taskDir}`,
  description: 'Verify plan achieves task goal before execution',

  agent: {
    name: 'gsd-plan-checker',
    prompt: {
      role: 'Senior QA Engineer - Plan Review Specialist',
      task: 'Verify this quick plan will achieve the stated task goal',
      context: {
        planPath: args.planPath,
        taskDir: args.taskDir,
        description: args.description,
        plan: args.planResult
      },
      instructions: [
        'Read the task description and plan',
        'Verify plan tasks cover the full scope',
        'Check for missing dependencies or steps',
        'Verify files targeted exist or are creatable',
        'Check verification command is meaningful',
        'Provide approved (boolean) and feedback'
      ],
      outputFormat: 'JSON with approved (boolean), feedback (string), issues (array), suggestions (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'feedback'],
      properties: {
        approved: { type: 'boolean' },
        feedback: { type: 'string' },
        issues: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'quick', 'plan-check']
}));

export const revisePlanTask = defineTask('revise-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise plan based on feedback',
  description: 'Update plan to address checker feedback',

  agent: {
    name: 'gsd-planner',
    prompt: {
      role: 'Senior Technical Lead',
      task: 'Revise the quick plan based on checker feedback',
      context: {
        planPath: args.planPath,
        taskDir: args.taskDir,
        feedback: args.feedback,
        originalPlan: args.originalPlan
      },
      instructions: [
        'Read the original plan and checker feedback',
        'Address each issue raised',
        'Update plan while maintaining quick-mode simplicity',
        'Write revised plan to same path'
      ],
      outputFormat: 'JSON with planMarkdown (string), tasks (array), changesApplied (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['planMarkdown', 'tasks'],
      properties: {
        planMarkdown: { type: 'string' },
        tasks: { type: 'array', items: { type: 'object' } },
        changesApplied: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'quick', 'plan-revision']
}));

export const executeQuickTask = defineTask('execute-quick', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute: ${args.taskSlug}`,
  description: 'Execute quick task plan with atomic commits',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'Senior Software Engineer with fresh context',
      task: 'Execute the quick task plan atomically with git commits',
      context: {
        description: args.description,
        taskSlug: args.taskSlug,
        taskDir: args.taskDir,
        planPath: args.planPath,
        plan: args.planResult,
        projectDir: args.projectDir
      },
      instructions: [
        'Read plan file completely before starting',
        'Execute each task in plan sequentially',
        'Create atomic git commit after each task via git-integration skill',
        'Use structured commit messages: type(scope): description',
        'Document files created/modified',
        'If a task fails, stop and report the failure clearly',
        'Create SUMMARY.md documenting what changed'
      ],
      outputFormat: 'JSON with filesCreated (array), filesModified (array), commits (array of {hash, message}), summary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
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
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'quick', 'execution']
}));

export const verifyQuickTask = defineTask('verify-quick', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify: ${args.taskSlug}`,
  description: 'Goal-backward verification of task completion',

  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'Senior QA Engineer',
      task: 'Verify the quick task achieved its stated goal using goal-backward analysis',
      context: {
        description: args.description,
        taskSlug: args.taskSlug,
        taskDir: args.taskDir,
        executeResult: args.executeResult
      },
      instructions: [
        'Start from the task goal, not from the task list',
        'Check each deliverable exists and functions',
        'Run verification commands if specified in plan',
        'Check for regressions in modified files',
        'Write VERIFICATION.md with findings',
        'Provide verified (boolean) and detailed rationale'
      ],
      outputFormat: 'JSON with verified (boolean), rationale (string), checks (array), issues (array), verificationMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'rationale'],
      properties: {
        verified: { type: 'boolean' },
        rationale: { type: 'string' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              passed: { type: 'boolean' },
              detail: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        verificationMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'quick', 'verification']
}));

export const updateStateTask = defineTask('update-state', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Update STATE.md quick tasks table',
  description: 'Add quick task row to STATE.md via state-management skill',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'add-quick-task',
      slug: args.taskSlug,
      number: args.taskNumber,
      description: args.description,
      status: args.status,
      commits: args.commits,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'quick', 'state']
}));

export const writeSummaryTask = defineTask('write-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Summary: ${args.taskSlug}`,
  description: 'Write SUMMARY.md for completed quick task',

  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'Technical writer',
      task: 'Write a concise SUMMARY.md for the completed quick task',
      context: {
        taskSlug: args.taskSlug,
        taskDir: args.taskDir,
        description: args.description,
        executeResult: args.executeResult,
        verifyResult: args.verifyResult
      },
      instructions: [
        'Use template-scaffolding skill for summary-minimal template',
        'Document: what was done, files changed, decisions made',
        'Keep it concise - this is a quick task, not a phase',
        'Include commit references',
        'Write to taskDir/SUMMARY.md'
      ],
      outputFormat: 'JSON with summaryMarkdown (string), filesDocumented (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['summaryMarkdown'],
      properties: {
        summaryMarkdown: { type: 'string' },
        filesDocumented: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'quick', 'summary']
}));
