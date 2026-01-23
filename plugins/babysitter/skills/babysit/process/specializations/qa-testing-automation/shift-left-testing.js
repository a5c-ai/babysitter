/**
 * @process qa-testing-automation/shift-left-testing
 * @description Implement shift-left testing practices to move testing activities earlier in the development lifecycle
 * @category Test Strategy & Planning
 * @priority High
 * @complexity Medium
 * @inputs { projectPath: string, teamSize: number, currentWorkflow: object, qualityTargets: object }
 * @outputs { success: boolean, implementationPlan: object, metricsBaseline: object, culturalReadiness: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectPath,
    teamSize = 5,
    currentWorkflow = {},
    qualityTargets = {
      defectReduction: 50,
      testCoverage: 80,
      earlyDetection: 70
    }
  } = inputs;

  const results = {
    success: false,
    implementationPlan: {},
    metricsBaseline: {},
    culturalReadiness: 0,
    phases: [],
    timestamp: ctx.now()
  };

  // Phase 1: Current State Analysis
  const currentStateAnalysis = await ctx.task(analyzeCurrentStateTask, {
    projectPath,
    currentWorkflow,
    teamSize
  });

  results.metricsBaseline = currentStateAnalysis.baseline;
  results.phases.push({ phase: 1, name: 'Current State Analysis', result: currentStateAnalysis });

  await ctx.checkpoint({
    title: 'Phase 1: Current State Analysis Complete',
    message: `Baseline established. Defect detection phase: ${currentStateAnalysis.baseline.defectDetectionPhase}`,
    context: { currentState: currentStateAnalysis }
  });

  // Phase 2: Requirements Review Process
  const requirementsProcess = await ctx.task(establishRequirementsReviewTask, {
    projectPath,
    teamSize,
    currentState: currentStateAnalysis
  });

  results.phases.push({ phase: 2, name: 'Requirements Review Process', result: requirementsProcess });

  await ctx.checkpoint({
    title: 'Phase 2: Requirements Review Process Established',
    message: `QA involvement in requirements: ${requirementsProcess.qaInvolvement}%`,
    context: { requirementsProcess }
  });

  // Phase 3: TDD/BDD Training
  const trainingResult = await ctx.task(conductTddBddTrainingTask, {
    projectPath,
    teamSize,
    currentState: currentStateAnalysis
  });

  results.phases.push({ phase: 3, name: 'TDD/BDD Training', result: trainingResult });

  await ctx.checkpoint({
    title: 'Phase 3: TDD/BDD Training Complete',
    message: `${trainingResult.developersTrained}/${teamSize} developers trained`,
    context: { trainingResult }
  });

  // Phase 4: IDE Test Integration
  const ideIntegration = await ctx.task(configureIdeTestIntegrationTask, {
    projectPath,
    currentState: currentStateAnalysis
  });

  results.phases.push({ phase: 4, name: 'IDE Test Integration', result: ideIntegration });

  await ctx.checkpoint({
    title: 'Phase 4: IDE Test Integration Complete',
    message: `Tests can now run in developer IDEs with ${ideIntegration.executionTime}ms average`,
    context: { ideIntegration }
  });

  // Phase 5: Pre-Commit Hooks
  const preCommitHooks = await ctx.task(setupPreCommitHooksTask, {
    projectPath,
    qualityTargets
  });

  results.phases.push({ phase: 5, name: 'Pre-Commit Hooks', result: preCommitHooks });

  await ctx.checkpoint({
    title: 'Phase 5: Pre-Commit Hooks Configured',
    message: `${preCommitHooks.hooksEnabled.length} hooks enabled`,
    context: { preCommitHooks }
  });

  // Phase 6: Pair Programming Practices
  const pairingPractices = await ctx.task(establishPairProgrammingTask, {
    projectPath,
    teamSize,
    currentState: currentStateAnalysis
  });

  results.phases.push({ phase: 6, name: 'Pair Programming Practices', result: pairingPractices });

  await ctx.checkpoint({
    title: 'Phase 6: Pair Programming Practices Established',
    message: `Pairing guidelines created for ${pairingPractices.pairingTypes.length} scenarios`,
    context: { pairingPractices }
  });

  // Phase 7: Static Analysis Integration
  const staticAnalysis = await ctx.task(integrateStaticAnalysisTask, {
    projectPath,
    qualityTargets
  });

  results.phases.push({ phase: 7, name: 'Static Analysis Integration', result: staticAnalysis });

  await ctx.checkpoint({
    title: 'Phase 7: Static Analysis Integrated',
    message: `${staticAnalysis.tools.length} static analysis tools configured`,
    context: { staticAnalysis }
  });

  // Phase 8: Culture Change & Monitoring
  const cultureChange = await ctx.task(fosterCultureChangeTask, {
    projectPath,
    teamSize,
    currentState: currentStateAnalysis,
    qualityTargets
  });

  results.phases.push({ phase: 8, name: 'Culture Change & Monitoring', result: cultureChange });
  results.culturalReadiness = cultureChange.readinessScore;

  await ctx.checkpoint({
    title: 'Phase 8: Culture Change Initiatives Launched',
    message: `Cultural readiness score: ${cultureChange.readinessScore}/100`,
    context: { cultureChange }
  });

  // Final validation and implementation plan
  const validation = await ctx.task(validateImplementationTask, {
    projectPath,
    phases: results.phases,
    qualityTargets,
    baseline: results.metricsBaseline
  });

  results.success = validation.success;
  results.implementationPlan = validation.plan;

  await ctx.checkpoint({
    title: 'Shift-Left Testing Implementation Complete',
    message: `Success: ${validation.success}. ${validation.defectsShiftedLeft}% defects shifted left.`,
    context: { validation, results }
  });

  return {
    ...results,
    processId: 'qa-testing-automation/shift-left-testing',
    metadata: {
      processId: 'qa-testing-automation/shift-left-testing',
      timestamp: ctx.now(),
      projectPath,
      teamSize,
      qualityTargets
    }
  };
}

// Task 1: Analyze Current State
export const analyzeCurrentStateTask = defineTask('analyze-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Current Testing Practices',
  agent: {
    name: 'qa-analyst',
    prompt: {
      role: 'Senior QA Analyst',
      task: 'Analyze current testing practices and establish baseline metrics',
      context: {
        projectPath: args.projectPath,
        currentWorkflow: args.currentWorkflow,
        teamSize: args.teamSize
      },
      instructions: [
        'Analyze existing test coverage and test distribution',
        'Identify when defects are currently being detected (requirements, dev, QA, production)',
        'Assess current QA involvement in requirements and design phases',
        'Evaluate existing automation and testing tools',
        'Measure current lead time from code commit to defect detection',
        'Assess team testing culture and practices',
        'Document pain points and bottlenecks',
        'Calculate defect detection phase distribution'
      ],
      outputFormat: 'JSON with baseline metrics, current practices assessment, and gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'currentPractices', 'gaps', 'recommendations'],
      properties: {
        baseline: {
          type: 'object',
          properties: {
            testCoverage: { type: 'number', minimum: 0, maximum: 100 },
            defectDetectionPhase: { type: 'string' },
            defectsInProduction: { type: 'number' },
            defectsInQA: { type: 'number' },
            defectsInDev: { type: 'number' },
            defectsInRequirements: { type: 'number' },
            qaInvolvementScore: { type: 'number', minimum: 0, maximum: 100 },
            automationCoverage: { type: 'number', minimum: 0, maximum: 100 },
            leadTimeHours: { type: 'number' }
          }
        },
        currentPractices: {
          type: 'object',
          properties: {
            testingApproach: { type: 'string' },
            qaInvolvement: { type: 'array', items: { type: 'string' } },
            toolsUsed: { type: 'array', items: { type: 'string' } },
            testFirst: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'number', minimum: 1, maximum: 5 },
              recommendation: { type: 'string' },
              expectedImpact: { type: 'string' }
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
  labels: ['agent', 'qa-testing', 'shift-left', 'analysis']
}));

// Task 2: Establish Requirements Review Process
export const establishRequirementsReviewTask = defineTask('establish-requirements-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Requirements Review Process with QA',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'QA Process Lead',
      task: 'Design and implement requirements review process with early QA involvement',
      context: {
        projectPath: args.projectPath,
        teamSize: args.teamSize,
        currentState: args.currentState
      },
      instructions: [
        'Define when QA should be involved in requirements phase',
        'Create requirements review checklist focused on testability',
        'Design acceptance criteria template with QA input',
        'Establish "Definition of Ready" that includes testability review',
        'Create process for QA to identify edge cases early',
        'Document workflow for requirements refinement with QA',
        'Set up tooling for collaborative requirements review',
        'Define metrics to track QA involvement effectiveness'
      ],
      outputFormat: 'JSON with process definition, templates, and implementation steps'
    },
    outputSchema: {
      type: 'object',
      required: ['processDefinition', 'templates', 'tooling', 'metrics'],
      properties: {
        processDefinition: {
          type: 'object',
          properties: {
            qaInvolvementStages: { type: 'array', items: { type: 'string' } },
            reviewCriteria: { type: 'array', items: { type: 'string' } },
            definitionOfReady: { type: 'array', items: { type: 'string' } },
            workflow: { type: 'string' }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' },
              usage: { type: 'string' }
            }
          }
        },
        tooling: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } },
            setupInstructions: { type: 'string' }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'number' },
              measurement: { type: 'string' }
            }
          }
        },
        qaInvolvement: { type: 'number', minimum: 0, maximum: 100 },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'requirements']
}));

// Task 3: Conduct TDD/BDD Training
export const conductTddBddTrainingTask = defineTask('conduct-tdd-bdd-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create TDD/BDD Training Program',
  agent: {
    name: 'training-coordinator',
    prompt: {
      role: 'Technical Training Lead',
      task: 'Design and deliver TDD/BDD training program for development team',
      context: {
        projectPath: args.projectPath,
        teamSize: args.teamSize,
        currentState: args.currentState
      },
      instructions: [
        'Create TDD training curriculum covering Red-Green-Refactor cycle',
        'Design BDD training with Gherkin and Given-When-Then patterns',
        'Develop hands-on exercises and katas for practice',
        'Create reference examples specific to project tech stack',
        'Design workshop format for team training sessions',
        'Create quick reference guides and cheat sheets',
        'Establish pairing exercises for practicing test-first development',
        'Set up code review checklist focused on test quality'
      ],
      outputFormat: 'JSON with training materials, exercises, and rollout plan'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingMaterials', 'exercises', 'rolloutPlan', 'developersTrained'],
      properties: {
        trainingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string' },
              materials: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              difficulty: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              estimatedTime: { type: 'string' }
            }
          }
        },
        rolloutPlan: {
          type: 'object',
          properties: {
            phases: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        developersTrained: { type: 'number' },
        referenceGuides: { type: 'array', items: { type: 'string' } },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'training']
}));

// Task 4: Configure IDE Test Integration
export const configureIdeTestIntegrationTask = defineTask('configure-ide-test-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Tests to Run in Developer IDEs',
  agent: {
    name: 'dev-tools-engineer',
    prompt: {
      role: 'Developer Experience Engineer',
      task: 'Configure test execution within developer IDEs for immediate feedback',
      context: {
        projectPath: args.projectPath,
        currentState: args.currentState
      },
      instructions: [
        'Identify IDEs used by team (VS Code, IntelliJ, etc.)',
        'Configure test runners for each IDE',
        'Set up test discovery and auto-run on save',
        'Configure fast unit test execution',
        'Set up test coverage visualization in IDE',
        'Configure keyboard shortcuts for test execution',
        'Set up test failure inline markers',
        'Create IDE workspace/settings templates',
        'Document setup instructions for each IDE'
      ],
      outputFormat: 'JSON with IDE configurations, setup steps, and verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['ideConfigurations', 'setupInstructions', 'executionTime'],
      properties: {
        ideConfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ide: { type: 'string' },
              extensions: { type: 'array', items: { type: 'string' } },
              settings: { type: 'object' },
              configFiles: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        setupInstructions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ide: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              verification: { type: 'string' }
            }
          }
        },
        executionTime: { type: 'number' },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              enabled: { type: 'boolean' },
              ide: { type: 'string' }
            }
          }
        },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'ide-integration']
}));

// Task 5: Setup Pre-Commit Hooks
export const setupPreCommitHooksTask = defineTask('setup-pre-commit-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Pre-Commit Test Hooks',
  agent: {
    name: 'automation-engineer',
    prompt: {
      role: 'DevOps/Automation Engineer',
      task: 'Set up pre-commit hooks to run tests before code is committed',
      context: {
        projectPath: args.projectPath,
        qualityTargets: args.qualityTargets
      },
      instructions: [
        'Set up Git pre-commit hooks using Husky or similar',
        'Configure fast unit test execution on pre-commit',
        'Add linting and formatting checks',
        'Configure type checking (TypeScript, Flow)',
        'Set up commit message validation',
        'Add file size and test file presence checks',
        'Configure hooks to be skippable with --no-verify (but discouraged)',
        'Create documentation on hook behavior and bypass procedures',
        'Measure hook execution time and optimize if needed'
      ],
      outputFormat: 'JSON with hook configuration, execution metrics, and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['hooksEnabled', 'configuration', 'executionMetrics'],
      properties: {
        hooksEnabled: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              checks: { type: 'array', items: { type: 'string' } },
              executionTime: { type: 'number' },
              canSkip: { type: 'boolean' }
            }
          }
        },
        configuration: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            configFile: { type: 'string' },
            installCommand: { type: 'string' }
          }
        },
        executionMetrics: {
          type: 'object',
          properties: {
            averageTime: { type: 'number' },
            maxTime: { type: 'number' },
            checksRun: { type: 'number' }
          }
        },
        documentation: { type: 'string' },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'pre-commit']
}));

// Task 6: Establish Pair Programming Practices
export const establishPairProgrammingTask = defineTask('establish-pair-programming', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Dev+QA Pair Programming Practices',
  agent: {
    name: 'agile-coach',
    prompt: {
      role: 'Agile Coach',
      task: 'Design pair programming practices for developer and QA collaboration',
      context: {
        projectPath: args.projectPath,
        teamSize: args.teamSize,
        currentState: args.currentState
      },
      instructions: [
        'Define scenarios where dev+QA pairing is beneficial',
        'Create pairing guidelines and best practices',
        'Design pairing session formats (driver-navigator, ping-pong TDD)',
        'Establish pairing rotation schedule',
        'Create checklist for pairing sessions',
        'Define knowledge sharing objectives for pairing',
        'Set up remote pairing tools and practices',
        'Create metrics to track pairing effectiveness',
        'Document success stories and patterns'
      ],
      outputFormat: 'JSON with pairing guidelines, schedules, and success metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['pairingGuidelines', 'pairingTypes', 'schedule', 'metrics'],
      properties: {
        pairingGuidelines: {
          type: 'object',
          properties: {
            principles: { type: 'array', items: { type: 'string' } },
            bestPractices: { type: 'array', items: { type: 'string' } },
            antiPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        pairingTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              scenario: { type: 'string' },
              format: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        schedule: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            rotationPattern: { type: 'string' },
            pairsPerWeek: { type: 'number' }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'number' },
              current: { type: 'number' }
            }
          }
        },
        tools: { type: 'array', items: { type: 'string' } },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'pairing']
}));

// Task 7: Integrate Static Analysis
export const integrateStaticAnalysisTask = defineTask('integrate-static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Static Analysis and Type Checking',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Code Quality Engineer',
      task: 'Set up static analysis, linting, and type checking for early defect detection',
      context: {
        projectPath: args.projectPath,
        qualityTargets: args.qualityTargets
      },
      instructions: [
        'Set up ESLint/Prettier or language-specific linters',
        'Configure TypeScript or Flow for type checking',
        'Integrate SonarQube or similar code quality tool',
        'Set up security linting (eslint-plugin-security)',
        'Configure complexity and maintainability checks',
        'Integrate with IDE for real-time feedback',
        'Add static analysis to CI/CD pipeline',
        'Define quality gates and thresholds',
        'Create documentation on addressing violations'
      ],
      outputFormat: 'JSON with tool configurations, quality gates, and integration steps'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'qualityGates', 'integrations'],
      properties: {
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              configFile: { type: 'string' },
              rulesEnabled: { type: 'number' },
              integrated: { type: 'boolean' }
            }
          }
        },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              threshold: { type: 'number' },
              blocking: { type: 'boolean' }
            }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              integration: { type: 'string' },
              status: { type: 'string' },
              details: { type: 'string' }
            }
          }
        },
        baselineMetrics: {
          type: 'object',
          properties: {
            violations: { type: 'number' },
            criticalViolations: { type: 'number' },
            codeSmells: { type: 'number' },
            technicalDebt: { type: 'string' }
          }
        },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'static-analysis']
}));

// Task 8: Foster Culture Change
export const fosterCultureChangeTask = defineTask('foster-culture-change', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Foster Quality-First Culture Change',
  agent: {
    name: 'culture-change-lead',
    prompt: {
      role: 'Organizational Change Leader',
      task: 'Design and implement culture change initiatives for quality-first mindset',
      context: {
        projectPath: args.projectPath,
        teamSize: args.teamSize,
        currentState: args.currentState,
        qualityTargets: args.qualityTargets
      },
      instructions: [
        'Design culture change communication plan',
        'Create quality-first principles and values document',
        'Establish quality champions program',
        'Set up knowledge sharing sessions on quality practices',
        'Design reward and recognition for quality contributions',
        'Create feedback loops for continuous improvement',
        'Establish quality metrics visibility (dashboards)',
        'Design retrospective format focused on quality learnings',
        'Create success stories repository',
        'Measure cultural readiness and adoption'
      ],
      outputFormat: 'JSON with culture initiatives, metrics, and readiness score'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'metrics', 'readinessScore', 'monitoring'],
      properties: {
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              objective: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              baseline: { type: 'number' },
              target: { type: 'number' },
              current: { type: 'number' },
              trend: { type: 'string' }
            }
          }
        },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        monitoring: {
          type: 'object',
          properties: {
            dashboards: { type: 'array', items: { type: 'string' } },
            reportingCadence: { type: 'string' },
            feedbackMechanisms: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityChampions: { type: 'array', items: { type: 'string' } },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'culture']
}));

// Task 9: Validate Implementation
export const validateImplementationTask = defineTask('validate-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Shift-Left Implementation',
  agent: {
    name: 'qa-validator',
    prompt: {
      role: 'QA Validation Lead',
      task: 'Validate shift-left implementation success against quality targets',
      context: {
        projectPath: args.projectPath,
        phases: args.phases,
        qualityTargets: args.qualityTargets,
        baseline: args.baseline
      },
      instructions: [
        'Review all phase results against success criteria',
        'Measure defect detection phase shift (left vs baseline)',
        'Validate requirements review process adoption',
        'Check TDD/BDD practice adoption rates',
        'Verify IDE test integration effectiveness',
        'Validate pre-commit hook usage and bypass rate',
        'Assess pairing practice adoption',
        'Measure static analysis impact',
        'Evaluate cultural readiness score',
        'Calculate ROI of shift-left practices',
        'Create comprehensive implementation plan for ongoing adoption'
      ],
      outputFormat: 'JSON with validation results, success indicators, and implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationResults', 'defectsShiftedLeft', 'plan'],
      properties: {
        success: { type: 'boolean' },
        validationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              passed: { type: 'boolean' },
              criteria: { type: 'array', items: { type: 'string' } },
              score: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        },
        defectsShiftedLeft: { type: 'number', minimum: 0, maximum: 100 },
        improvements: {
          type: 'object',
          properties: {
            defectsInRequirements: { type: 'number' },
            defectsInDev: { type: 'number' },
            defectsInQA: { type: 'number' },
            defectsInProduction: { type: 'number' },
            testCoverageIncrease: { type: 'number' },
            leadTimeReduction: { type: 'number' }
          }
        },
        plan: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            nextSteps: { type: 'array', items: { type: 'string' } },
            ongoingActivities: { type: 'array', items: { type: 'string' } },
            monitoringSchedule: { type: 'string' },
            reviewCadence: { type: 'string' }
          }
        },
        roi: {
          type: 'object',
          properties: {
            costSavings: { type: 'string' },
            timeToMarketImprovement: { type: 'string' },
            qualityImprovement: { type: 'string' }
          }
        },
        filesCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-testing', 'shift-left', 'validation']
}));

// Quality gates for the overall process
export const qualityGates = {
  requirementsReviewsIncludeQA: {
    description: 'Requirements reviews include QA participation',
    threshold: 90,
    metric: 'qaInvolvementPercentage'
  },
  developersWritingTests: {
    description: 'Developers actively writing tests before/during development',
    threshold: 80,
    metric: 'testFirstAdoptionRate'
  },
  preCommitHooksFunctional: {
    description: 'Pre-commit hooks running and rarely bypassed',
    threshold: 95,
    metric: 'preCommitComplianceRate'
  },
  staticAnalysisInPlace: {
    description: 'Static analysis tools integrated and enforced',
    threshold: 100,
    metric: 'staticAnalysisToolsEnabled'
  },
  defectDetectionShiftedEarlier: {
    description: 'Defects detected in earlier phases than baseline',
    threshold: 50,
    metric: 'defectsShiftedLeftPercentage'
  }
};

// Estimated duration: 5-7 days for setup + ongoing cultural change
export const estimatedDuration = {
  setup: '5-7 days',
  cultural: 'ongoing',
  total: '5-7 days setup + 3-6 months cultural adoption'
};
