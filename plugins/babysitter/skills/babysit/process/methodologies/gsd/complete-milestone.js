/**
 * @process gsd/complete-milestone
 * @description Milestone lifecycle completion: verify audit, archive, evolve PROJECT.md, tag release, cleanup
 * @inputs { projectDir: string, milestoneVersion: string }
 * @outputs { success: boolean, milestoneVersion: string, archivePath: string, gitTag: string, phasesArchived: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Complete Milestone Process
 *
 * GSD Methodology: Milestone lifecycle completion that archives artifacts,
 * evolves project documentation, creates git tags, and cleans up completed
 * phase directories. Pairs with audit-milestone.js which validates readiness.
 *
 * Agents referenced from agents/ directory:
 *   (none - this uses skill-based automation, not agent reasoning)
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config, path operations
 *   - state-management: STATE.md milestone completion updates
 *   - roadmap-management: Phase scope and status queries
 *   - template-scaffolding: Milestone archive template
 *   - git-integration: Git tag creation, commit history
 *   - verification-suite: Audit report validation
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectDir - Project root directory (default: '.')
 * @param {string} inputs.milestoneVersion - Milestone version (e.g., 'v1.0', auto-detected if omitted)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with milestone completion details
 */
export async function process(inputs, ctx) {
  const {
    projectDir = '.',
    milestoneVersion
  } = inputs;

  // ============================================================================
  // PHASE 1: PREFLIGHT CHECK
  // ============================================================================

  ctx.log('Running preflight check for milestone completion...');

  const preflightResult = await ctx.task(preflightCheckTask, {
    projectDir,
    milestoneVersion
  });

  const auditExists = preflightResult.auditExists;
  const auditPassed = preflightResult.auditPassed;
  const detectedVersion = preflightResult.milestoneVersion || milestoneVersion;
  const phases = preflightResult.phases || [];

  if (!auditExists) {
    await ctx.breakpoint({
      question: `No MILESTONE-AUDIT.md found. An audit must pass before completing the milestone. Route to audit-milestone first?`,
      title: 'Milestone Audit Required',
      context: {
        runId: ctx.runId,
        files: [
          { path: '.planning/ROADMAP.md', format: 'markdown', label: 'Roadmap' }
        ]
      }
    });

    return {
      success: false,
      reason: 'audit-required',
      recommendation: 'Run gsd/audit-milestone before completing milestone',
      nextProcess: 'gsd/audit-milestone',
      nextInputs: { projectDir },
      metadata: {
        processId: 'gsd/complete-milestone',
        timestamp: ctx.now()
      }
    };
  }

  if (!auditPassed) {
    await ctx.breakpoint({
      question: `Milestone audit exists but has unresolved gaps. Review audit report and decide: proceed with completion (accepting gaps), or address gaps first?`,
      title: 'Milestone Audit Has Gaps',
      context: {
        runId: ctx.runId,
        files: [
          { path: '.planning/MILESTONE-AUDIT.md', format: 'markdown', label: 'Audit Report' }
        ]
      }
    });
  }

  ctx.log(`Preflight passed. Version: ${detectedVersion}, Phases: ${phases.length}`);

  // ============================================================================
  // PHASE 2: ARCHIVE
  // ============================================================================

  ctx.log('Archiving milestone artifacts...');

  const archivePath = `milestones/${detectedVersion}`;

  const archiveResult = await ctx.task(archiveMilestoneTask, {
    milestoneVersion: detectedVersion,
    archivePath,
    phases,
    projectDir
  });

  ctx.log(`Archived to ${archivePath}: ${archiveResult.filesCopied} files`);

  // ============================================================================
  // PHASE 3: EVOLVE PROJECT
  // ============================================================================

  ctx.log('Evolving PROJECT.md...');

  const evolveResult = await ctx.task(evolveProjectTask, {
    milestoneVersion: detectedVersion,
    phases,
    archivePath,
    projectDir
  });

  // ============================================================================
  // PHASE 4: GIT TAG
  // ============================================================================

  ctx.log(`Creating git tag: ${detectedVersion}`);

  const tagResult = await ctx.task(createGitTagTask, {
    milestoneVersion: detectedVersion,
    phases,
    projectDir
  });

  const gitTag = tagResult.tag;

  // ============================================================================
  // PHASE 5: CLEANUP
  // ============================================================================

  ctx.log('Cleaning up completed phase directories...');

  const cleanupResult = await ctx.task(cleanupPhasesTask, {
    milestoneVersion: detectedVersion,
    phases,
    archivePath,
    projectDir
  });

  const phasesArchived = cleanupResult.phasesArchived;

  // ============================================================================
  // PHASE 6: UPDATE STATE
  // ============================================================================

  ctx.log('Updating STATE.md for milestone completion...');

  const stateResult = await ctx.task(updateMilestoneStateTask, {
    milestoneVersion: detectedVersion,
    phases,
    archivePath,
    gitTag,
    phasesArchived,
    projectDir
  });

  // ============================================================================
  // PHASE 7: PRESENT RESULTS
  // ============================================================================

  await ctx.breakpoint({
    question: `Milestone ${detectedVersion} completed!\n\n` +
      `- ${phases.length} phases archived to ${archivePath}/\n` +
      `- Git tag: ${gitTag}\n` +
      `- PROJECT.md updated\n` +
      `- STATE.md cleared for next milestone\n\n` +
      `Next steps: Start a new milestone or mark the project as complete.`,
    title: `Milestone Complete: ${detectedVersion}`,
    context: {
      runId: ctx.runId,
      files: [
        { path: `${archivePath}/ROADMAP.md`, format: 'markdown', label: 'Archived Roadmap' },
        { path: '.planning/PROJECT.md', format: 'markdown', label: 'Updated Project' },
        { path: '.planning/STATE.md', format: 'markdown', label: 'Updated State' }
      ]
    }
  });

  return {
    success: true,
    milestoneVersion: detectedVersion,
    archivePath,
    gitTag,
    phasesArchived,
    phases: phases.map(p => ({ id: p.id, name: p.name })),
    artifacts: {
      archive: archivePath,
      project: '.planning/PROJECT.md',
      state: '.planning/STATE.md',
      audit: '.planning/MILESTONE-AUDIT.md'
    },
    metadata: {
      processId: 'gsd/complete-milestone',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const preflightCheckTask = defineTask('preflight-check', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Milestone preflight check',
  description: 'Verify audit exists and passed, detect milestone version, list phases',

  orchestratorTask: {
    payload: {
      skill: 'verification-suite',
      operation: 'preflight',
      check: 'milestone-audit',
      milestoneVersion: args.milestoneVersion || '',
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'milestone', 'preflight']
}));

export const archiveMilestoneTask = defineTask('archive-milestone', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Archive: ${args.milestoneVersion}`,
  description: 'Copy ROADMAP.md, REQUIREMENTS.md, and phase summaries into milestone archive',

  orchestratorTask: {
    payload: {
      skill: 'template-scaffolding',
      operation: 'scaffold',
      template: 'milestone-archive',
      outputPath: args.archivePath,
      vars: {
        milestoneVersion: args.milestoneVersion,
        phases: args.phases
      },
      copySources: [
        '.planning/ROADMAP.md',
        '.planning/REQUIREMENTS.md',
        '.planning/MILESTONE-AUDIT.md'
      ],
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'milestone', 'archive']
}));

export const evolveProjectTask = defineTask('evolve-project', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Evolve PROJECT.md',
  description: 'Update PROJECT.md with milestone completion entry',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'evolve-project',
      milestoneVersion: args.milestoneVersion,
      archivePath: args.archivePath,
      phases: args.phases,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'milestone', 'project-evolve']
}));

export const createGitTagTask = defineTask('create-git-tag', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: `Tag: ${args.milestoneVersion}`,
  description: 'Create annotated git tag for milestone release',

  orchestratorTask: {
    payload: {
      skill: 'git-integration',
      operation: 'tag',
      tag: args.milestoneVersion,
      message: `Milestone ${args.milestoneVersion}: ${args.phases.length} phases completed`,
      annotate: true,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'milestone', 'git-tag']
}));

export const cleanupPhasesTask = defineTask('cleanup-phases', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Cleanup completed phases',
  description: 'Archive phase directories from completed milestone, clear active ROADMAP.md',

  orchestratorTask: {
    payload: {
      skill: 'roadmap-management',
      operation: 'cleanup',
      milestoneVersion: args.milestoneVersion,
      archivePath: args.archivePath,
      phases: args.phases,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'milestone', 'cleanup']
}));

export const updateMilestoneStateTask = defineTask('update-milestone-state', (args, taskCtx) => ({
  kind: 'orchestrator_task',
  title: 'Update STATE.md for milestone completion',
  description: 'Clear completed phases, reset current task, record milestone completion',

  orchestratorTask: {
    payload: {
      skill: 'state-management',
      operation: 'complete-milestone',
      milestoneVersion: args.milestoneVersion,
      archivePath: args.archivePath,
      gitTag: args.gitTag,
      phasesArchived: args.phasesArchived,
      projectDir: args.projectDir
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['gsd', 'milestone', 'state']
}));
