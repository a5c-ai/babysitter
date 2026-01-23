/**
 * @process methodologies/bdd-specification-by-example
 * @description BDD/Specification by Example - Executable specifications with Given-When-Then scenarios
 * @inputs { projectName: string, feature: string, stakeholders?: array, testFramework?: string, developmentPhase?: string }
 * @outputs { success: boolean, features: array, scenarios: array, stepDefinitions: array, automation: object, documentation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BDD/Specification by Example Process
 *
 * Three-step iterative process:
 * 1. Discovery - Collaborative exploration with concrete examples
 * 2. Formulation - Convert examples to Gherkin scenarios
 * 3. Automation - Implement executable specifications
 *
 * Methodology: Dan North (BDD), Gojko Adzic (Specification by Example)
 *
 * This process implements:
 * - Discovery workshops (Example Mapping style)
 * - Gherkin formulation (Given-When-Then)
 * - Step definition generation
 * - Test automation
 * - Living documentation
 * - Outside-in development
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Project name
 * @param {string} inputs.feature - Feature description or story to analyze
 * @param {Array<string>} inputs.stakeholders - List of stakeholder roles (default: ['Product Owner', 'Developer', 'QA'])
 * @param {string} inputs.testFramework - cucumber|specflow|behave|cypress (default: cucumber)
 * @param {string} inputs.developmentPhase - greenfield|brownfield (default: greenfield)
 * @param {boolean} inputs.generateTests - Auto-generate test code (default: true)
 * @param {boolean} inputs.createDocumentation - Generate living documentation (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with features, scenarios, and automation artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    feature,
    stakeholders = ['Product Owner', 'Developer', 'QA'],
    testFramework = 'cucumber',
    developmentPhase = 'greenfield',
    generateTests = true,
    createDocumentation = true
  } = inputs;

  // Validate inputs
  if (!projectName || !feature) {
    throw new Error('projectName and feature are required');
  }

  // ============================================================================
  // PHASE 1: DISCOVERY WORKSHOP
  // ============================================================================

  const discoveryResult = await ctx.task(discoveryWorkshopTask, {
    projectName,
    feature,
    stakeholders,
    developmentPhase,
    existingFeatures: inputs.existingFeatures || []
  });

  // Breakpoint: Review discovery workshop results
  await ctx.breakpoint({
    question: `Discovery workshop complete for "${feature}". Found ${discoveryResult.examples.length} examples, ${discoveryResult.rules.length} rules, and ${discoveryResult.questions.length} questions. Review and clarify before proceeding to formulation?`,
    title: 'Discovery Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bdd/discovery/example-map.md', format: 'markdown', label: 'Example Map' },
        { path: 'artifacts/bdd/discovery/rules.json', format: 'code', language: 'json', label: 'Business Rules' },
        { path: 'artifacts/bdd/discovery/questions.json', format: 'code', language: 'json', label: 'Open Questions' }
      ]
    }
  });

  // Handle open questions if any
  let clarifiedDiscovery = discoveryResult;
  if (discoveryResult.questions.length > 0) {
    const clarificationResult = await ctx.task(clarifyQuestionsTask, {
      projectName,
      feature,
      questions: discoveryResult.questions,
      discovery: discoveryResult
    });

    clarifiedDiscovery = {
      ...discoveryResult,
      questions: discoveryResult.questions.map((q, idx) => ({
        ...q,
        answer: clarificationResult.answers[idx]
      })),
      clarifications: clarificationResult.additionalExamples
    };
  }

  // ============================================================================
  // PHASE 2: GHERKIN FORMULATION
  // ============================================================================

  const gherkinResult = await ctx.task(gherkinFormulationTask, {
    projectName,
    feature,
    discovery: clarifiedDiscovery,
    testFramework,
    existingScenarios: inputs.existingScenarios || []
  });

  // Analyze scenarios for quality
  const scenarioAnalysisResult = await ctx.task(analyzeScenarioQualityTask, {
    projectName,
    feature,
    gherkin: gherkinResult,
    discovery: clarifiedDiscovery
  });

  // Breakpoint: Review Gherkin scenarios
  await ctx.breakpoint({
    question: `Gherkin formulation complete. Created ${gherkinResult.scenarios.length} scenarios with ${gherkinResult.totalSteps} steps. Quality score: ${scenarioAnalysisResult.qualityScore}/100. Approve scenarios?`,
    title: 'Gherkin Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bdd/features/feature.feature', format: 'code', language: 'gherkin', label: 'Feature File' },
        { path: 'artifacts/bdd/analysis/scenario-quality.md', format: 'markdown', label: 'Quality Analysis' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: STEP DEFINITION GENERATION
  // ============================================================================

  const stepDefinitionResult = await ctx.task(stepDefinitionTask, {
    projectName,
    feature,
    gherkin: gherkinResult,
    testFramework,
    developmentPhase,
    existingSteps: inputs.existingSteps || []
  });

  // Identify reusable steps
  const reuseAnalysisResult = await ctx.task(analyzeStepReuseTask, {
    projectName,
    stepDefinitions: stepDefinitionResult,
    existingSteps: inputs.existingSteps || []
  });

  // Breakpoint: Review step definitions
  await ctx.breakpoint({
    question: `Step definitions generated. ${stepDefinitionResult.newSteps} new steps, ${reuseAnalysisResult.reusableSteps} reusable from existing. ${reuseAnalysisResult.duplicates} potential duplicates found. Approve?`,
    title: 'Step Definitions Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/bdd/step-definitions/steps.${getStepFileExtension(testFramework)}`, format: 'code', language: getLanguage(testFramework), label: 'Step Definitions' },
        { path: 'artifacts/bdd/analysis/step-reuse.md', format: 'markdown', label: 'Reusability Analysis' }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: TEST AUTOMATION (if enabled)
  // ============================================================================

  let automationResult = null;
  if (generateTests) {
    // Implement step definitions in parallel waves
    const stepGroups = groupStepsByComplexity(stepDefinitionResult.steps);
    const implementedSteps = [];

    for (let groupIdx = 0; groupIdx < stepGroups.length; groupIdx++) {
      const group = stepGroups[groupIdx];

      // Implement group in parallel
      const groupResults = await ctx.parallel.all(
        group.map(step => async () => {
          return await ctx.task(implementStepTask, {
            projectName,
            feature,
            step,
            testFramework,
            gherkin: gherkinResult,
            discovery: clarifiedDiscovery,
            previousImplementations: implementedSteps
          });
        })
      );

      implementedSteps.push(...groupResults);
    }

    // Generate test data and fixtures
    const testDataResult = await ctx.task(generateTestDataTask, {
      projectName,
      feature,
      scenarios: gherkinResult.scenarios,
      stepImplementations: implementedSteps
    });

    // Run automated tests
    const testExecutionResult = await ctx.task(executeTestsTask, {
      projectName,
      feature,
      testFramework,
      scenarios: gherkinResult.scenarios,
      stepImplementations: implementedSteps,
      testData: testDataResult
    });

    automationResult = {
      stepImplementations: implementedSteps,
      testData: testDataResult,
      execution: testExecutionResult
    };

    // Breakpoint: Review test automation results
    await ctx.breakpoint({
      question: `Test automation complete. ${testExecutionResult.passed}/${testExecutionResult.total} scenarios passing. ${testExecutionResult.failed} failures, ${testExecutionResult.pending} pending. Investigate failures?`,
      title: 'Test Automation Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/bdd/automation/test-report.html', format: 'markdown', label: 'Test Report' },
          { path: 'artifacts/bdd/automation/implementation-summary.md', format: 'markdown', label: 'Implementation Summary' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 5: LIVING DOCUMENTATION (if enabled)
  // ============================================================================

  let documentationResult = null;
  if (createDocumentation) {
    documentationResult = await ctx.task(generateLivingDocumentationTask, {
      projectName,
      feature,
      discovery: clarifiedDiscovery,
      gherkin: gherkinResult,
      stepDefinitions: stepDefinitionResult,
      automation: automationResult,
      scenarioAnalysis: scenarioAnalysisResult
    });

    // Generate traceability matrix
    const traceabilityResult = await ctx.task(generateTraceabilityTask, {
      projectName,
      feature,
      discovery: clarifiedDiscovery,
      gherkin: gherkinResult,
      automation: automationResult
    });

    documentationResult.traceability = traceabilityResult;

    // Breakpoint: Review living documentation
    await ctx.breakpoint({
      question: `Living documentation generated. Feature overview, ${gherkinResult.scenarios.length} scenarios documented, traceability matrix complete. Review documentation?`,
      title: 'Documentation Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/bdd/docs/feature-documentation.md', format: 'markdown', label: 'Feature Documentation' },
          { path: 'artifacts/bdd/docs/traceability-matrix.md', format: 'markdown', label: 'Traceability Matrix' },
          { path: 'artifacts/bdd/docs/coverage-report.md', format: 'markdown', label: 'Coverage Report' }
        ]
      }
    });
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const allScenariosPassing = automationResult
    ? automationResult.execution.failed === 0 && automationResult.execution.pending === 0
    : true;

  // Final breakpoint
  await ctx.breakpoint({
    question: `BDD process complete for "${feature}". ${gherkinResult.scenarios.length} scenarios created. Tests ${allScenariosPassing ? 'passing' : 'need attention'}. Documentation ${createDocumentation ? 'generated' : 'skipped'}. Approve final deliverables?`,
    title: 'BDD Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bdd/discovery/example-map.md', format: 'markdown', label: 'Discovery' },
        { path: 'artifacts/bdd/features/feature.feature', format: 'code', language: 'gherkin', label: 'Feature File' },
        { path: `artifacts/bdd/step-definitions/steps.${getStepFileExtension(testFramework)}`, format: 'code', language: getLanguage(testFramework), label: 'Step Definitions' },
        ...(createDocumentation ? [{ path: 'artifacts/bdd/docs/feature-documentation.md', format: 'markdown', label: 'Documentation' }] : [])
      ]
    }
  });

  return {
    success: allScenariosPassing,
    projectName,
    feature: feature,
    developmentPhase,
    discovery: clarifiedDiscovery,
    gherkin: gherkinResult,
    scenarioAnalysis: scenarioAnalysisResult,
    stepDefinitions: stepDefinitionResult,
    stepReuse: reuseAnalysisResult,
    automation: automationResult,
    documentation: documentationResult,
    summary: {
      totalExamples: clarifiedDiscovery.examples.length,
      totalRules: clarifiedDiscovery.rules.length,
      totalScenarios: gherkinResult.scenarios.length,
      totalSteps: gherkinResult.totalSteps,
      newStepDefinitions: stepDefinitionResult.newSteps,
      reusableSteps: reuseAnalysisResult.reusableSteps,
      testsGenerated: generateTests,
      testsPassing: automationResult ? automationResult.execution.passed : null,
      documentationCreated: createDocumentation,
      qualityScore: scenarioAnalysisResult.qualityScore
    },
    artifacts: {
      discovery: 'artifacts/bdd/discovery/',
      features: 'artifacts/bdd/features/',
      stepDefinitions: 'artifacts/bdd/step-definitions/',
      automation: 'artifacts/bdd/automation/',
      documentation: 'artifacts/bdd/docs/'
    },
    metadata: {
      processId: 'methodologies/bdd-specification-by-example',
      testFramework,
      timestamp: ctx.now()
    }
  };
}

/**
 * Helper: Get file extension for step definitions based on framework
 */
function getStepFileExtension(framework) {
  const extensions = {
    'cucumber': 'js',
    'specflow': 'cs',
    'behave': 'py',
    'cypress': 'js'
  };
  return extensions[framework] || 'js';
}

/**
 * Helper: Get language for step definitions
 */
function getLanguage(framework) {
  const languages = {
    'cucumber': 'javascript',
    'specflow': 'csharp',
    'behave': 'python',
    'cypress': 'javascript'
  };
  return languages[framework] || 'javascript';
}

/**
 * Helper: Group steps by complexity for parallel implementation
 */
function groupStepsByComplexity(steps) {
  const groups = {
    simple: [],
    medium: [],
    complex: []
  };

  steps.forEach(step => {
    const complexity = estimateStepComplexity(step);
    groups[complexity].push(step);
  });

  // Return as array of groups (simple first, then medium, then complex)
  return [groups.simple, groups.medium, groups.complex].filter(g => g.length > 0);
}

/**
 * Helper: Estimate step complexity
 */
function estimateStepComplexity(step) {
  const text = step.text.toLowerCase();

  // Simple steps: navigation, assertions on simple values
  if (text.includes('navigate') || text.includes('click') || text.includes('see')) {
    return 'simple';
  }

  // Complex steps: API calls, database operations, complex calculations
  if (text.includes('calculate') || text.includes('database') || text.includes('api') || text.includes('integrate')) {
    return 'complex';
  }

  // Default to medium
  return 'medium';
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const discoveryWorkshopTask = defineTask('discovery-workshop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discovery Workshop: ${args.feature}`,
  description: 'Collaborative exploration using Example Mapping',

  agent: {
    name: 'bdd-facilitator',
    prompt: {
      role: 'BDD facilitator conducting discovery workshop',
      task: 'Facilitate Example Mapping workshop to discover concrete examples, rules, and questions',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        stakeholders: args.stakeholders,
        developmentPhase: args.developmentPhase,
        existingFeatures: args.existingFeatures
      },
      instructions: [
        'Analyze the feature from multiple stakeholder perspectives',
        'Generate concrete examples that illustrate feature behavior',
        'Identify business rules that govern the feature',
        'Capture questions and edge cases that need clarification',
        'Validate scope - what is in/out of scope',
        'Consider happy paths, edge cases, and error scenarios',
        'Ensure examples are specific and testable',
        'Use Example Mapping format: Story → Rules → Examples → Questions'
      ],
      outputFormat: 'JSON with story, rules, examples (with context, action, outcome), questions, and scope'
    },
    outputSchema: {
      type: 'object',
      required: ['story', 'rules', 'examples', 'questions', 'scope'],
      properties: {
        story: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            businessValue: { type: 'string' },
            acceptanceCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              ruleId: { type: 'string' },
              title: { type: 'string' },
              context: { type: 'string' },
              action: { type: 'string' },
              outcome: { type: 'string' },
              type: { type: 'string', enum: ['happy-path', 'edge-case', 'error', 'boundary'] }
            }
          }
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              stakeholder: { type: 'string' }
            }
          }
        },
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'discovery', 'example-mapping']
}));

export const clarifyQuestionsTask = defineTask('clarify-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Clarify Open Questions',
  description: 'Address discovery questions and generate additional examples',

  agent: {
    name: 'requirements-clarifier',
    prompt: {
      role: 'business analyst and domain expert',
      task: 'Answer open questions from discovery workshop and provide additional examples',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        questions: args.questions,
        discovery: args.discovery
      },
      instructions: [
        'Review each open question',
        'Provide clear, specific answers based on domain knowledge',
        'Generate additional examples if needed to illustrate answers',
        'Identify any assumptions made',
        'Flag questions that require actual stakeholder input',
        'Ensure answers are consistent with existing rules and examples'
      ],
      outputFormat: 'JSON with answers, additional examples, assumptions, and questions needing stakeholder input'
    },
    outputSchema: {
      type: 'object',
      required: ['answers', 'additionalExamples', 'assumptions'],
      properties: {
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'string' },
              answer: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        additionalExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              context: { type: 'string' },
              action: { type: 'string' },
              outcome: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        needsStakeholderInput: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'clarification']
}));

export const gherkinFormulationTask = defineTask('gherkin-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Formulate Gherkin: ${args.feature}`,
  description: 'Convert examples to Given-When-Then scenarios',

  agent: {
    name: 'gherkin-writer',
    prompt: {
      role: 'BDD specification writer',
      task: 'Convert discovery examples into well-formed Gherkin scenarios',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        discovery: args.discovery,
        testFramework: args.testFramework,
        existingScenarios: args.existingScenarios
      },
      instructions: [
        'Write feature file with clear description and business value',
        'Convert each example to Given-When-Then scenario',
        'Use declarative language (what, not how)',
        'Keep scenarios focused and independent',
        'Use scenario outlines for data-driven examples',
        'Add background for common preconditions',
        'Tag scenarios appropriately (@smoke, @regression, @slow, etc.)',
        'Ensure steps are reusable across scenarios',
        'Follow Gherkin best practices',
        'Make scenarios readable by non-technical stakeholders'
      ],
      outputFormat: 'JSON with feature file content, scenarios array, background, tags, and step inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['featureFile', 'scenarios', 'totalSteps', 'uniqueSteps'],
      properties: {
        featureFile: { type: 'string' },
        feature: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            background: { type: 'string' }
          }
        },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              exampleId: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string', enum: ['scenario', 'scenario-outline'] },
              tags: { type: 'array', items: { type: 'string' } },
              given: { type: 'array', items: { type: 'string' } },
              when: { type: 'array', items: { type: 'string' } },
              then: { type: 'array', items: { type: 'string' } },
              examples: { type: 'array' }
            }
          }
        },
        totalSteps: { type: 'number' },
        uniqueSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string', enum: ['given', 'when', 'then'] },
              usageCount: { type: 'number' }
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

  labels: ['agent', 'bdd', 'gherkin', 'formulation']
}));

export const analyzeScenarioQualityTask = defineTask('analyze-scenario-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Scenario Quality',
  description: 'Assess Gherkin scenarios against best practices',

  agent: {
    name: 'bdd-quality-analyst',
    prompt: {
      role: 'BDD quality analyst',
      task: 'Analyze Gherkin scenarios for quality, maintainability, and best practices',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        gherkin: args.gherkin,
        discovery: args.discovery
      },
      instructions: [
        'Check scenarios are independent and can run in any order',
        'Verify scenarios use declarative language (not imperative)',
        'Assess if scenarios are readable by non-technical stakeholders',
        'Check for proper Given-When-Then structure',
        'Identify overly complex scenarios that should be split',
        'Find duplicate or redundant scenarios',
        'Verify all discovery examples are covered',
        'Check tag usage and organization',
        'Assess step reusability',
        'Calculate overall quality score (0-100)'
      ],
      outputFormat: 'JSON with quality score, issues, recommendations, and coverage metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'issues', 'recommendations', 'coverage'],
      properties: {
        qualityScore: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning', 'info'] },
              category: { type: 'string' },
              description: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        coverage: {
          type: 'object',
          properties: {
            examplesCovered: { type: 'number' },
            examplesTotal: { type: 'number' },
            coveragePercentage: { type: 'number' },
            missingExamples: { type: 'array', items: { type: 'string' } }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            avgStepsPerScenario: { type: 'number' },
            maxStepsPerScenario: { type: 'number' },
            stepReusePercentage: { type: 'number' },
            scenarioIndependence: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'quality', 'analysis']
}));

export const stepDefinitionTask = defineTask('step-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Step Definitions: ${args.testFramework}`,
  description: 'Create step definition stubs',

  agent: {
    name: 'step-definition-generator',
    prompt: {
      role: 'test automation engineer',
      task: 'Generate step definition stubs for Gherkin scenarios',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        gherkin: args.gherkin,
        testFramework: args.testFramework,
        developmentPhase: args.developmentPhase,
        existingSteps: args.existingSteps
      },
      instructions: [
        'Parse all unique steps from Gherkin scenarios',
        'Generate step definition stubs in framework syntax',
        'Use regular expressions to capture parameters',
        'Group related steps together',
        'Identify steps that can reuse existing definitions',
        'Create clear function names and structure',
        'Add comments explaining step purpose',
        'Include placeholder implementation hints',
        'Follow framework conventions and best practices',
        'Consider Page Object Model patterns'
      ],
      outputFormat: 'JSON with step definitions code, new steps count, reused steps, and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['stepDefinitionsCode', 'steps', 'newSteps', 'reusedSteps'],
      properties: {
        stepDefinitionsCode: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              type: { type: 'string' },
              regex: { type: 'string' },
              functionName: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } },
              isNew: { type: 'boolean' },
              complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] }
            }
          }
        },
        newSteps: { type: 'number' },
        reusedSteps: { type: 'number' },
        pageObjects: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'step-definitions', args.testFramework]
}));

export const analyzeStepReuseTask = defineTask('analyze-step-reuse', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Step Reusability',
  description: 'Identify reusable steps and potential duplicates',

  agent: {
    name: 'step-reuse-analyzer',
    prompt: {
      role: 'test automation architect',
      task: 'Analyze step definitions for reusability and identify duplicates',
      context: {
        projectName: args.projectName,
        stepDefinitions: args.stepDefinitions,
        existingSteps: args.existingSteps
      },
      instructions: [
        'Identify steps that can be reused from existing step library',
        'Find potential duplicate or very similar steps',
        'Suggest step consolidation opportunities',
        'Identify steps that should be extracted to shared library',
        'Analyze step parameter patterns for consistency',
        'Recommend naming conventions improvements',
        'Calculate reusability metrics'
      ],
      outputFormat: 'JSON with reusable steps, duplicates, recommendations, and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['reusableSteps', 'duplicates', 'recommendations'],
      properties: {
        reusableSteps: { type: 'number' },
        duplicates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step1: { type: 'string' },
              step2: { type: 'string' },
              similarity: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        sharedLibraryCandidates: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'analysis', 'reusability']
}));

export const implementStepTask = defineTask('implement-step', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Step: ${args.step.text}`,
  description: 'Implement step definition with actual code',

  agent: {
    name: 'test-automation-developer',
    prompt: {
      role: 'test automation developer',
      task: 'Implement step definition with working code',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        step: args.step,
        testFramework: args.testFramework,
        gherkin: args.gherkin,
        discovery: args.discovery,
        previousImplementations: args.previousImplementations
      },
      instructions: [
        'Implement the step definition with actual working code',
        'Use appropriate testing libraries and patterns',
        'Implement page object methods if needed',
        'Add proper error handling and assertions',
        'Include meaningful assertion messages',
        'Handle async operations correctly',
        'Add logging for debugging',
        'Follow framework-specific best practices',
        'Ensure step is idempotent and independent',
        'Consider reusing helper functions from previous implementations'
      ],
      outputFormat: 'JSON with implementation code, dependencies, page objects, and test data needs'
    },
    outputSchema: {
      type: 'object',
      required: ['stepId', 'implementationCode', 'dependencies'],
      properties: {
        stepId: { type: 'string' },
        implementationCode: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        pageObjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              code: { type: 'string' }
            }
          }
        },
        helperFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              code: { type: 'string' }
            }
          }
        },
        testDataNeeds: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'implementation', `step-${args.step.id}`]
}));

export const generateTestDataTask = defineTask('generate-test-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Test Data',
  description: 'Create test data and fixtures',

  agent: {
    name: 'test-data-generator',
    prompt: {
      role: 'test data specialist',
      task: 'Generate test data and fixtures for scenarios',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        scenarios: args.scenarios,
        stepImplementations: args.stepImplementations
      },
      instructions: [
        'Analyze test data needs from scenarios and step implementations',
        'Generate realistic test data',
        'Create fixtures for different scenario types',
        'Include boundary values and edge cases',
        'Ensure data privacy and security',
        'Create data factories or builders',
        'Document test data structure',
        'Consider data cleanup strategies'
      ],
      outputFormat: 'JSON with test data sets, fixtures, factories, and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['testData', 'fixtures'],
      properties: {
        testData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        fixtures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        factories: { type: 'array', items: { type: 'string' } },
        cleanupStrategy: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'test-data']
}));

export const executeTestsTask = defineTask('execute-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Automated Tests',
  description: 'Run BDD tests and generate report',

  agent: {
    name: 'test-executor',
    prompt: {
      role: 'test execution engineer',
      task: 'Execute BDD tests and analyze results',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        testFramework: args.testFramework,
        scenarios: args.scenarios,
        stepImplementations: args.stepImplementations,
        testData: args.testData
      },
      instructions: [
        'Simulate test execution for all scenarios',
        'Analyze implementation completeness',
        'Identify passing, failing, and pending scenarios',
        'Generate detailed test report',
        'Capture failure reasons and stack traces',
        'Calculate execution metrics',
        'Identify flaky tests',
        'Provide remediation recommendations'
      ],
      outputFormat: 'JSON with execution results, passed/failed/pending counts, and detailed report'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'passed', 'failed', 'pending', 'results'],
      properties: {
        total: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        pending: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              scenarioTitle: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'pending'] },
              duration: { type: 'number' },
              failureReason: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    status: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        executionTime: { type: 'number' },
        coverage: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'test-execution']
}));

export const generateLivingDocumentationTask = defineTask('generate-living-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Living Documentation',
  description: 'Create feature documentation from scenarios and test results',

  agent: {
    name: 'documentation-generator',
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive living documentation from BDD artifacts',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        discovery: args.discovery,
        gherkin: args.gherkin,
        stepDefinitions: args.stepDefinitions,
        automation: args.automation,
        scenarioAnalysis: args.scenarioAnalysis
      },
      instructions: [
        'Create feature overview documentation',
        'Document business rules with examples',
        'Generate scenario documentation with test results',
        'Create behavior catalog',
        'Document test coverage',
        'Include quality metrics',
        'Make documentation readable by non-technical stakeholders',
        'Link to actual test implementations',
        'Highlight test status (passing/failing)',
        'Include visual diagrams where helpful'
      ],
      outputFormat: 'JSON with documentation markdown, coverage report, and behavior catalog'
    },
    outputSchema: {
      type: 'object',
      required: ['featureDocumentation', 'coverageReport', 'behaviorCatalog'],
      properties: {
        featureDocumentation: { type: 'string' },
        coverageReport: {
          type: 'object',
          properties: {
            totalScenarios: { type: 'number' },
            passingScenarios: { type: 'number' },
            failingScenarios: { type: 'number' },
            coveragePercentage: { type: 'number' },
            lastUpdated: { type: 'string' }
          }
        },
        behaviorCatalog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              rule: { type: 'string' },
              scenarios: { type: 'array', items: { type: 'string' } },
              testStatus: { type: 'string' }
            }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            overallQuality: { type: 'number' },
            maintainability: { type: 'number' },
            readability: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'documentation']
}));

export const generateTraceabilityTask = defineTask('generate-traceability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Traceability Matrix',
  description: 'Link requirements to scenarios to tests',

  agent: {
    name: 'traceability-analyst',
    prompt: {
      role: 'requirements traceability analyst',
      task: 'Create traceability matrix linking requirements, scenarios, and tests',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        discovery: args.discovery,
        gherkin: args.gherkin,
        automation: args.automation
      },
      instructions: [
        'Map business rules to scenarios',
        'Map scenarios to test implementations',
        'Map examples from discovery to Gherkin scenarios',
        'Identify coverage gaps',
        'Create bidirectional traceability',
        'Generate traceability matrix document',
        'Highlight untested requirements',
        'Calculate traceability completeness'
      ],
      outputFormat: 'JSON with traceability matrix, coverage gaps, and completeness metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'coverageGaps', 'completeness'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleId: { type: 'string' },
              rule: { type: 'string' },
              exampleIds: { type: 'array', items: { type: 'string' } },
              scenarioIds: { type: 'array', items: { type: 'string' } },
              testStatus: { type: 'string' }
            }
          }
        },
        coverageGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            rulesCovered: { type: 'number' },
            rulesTotal: { type: 'number' },
            examplesCovered: { type: 'number' },
            examplesTotal: { type: 'number' },
            overallCompleteness: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bdd', 'traceability']
}));
