/**
 * @process specializations/domains/science/mathematics/reproducible-computation-setup
 * @description Set up reproducible computational mathematics environments with version control,
 * dependency management, and random seed documentation.
 * @inputs { projectName: string, computationType?: string, languages?: array, requirements?: object }
 * @outputs { success: boolean, environmentConfig: object, versionControl: object, reproducibilityReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/reproducible-computation-setup', {
 *   projectName: 'numerical-pde-solver',
 *   computationType: 'numerical-simulation',
 *   languages: ['python', 'julia'],
 *   requirements: { deterministic: true, parallelizable: true }
 * });
 *
 * @references
 * - Reproducible Research in Computational Science
 * - The Turing Way: Guide for Reproducible Research
 * - Best Practices for Scientific Computing
 * - Docker for Data Science
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    computationType = 'general',
    languages = ['python'],
    requirements = {}
  } = inputs;

  // Phase 1: Configure Version Control
  const versionControlConfig = await ctx.task(versionControlConfigTask, {
    projectName,
    computationType,
    languages
  });

  // Quality Gate: Version control must be configurable
  if (!versionControlConfig.config) {
    return {
      success: false,
      error: 'Unable to configure version control',
      phase: 'version-control',
      environmentConfig: null
    };
  }

  // Breakpoint: Review version control setup
  await ctx.breakpoint({
    question: `Version control configured for ${projectName}. Review setup?`,
    title: 'Version Control Review',
    context: {
      runId: ctx.runId,
      projectName,
      gitConfig: versionControlConfig.config,
      files: [{
        path: `artifacts/phase1-version-control.json`,
        format: 'json',
        content: versionControlConfig
      }]
    }
  });

  // Phase 2: Document Dependencies
  const dependencyDocumentation = await ctx.task(dependencyDocumentationTask, {
    projectName,
    languages,
    computationType,
    requirements
  });

  // Phase 3: Set Random Seeds
  const randomSeedSetup = await ctx.task(randomSeedSetupTask, {
    projectName,
    languages,
    computationType,
    requirements
  });

  // Phase 4: Create Reproducible Scripts
  const reproducibleScripts = await ctx.task(reproducibleScriptsTask, {
    projectName,
    languages,
    dependencyDocumentation,
    randomSeedSetup
  });

  // Phase 5: Generate Reproducibility Reports
  const reproducibilityReport = await ctx.task(reproducibilityReportTask, {
    versionControlConfig,
    dependencyDocumentation,
    randomSeedSetup,
    reproducibleScripts,
    projectName
  });

  // Final Breakpoint: Setup Complete
  await ctx.breakpoint({
    question: `Reproducible computation environment setup complete for ${projectName}. Reproducibility score: ${reproducibilityReport.score}/100. Review?`,
    title: 'Reproducibility Setup Complete',
    context: {
      runId: ctx.runId,
      projectName,
      reproducibilityScore: reproducibilityReport.score,
      files: [
        { path: `artifacts/reproducibility-report.json`, format: 'json', content: reproducibilityReport }
      ]
    }
  });

  return {
    success: true,
    projectName,
    environmentConfig: {
      languages,
      computationType,
      dependencies: dependencyDocumentation.dependencies,
      containerConfig: dependencyDocumentation.containerConfig
    },
    versionControl: {
      gitConfig: versionControlConfig.config,
      gitignore: versionControlConfig.gitignore,
      hooks: versionControlConfig.hooks
    },
    randomSeeds: randomSeedSetup.seeds,
    scripts: reproducibleScripts.scripts,
    reproducibilityReport: {
      score: reproducibilityReport.score,
      checklist: reproducibilityReport.checklist,
      recommendations: reproducibilityReport.recommendations
    },
    metadata: {
      processId: 'specializations/domains/science/mathematics/reproducible-computation-setup',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const versionControlConfigTask = defineTask('version-control-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Configure Version Control`,
  agent: {
    name: 'scientific-computing-specialist',
    skills: ['version-control-for-math', 'jupyter-notebook-interface', 'reproducible-research-tools'],
    prompt: {
      role: 'Version Control Expert for Scientific Computing',
      task: 'Configure version control for reproducible computations',
      context: {
        projectName: args.projectName,
        computationType: args.computationType,
        languages: args.languages
      },
      instructions: [
        '1. Set up Git repository structure',
        '2. Create appropriate .gitignore for languages',
        '3. Configure Git LFS for large data files',
        '4. Set up branching strategy',
        '5. Configure commit message templates',
        '6. Set up pre-commit hooks for code quality',
        '7. Configure Git attributes for notebooks',
        '8. Set up data versioning strategy',
        '9. Configure continuous integration hooks',
        '10. Document version control practices'
      ],
      outputFormat: 'JSON object with version control configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'gitignore'],
      properties: {
        config: {
          type: 'object',
          properties: {
            structure: { type: 'array', items: { type: 'string' } },
            branchingStrategy: { type: 'string' },
            lfsPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        gitignore: { type: 'string' },
        gitattributes: { type: 'string' },
        hooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              script: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        commitTemplate: { type: 'string' },
        dataVersioning: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'reproducibility', 'version-control']
}));

export const dependencyDocumentationTask = defineTask('dependency-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Document Dependencies`,
  agent: {
    name: 'scientific-computing-specialist',
    skills: ['version-control-for-math', 'jupyter-notebook-interface', 'reproducible-research-tools'],
    prompt: {
      role: 'Dependency Management Expert',
      task: 'Document all dependencies for reproducibility',
      context: {
        projectName: args.projectName,
        languages: args.languages,
        computationType: args.computationType,
        requirements: args.requirements
      },
      instructions: [
        '1. List all language dependencies with exact versions',
        '2. Document system-level dependencies',
        '3. Create environment specification files',
        '4. Set up virtual environment configuration',
        '5. Create Dockerfile for containerization',
        '6. Document hardware requirements',
        '7. Specify compiler versions if applicable',
        '8. Document BLAS/LAPACK requirements',
        '9. Create dependency lock files',
        '10. Test dependency installation'
      ],
      outputFormat: 'JSON object with dependency documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'environmentFiles'],
      properties: {
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              language: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        environmentFiles: {
          type: 'object',
          properties: {
            requirements: { type: 'string' },
            environment: { type: 'string' },
            projectToml: { type: 'string' }
          }
        },
        containerConfig: {
          type: 'object',
          properties: {
            dockerfile: { type: 'string' },
            dockerCompose: { type: 'string' }
          }
        },
        systemDependencies: { type: 'array', items: { type: 'string' } },
        hardwareRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'reproducibility', 'dependencies']
}));

export const randomSeedSetupTask = defineTask('random-seed-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Set Random Seeds`,
  agent: {
    name: 'scientific-computing-specialist',
    skills: ['jupyter-notebook-interface', 'monte-carlo-simulation', 'reproducible-research-tools'],
    prompt: {
      role: 'Computational Reproducibility Expert',
      task: 'Set up random seed management for reproducibility',
      context: {
        projectName: args.projectName,
        languages: args.languages,
        computationType: args.computationType,
        requirements: args.requirements
      },
      instructions: [
        '1. Identify all sources of randomness',
        '2. Set global random seeds for each language',
        '3. Set NumPy/SciPy random seeds',
        '4. Handle parallel/distributed random seeds',
        '5. Set CUDA random seeds if GPU used',
        '6. Document seed values used',
        '7. Create seed management utilities',
        '8. Handle non-deterministic operations',
        '9. Test reproducibility with same seeds',
        '10. Document any unavoidable non-determinism'
      ],
      outputFormat: 'JSON object with random seed setup'
    },
    outputSchema: {
      type: 'object',
      required: ['seeds', 'seedManagement'],
      properties: {
        seeds: {
          type: 'object',
          properties: {
            master: { type: 'number' },
            numpy: { type: 'number' },
            random: { type: 'number' },
            torch: { type: 'number' },
            cuda: { type: 'number' }
          }
        },
        seedManagement: {
          type: 'object',
          properties: {
            script: { type: 'string' },
            documentation: { type: 'string' }
          }
        },
        randomnessSources: { type: 'array', items: { type: 'string' } },
        parallelHandling: { type: 'string' },
        nonDeterministicOperations: { type: 'array', items: { type: 'string' } },
        mitigationStrategies: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'reproducibility', 'random-seeds']
}));

export const reproducibleScriptsTask = defineTask('reproducible-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Create Reproducible Scripts`,
  agent: {
    name: 'scientific-computing-specialist',
    skills: ['jupyter-notebook-interface', 'version-control-for-math', 'reproducible-research-tools'],
    prompt: {
      role: 'Scientific Computing Script Expert',
      task: 'Create scripts that ensure reproducible execution',
      context: {
        projectName: args.projectName,
        languages: args.languages,
        dependencyDocumentation: args.dependencyDocumentation,
        randomSeedSetup: args.randomSeedSetup
      },
      instructions: [
        '1. Create main execution script',
        '2. Add environment setup commands',
        '3. Include seed initialization',
        '4. Add logging for reproducibility info',
        '5. Create data download scripts',
        '6. Add result verification steps',
        '7. Create cleanup scripts',
        '8. Add timing and profiling',
        '9. Create batch execution scripts',
        '10. Document script usage'
      ],
      outputFormat: 'JSON object with reproducible scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts'],
      properties: {
        scripts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              content: { type: 'string' },
              usage: { type: 'string' }
            }
          }
        },
        makefile: { type: 'string' },
        runAll: { type: 'string' },
        logging: {
          type: 'object',
          properties: {
            config: { type: 'string' },
            format: { type: 'string' }
          }
        },
        verification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'reproducibility', 'scripts']
}));

export const reproducibilityReportTask = defineTask('reproducibility-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Reproducibility Reports`,
  agent: {
    name: 'scientific-computing-specialist',
    skills: ['version-control-for-math', 'latex-math-formatter', 'reproducible-research-tools'],
    prompt: {
      role: 'Reproducibility Assessment Expert',
      task: 'Generate comprehensive reproducibility report',
      context: {
        versionControlConfig: args.versionControlConfig,
        dependencyDocumentation: args.dependencyDocumentation,
        randomSeedSetup: args.randomSeedSetup,
        reproducibleScripts: args.reproducibleScripts,
        projectName: args.projectName
      },
      instructions: [
        '1. Assess overall reproducibility level',
        '2. Create reproducibility checklist',
        '3. Document all configurations',
        '4. List known limitations',
        '5. Provide reproduction instructions',
        '6. Calculate reproducibility score',
        '7. Identify improvement areas',
        '8. Generate README content',
        '9. Create quick-start guide',
        '10. Document validation procedures'
      ],
      outputFormat: 'JSON object with reproducibility report'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'checklist', 'recommendations'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string', enum: ['complete', 'partial', 'missing'] },
              notes: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        reproductionInstructions: { type: 'string' },
        readme: { type: 'string' },
        quickStart: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        validationProcedures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'reproducibility', 'reporting']
}));
