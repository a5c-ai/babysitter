/**
 * @process marketing/ab-testing-program
 * @description Design and execute marketing experiments for ads, landing pages, emails, and CTAs using statistical significance to optimize conversion rates.
 * @inputs { testName: string, hypothesis: string, testType: string, variants: array, targetMetric: string, trafficAllocation: object, duration: string }
 * @outputs { success: boolean, testDesign: object, results: object, statisticalAnalysis: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    testName = 'A/B Test',
    hypothesis = '',
    testType = 'landing-page',
    variants = [],
    targetMetric = 'conversion-rate',
    trafficAllocation = {},
    duration = '2 weeks',
    confidenceLevel = 95,
    outputDir = 'ab-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting A/B Testing Program for ${testName}`);

  // ============================================================================
  // PHASE 1: HYPOTHESIS FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formulating and validating test hypothesis');
  const hypothesisFormulation = await ctx.task(hypothesisFormulationTask, {
    testName,
    hypothesis,
    testType,
    targetMetric,
    outputDir
  });

  artifacts.push(...hypothesisFormulation.artifacts);

  // ============================================================================
  // PHASE 2: TEST DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing A/B test structure');
  const testDesign = await ctx.task(testDesignTask, {
    testName,
    hypothesisFormulation,
    testType,
    variants,
    targetMetric,
    trafficAllocation,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...testDesign.artifacts);

  // ============================================================================
  // PHASE 3: SAMPLE SIZE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating required sample size');
  const sampleSizeCalculation = await ctx.task(sampleSizeCalculationTask, {
    testName,
    testDesign,
    targetMetric,
    confidenceLevel,
    duration,
    outputDir
  });

  artifacts.push(...sampleSizeCalculation.artifacts);

  // ============================================================================
  // PHASE 4: VARIANT SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Specifying test variants');
  const variantSpecification = await ctx.task(variantSpecificationTask, {
    testName,
    testType,
    variants,
    hypothesisFormulation,
    testDesign,
    outputDir
  });

  artifacts.push(...variantSpecification.artifacts);

  // ============================================================================
  // PHASE 5: TRACKING IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning tracking implementation');
  const trackingImplementation = await ctx.task(trackingImplementationTask, {
    testName,
    testDesign,
    variantSpecification,
    targetMetric,
    outputDir
  });

  artifacts.push(...trackingImplementation.artifacts);

  // ============================================================================
  // PHASE 6: TEST EXECUTION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating test execution plan');
  const executionPlan = await ctx.task(testExecutionPlanTask, {
    testName,
    testDesign,
    sampleSizeCalculation,
    variantSpecification,
    trackingImplementation,
    duration,
    outputDir
  });

  artifacts.push(...executionPlan.artifacts);

  // ============================================================================
  // PHASE 7: STATISTICAL ANALYSIS FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining statistical analysis framework');
  const analysisFramework = await ctx.task(statisticalAnalysisFrameworkTask, {
    testName,
    testDesign,
    targetMetric,
    confidenceLevel,
    sampleSizeCalculation,
    outputDir
  });

  artifacts.push(...analysisFramework.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSURANCE CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating QA checklist for test validity');
  const qaChecklist = await ctx.task(testQAChecklistTask, {
    testName,
    testDesign,
    variantSpecification,
    trackingImplementation,
    executionPlan,
    outputDir
  });

  artifacts.push(...qaChecklist.artifacts);

  // ============================================================================
  // PHASE 9: RESULTS INTERPRETATION GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating results interpretation guide');
  const interpretationGuide = await ctx.task(resultsInterpretationGuideTask, {
    testName,
    hypothesisFormulation,
    testDesign,
    analysisFramework,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...interpretationGuide.artifacts);

  // ============================================================================
  // PHASE 10: TEST PROGRAM QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing test program quality');
  const qualityAssessment = await ctx.task(testProgramQualityTask, {
    testName,
    hypothesisFormulation,
    testDesign,
    sampleSizeCalculation,
    variantSpecification,
    trackingImplementation,
    executionPlan,
    analysisFramework,
    qaChecklist,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const testScore = qualityAssessment.overallScore;
  const qualityMet = testScore >= 80;

  // Breakpoint: Review test program
  await ctx.breakpoint({
    question: `A/B test program complete. Quality score: ${testScore}/100. ${qualityMet ? 'Test design meets quality standards!' : 'Test design may need refinement.'} Review and approve?`,
    title: 'A/B Test Program Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        testScore,
        qualityMet,
        testName,
        totalArtifacts: artifacts.length,
        variantCount: variantSpecification.variants?.length || 0,
        requiredSampleSize: sampleSizeCalculation.requiredSampleSize || 'N/A',
        estimatedDuration: sampleSizeCalculation.estimatedDuration || duration
      }
    }
  });

  const endTime = ctx.now();
  const processDuration = endTime - startTime;

  return {
    success: true,
    testName,
    testScore,
    qualityMet,
    testDesign: {
      hypothesis: hypothesisFormulation.validatedHypothesis,
      type: testDesign.testType,
      variants: variantSpecification.variants,
      targetMetric: testDesign.primaryMetric,
      secondaryMetrics: testDesign.secondaryMetrics
    },
    sampleSize: {
      required: sampleSizeCalculation.requiredSampleSize,
      perVariant: sampleSizeCalculation.perVariantSize,
      estimatedDuration: sampleSizeCalculation.estimatedDuration
    },
    trackingPlan: trackingImplementation.trackingPlan,
    executionPlan: executionPlan.plan,
    statisticalAnalysis: {
      framework: analysisFramework.framework,
      methods: analysisFramework.methods,
      confidenceLevel: confidenceLevel
    },
    qaChecklist: qaChecklist.checklist,
    interpretationGuide: interpretationGuide.guide,
    artifacts,
    duration: processDuration,
    metadata: {
      processId: 'marketing/ab-testing-program',
      timestamp: startTime,
      testName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Hypothesis Formulation
export const hypothesisFormulationTask = defineTask('hypothesis-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate and validate test hypothesis',
  agent: {
    name: 'hypothesis-analyst',
    prompt: {
      role: 'experimentation scientist and CRO specialist',
      task: 'Formulate clear, testable hypothesis with expected outcomes',
      context: args,
      instructions: [
        'Clarify the business problem being addressed',
        'Formulate hypothesis in standard format: If [change], then [outcome], because [rationale]',
        'Define null hypothesis (H0) and alternative hypothesis (H1)',
        'Identify independent and dependent variables',
        'Document expected effect size',
        'Identify potential confounding variables',
        'Assess hypothesis testability',
        'Define success criteria',
        'Generate hypothesis documentation'
      ],
      outputFormat: 'JSON with validatedHypothesis (string), nullHypothesis (string), alternativeHypothesis (string), variables (object), expectedEffectSize (string), confoundingVariables (array), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedHypothesis', 'nullHypothesis', 'alternativeHypothesis', 'artifacts'],
      properties: {
        validatedHypothesis: { type: 'string' },
        nullHypothesis: { type: 'string' },
        alternativeHypothesis: { type: 'string' },
        variables: {
          type: 'object',
          properties: {
            independent: { type: 'array', items: { type: 'string' } },
            dependent: { type: 'array', items: { type: 'string' } }
          }
        },
        expectedEffectSize: { type: 'string' },
        confoundingVariables: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'hypothesis']
}));

// Task 2: Test Design
export const testDesignTask = defineTask('test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design A/B test structure',
  agent: {
    name: 'test-designer',
    prompt: {
      role: 'experimentation design specialist',
      task: 'Design comprehensive A/B test structure and parameters',
      context: args,
      instructions: [
        'Define test type (A/B, A/B/n, multivariate, split URL)',
        'Specify control and treatment variants',
        'Define primary and secondary metrics',
        'Set traffic allocation percentages',
        'Define audience targeting/segmentation',
        'Specify randomization method',
        'Plan for novelty and primacy effects',
        'Define test boundaries and exclusions',
        'Generate test design document'
      ],
      outputFormat: 'JSON with testType (string), primaryMetric (string), secondaryMetrics (array), trafficSplit (object), audienceTargeting (object), randomization (string), boundaries (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testType', 'primaryMetric', 'trafficSplit', 'artifacts'],
      properties: {
        testType: { type: 'string' },
        primaryMetric: { type: 'string' },
        secondaryMetrics: { type: 'array', items: { type: 'string' } },
        trafficSplit: {
          type: 'object',
          properties: {
            control: { type: 'number' },
            treatment: { type: 'number' }
          }
        },
        audienceTargeting: { type: 'object' },
        randomization: { type: 'string' },
        boundaries: { type: 'object' },
        exclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'test-design']
}));

// Task 3: Sample Size Calculation
export const sampleSizeCalculationTask = defineTask('sample-size-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate required sample size',
  agent: {
    name: 'statistician',
    prompt: {
      role: 'statistical analyst and sample size specialist',
      task: 'Calculate statistically valid sample size for the A/B test',
      context: args,
      instructions: [
        'Determine baseline conversion rate',
        'Define minimum detectable effect (MDE)',
        'Set statistical power (typically 80%)',
        'Set significance level (alpha)',
        'Calculate required sample size per variant',
        'Estimate test duration based on traffic',
        'Consider one-tailed vs two-tailed test',
        'Account for expected drop-off',
        'Generate sample size calculation document'
      ],
      outputFormat: 'JSON with requiredSampleSize (number), perVariantSize (number), baselineRate (number), mde (number), power (number), alpha (number), estimatedDuration (string), calculation (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSampleSize', 'perVariantSize', 'estimatedDuration', 'artifacts'],
      properties: {
        requiredSampleSize: { type: 'number' },
        perVariantSize: { type: 'number' },
        baselineRate: { type: 'number' },
        mde: { type: 'number' },
        power: { type: 'number' },
        alpha: { type: 'number' },
        estimatedDuration: { type: 'string' },
        calculation: {
          type: 'object',
          properties: {
            formula: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'ab-testing', 'sample-size']
}));

// Task 4: Variant Specification
export const variantSpecificationTask = defineTask('variant-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify test variants',
  agent: {
    name: 'variant-designer',
    prompt: {
      role: 'UX designer and experimentation specialist',
      task: 'Create detailed specifications for control and treatment variants',
      context: args,
      instructions: [
        'Document control variant (baseline) in detail',
        'Specify treatment variant changes',
        'Ensure only one variable differs per test',
        'Document visual and functional differences',
        'Specify device and browser requirements',
        'Create variant mockups or descriptions',
        'Define variant implementation requirements',
        'Document variant naming conventions',
        'Generate variant specification document'
      ],
      outputFormat: 'JSON with variants (array), control (object), treatments (array), differences (array), implementationRequirements (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'control', 'treatments', 'artifacts'],
      properties: {
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              isControl: { type: 'boolean' }
            }
          }
        },
        control: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
            elements: { type: 'array' }
          }
        },
        treatments: { type: 'array' },
        differences: { type: 'array', items: { type: 'string' } },
        implementationRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'variants']
}));

// Task 5: Tracking Implementation
export const trackingImplementationTask = defineTask('tracking-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan tracking implementation',
  agent: {
    name: 'tracking-engineer',
    prompt: {
      role: 'analytics implementation specialist',
      task: 'Plan tracking implementation for accurate test measurement',
      context: args,
      instructions: [
        'Define events to track for primary metric',
        'Specify secondary metric tracking',
        'Plan variant assignment tracking',
        'Define user identification approach',
        'Specify cross-device tracking if needed',
        'Plan data layer implementation',
        'Define QA validation approach',
        'Document tracking specifications',
        'Generate tracking implementation plan'
      ],
      outputFormat: 'JSON with trackingPlan (object), events (array), dataLayer (object), userIdentification (object), validation (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingPlan', 'events', 'artifacts'],
      properties: {
        trackingPlan: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            method: { type: 'string' },
            implementation: { type: 'array', items: { type: 'string' } }
          }
        },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              trigger: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        },
        dataLayer: { type: 'object' },
        userIdentification: { type: 'object' },
        validation: {
          type: 'object',
          properties: {
            steps: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'ab-testing', 'tracking']
}));

// Task 6: Test Execution Plan
export const testExecutionPlanTask = defineTask('test-execution-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create test execution plan',
  agent: {
    name: 'test-manager',
    prompt: {
      role: 'experimentation program manager',
      task: 'Create comprehensive test execution plan',
      context: args,
      instructions: [
        'Define test launch prerequisites',
        'Create launch checklist',
        'Plan monitoring schedule',
        'Define early stopping criteria',
        'Plan communication cadence',
        'Create escalation procedures',
        'Define test conclusion criteria',
        'Plan rollout strategy for winner',
        'Generate execution plan document'
      ],
      outputFormat: 'JSON with plan (object), prerequisites (array), launchChecklist (array), monitoringSchedule (object), stoppingCriteria (array), escalationProcedures (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'prerequisites', 'launchChecklist', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            timeline: { type: 'object' },
            owner: { type: 'string' }
          }
        },
        prerequisites: { type: 'array', items: { type: 'string' } },
        launchChecklist: { type: 'array', items: { type: 'string' } },
        monitoringSchedule: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } }
          }
        },
        stoppingCriteria: { type: 'array', items: { type: 'string' } },
        escalationProcedures: { type: 'object' },
        rolloutStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'execution-plan']
}));

// Task 7: Statistical Analysis Framework
export const statisticalAnalysisFrameworkTask = defineTask('statistical-analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define statistical analysis framework',
  agent: {
    name: 'statistical-analyst',
    prompt: {
      role: 'statistician and data scientist',
      task: 'Define comprehensive statistical analysis framework for test results',
      context: args,
      instructions: [
        'Select appropriate statistical tests',
        'Define frequentist vs Bayesian approach',
        'Plan for multiple comparison corrections',
        'Define confidence interval calculations',
        'Plan segment analysis approach',
        'Define effect size calculations',
        'Plan for p-value and significance reporting',
        'Create analysis templates',
        'Generate analysis framework document'
      ],
      outputFormat: 'JSON with framework (object), methods (array), tests (array), corrections (object), segmentAnalysis (object), reportingTemplate (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'methods', 'tests', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        methods: { type: 'array', items: { type: 'string' } },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              purpose: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        corrections: { type: 'object' },
        segmentAnalysis: { type: 'object' },
        reportingTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'statistical-analysis']
}));

// Task 8: Test QA Checklist
export const testQAChecklistTask = defineTask('test-qa-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create QA checklist for test validity',
  agent: {
    name: 'qa-specialist',
    prompt: {
      role: 'QA engineer and experimentation specialist',
      task: 'Create comprehensive QA checklist to ensure test validity',
      context: args,
      instructions: [
        'Define variant rendering validation steps',
        'Create tracking validation checklist',
        'Define randomization verification tests',
        'Plan cross-browser and device testing',
        'Create user experience validation',
        'Define data quality checks',
        'Plan for edge case testing',
        'Create pre-launch validation procedure',
        'Generate QA checklist document'
      ],
      outputFormat: 'JSON with checklist (array), variantValidation (array), trackingValidation (array), randomizationTests (array), browserMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'variantValidation', 'trackingValidation', 'artifacts'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        variantValidation: { type: 'array', items: { type: 'string' } },
        trackingValidation: { type: 'array', items: { type: 'string' } },
        randomizationTests: { type: 'array', items: { type: 'string' } },
        browserMatrix: {
          type: 'object',
          properties: {
            browsers: { type: 'array', items: { type: 'string' } },
            devices: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'ab-testing', 'qa-checklist']
}));

// Task 9: Results Interpretation Guide
export const resultsInterpretationGuideTask = defineTask('results-interpretation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create results interpretation guide',
  agent: {
    name: 'interpretation-specialist',
    prompt: {
      role: 'data scientist and business analyst',
      task: 'Create guide for interpreting and acting on test results',
      context: args,
      instructions: [
        'Define winning criteria',
        'Explain statistical significance interpretation',
        'Create decision tree for different outcomes',
        'Define what inconclusive results mean',
        'Plan for segment-specific insights',
        'Define follow-up test recommendations',
        'Create stakeholder reporting format',
        'Document learnings capture process',
        'Generate interpretation guide document'
      ],
      outputFormat: 'JSON with guide (object), winningCriteria (array), decisionTree (object), outcomes (object), reportingFormat (object), learningsProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'winningCriteria', 'decisionTree', 'artifacts'],
      properties: {
        guide: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            keyPrinciples: { type: 'array', items: { type: 'string' } }
          }
        },
        winningCriteria: { type: 'array', items: { type: 'string' } },
        decisionTree: {
          type: 'object',
          properties: {
            significant: { type: 'object' },
            notSignificant: { type: 'object' },
            inconclusive: { type: 'object' }
          }
        },
        outcomes: { type: 'object' },
        reportingFormat: { type: 'object' },
        learningsProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'interpretation']
}));

// Task 10: Test Program Quality Assessment
export const testProgramQualityTask = defineTask('test-program-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess test program quality',
  agent: {
    name: 'test-validator',
    prompt: {
      role: 'experimentation director',
      task: 'Assess overall test program quality and readiness',
      context: args,
      instructions: [
        'Evaluate hypothesis clarity and testability (weight: 15%)',
        'Assess test design rigor (weight: 20%)',
        'Review sample size adequacy (weight: 15%)',
        'Evaluate variant specification clarity (weight: 15%)',
        'Assess tracking implementation completeness (weight: 10%)',
        'Review execution plan feasibility (weight: 10%)',
        'Evaluate statistical framework appropriateness (weight: 10%)',
        'Assess QA checklist comprehensiveness (weight: 5%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            hypothesis: { type: 'number' },
            testDesign: { type: 'number' },
            sampleSize: { type: 'number' },
            variants: { type: 'number' },
            tracking: { type: 'number' },
            executionPlan: { type: 'number' },
            statisticalFramework: { type: 'number' },
            qaChecklist: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'quality-assessment']
}));
