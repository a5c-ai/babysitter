/**
 * @process cradle/library-contribution
 * @description Contribute processes, skills, or agents to the babysitter process library. Validates against library patterns, forks, and submits PR
 * @inputs { contributionType?: string, name?: string, description?: string, specialization?: string, filePaths?: array, additionalContext?: string }
 * @outputs { success: boolean, prUrl: string, prNumber: number, forkUrl: string, validationResult: object, summary: string }
 *
 * Library Contribution Process (PR-based)
 *
 * Phases:
 * 1. Gather Contribution Details - Determine type (process/skill/agent), name, specialization
 * 2. Validate Against Library Patterns - Check structure, naming, JSDoc, exports match library conventions
 * 3. Determine Target Location - Map to correct directory in the library
 * 4. Fork Repository - Fork a5c-ai/babysitter (with breakpoint)
 * 5. Star Repository - Ask to star (with breakpoint)
 * 6. Create Branch - Create contribution branch
 * 7. Add Files - Place files in correct library location with proper structure
 * 8. Run Quality Checks - Validate files, lint, check patterns (parallel)
 * 9. Review Breakpoint - Let user review before PR
 * 10. Submit PR - Create pull request (with breakpoint)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contributionType = '',
    name = '',
    description = '',
    specialization = '',
    filePaths = [],
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: GATHER CONTRIBUTION DETAILS
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering library contribution details');

  const details = await ctx.task(gatherLibraryContribDetailsTask, {
    contributionType,
    name,
    description,
    specialization,
    filePaths,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: VALIDATE AGAINST LIBRARY PATTERNS
  // ============================================================================

  ctx.log('info', 'Phase 2: Validating against library patterns');

  const validationResult = await ctx.task(validateLibraryPatternsTask, {
    details,
    filePaths
  });

  if (!validationResult.valid) {
    const validationApproval = await ctx.breakpoint({
      question: [
        'Validation found issues with your library contribution:',
        '',
        ...validationResult.issues.map(i => `- **${i.severity}:** ${i.description}`),
        '',
        'Would you like to:',
        '1. Continue anyway (issues will be noted in PR)',
        '2. Cancel and fix the issues first'
      ].join('\n'),
      title: 'Library Validation Issues',
      context: { runId: ctx.runId }
    });
    if (!validationApproval.approved) {
      return { success: false, reason: 'User cancelled due to validation issues', feedback: validationApproval.response || validationApproval.feedback, validationResult };
    }
  }

  // ============================================================================
  // PHASE 3: DETERMINE TARGET LOCATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Determining target location in library');

  const targetLocation = await ctx.task(determineTargetLocationTask, {
    details,
    validationResult
  });

  // ============================================================================
  // PHASE 4: FORK REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 4: Forking repository');

  const forkApproval = await ctx.breakpoint({
    question: [
      'To submit your library contribution, we need to fork the a5c-ai/babysitter repository.',
      '',
      `**Type:** ${details.type} (${details.subType || 'new'})`,
      `**Name:** ${details.name}`,
      `**Specialization:** ${details.specialization}`,
      `**Target:** ${targetLocation.targetDir}`,
      '',
      'Approve to fork the repository, or reject to cancel.'
    ].join('\n'),
    title: 'Confirm Repository Fork',
    context: { runId: ctx.runId }
  });
  if (!forkApproval.approved) {
    return { success: false, reason: 'User rejected at fork approval gate', feedback: forkApproval.response || forkApproval.feedback };
  }

  const forkResult = await ctx.task(forkRepoTask, {});

  // ============================================================================
  // PHASE 5: STAR REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 5: Star repository check');

  const starCheck = await ctx.task(checkStarTask, {});

  if (!starCheck.starred) {
    const starApproval = await ctx.breakpoint({
      question: 'Would you like to star the a5c-ai/babysitter repository? This helps the project gain visibility.',
      title: 'Star Repository',
      context: { runId: ctx.runId }
    });

    if (starApproval.approved) {
      await ctx.task(starRepoTask, {});
    }
  }

  // ============================================================================
  // PHASE 6: CREATE BRANCH
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating contribution branch');

  const branchResult = await ctx.task(createBranchTask, {
    forkUrl: forkResult.forkUrl,
    forkOwner: forkResult.forkOwner,
    branchName: `contrib/${details.type}/${details.branchSlug}`,
    details
  });

  // ============================================================================
  // PHASE 7: ADD FILES
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding contribution files to library');

  const addResult = await ctx.task(addLibraryFilesTask, {
    forkOwner: forkResult.forkOwner,
    branchName: branchResult.branchName,
    details,
    targetLocation,
    filePaths
  });

  // ============================================================================
  // PHASE 8: RUN QUALITY CHECKS (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 8: Running quality checks');

  const [structureCheck, lintCheck] = await ctx.parallel.all([
    () => ctx.task(checkLibraryStructureTask, {
      details,
      targetLocation,
      addedFiles: addResult.filesAdded
    }),
    () => ctx.task(runLintTask, {
      component: 'processes'
    })
  ]);

  // ============================================================================
  // PHASE 9: REVIEW BREAKPOINT
  // ============================================================================

  const reviewResult = await ctx.breakpoint({
    question: [
      'Please review your library contribution before submitting the PR:',
      '',
      `**Type:** ${details.type}`,
      `**Name:** ${details.name}`,
      `**Location:** ${targetLocation.targetDir}`,
      `**Files added:** ${addResult.filesAdded.join(', ')}`,
      `**Structure check:** ${structureCheck.passed ? 'PASS' : 'FAIL'}`,
      `**Lint:** ${lintCheck.passed ? 'PASS' : 'FAIL'}`,
      `**Validation:** ${validationResult.valid ? 'PASS' : `${validationResult.issues.length} issues`}`,
      '',
      'Approve to submit the PR, or reject to cancel.'
    ].join('\n'),
    title: 'Review Library Contribution Before PR',
    context: { runId: ctx.runId }
  });
  if (!reviewResult.approved) {
    return { success: false, reason: 'User rejected at library contribution review gate', feedback: reviewResult.response || reviewResult.feedback };
  }

  // ============================================================================
  // PHASE 10: SUBMIT PR
  // ============================================================================

  ctx.log('info', 'Phase 10: Submitting pull request');

  const submitApproval = await ctx.breakpoint({
    question: 'Confirm: Submit this library contribution as a pull request to a5c-ai/babysitter?',
    title: 'Confirm PR Submission',
    context: { runId: ctx.runId }
  });
  if (!submitApproval.approved) {
    return { success: false, reason: 'User rejected at PR submission gate', feedback: submitApproval.response || submitApproval.feedback };
  }

  const prResult = await ctx.task(submitPrTask, {
    forkOwner: forkResult.forkOwner,
    branchName: branchResult.branchName,
    details,
    targetLocation,
    validationResult,
    structureCheck,
    lintCheck
  });

  return {
    success: prResult.success,
    prUrl: prResult.prUrl,
    prNumber: prResult.prNumber,
    forkUrl: forkResult.forkUrl,
    validationResult,
    summary: prResult.success
      ? `Library contribution PR submitted: ${prResult.prUrl}`
      : `PR submission failed: ${prResult.error}`,
    metadata: {
      processId: 'cradle/library-contribution',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatherLibraryContribDetailsTask = defineTask('gather-library-contrib-details', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather library contribution details',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Library curator gathering details about a process library contribution',
      task: 'Analyze the contribution and determine type, name, specialization, and target directory',
      context: {
        contributionType: args.contributionType,
        name: args.name,
        description: args.description,
        specialization: args.specialization,
        filePaths: args.filePaths,
        additionalContext: args.additionalContext,
        validTypes: ['process', 'skill', 'agent', 'methodology'],
        libraryStructure: {
          processes: 'library/specializations/<specialization>/',
          skills: 'library/specializations/<specialization>/skills/<name>/',
          agents: 'library/specializations/<specialization>/agents/<name>/',
          methodologies: 'library/methodologies/<name>/'
        }
      },
      instructions: [
        'Determine the contribution type: process (.js file), skill (SKILL.md), agent (AGENT.md), or methodology',
        'If type not specified, infer from file extensions and content',
        'Identify the target specialization category',
        'Generate a branch slug for the contribution',
        'Determine if this is a new item or improvement to an existing one (subType: new or improvement)',
        'Return structured details'
      ],
      outputFormat: 'JSON with type (string), subType (string: new|improvement), name (string), description (string), specialization (string), branchSlug (string), affectedFiles (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'name', 'specialization', 'branchSlug'],
      properties: {
        type: { type: 'string' },
        subType: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        specialization: { type: 'string' },
        branchSlug: { type: 'string' },
        affectedFiles: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'gather']
}));

export const validateLibraryPatternsTask = defineTask('validate-library-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate against library patterns',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Library quality inspector validating contributions against established patterns',
      task: 'Validate the contribution files against the process library conventions',
      context: { details: args.details, filePaths: args.filePaths },
      instructions: [
        'For process files (.js): Check import/export pattern, JSDoc annotations, defineTask usage, io pattern',
        'For skill files (SKILL.md): Check frontmatter (name, description), content structure, progressive disclosure',
        'For agent files (AGENT.md): Check frontmatter (name, description, role), system prompt, triggering conditions',
        'For methodologies: Check README.md, process files, references.md',
        'Validate naming conventions (kebab-case for files, directories)',
        'Check for required companion files (README.md for directories)',
        'Return validation result with specific issues'
      ],
      outputFormat: 'JSON with valid (boolean), issues (array of {severity: high|medium|low, description, file}), suggestions (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'issues'],
      properties: {
        valid: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        suggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'validate']
}));

export const determineTargetLocationTask = defineTask('determine-target-location', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine target library location',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Library organizer determining the correct directory for a contribution',
      task: 'Determine the exact target directory and file paths for this library contribution',
      context: { details: args.details, validationResult: args.validationResult },
      instructions: [
        'Map the contribution to the correct library directory based on type and specialization:',
        '  - Process: library/specializations/<specialization>/<name>.js',
        '  - Skill: library/specializations/<specialization>/skills/<name>/SKILL.md',
        '  - Agent: library/specializations/<specialization>/agents/<name>/AGENT.md',
        '  - Methodology: library/methodologies/<name>/',
        'Check if the target directory/file already exists',
        'Return the target directory and expected file paths'
      ],
      outputFormat: 'JSON with targetDir (string), targetFiles (array of {source, destination}), alreadyExists (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['targetDir', 'targetFiles'],
      properties: {
        targetDir: { type: 'string' },
        targetFiles: { type: 'array', items: { type: 'object' } },
        alreadyExists: { type: 'boolean' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'location']
}));

export const forkRepoTask = defineTask('fork-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fork repository',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent',
      task: 'Fork a5c-ai/babysitter to the authenticated user\'s account',
      context: {},
      instructions: ['Check existing fork, create if needed: `gh repo fork a5c-ai/babysitter --clone=false`', 'Return fork URL and owner'],
      outputFormat: 'JSON with success (boolean), forkUrl (string), forkOwner (string), alreadyExisted (boolean)'
    },
    outputSchema: { type: 'object', required: ['success', 'forkUrl', 'forkOwner'], properties: { success: { type: 'boolean' }, forkUrl: { type: 'string' }, forkOwner: { type: 'string' }, alreadyExisted: { type: 'boolean' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'fork', 'github']
}));

export const checkStarTask = defineTask('check-star', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check star status',
  agent: { name: 'general-purpose', prompt: { role: 'GitHub agent', task: 'Check star status', context: {}, instructions: ['`gh api user/starred/a5c-ai/babysitter` - 204=starred, 404=not'], outputFormat: 'JSON with starred (boolean)' }, outputSchema: { type: 'object', required: ['starred'], properties: { starred: { type: 'boolean' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'star-check']
}));

export const starRepoTask = defineTask('star-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Star repository',
  agent: { name: 'general-purpose', prompt: { role: 'GitHub agent', task: 'Star a5c-ai/babysitter', context: {}, instructions: ['`gh api -X PUT user/starred/a5c-ai/babysitter`'], outputFormat: 'JSON with success (boolean)' }, outputSchema: { type: 'object', required: ['success'], properties: { success: { type: 'boolean' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'star', 'github']
}));

export const createBranchTask = defineTask('create-branch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create branch: ${args.branchName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Git agent', task: 'Create contribution branch', context: { branchName: args.branchName, forkOwner: args.forkOwner }, instructions: [`Create "${args.branchName}" from main, push to fork`], outputFormat: 'JSON with success (boolean), branchName (string)' },
    outputSchema: { type: 'object', required: ['success', 'branchName'], properties: { success: { type: 'boolean' }, branchName: { type: 'string' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'branch']
}));

export const addLibraryFilesTask = defineTask('add-library-files', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add contribution files to library',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Library maintainer adding contribution files to the correct library locations',
      task: 'Place the contributed files in the correct process library directory and commit',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        details: args.details,
        targetLocation: args.targetLocation,
        filePaths: args.filePaths
      },
      instructions: [
        'Create the target directory if it doesn\'t exist',
        'Copy/move contribution files to the target location per targetLocation.targetFiles mapping',
        'If contributing a skill/agent, ensure the directory has the proper SKILL.md or AGENT.md',
        'If contributing a process, ensure proper JSDoc annotations are present',
        'Add a README.md to new directories if not already present',
        'Commit with message: "contrib(<specialization>): add <type> <name>"',
        'Push to fork branch',
        'Return list of files added'
      ],
      outputFormat: 'JSON with success (boolean), filesAdded (array of strings), commitMessage (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filesAdded'],
      properties: { success: { type: 'boolean' }, filesAdded: { type: 'array', items: { type: 'string' } }, commitMessage: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'add-files']
}));

export const checkLibraryStructureTask = defineTask('check-library-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check library structure compliance',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Library structure validator',
      task: 'Verify the contributed files match the expected library structure',
      context: { details: args.details, targetLocation: args.targetLocation, addedFiles: args.addedFiles },
      instructions: [
        'Verify all expected files exist in the target location',
        'Check directory naming (kebab-case)',
        'Check file naming conventions',
        'For processes: verify JSDoc, imports, exports',
        'For skills: verify SKILL.md frontmatter',
        'For agents: verify AGENT.md frontmatter',
        'Return pass/fail with details'
      ],
      outputFormat: 'JSON with passed (boolean), checks (array of {name, passed, details}), issues (array of strings)'
    },
    outputSchema: { type: 'object', required: ['passed'], properties: { passed: { type: 'boolean' }, checks: { type: 'array', items: { type: 'object' } }, issues: { type: 'array', items: { type: 'string' } } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'structure-check']
}));

export const runLintTask = defineTask('run-lint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run lint',
  agent: { name: 'general-purpose', prompt: { role: 'Code quality engineer', task: 'Run lint checks', context: {}, instructions: ['Run `npm run lint --workspace=@a5c-ai/babysitter-sdk` if JS files changed'], outputFormat: 'JSON with passed (boolean), errors (number), warnings (number)' }, outputSchema: { type: 'object', required: ['passed'], properties: { passed: { type: 'boolean' }, errors: { type: 'number' }, warnings: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'lint']
}));

export const submitPrTask = defineTask('submit-pr', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit library contribution PR',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GitHub operations agent creating a library contribution PR',
      task: 'Create PR from fork to a5c-ai/babysitter',
      context: {
        forkOwner: args.forkOwner,
        branchName: args.branchName,
        details: args.details,
        targetLocation: args.targetLocation,
        validationResult: args.validationResult,
        structureCheck: args.structureCheck,
        lintCheck: args.lintCheck
      },
      instructions: [
        'Create PR: `gh pr create --repo a5c-ai/babysitter --head <forkOwner>:<branchName> --base main --title "<title>" --body "<body>"`',
        'Title: contrib(<specialization>): add <type> <name>',
        'Body:',
        '  ## Library Contribution',
        '  **Type:** process/skill/agent/methodology',
        '  **Name:** <name>',
        '  **Specialization:** <specialization>',
        '  **Location:** <targetDir>',
        '  ## Validation Results',
        '  ## Files Added',
        '  ## Quality Checks',
        'Use heredoc for body',
        'Return PR details'
      ],
      outputFormat: 'JSON with success (boolean), prUrl (string), prNumber (number), error (string if failed)'
    },
    outputSchema: { type: 'object', required: ['success'], properties: { success: { type: 'boolean' }, prUrl: { type: 'string' }, prNumber: { type: 'number' }, error: { type: 'string' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'library-contribution', 'pr', 'github']
}));
