/**
 * @process specializations/sdk-platform-development/sdk-onboarding-tutorials
 * @description SDK Onboarding and Tutorials - Create comprehensive onboarding experience for new SDK users
 * including step-by-step tutorials, sandbox environments, and code examples repository.
 * @inputs { projectName: string, sdkLanguages?: array, sandboxEnabled?: boolean, interactiveTutorials?: boolean }
 * @outputs { success: boolean, tutorials: array, sandboxConfig: object, examplesRepo: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/sdk-onboarding-tutorials', {
 *   projectName: 'CloudAPI SDK',
 *   sdkLanguages: ['typescript', 'python', 'go'],
 *   sandboxEnabled: true,
 *   interactiveTutorials: true
 * });
 *
 * @references
 * - Diataxis Tutorial Framework: https://diataxis.fr/tutorials/
 * - Developer Education Best Practices: https://www.developerrelations.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sdkLanguages = ['typescript', 'python'],
    sandboxEnabled = true,
    interactiveTutorials = true,
    outputDir = 'sdk-onboarding-tutorials'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SDK Onboarding and Tutorials: ${projectName}`);
  ctx.log('info', `Languages: ${sdkLanguages.join(', ')}`);

  // ============================================================================
  // PHASE 1: ONBOARDING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining onboarding strategy');

  const strategy = await ctx.task(onboardingStrategyTask, {
    projectName,
    sdkLanguages,
    sandboxEnabled,
    interactiveTutorials,
    outputDir
  });

  artifacts.push(...strategy.artifacts);

  // ============================================================================
  // PHASE 2: GETTING STARTED TUTORIALS
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating getting started tutorials per language');

  const tutorialTasks = sdkLanguages.map(lang =>
    () => ctx.task(gettingStartedTutorialTask, {
      projectName,
      language: lang,
      strategy,
      outputDir
    })
  );

  const gettingStartedTutorials = await ctx.parallel.all(tutorialTasks);
  artifacts.push(...gettingStartedTutorials.flatMap(t => t.artifacts));

  // ============================================================================
  // PHASE 3: SANDBOX ENVIRONMENT
  // ============================================================================

  if (sandboxEnabled) {
    ctx.log('info', 'Phase 3: Setting up sandbox/playground environment');

    const sandboxSetup = await ctx.task(sandboxSetupTask, {
      projectName,
      sdkLanguages,
      outputDir
    });

    artifacts.push(...sandboxSetup.artifacts);
  }

  // ============================================================================
  // PHASE 4: CODE EXAMPLES REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 4: Building code examples repository');

  const examplesRepo = await ctx.task(codeExamplesRepoTask, {
    projectName,
    sdkLanguages,
    gettingStartedTutorials,
    outputDir
  });

  artifacts.push(...examplesRepo.artifacts);

  // Quality Gate: Tutorial Review
  await ctx.breakpoint({
    question: `Onboarding content created for ${projectName}. Tutorials: ${gettingStartedTutorials.length} languages, Examples: ${examplesRepo.exampleCount}. Approve content?`,
    title: 'Onboarding Content Review',
    context: {
      runId: ctx.runId,
      projectName,
      languages: sdkLanguages,
      tutorialCount: gettingStartedTutorials.length,
      exampleCount: examplesRepo.exampleCount,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: INTERACTIVE LEARNING EXPERIENCES
  // ============================================================================

  if (interactiveTutorials) {
    ctx.log('info', 'Phase 5: Designing interactive learning experiences');

    const interactiveLearning = await ctx.task(interactiveLearningTask, {
      projectName,
      sdkLanguages,
      gettingStartedTutorials,
      outputDir
    });

    artifacts.push(...interactiveLearning.artifacts);
  }

  // ============================================================================
  // PHASE 6: LEARNING PATHS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating learning paths for different skill levels');

  const learningPaths = await ctx.task(learningPathsTask, {
    projectName,
    strategy,
    gettingStartedTutorials,
    outputDir
  });

  artifacts.push(...learningPaths.artifacts);

  // ============================================================================
  // PHASE 7: VIDEO TUTORIAL SCRIPTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating video tutorial scripts');

  const videoScripts = await ctx.task(videoScriptsTask, {
    projectName,
    gettingStartedTutorials,
    learningPaths,
    outputDir
  });

  artifacts.push(...videoScripts.artifacts);

  // ============================================================================
  // PHASE 8: ONBOARDING DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating onboarding documentation');

  const documentation = await ctx.task(onboardingDocumentationTask, {
    projectName,
    strategy,
    gettingStartedTutorials,
    examplesRepo,
    learningPaths,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    tutorials: gettingStartedTutorials.map(t => ({
      language: t.language,
      path: t.tutorialPath,
      duration: t.estimatedDuration
    })),
    sandboxConfig: sandboxEnabled ? { enabled: true } : { enabled: false },
    examplesRepo: {
      path: examplesRepo.repoPath,
      exampleCount: examplesRepo.exampleCount,
      categories: examplesRepo.categories
    },
    learningPaths: learningPaths.paths,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/sdk-onboarding-tutorials',
      timestamp: startTime,
      sdkLanguages
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const onboardingStrategyTask = defineTask('onboarding-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Onboarding Strategy - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Developer Advocate',
      task: 'Define comprehensive onboarding strategy',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        sandboxEnabled: args.sandboxEnabled,
        interactiveTutorials: args.interactiveTutorials,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define target developer personas',
        '2. Map learning objectives per persona',
        '3. Design onboarding journey',
        '4. Define success milestones',
        '5. Plan content types (text, video, interactive)',
        '6. Design feedback collection points',
        '7. Plan gamification elements',
        '8. Define completion criteria',
        '9. Plan ongoing education',
        '10. Generate onboarding strategy document'
      ],
      outputFormat: 'JSON with onboarding strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'journey', 'milestones', 'artifacts'],
      properties: {
        personas: { type: 'array', items: { type: 'object' } },
        journey: { type: 'object' },
        milestones: { type: 'array', items: { type: 'string' } },
        contentTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'strategy']
}));

export const gettingStartedTutorialTask = defineTask('getting-started-tutorial', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Getting Started Tutorial - ${args.language}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Technical Writer',
      task: `Create getting started tutorial for ${args.language}`,
      context: {
        projectName: args.projectName,
        language: args.language,
        strategy: args.strategy,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.language} SDK installation guide`,
        '2. Write authentication setup tutorial',
        '3. Create first API call example',
        '4. Design immediate success moment',
        '5. Add common operations guide',
        '6. Include error handling basics',
        '7. Add "what\'s next" section',
        '8. Include troubleshooting tips',
        '9. Add code snippets with comments',
        '10. Generate complete tutorial'
      ],
      outputFormat: 'JSON with tutorial path and structure'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'tutorialPath', 'estimatedDuration', 'artifacts'],
      properties: {
        language: { type: 'string' },
        tutorialPath: { type: 'string' },
        estimatedDuration: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        codeSnippets: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'tutorial', args.language]
}));

export const sandboxSetupTask = defineTask('sandbox-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Sandbox Setup - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Engineer',
      task: 'Set up sandbox/playground environment',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design sandbox architecture',
        '2. Set up isolated API environment',
        '3. Create test data and fixtures',
        '4. Configure rate limiting for sandbox',
        '5. Set up sandbox credentials management',
        '6. Create sandbox documentation',
        '7. Design sandbox reset mechanism',
        '8. Configure monitoring for sandbox',
        '9. Plan sandbox maintenance',
        '10. Generate sandbox configuration'
      ],
      outputFormat: 'JSON with sandbox configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['sandboxUrl', 'features', 'artifacts'],
      properties: {
        sandboxUrl: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        testData: { type: 'object' },
        credentials: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'sandbox']
}));

export const codeExamplesRepoTask = defineTask('code-examples-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Code Examples Repository - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Developer Advocate',
      task: 'Build comprehensive code examples repository',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        gettingStartedTutorials: args.gettingStartedTutorials,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design repository structure',
        '2. Create basic CRUD examples',
        '3. Build authentication examples',
        '4. Create pagination handling examples',
        '5. Add error handling examples',
        '6. Create webhook integration examples',
        '7. Build real-world scenario examples',
        '8. Add testing examples',
        '9. Create README for each example',
        '10. Set up CI for examples validation'
      ],
      outputFormat: 'JSON with examples repository configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['repoPath', 'exampleCount', 'categories', 'artifacts'],
      properties: {
        repoPath: { type: 'string' },
        exampleCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        perLanguage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'code-examples']
}));

export const interactiveLearningTask = defineTask('interactive-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Interactive Learning - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Learning Experience Designer',
      task: 'Design interactive learning experiences',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        gettingStartedTutorials: args.gettingStartedTutorials,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design interactive code playground',
        '2. Create step-by-step walkthroughs',
        '3. Design quizzes and assessments',
        '4. Create coding challenges',
        '5. Design progress tracking',
        '6. Create achievement badges',
        '7. Design peer learning features',
        '8. Create live coding sessions format',
        '9. Design feedback collection',
        '10. Generate interactive learning configuration'
      ],
      outputFormat: 'JSON with interactive learning design'
    },
    outputSchema: {
      type: 'object',
      required: ['experiences', 'gamification', 'artifacts'],
      properties: {
        experiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        gamification: { type: 'object' },
        assessments: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'interactive-learning']
}));

export const learningPathsTask = defineTask('learning-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Learning Paths - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Curriculum Designer',
      task: 'Create learning paths for different skill levels',
      context: {
        projectName: args.projectName,
        strategy: args.strategy,
        gettingStartedTutorials: args.gettingStartedTutorials,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design beginner learning path',
        '2. Create intermediate learning path',
        '3. Design advanced learning path',
        '4. Create use-case specific paths',
        '5. Define prerequisites per path',
        '6. Estimate time to completion',
        '7. Create certification criteria',
        '8. Design path branching options',
        '9. Plan path updates and maintenance',
        '10. Generate learning paths documentation'
      ],
      outputFormat: 'JSON with learning paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              level: { type: 'string' },
              modules: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        certifications: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'learning-paths']
}));

export const videoScriptsTask = defineTask('video-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Video Tutorial Scripts - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Technical Content Creator',
      task: 'Create video tutorial scripts',
      context: {
        projectName: args.projectName,
        gettingStartedTutorials: args.gettingStartedTutorials,
        learningPaths: args.learningPaths,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create introduction video script',
        '2. Write getting started video scripts',
        '3. Create feature deep-dive scripts',
        '4. Design demo application walkthrough',
        '5. Create troubleshooting video scripts',
        '6. Plan video series structure',
        '7. Include code demonstrations',
        '8. Design call-to-action points',
        '9. Plan video updates cadence',
        '10. Generate video scripts'
      ],
      outputFormat: 'JSON with video scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'artifacts'],
      properties: {
        scripts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              duration: { type: 'string' },
              scriptPath: { type: 'string' }
            }
          }
        },
        seriesStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'video-content']
}));

export const onboardingDocumentationTask = defineTask('onboarding-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Onboarding Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate onboarding documentation',
      context: {
        projectName: args.projectName,
        strategy: args.strategy,
        gettingStartedTutorials: args.gettingStartedTutorials,
        examplesRepo: args.examplesRepo,
        learningPaths: args.learningPaths,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create onboarding overview page',
        '2. Document all tutorials',
        '3. Create examples index',
        '4. Document learning paths',
        '5. Create sandbox usage guide',
        '6. Document success metrics',
        '7. Create contributor guide for examples',
        '8. Document feedback channels',
        '9. Create FAQ section',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            tutorials: { type: 'string' },
            examples: { type: 'string' },
            learningPaths: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'onboarding', 'documentation']
}));
