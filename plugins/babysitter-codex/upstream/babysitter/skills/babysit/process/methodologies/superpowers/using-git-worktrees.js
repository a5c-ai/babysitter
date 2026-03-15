/**
 * @process methodologies/superpowers/using-git-worktrees
 * @description Using Git Worktrees - Create isolated workspaces with systematic directory selection and safety verification
 * @inputs { branchName: string, projectRoot?: string, setupCommand?: string }
 * @outputs { success: boolean, worktreePath: string, branchCreated: boolean, testsPass: boolean, testCount: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentCheckDirectoriesTask = defineTask('worktree-check-dirs', async (args, ctx) => {
  return { check: args };
}, {
  kind: 'agent',
  title: 'Check Existing Worktree Directories',
  labels: ['superpowers', 'git-worktrees', 'directory-check'],
  io: {
    inputs: { projectRoot: 'string' },
    outputs: { existingDir: 'string', dirName: 'string', isGitignored: 'boolean', existingWorktrees: 'array' }
  }
});

const agentVerifyGitignoreTask = defineTask('worktree-verify-gitignore', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Worktree Directory Is Gitignored',
  labels: ['superpowers', 'git-worktrees', 'safety'],
  io: {
    inputs: { dirPath: 'string', projectRoot: 'string' },
    outputs: { isGitignored: 'boolean', gitignorePath: 'string', addedEntry: 'boolean' }
  }
});

const agentCreateWorktreeTask = defineTask('worktree-create', async (args, ctx) => {
  return { worktree: args };
}, {
  kind: 'agent',
  title: 'Create Git Worktree with New Branch',
  labels: ['superpowers', 'git-worktrees', 'creation'],
  io: {
    inputs: { branchName: 'string', worktreeDir: 'string', projectRoot: 'string' },
    outputs: { worktreePath: 'string', branchCreated: 'boolean', baseSha: 'string' }
  }
});

const agentRunProjectSetupTask = defineTask('worktree-project-setup', async (args, ctx) => {
  return { setup: args };
}, {
  kind: 'agent',
  title: 'Run Project Setup in Worktree',
  labels: ['superpowers', 'git-worktrees', 'setup'],
  io: {
    inputs: { worktreePath: 'string', setupCommand: 'string' },
    outputs: { setupRan: 'boolean', packageManager: 'string', setupOutput: 'string' }
  }
});

const agentVerifyBaselineTestsTask = defineTask('worktree-baseline-tests', async (args, ctx) => {
  return { tests: args };
}, {
  kind: 'agent',
  title: 'Verify Clean Test Baseline in Worktree',
  labels: ['superpowers', 'git-worktrees', 'verification'],
  io: {
    inputs: { worktreePath: 'string' },
    outputs: { testsPass: 'boolean', testCount: 'number', testOutput: 'string', failCount: 'number' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Using Git Worktrees Process
 *
 * Creates isolated workspaces sharing the same repository:
 * 1. Check existing directories (.worktrees/ or worktrees/)
 * 2. Verify directory is gitignored
 * 3. Create worktree with new branch
 * 4. Run project setup (auto-detect npm/cargo/pip/go)
 * 5. Verify clean test baseline
 * 6. Report ready
 *
 * Safety rules:
 * - Always verify worktree directory is gitignored
 * - Always run baseline tests
 * - Report failures before proceeding
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.branchName - Name for the new branch
 * @param {string} inputs.projectRoot - Root of the project (default: ctx.runDir)
 * @param {string} inputs.setupCommand - Custom setup command (auto-detected if not provided)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Worktree creation results
 */
export async function process(inputs, ctx) {
  const {
    branchName,
    projectRoot = null,
    setupCommand = null
  } = inputs;

  const root = projectRoot || ctx.runDir;

  ctx.log('Starting Using Git Worktrees', { branchName, projectRoot: root });

  // ============================================================================
  // STEP 1: CHECK EXISTING DIRECTORIES
  // ============================================================================

  ctx.log('Step 1: Checking existing worktree directories');

  const dirCheck = await ctx.task(agentCheckDirectoriesTask, {
    projectRoot: root
  });

  // ============================================================================
  // STEP 2: VERIFY GITIGNORE
  // ============================================================================

  ctx.log('Step 2: Verifying worktree directory is gitignored');

  const gitignoreResult = await ctx.task(agentVerifyGitignoreTask, {
    dirPath: dirCheck.existingDir || '.worktrees',
    projectRoot: root
  });

  if (!gitignoreResult.isGitignored && !gitignoreResult.addedEntry) {
    await ctx.breakpoint({
      question: `Worktree directory is NOT gitignored. This is a safety requirement. Add "${dirCheck.dirName || '.worktrees'}" to .gitignore before proceeding.`,
      title: 'Worktree Safety: Not Gitignored',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 3: CREATE WORKTREE
  // ============================================================================

  ctx.log('Step 3: Creating git worktree with new branch');

  const worktreeResult = await ctx.task(agentCreateWorktreeTask, {
    branchName,
    worktreeDir: dirCheck.existingDir || '.worktrees',
    projectRoot: root
  });

  // ============================================================================
  // STEP 4: RUN PROJECT SETUP
  // ============================================================================

  ctx.log('Step 4: Running project setup in worktree');

  const setupResult = await ctx.task(agentRunProjectSetupTask, {
    worktreePath: worktreeResult.worktreePath,
    setupCommand: setupCommand || ''
  });

  // ============================================================================
  // STEP 5: VERIFY BASELINE TESTS
  // ============================================================================

  ctx.log('Step 5: Verifying clean test baseline');

  const testResult = await ctx.task(agentVerifyBaselineTestsTask, {
    worktreePath: worktreeResult.worktreePath
  });

  if (!testResult.testsPass) {
    await ctx.breakpoint({
      question: `Baseline tests failing in worktree (${testResult.failCount} failures). This must be investigated before starting implementation. Review test output and resolve.`,
      title: 'Worktree Baseline Tests Failing',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/worktree/baseline-test-output.txt', format: 'text', label: 'Test Output' }
        ]
      }
    });
  }

  ctx.log('Worktree ready', {
    worktreePath: worktreeResult.worktreePath,
    testsPass: testResult.testsPass,
    testCount: testResult.testCount
  });

  return {
    success: true,
    worktreePath: worktreeResult.worktreePath,
    branchName,
    branchCreated: worktreeResult.branchCreated,
    baseSha: worktreeResult.baseSha,
    testsPass: testResult.testsPass,
    testCount: testResult.testCount || 0,
    packageManager: setupResult.packageManager,
    metadata: {
      processId: 'methodologies/superpowers/using-git-worktrees',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
