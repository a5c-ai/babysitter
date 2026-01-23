/**
 * @process qa-testing-automation/test-strategy
 * @description Comprehensive test strategy development process with requirements analysis, risk assessment, test pyramid definition, automation strategy, and quality metrics
 * @inputs { projectName: string, requirements: array, architecture: object, team: object, constraints: object }
 * @outputs { success: boolean, strategyDocument: string, automationRoadmap: object, qualityMetrics: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    requirements = [],
    architecture = {},
    team = {},
    constraints = {},
    outputDir = 'test-strategy-output',
    targetTestCoverage = 80,
    targetAutomationRatio = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Test Strategy Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements for testability');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    requirements,
    architecture,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting quality risk assessment');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    requirements,
    architecture,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 3: TEST LEVEL DEFINITION (TEST PYRAMID)
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining test pyramid and test levels');
  const testLevelDefinition = await ctx.task(testLevelDefinitionTask, {
    projectName,
    architecture,
    requirementsAnalysis,
    riskAssessment,
    targetTestCoverage,
    outputDir
  });

  artifacts.push(...testLevelDefinition.artifacts);

  // ============================================================================
  // PHASE 4: AUTOMATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing test automation strategy');
  const automationStrategy = await ctx.task(automationStrategyTask, {
    projectName,
    architecture,
    team,
    constraints,
    testLevelDefinition,
    riskAssessment,
    targetAutomationRatio,
    outputDir
  });

  artifacts.push(...automationStrategy.artifacts);

  // ============================================================================
  // PHASE 5: RESOURCE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning QA resources and allocations');
  const resourcePlanning = await ctx.task(resourcePlanningTask, {
    projectName,
    team,
    constraints,
    testLevelDefinition,
    automationStrategy,
    riskAssessment,
    outputDir
  });

  artifacts.push(...resourcePlanning.artifacts);

  // ============================================================================
  // PHASE 6: QUALITY METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining quality KPIs and success metrics');
  const qualityMetricsDefinition = await ctx.task(qualityMetricsDefinitionTask, {
    projectName,
    requirements,
    testLevelDefinition,
    automationStrategy,
    targetTestCoverage,
    targetAutomationRatio,
    outputDir
  });

  artifacts.push(...qualityMetricsDefinition.artifacts);

  // ============================================================================
  // PHASE 7: COMPREHENSIVE STRATEGY DOCUMENT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating comprehensive test strategy document');
  const strategyDocument = await ctx.task(strategyDocumentGenerationTask, {
    projectName,
    requirements,
    architecture,
    team,
    constraints,
    requirementsAnalysis,
    riskAssessment,
    testLevelDefinition,
    automationStrategy,
    resourcePlanning,
    qualityMetricsDefinition,
    outputDir
  });

  artifacts.push(...strategyDocument.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating test strategy quality and completeness');
  const strategyQualityScore = await ctx.task(strategyQualityScoringTask, {
    projectName,
    requirementsAnalysis,
    riskAssessment,
    testLevelDefinition,
    automationStrategy,
    resourcePlanning,
    qualityMetricsDefinition,
    strategyDocument,
    outputDir
  });

  artifacts.push(...strategyQualityScore.artifacts);

  const strategyScore = strategyQualityScore.overallScore;
  const qualityMet = strategyScore >= 85;

  // Breakpoint: Review test strategy
  await ctx.breakpoint({
    question: `Test strategy complete. Quality score: ${strategyScore}/100. ${qualityMet ? 'Strategy meets quality standards!' : 'Strategy may need refinement.'} Review and approve?`,
    title: 'Test Strategy Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        strategyScore,
        qualityMet,
        projectName,
        totalArtifacts: artifacts.length,
        criticalRisks: riskAssessment.criticalRisks?.length || 0,
        testLevels: Object.keys(testLevelDefinition.testPyramid || {}).length,
        automationTools: automationStrategy.selectedTools?.length || 0,
        estimatedDuration: resourcePlanning.estimatedDuration || 'N/A'
      }
    }
  });

  // ============================================================================
  // PHASE 9: GENERATE AUTOMATION ROADMAP (if needed)
  // ============================================================================

  let automationRoadmap = null;
  if (qualityMet && automationStrategy.roadmapRequired) {
    ctx.log('info', 'Phase 9: Generating detailed automation roadmap');
    automationRoadmap = await ctx.task(automationRoadmapGenerationTask, {
      projectName,
      automationStrategy,
      testLevelDefinition,
      resourcePlanning,
      constraints,
      outputDir
    });
    artifacts.push(...automationRoadmap.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    strategyScore,
    qualityMet,
    strategyDocument: strategyDocument.documentPath,
    requirementsAnalysis: {
      totalRequirements: requirementsAnalysis.totalRequirements,
      testableRequirements: requirementsAnalysis.testableRequirements,
      testabilityScore: requirementsAnalysis.testabilityScore
    },
    riskAssessment: {
      totalRisks: riskAssessment.totalRisks,
      criticalRisks: riskAssessment.criticalRisks,
      mitigationPlan: riskAssessment.mitigationPlan
    },
    testLevelDefinition: {
      testPyramid: testLevelDefinition.testPyramid,
      estimatedTestCount: testLevelDefinition.estimatedTestCount,
      coverageTargets: testLevelDefinition.coverageTargets
    },
    automationStrategy: {
      automationRatio: automationStrategy.automationRatio,
      selectedTools: automationStrategy.selectedTools,
      frameworks: automationStrategy.frameworks,
      estimatedROI: automationStrategy.estimatedROI
    },
    resourcePlanning: {
      teamSize: resourcePlanning.teamSize,
      roles: resourcePlanning.roles,
      estimatedDuration: resourcePlanning.estimatedDuration,
      allocationMatrix: resourcePlanning.allocationMatrix
    },
    qualityMetrics: {
      kpis: qualityMetricsDefinition.kpis,
      successCriteria: qualityMetricsDefinition.successCriteria,
      dashboardDefinition: qualityMetricsDefinition.dashboardDefinition
    },
    automationRoadmap: automationRoadmap ? automationRoadmap.roadmap : null,
    artifacts,
    duration,
    metadata: {
      processId: 'qa-testing-automation/test-strategy',
      timestamp: startTime,
      projectName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze requirements for testability',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'senior QA architect and requirements engineer',
      task: 'Analyze functional and non-functional requirements to assess testability and identify testing scope',
      context: args,
      instructions: [
        'Review all functional requirements and identify testable behaviors',
        'Analyze non-functional requirements (performance, security, usability, accessibility)',
        'Identify requirements with ambiguity or insufficient acceptance criteria',
        'Categorize requirements by test level (unit, integration, E2E, performance)',
        'Assess testability score for each requirement (clear acceptance criteria, measurable outcomes)',
        'Identify critical user journeys requiring E2E testing',
        'Flag requirements needing clarification or refinement',
        'Generate testability assessment report'
      ],
      outputFormat: 'JSON with totalRequirements, testableRequirements, requirementsByCategory, criticalUserJourneys, testabilityScore, requirementsNeedingClarification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRequirements', 'testableRequirements', 'testabilityScore', 'artifacts'],
      properties: {
        totalRequirements: { type: 'number' },
        testableRequirements: { type: 'number' },
        requirementsByCategory: {
          type: 'object',
          properties: {
            functional: { type: 'number' },
            nonFunctional: { type: 'number' },
            performance: { type: 'number' },
            security: { type: 'number' },
            usability: { type: 'number' }
          }
        },
        criticalUserJourneys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              journey: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              testingApproach: { type: 'string' }
            }
          }
        },
        testabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        requirementsNeedingClarification: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['agent', 'test-strategy', 'requirements-analysis']
}));

// Task 2: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct quality risk assessment',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'senior QA manager and risk management specialist',
      task: 'Identify and prioritize quality risks, assess likelihood and impact, and develop mitigation strategies',
      context: args,
      instructions: [
        'Identify technical risks (complexity, dependencies, legacy code, new technologies)',
        'Identify business risks (critical features, regulatory compliance, brand reputation)',
        'Identify operational risks (tight timelines, resource constraints, skill gaps)',
        'Assess each risk: likelihood (low/medium/high) and impact (low/medium/high/critical)',
        'Prioritize risks using risk matrix (likelihood × impact)',
        'Identify critical risks requiring immediate mitigation',
        'Develop risk mitigation strategies for each high/critical risk',
        'Map risks to test levels and test types',
        'Create risk-based testing priority matrix',
        'Generate comprehensive risk assessment report'
      ],
      outputFormat: 'JSON with totalRisks, criticalRisks, highRisks, risksByCategory, riskMatrix, mitigationPlan, testingPriorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRisks', 'criticalRisks', 'mitigationPlan', 'artifacts'],
      properties: {
        totalRisks: { type: 'number' },
        criticalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        highRisks: { type: 'array' },
        risksByCategory: {
          type: 'object',
          properties: {
            technical: { type: 'number' },
            business: { type: 'number' },
            operational: { type: 'number' }
          }
        },
        riskMatrix: { type: 'object' },
        mitigationPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              strategy: { type: 'string' },
              testingApproach: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        testingPriorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'risk-assessment']
}));

// Task 3: Test Level Definition (Test Pyramid)
export const testLevelDefinitionTask = defineTask('test-level-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define test pyramid and test levels',
  agent: {
    name: 'test-architect',
    prompt: {
      role: 'senior test architect',
      task: 'Define optimal test pyramid distribution, test levels, test types, and coverage targets aligned with project architecture and risk profile',
      context: args,
      instructions: [
        'Design test pyramid: unit (70%), integration (20%), E2E (10%) as baseline, adjust based on architecture',
        'For microservices: increase integration and contract testing',
        'For monoliths: focus on comprehensive E2E coverage',
        'For APIs: emphasize API integration and contract testing',
        'Define unit testing scope: business logic, utilities, pure functions',
        'Define integration testing scope: database, external services, module integration',
        'Define E2E testing scope: critical user journeys, cross-functional workflows',
        'Include specialized test types: performance, security, accessibility, visual regression',
        'Define coverage targets per level aligned with risk assessment',
        'Estimate test count per level based on requirements',
        'Provide test pyramid visualization and rationale',
        'Generate test level definition document'
      ],
      outputFormat: 'JSON with testPyramid (object with percentages), testLevelDetails (array), testTypes (array), coverageTargets (object), estimatedTestCount (object), rationale (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testPyramid', 'testLevelDetails', 'coverageTargets', 'estimatedTestCount', 'artifacts'],
      properties: {
        testPyramid: {
          type: 'object',
          properties: {
            unit: { type: 'number' },
            integration: { type: 'number' },
            e2e: { type: 'number' },
            specialized: { type: 'number' }
          }
        },
        testLevelDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              scope: { type: 'string' },
              tools: { type: 'array', items: { type: 'string' } },
              coverageTarget: { type: 'number' },
              estimatedCount: { type: 'number' }
            }
          }
        },
        testTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string' },
              estimatedCount: { type: 'number' }
            }
          }
        },
        coverageTargets: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            unit: { type: 'number' },
            integration: { type: 'number' },
            e2e: { type: 'number' },
            critical: { type: 'number' }
          }
        },
        estimatedTestCount: {
          type: 'object',
          properties: {
            unit: { type: 'number' },
            integration: { type: 'number' },
            e2e: { type: 'number' },
            total: { type: 'number' }
          }
        },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'test-pyramid']
}));

// Task 4: Automation Strategy
export const automationStrategyTask = defineTask('automation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop test automation strategy',
  agent: {
    name: 'automation-strategist',
    prompt: {
      role: 'test automation architect',
      task: 'Define comprehensive test automation strategy including tool selection, frameworks, patterns, CI/CD integration, and ROI justification',
      context: args,
      instructions: [
        'Determine what to automate based on test pyramid and risk assessment',
        'What NOT to automate: one-time tests, highly volatile UI, exploratory testing',
        'Select test automation tools and frameworks for each test level',
        'Unit: Jest, Mocha, JUnit, pytest based on tech stack',
        'Integration: Supertest, RestAssured, Testcontainers',
        'E2E: Playwright, Cypress, Selenium WebDriver',
        'API: Postman, RestAssured, Supertest',
        'Performance: k6, JMeter, Gatling',
        'Define automation design patterns (Page Object Model, Screenplay, etc.)',
        'Plan CI/CD integration strategy (stages, parallelization, reporting)',
        'Define automation metrics and KPIs',
        'Calculate automation ROI: effort saved vs implementation cost',
        'Provide tool selection justification and comparison matrix',
        'Define automation roadmap phases and milestones',
        'Generate comprehensive automation strategy document'
      ],
      outputFormat: 'JSON with automationRatio, selectedTools (array), frameworks (object), designPatterns (array), cicdIntegration (object), metrics (array), estimatedROI (object), roadmapRequired (boolean), toolComparison (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['automationRatio', 'selectedTools', 'frameworks', 'estimatedROI', 'artifacts'],
      properties: {
        automationRatio: { type: 'number', minimum: 0, maximum: 100 },
        selectedTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              testLevel: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        frameworks: {
          type: 'object',
          properties: {
            unit: { type: 'array', items: { type: 'string' } },
            integration: { type: 'array', items: { type: 'string' } },
            e2e: { type: 'array', items: { type: 'string' } },
            api: { type: 'array', items: { type: 'string' } }
          }
        },
        designPatterns: { type: 'array', items: { type: 'string' } },
        cicdIntegration: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'string' } },
            parallelization: { type: 'boolean' },
            reportingTools: { type: 'array', items: { type: 'string' } }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        estimatedROI: {
          type: 'object',
          properties: {
            implementationCost: { type: 'string' },
            maintenanceCost: { type: 'string' },
            timeSaved: { type: 'string' },
            paybackPeriod: { type: 'string' },
            roiPercentage: { type: 'number' }
          }
        },
        roadmapRequired: { type: 'boolean' },
        toolComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'automation-strategy']
}));

// Task 5: Resource Planning
export const resourcePlanningTask = defineTask('resource-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan QA resources and allocations',
  agent: {
    name: 'resource-planner',
    prompt: {
      role: 'QA manager and resource planning specialist',
      task: 'Allocate QA resources, define roles and responsibilities, estimate effort, and create resource allocation matrix',
      context: args,
      instructions: [
        'Assess current team structure and skill inventory',
        'Identify skill gaps based on automation strategy and test levels',
        'Define required roles: QA lead, automation engineers, manual testers, performance testers',
        'Estimate effort for each testing activity (setup, development, execution, maintenance)',
        'Create resource allocation matrix mapping people to activities',
        'Calculate FTE (Full-Time Equivalent) requirements',
        'Plan training needs for new tools and frameworks',
        'Define responsibilities using RACI matrix',
        'Estimate timeline and milestones',
        'Consider constraints: budget, timeline, availability',
        'Provide hiring recommendations if needed',
        'Generate comprehensive resource plan document'
      ],
      outputFormat: 'JSON with teamSize, roles (array), allocationMatrix (object), skillGaps (array), trainingPlan (object), estimatedDuration (string), timeline (object), hiringRecommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['teamSize', 'roles', 'allocationMatrix', 'estimatedDuration', 'artifacts'],
      properties: {
        teamSize: { type: 'number' },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              count: { type: 'number' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              requiredSkills: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        allocationMatrix: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              allocation: { type: 'number' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        skillGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              currentLevel: { type: 'string' },
              requiredLevel: { type: 'string' },
              gap: { type: 'string' }
            }
          }
        },
        trainingPlan: {
          type: 'object',
          properties: {
            courses: { type: 'array', items: { type: 'string' } },
            estimatedDuration: { type: 'string' },
            cost: { type: 'string' }
          }
        },
        estimatedDuration: { type: 'string' },
        timeline: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  milestones: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        hiringRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'resource-planning']
}));

// Task 6: Quality Metrics Definition
export const qualityMetricsDefinitionTask = defineTask('quality-metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quality KPIs and success metrics',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'QA metrics specialist and data analyst',
      task: 'Define comprehensive quality KPIs, success criteria, and quality dashboard specifications',
      context: args,
      instructions: [
        'Define test execution metrics: pass rate, flakiness rate, execution time',
        'Define test coverage metrics: code coverage, branch coverage, critical path coverage',
        'Define defect metrics: defect density, defect leakage, mean time to detect',
        'Define automation metrics: automation ratio, automation ROI, maintenance effort',
        'Define velocity metrics: build frequency, deployment frequency, lead time',
        'Define quality gate metrics: gate pass rate, gate violations, time in gate',
        'Set target thresholds for each metric aligned with industry benchmarks',
        'Define success criteria for test strategy implementation',
        'Design quality dashboard layout with key metrics and visualizations',
        'Specify data collection methods and frequency',
        'Define alerting thresholds for critical metrics',
        'Provide metric definitions and calculation formulas',
        'Generate quality metrics definition document'
      ],
      outputFormat: 'JSON with kpis (array), successCriteria (array), dashboardDefinition (object), thresholds (object), dataCollection (object), alerts (array), metricDefinitions (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'successCriteria', 'dashboardDefinition', 'artifacts'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              category: { type: 'string' },
              target: { type: 'string' },
              formula: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        dashboardDefinition: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  metrics: { type: 'array', items: { type: 'string' } },
                  visualizationType: { type: 'string' }
                }
              }
            },
            refreshFrequency: { type: 'string' }
          }
        },
        thresholds: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              green: { type: 'string' },
              yellow: { type: 'string' },
              red: { type: 'string' }
            }
          }
        },
        dataCollection: {
          type: 'object',
          properties: {
            sources: { type: 'array', items: { type: 'string' } },
            methods: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'string' }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              condition: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metricDefinitions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'quality-metrics']
}));

// Task 7: Strategy Document Generation
export const strategyDocumentGenerationTask = defineTask('strategy-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive test strategy document',
  agent: {
    name: 'strategy-writer',
    prompt: {
      role: 'senior technical writer and QA architect',
      task: 'Generate comprehensive, executive-ready test strategy document consolidating all planning artifacts',
      context: args,
      instructions: [
        'Create executive summary with key points and recommendations',
        'Include project overview and testing objectives',
        'Document requirements analysis findings and testability assessment',
        'Present risk assessment with mitigation strategies',
        'Detail test pyramid and test level definitions',
        'Explain automation strategy with tool justifications',
        'Present resource plan and allocation matrix',
        'Define quality metrics and success criteria',
        'Include test environment strategy',
        'Document test data management approach',
        'Provide implementation roadmap with phases and milestones',
        'Include appendices: tool comparison, risk matrix, RACI',
        'Format as professional Markdown document with diagrams',
        'Ensure document is actionable and ready for stakeholder approval',
        'Save strategy document to output directory'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyRecommendations (array), readinessScore (number 0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'keyRecommendations', 'readinessScore', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyRecommendations: { type: 'array', items: { type: 'string' } },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        criticalDecisions: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'documentation']
}));

// Task 8: Strategy Quality Scoring
export const strategyQualityScoringTask = defineTask('strategy-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score test strategy quality and completeness',
  agent: {
    name: 'strategy-validator',
    prompt: {
      role: 'principal QA architect and quality auditor',
      task: 'Assess overall test strategy quality, completeness, and readiness for implementation',
      context: args,
      instructions: [
        'Evaluate requirements coverage and testability (weight: 15%)',
        'Assess risk assessment completeness and mitigation strategies (weight: 20%)',
        'Review test pyramid appropriateness for architecture (weight: 15%)',
        'Evaluate automation strategy feasibility and ROI (weight: 20%)',
        'Assess resource plan realism and adequacy (weight: 15%)',
        'Review quality metrics relevance and measurability (weight: 10%)',
        'Evaluate strategy document clarity and actionability (weight: 5%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific recommendations for improvement',
        'Assess stakeholder approval readiness',
        'Validate alignment with industry best practices'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), approvalReadiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            requirementsCoverage: { type: 'number' },
            riskAssessment: { type: 'number' },
            testPyramid: { type: 'number' },
            automationStrategy: { type: 'number' },
            resourcePlan: { type: 'number' },
            qualityMetrics: { type: 'number' },
            documentation: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allCriticalJourneysCovered: { type: 'boolean' },
            automationROIJustified: { type: 'boolean' },
            metricsAreMeasurable: { type: 'boolean' },
            resourcesAdequate: { type: 'boolean' },
            risksAddressed: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        approvalReadiness: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'validation', 'quality-scoring']
}));

// Task 9: Automation Roadmap Generation (optional)
export const automationRoadmapGenerationTask = defineTask('automation-roadmap-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate detailed automation roadmap',
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'test automation program manager',
      task: 'Create detailed phased automation roadmap with milestones, dependencies, and success criteria',
      context: args,
      instructions: [
        'Define automation implementation phases (foundation, core, advanced, optimization)',
        'Phase 1: Framework setup, tool installation, sample tests',
        'Phase 2: Unit test automation, API test automation',
        'Phase 3: E2E test automation for critical journeys',
        'Phase 4: Performance testing, visual regression, advanced topics',
        'Define milestones and deliverables for each phase',
        'Identify dependencies between phases and tasks',
        'Estimate effort and duration for each phase',
        'Define success criteria and exit gates for each phase',
        'Include quick wins for early ROI demonstration',
        'Map resource allocation across phases',
        'Provide Gantt chart or timeline visualization',
        'Generate comprehensive automation roadmap document'
      ],
      outputFormat: 'JSON with roadmap (object with phases), milestones (array), dependencies (array), timeline (object), quickWins (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'milestones', 'timeline', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  successCriteria: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              phase: { type: 'string' },
              targetDate: { type: 'string' },
              criteria: { type: 'string' }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-strategy', 'automation-roadmap']
}));
