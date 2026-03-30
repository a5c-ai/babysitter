/**
 * @process specializations/security-research/capture-the-flag-challenges
 * @description Creation of Capture The Flag (CTF) challenges for security training and competitions.
 * Covers challenge design, difficulty scaling, infrastructure setup, and solution documentation
 * across various categories (web, pwn, crypto, reverse, forensics).
 * @inputs { projectName: string, ctfType: string, categories: array, difficulty: string }
 * @outputs { success: boolean, challenges: array, infrastructure: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/capture-the-flag-challenges', {
 *   projectName: 'Internal Security CTF',
 *   ctfType: 'jeopardy',
 *   categories: ['web', 'crypto', 'reverse'],
 *   difficulty: 'intermediate'
 * });
 *
 * @references
 * - CTFd: https://ctfd.io/
 * - CTF Design Guide: https://ctf-wiki.org/en/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    ctfType,
    categories,
    difficulty,
    challengeCount = 10,
    outputDir = 'ctf-challenges-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const challenges = [];

  ctx.log('info', `Starting CTF Challenge Creation for ${projectName}`);
  ctx.log('info', `Type: ${ctfType}, Categories: ${categories.join(', ')}`);

  // ============================================================================
  // PHASE 1: CTF DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing CTF structure');

  const ctfDesign = await ctx.task(ctfDesignTask, {
    projectName,
    ctfType,
    categories,
    difficulty,
    challengeCount,
    outputDir
  });

  artifacts.push(...ctfDesign.artifacts);

  // ============================================================================
  // PHASE 2: CHALLENGE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating challenges');

  const challengeCreation = await ctx.task(challengeCreationTask, {
    projectName,
    ctfDesign,
    categories,
    difficulty,
    outputDir
  });

  challenges.push(...challengeCreation.challenges);
  artifacts.push(...challengeCreation.artifacts);

  // ============================================================================
  // PHASE 3: SOLUTION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting solutions');

  const solutions = await ctx.task(solutionDocumentationTask, {
    projectName,
    challenges: challengeCreation.challenges,
    outputDir
  });

  artifacts.push(...solutions.artifacts);

  // ============================================================================
  // PHASE 4: INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up CTF infrastructure');

  const infrastructure = await ctx.task(ctfInfrastructureTask, {
    projectName,
    ctfType,
    challenges: challengeCreation.challenges,
    outputDir
  });

  artifacts.push(...infrastructure.artifacts);

  // ============================================================================
  // PHASE 5: CHALLENGE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing challenges');

  const testing = await ctx.task(challengeTestingTask, {
    projectName,
    challenges: challengeCreation.challenges,
    solutions,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // ============================================================================
  // PHASE 6: DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Deploying CTF');

  const deployment = await ctx.task(ctfDeploymentTask, {
    projectName,
    infrastructure,
    challenges: challengeCreation.challenges,
    outputDir
  });

  artifacts.push(...deployment.artifacts);

  await ctx.breakpoint({
    question: `CTF creation complete. ${challenges.length} challenges created across ${categories.length} categories. All tested: ${testing.allPassed}. Ready to deploy?`,
    title: 'CTF Creation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        type: ctfType,
        categories: categories.length,
        challenges: challenges.length,
        allTested: testing.allPassed
      },
      files: deployment.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    challenges,
    infrastructure: {
      platform: infrastructure.platform,
      url: deployment.ctfUrl
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/capture-the-flag-challenges',
      timestamp: startTime,
      ctfType,
      categories,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const ctfDesignTask = defineTask('ctf-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design CTF - ${args.projectName}`,
  agent: {
    name: 'ctf-creator',
    prompt: {
      role: 'CTF Design Specialist',
      task: 'Design CTF structure',
      context: args,
      instructions: [
        '1. Define CTF format',
        '2. Plan challenge distribution',
        '3. Design scoring system',
        '4. Plan difficulty curve',
        '5. Define categories',
        '6. Plan infrastructure needs',
        '7. Design rules',
        '8. Document design'
      ],
      outputFormat: 'JSON with CTF design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'challengePlan', 'artifacts'],
      properties: {
        design: { type: 'object' },
        challengePlan: { type: 'array' },
        scoringSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ctf', 'design']
}));

export const challengeCreationTask = defineTask('challenge-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Challenges - ${args.projectName}`,
  agent: {
    name: 'ctf-creator',
    prompt: {
      role: 'CTF Challenge Creator',
      task: 'Create CTF challenges',
      context: args,
      instructions: [
        '1. Create web challenges',
        '2. Create crypto challenges',
        '3. Create reverse challenges',
        '4. Create pwn challenges',
        '5. Create forensics challenges',
        '6. Set point values',
        '7. Create flags',
        '8. Document challenges'
      ],
      outputFormat: 'JSON with challenges'
    },
    outputSchema: {
      type: 'object',
      required: ['challenges', 'totalCreated', 'artifacts'],
      properties: {
        challenges: { type: 'array' },
        totalCreated: { type: 'number' },
        byCategory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ctf', 'challenges']
}));

export const solutionDocumentationTask = defineTask('solution-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Solutions - ${args.projectName}`,
  agent: {
    name: 'ctf-creator',
    prompt: {
      role: 'Solution Documentation Specialist',
      task: 'Document challenge solutions',
      context: args,
      instructions: [
        '1. Write solution steps',
        '2. Create exploit scripts',
        '3. Document hints',
        '4. Create writeups',
        '5. Add learning resources',
        '6. Document alternative solutions',
        '7. Add difficulty notes',
        '8. Create solution guide'
      ],
      outputFormat: 'JSON with solutions'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'writeups', 'artifacts'],
      properties: {
        solutions: { type: 'array' },
        writeups: { type: 'array' },
        exploitScripts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ctf', 'solutions']
}));

export const ctfInfrastructureTask = defineTask('ctf-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Infrastructure - ${args.projectName}`,
  agent: {
    name: 'ctf-creator',
    prompt: {
      role: 'CTF Infrastructure Engineer',
      task: 'Set up CTF infrastructure',
      context: args,
      instructions: [
        '1. Set up CTFd platform',
        '2. Configure challenge containers',
        '3. Set up networking',
        '4. Configure scoring',
        '5. Set up monitoring',
        '6. Configure authentication',
        '7. Set up backups',
        '8. Document infrastructure'
      ],
      outputFormat: 'JSON with infrastructure'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'containers', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        containers: { type: 'array' },
        networking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ctf', 'infrastructure']
}));

export const challengeTestingTask = defineTask('challenge-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Challenges - ${args.projectName}`,
  agent: {
    name: 'ctf-creator',
    prompt: {
      role: 'CTF Challenge Tester',
      task: 'Test challenges',
      context: args,
      instructions: [
        '1. Test each challenge',
        '2. Verify solutions work',
        '3. Check flag format',
        '4. Test difficulty',
        '5. Check for unintended solutions',
        '6. Test stability',
        '7. Verify scoring',
        '8. Document results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'tested', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        tested: { type: 'number' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ctf', 'testing']
}));

export const ctfDeploymentTask = defineTask('ctf-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy CTF - ${args.projectName}`,
  agent: {
    name: 'ctf-creator',
    prompt: {
      role: 'CTF Deployment Engineer',
      task: 'Deploy CTF',
      context: args,
      instructions: [
        '1. Deploy platform',
        '2. Import challenges',
        '3. Configure access',
        '4. Set up SSL',
        '5. Final testing',
        '6. Enable registration',
        '7. Monitor deployment',
        '8. Document access'
      ],
      outputFormat: 'JSON with deployment'
    },
    outputSchema: {
      type: 'object',
      required: ['deployed', 'ctfUrl', 'artifacts'],
      properties: {
        deployed: { type: 'boolean' },
        ctfUrl: { type: 'string' },
        adminAccess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'ctf', 'deployment']
}));
