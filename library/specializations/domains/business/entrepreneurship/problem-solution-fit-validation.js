/**
 * @process specializations/domains/business/entrepreneurship/problem-solution-fit-validation
 * @description Problem-Solution Fit Validation Process - Structured process to validate that a proposed solution effectively addresses a real customer problem worth solving.
 * @inputs { projectName: string, problemStatement: string, solutionHypothesis: string, targetCustomers: array, validationCriteria?: array }
 * @outputs { success: boolean, validationScorecard: object, evidenceDocumentation: object, recommendation: string, pivotOptions: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/problem-solution-fit-validation', {
 *   projectName: 'Invoice Automation Tool',
 *   problemStatement: 'Freelancers spend 5+ hours/week on manual invoicing',
 *   solutionHypothesis: 'AI-powered invoice generation from time entries',
 *   targetCustomers: ['Freelance Designers', 'Consultants']
 * });
 *
 * @references
 * - Lean Startup Methodology: https://theleanstartup.com/
 * - Testing Business Ideas: https://www.strategyzer.com/books/testing-business-ideas
 * - Design Thinking: https://designthinking.ideo.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    problemStatement,
    solutionHypothesis,
    targetCustomers = [],
    validationCriteria = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Problem-Solution Fit Validation for ${projectName}`);

  // Phase 1: Problem Articulation and Analysis
  const problemAnalysis = await ctx.task(problemAnalysisTask, {
    projectName,
    problemStatement,
    targetCustomers
  });

  artifacts.push(...(problemAnalysis.artifacts || []));

  // Phase 2: Solution Hypothesis Development
  const solutionDevelopment = await ctx.task(solutionHypothesisDevelopmentTask, {
    projectName,
    solutionHypothesis,
    problemAnalysis
  });

  artifacts.push(...(solutionDevelopment.artifacts || []));

  // Phase 3: Prototype Strategy
  const prototypeStrategy = await ctx.task(prototypeStrategyTask, {
    projectName,
    solutionDevelopment,
    problemAnalysis
  });

  artifacts.push(...(prototypeStrategy.artifacts || []));

  // Breakpoint: Review prototype strategy
  await ctx.breakpoint({
    question: `Review prototype strategy for ${projectName}. Prototype type: ${prototypeStrategy.prototypeType}. Ready to build?`,
    title: 'Prototype Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      prototypeType: prototypeStrategy.prototypeType,
      estimatedEffort: prototypeStrategy.estimatedEffort,
      files: artifacts
    }
  });

  // Phase 4: Validation Experiment Design
  const experimentDesign = await ctx.task(experimentDesignTask, {
    projectName,
    prototypeStrategy,
    targetCustomers,
    validationCriteria
  });

  artifacts.push(...(experimentDesign.artifacts || []));

  // Phase 5: Desirability Testing Framework
  const desirabilityTesting = await ctx.task(desirabilityTestingTask, {
    projectName,
    experimentDesign,
    targetCustomers
  });

  artifacts.push(...(desirabilityTesting.artifacts || []));

  // Phase 6: Feasibility Assessment
  const feasibilityAssessment = await ctx.task(feasibilityAssessmentTask, {
    projectName,
    solutionDevelopment,
    prototypeStrategy
  });

  artifacts.push(...(feasibilityAssessment.artifacts || []));

  // Phase 7: Viability Analysis
  const viabilityAnalysis = await ctx.task(viabilityAnalysisTask, {
    projectName,
    problemAnalysis,
    solutionDevelopment,
    desirabilityTesting
  });

  artifacts.push(...(viabilityAnalysis.artifacts || []));

  // Phase 8: Evidence Synthesis and Scoring
  const validationScoring = await ctx.task(validationScoringTask, {
    projectName,
    desirabilityTesting,
    feasibilityAssessment,
    viabilityAnalysis,
    validationCriteria
  });

  artifacts.push(...(validationScoring.artifacts || []));

  // Phase 9: Decision Framework
  const decisionFramework = await ctx.task(decisionFrameworkTask, {
    projectName,
    validationScoring,
    problemStatement,
    solutionHypothesis
  });

  artifacts.push(...(decisionFramework.artifacts || []));

  // Final Breakpoint: Validation decision
  await ctx.breakpoint({
    question: `Problem-Solution Fit validation complete. Score: ${validationScoring.overallScore}/100. Recommendation: ${decisionFramework.recommendation}. Approve decision?`,
    title: 'Problem-Solution Fit Decision',
    context: {
      runId: ctx.runId,
      projectName,
      overallScore: validationScoring.overallScore,
      desirabilityScore: validationScoring.desirabilityScore,
      feasibilityScore: validationScoring.feasibilityScore,
      viabilityScore: validationScoring.viabilityScore,
      recommendation: decisionFramework.recommendation,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    validationScorecard: {
      overallScore: validationScoring.overallScore,
      desirabilityScore: validationScoring.desirabilityScore,
      feasibilityScore: validationScoring.feasibilityScore,
      viabilityScore: validationScoring.viabilityScore,
      confidence: validationScoring.confidenceLevel
    },
    evidenceDocumentation: {
      problemEvidence: problemAnalysis,
      solutionEvidence: desirabilityTesting,
      feasibilityEvidence: feasibilityAssessment,
      viabilityEvidence: viabilityAnalysis
    },
    recommendation: decisionFramework.recommendation,
    pivotOptions: decisionFramework.pivotOptions || [],
    nextSteps: decisionFramework.nextSteps,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/problem-solution-fit-validation',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemAnalysisTask = defineTask('problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Problem-Solution Fit Expert with Lean Startup and Design Thinking expertise',
      task: 'Analyze and articulate the problem statement with customer impact assessment',
      context: {
        projectName: args.projectName,
        problemStatement: args.problemStatement,
        targetCustomers: args.targetCustomers
      },
      instructions: [
        '1. Deconstruct the problem statement into component parts',
        '2. Identify the jobs-to-be-done framework for the problem',
        '3. Assess problem frequency (how often customers experience it)',
        '4. Evaluate problem intensity (pain level when experienced)',
        '5. Measure willingness to pay (how much customers would pay to solve)',
        '6. Identify current alternatives and workarounds',
        '7. Define problem context and triggers',
        '8. Assess problem urgency and timeline pressures',
        '9. Identify problem stakeholders beyond primary user',
        '10. Rate overall problem worth solving score'
      ],
      outputFormat: 'JSON object with problem analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['problemComponents', 'worthSolvingScore', 'currentAlternatives'],
      properties: {
        problemComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              impact: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        jobsToBeDone: { type: 'array', items: { type: 'string' } },
        frequencyAssessment: { type: 'string' },
        intensityScore: { type: 'number', minimum: 1, maximum: 10 },
        willingnessToPayIndicators: { type: 'array', items: { type: 'string' } },
        currentAlternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              satisfaction: { type: 'string' },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        problemContext: { type: 'object' },
        worthSolvingScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'problem-analysis']
}));

export const solutionHypothesisDevelopmentTask = defineTask('solution-hypothesis-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solution Hypothesis Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Strategy Expert',
      task: 'Develop and refine solution hypothesis with value proposition mapping',
      context: {
        projectName: args.projectName,
        solutionHypothesis: args.solutionHypothesis,
        problemAnalysis: args.problemAnalysis
      },
      instructions: [
        '1. Articulate clear solution hypothesis statement',
        '2. Map solution features to problem components',
        '3. Define unique value proposition',
        '4. Identify key assumptions in the solution hypothesis',
        '5. Rank assumptions by risk and importance',
        '6. Define solution differentiation from alternatives',
        '7. Identify minimum viable feature set',
        '8. Map customer gains and pain relievers',
        '9. Define solution delivery mechanism',
        '10. Identify potential solution risks and barriers'
      ],
      outputFormat: 'JSON object with solution hypothesis'
    },
    outputSchema: {
      type: 'object',
      required: ['solutionStatement', 'valueProposition', 'keyAssumptions'],
      properties: {
        solutionStatement: { type: 'string' },
        featureMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              problemComponent: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        valueProposition: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            painRelievers: { type: 'array', items: { type: 'string' } },
            gainCreators: { type: 'array', items: { type: 'string' } }
          }
        },
        keyAssumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              riskLevel: { type: 'string' },
              testMethod: { type: 'string' }
            }
          }
        },
        differentiation: { type: 'array', items: { type: 'string' } },
        minimumViableFeatures: { type: 'array', items: { type: 'string' } },
        barriers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'solution-hypothesis']
}));

export const prototypeStrategyTask = defineTask('prototype-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prototype Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rapid Prototyping Specialist',
      task: 'Design prototype strategy for solution validation',
      context: {
        projectName: args.projectName,
        solutionDevelopment: args.solutionDevelopment,
        problemAnalysis: args.problemAnalysis
      },
      instructions: [
        '1. Select appropriate prototype type (Wizard of Oz, concierge, landing page, mockup, etc.)',
        '2. Define prototype scope and fidelity level',
        '3. Identify what to test with the prototype',
        '4. Design prototype user flow and interactions',
        '5. Estimate prototype development effort and timeline',
        '6. Identify tools and resources needed',
        '7. Define prototype success metrics',
        '8. Plan prototype testing approach',
        '9. Create prototype iteration plan',
        '10. Define prototype limitations and constraints'
      ],
      outputFormat: 'JSON object with prototype strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypeType', 'scope', 'successMetrics'],
      properties: {
        prototypeType: { type: 'string' },
        fidelityLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        scope: {
          type: 'object',
          properties: {
            included: { type: 'array', items: { type: 'string' } },
            excluded: { type: 'array', items: { type: 'string' } }
          }
        },
        testingObjectives: { type: 'array', items: { type: 'string' } },
        userFlow: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'string' },
        toolsRequired: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'string' } },
        iterationPlan: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'prototyping']
}));

export const experimentDesignTask = defineTask('experiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Experiment Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lean Experimentation Expert',
      task: 'Design validation experiments to test solution with target customers',
      context: {
        projectName: args.projectName,
        prototypeStrategy: args.prototypeStrategy,
        targetCustomers: args.targetCustomers,
        validationCriteria: args.validationCriteria
      },
      instructions: [
        '1. Design experiment structure and methodology',
        '2. Define experiment hypothesis with measurable outcomes',
        '3. Determine sample size and participant criteria',
        '4. Create experiment protocol and script',
        '5. Define quantitative and qualitative metrics',
        '6. Design data collection methods',
        '7. Create analysis framework for results',
        '8. Define success/failure thresholds',
        '9. Plan experiment timeline and logistics',
        '10. Identify potential biases and mitigation strategies'
      ],
      outputFormat: 'JSON object with experiment design'
    },
    outputSchema: {
      type: 'object',
      required: ['experimentHypothesis', 'methodology', 'successCriteria'],
      properties: {
        experimentHypothesis: { type: 'string' },
        methodology: { type: 'string' },
        sampleSize: { type: 'number' },
        participantCriteria: { type: 'array', items: { type: 'string' } },
        protocol: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'object',
          properties: {
            quantitative: { type: 'array', items: { type: 'string' } },
            qualitative: { type: 'array', items: { type: 'string' } }
          }
        },
        dataCollection: { type: 'object' },
        analysisFramework: { type: 'object' },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        timeline: { type: 'object' },
        biasMitigation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'experimentation']
}));

export const desirabilityTestingTask = defineTask('desirability-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Desirability Testing Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Desirability Researcher',
      task: 'Create framework for testing customer desirability of the solution',
      context: {
        projectName: args.projectName,
        experimentDesign: args.experimentDesign,
        targetCustomers: args.targetCustomers
      },
      instructions: [
        '1. Design desirability measurement methodology',
        '2. Create customer reaction capture framework',
        '3. Design intent-to-use measurement',
        '4. Create willingness-to-pay testing approach',
        '5. Design feature prioritization exercise',
        '6. Create emotional response measurement',
        '7. Design comparison with alternatives framework',
        '8. Create commitment escalation tests',
        '9. Design referral likelihood measurement (NPS-style)',
        '10. Create desirability scoring framework'
      ],
      outputFormat: 'JSON object with desirability testing framework'
    },
    outputSchema: {
      type: 'object',
      required: ['measurementMethodology', 'desirabilityMetrics', 'scoringFramework'],
      properties: {
        measurementMethodology: { type: 'string' },
        reactionCapture: { type: 'object' },
        intentToUse: {
          type: 'object',
          properties: {
            questions: { type: 'array', items: { type: 'string' } },
            scale: { type: 'string' }
          }
        },
        willingnessToPayTests: { type: 'array', items: { type: 'object' } },
        featurePrioritization: { type: 'object' },
        emotionalResponse: { type: 'object' },
        alternativeComparison: { type: 'object' },
        commitmentTests: { type: 'array', items: { type: 'string' } },
        referralLikelihood: { type: 'object' },
        desirabilityMetrics: { type: 'array', items: { type: 'string' } },
        scoringFramework: {
          type: 'object',
          properties: {
            dimensions: { type: 'array', items: { type: 'string' } },
            weights: { type: 'object' },
            thresholds: { type: 'object' }
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
  labels: ['entrepreneurship', 'problem-solution-fit', 'desirability']
}));

export const feasibilityAssessmentTask = defineTask('feasibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feasibility Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Feasibility Analyst',
      task: 'Assess technical and operational feasibility of the solution',
      context: {
        projectName: args.projectName,
        solutionDevelopment: args.solutionDevelopment,
        prototypeStrategy: args.prototypeStrategy
      },
      instructions: [
        '1. Assess technical complexity and development requirements',
        '2. Evaluate required technical capabilities and skills',
        '3. Identify technology stack and infrastructure needs',
        '4. Assess integration requirements with existing systems',
        '5. Evaluate scalability considerations',
        '6. Identify regulatory and compliance requirements',
        '7. Assess operational requirements for delivery',
        '8. Evaluate partnership or vendor dependencies',
        '9. Identify key technical risks and mitigation',
        '10. Calculate feasibility score'
      ],
      outputFormat: 'JSON object with feasibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['technicalComplexity', 'feasibilityScore', 'keyRisks'],
      properties: {
        technicalComplexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        developmentRequirements: {
          type: 'object',
          properties: {
            skills: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        technologyStack: { type: 'array', items: { type: 'string' } },
        infrastructureNeeds: { type: 'array', items: { type: 'string' } },
        integrationRequirements: { type: 'array', items: { type: 'string' } },
        scalabilityConsiderations: { type: 'array', items: { type: 'string' } },
        complianceRequirements: { type: 'array', items: { type: 'string' } },
        operationalRequirements: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        keyRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        feasibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'feasibility']
}));

export const viabilityAnalysisTask = defineTask('viability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Viability Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Viability Analyst',
      task: 'Analyze business viability of the solution',
      context: {
        projectName: args.projectName,
        problemAnalysis: args.problemAnalysis,
        solutionDevelopment: args.solutionDevelopment,
        desirabilityTesting: args.desirabilityTesting
      },
      instructions: [
        '1. Assess market size and growth potential',
        '2. Evaluate revenue model options',
        '3. Estimate customer acquisition costs',
        '4. Project customer lifetime value',
        '5. Analyze competitive positioning',
        '6. Evaluate pricing strategy options',
        '7. Assess path to profitability',
        '8. Identify funding requirements',
        '9. Evaluate business model scalability',
        '10. Calculate viability score'
      ],
      outputFormat: 'JSON object with viability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['marketPotential', 'revenueModel', 'viabilityScore'],
      properties: {
        marketPotential: {
          type: 'object',
          properties: {
            size: { type: 'string' },
            growth: { type: 'string' },
            accessibility: { type: 'string' }
          }
        },
        revenueModel: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            streams: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        },
        unitEconomics: {
          type: 'object',
          properties: {
            estimatedCAC: { type: 'string' },
            estimatedLTV: { type: 'string' },
            ltvCacRatio: { type: 'number' }
          }
        },
        competitivePosition: { type: 'string' },
        pricingStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            pricePoints: { type: 'array', items: { type: 'string' } }
          }
        },
        pathToProfitability: { type: 'string' },
        fundingRequirements: { type: 'string' },
        scalability: { type: 'string' },
        viabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'viability']
}));

export const validationScoringTask = defineTask('validation-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Scoring - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Scoring Specialist',
      task: 'Synthesize evidence and calculate validation scores',
      context: {
        projectName: args.projectName,
        desirabilityTesting: args.desirabilityTesting,
        feasibilityAssessment: args.feasibilityAssessment,
        viabilityAnalysis: args.viabilityAnalysis,
        validationCriteria: args.validationCriteria
      },
      instructions: [
        '1. Calculate desirability score from testing evidence',
        '2. Calculate feasibility score from assessment',
        '3. Calculate viability score from analysis',
        '4. Weight and combine scores for overall score',
        '5. Assess evidence quality and confidence level',
        '6. Identify strongest validation signals',
        '7. Identify weakest areas needing more evidence',
        '8. Compare against validation criteria',
        '9. Determine validation status (validated, invalidated, inconclusive)',
        '10. Generate validation scorecard'
      ],
      outputFormat: 'JSON object with validation scores'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'desirabilityScore', 'feasibilityScore', 'viabilityScore', 'validationStatus'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        desirabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        feasibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        viabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        strongSignals: { type: 'array', items: { type: 'string' } },
        weakAreas: { type: 'array', items: { type: 'string' } },
        criteriaComparison: { type: 'object' },
        validationStatus: { type: 'string', enum: ['validated', 'invalidated', 'inconclusive'] },
        scorecard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'validation-scoring']
}));

export const decisionFrameworkTask = defineTask('decision-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Strategy Advisor',
      task: 'Create decision framework based on validation results',
      context: {
        projectName: args.projectName,
        validationScoring: args.validationScoring,
        problemStatement: args.problemStatement,
        solutionHypothesis: args.solutionHypothesis
      },
      instructions: [
        '1. Generate go/no-go recommendation based on scores',
        '2. Identify pivot options if validation is weak',
        '3. Define next steps for each outcome scenario',
        '4. Create risk mitigation recommendations',
        '5. Identify additional validation needed',
        '6. Define resource requirements for next phase',
        '7. Create timeline recommendations',
        '8. Identify key decisions required',
        '9. Define success criteria for next phase',
        '10. Create stakeholder communication plan'
      ],
      outputFormat: 'JSON object with decision framework'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'nextSteps', 'pivotOptions'],
      properties: {
        recommendation: { type: 'string', enum: ['proceed', 'pivot', 'kill', 'more-validation'] },
        rationale: { type: 'string' },
        pivotOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pivotType: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        riskMitigation: { type: 'array', items: { type: 'string' } },
        additionalValidation: { type: 'array', items: { type: 'string' } },
        resourceRequirements: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'problem-solution-fit', 'decision-framework']
}));
