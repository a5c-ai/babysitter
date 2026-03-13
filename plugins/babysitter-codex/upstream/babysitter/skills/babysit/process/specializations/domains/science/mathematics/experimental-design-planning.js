/**
 * @process specializations/domains/science/mathematics/experimental-design-planning
 * @description Design rigorous statistical experiments with proper sample size calculations, randomization schemes,
 * and power analysis. Ensures statistical validity before data collection begins.
 * @inputs { researchQuestion: string, studyType?: string, variables?: object, constraints?: object, desiredPower?: number }
 * @outputs { success: boolean, experimentDesign: object, sampleSizeCalculation: object, randomizationProtocol: object, powerAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/experimental-design-planning', {
 *   researchQuestion: 'Does the new treatment reduce symptoms compared to placebo?',
 *   studyType: 'randomized-controlled-trial',
 *   variables: { treatment: 'independent', symptomScore: 'dependent', age: 'covariate' },
 *   constraints: { maxSampleSize: 500, duration: '6 months', budget: '100000' },
 *   desiredPower: 0.80
 * });
 *
 * @references
 * - Montgomery, Design and Analysis of Experiments
 * - Cohen, Statistical Power Analysis for the Behavioral Sciences
 * - Casella & Berger, Statistical Inference
 * - Piantadosi, Clinical Trials: A Methodologic Perspective
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    studyType = 'experimental',
    variables = {},
    constraints = {},
    desiredPower = 0.80
  } = inputs;

  // Phase 1: Define Research Hypothesis
  const hypothesisDefinition = await ctx.task(hypothesisDefinitionTask, {
    researchQuestion,
    studyType,
    variables
  });

  // Quality Gate: Hypothesis must be testable
  if (!hypothesisDefinition.testableHypothesis) {
    return {
      success: false,
      error: 'Unable to formulate testable hypothesis',
      phase: 'hypothesis-definition',
      experimentDesign: null
    };
  }

  // Breakpoint: Review hypothesis formulation
  await ctx.breakpoint({
    question: `Review hypothesis formulation. H0: ${hypothesisDefinition.nullHypothesis}, H1: ${hypothesisDefinition.alternativeHypothesis}. Approve?`,
    title: 'Hypothesis Formulation Review',
    context: {
      runId: ctx.runId,
      researchQuestion,
      hypotheses: hypothesisDefinition,
      files: [{
        path: `artifacts/phase1-hypothesis.json`,
        format: 'json',
        content: hypothesisDefinition
      }]
    }
  });

  // Phase 2: Calculate Required Sample Size
  const sampleSizeCalculation = await ctx.task(sampleSizeCalculationTask, {
    hypothesisDefinition,
    studyType,
    constraints,
    desiredPower
  });

  // Phase 3: Design Randomization Protocol
  const randomizationDesign = await ctx.task(randomizationDesignTask, {
    hypothesisDefinition,
    studyType,
    sampleSizeCalculation,
    variables,
    constraints
  });

  // Phase 4: Conduct Power Analysis
  const powerAnalysis = await ctx.task(powerAnalysisTask, {
    hypothesisDefinition,
    sampleSizeCalculation,
    studyType,
    desiredPower
  });

  // Quality Gate: Check if design meets power requirements
  if (powerAnalysis.achievedPower < desiredPower - 0.05) {
    await ctx.breakpoint({
      question: `Achieved power (${powerAnalysis.achievedPower}) is below desired power (${desiredPower}). Increase sample size or accept lower power?`,
      title: 'Power Analysis Warning',
      context: {
        runId: ctx.runId,
        achievedPower: powerAnalysis.achievedPower,
        desiredPower,
        recommendation: powerAnalysis.recommendations
      }
    });
  }

  // Phase 5: Document Design Decisions
  const designDocumentation = await ctx.task(designDocumentationTask, {
    researchQuestion,
    hypothesisDefinition,
    sampleSizeCalculation,
    randomizationDesign,
    powerAnalysis,
    studyType,
    constraints
  });

  // Final Breakpoint: Design Complete
  await ctx.breakpoint({
    question: `Experimental design complete. Sample size: ${sampleSizeCalculation.requiredSampleSize}, Power: ${powerAnalysis.achievedPower}. Approve design?`,
    title: 'Experimental Design Complete',
    context: {
      runId: ctx.runId,
      researchQuestion,
      sampleSize: sampleSizeCalculation.requiredSampleSize,
      power: powerAnalysis.achievedPower,
      files: [
        { path: `artifacts/experimental-design.json`, format: 'json', content: designDocumentation },
        { path: `artifacts/experimental-design.md`, format: 'markdown', content: designDocumentation.markdownReport }
      ]
    }
  });

  return {
    success: true,
    researchQuestion,
    experimentDesign: {
      studyType,
      hypothesis: hypothesisDefinition,
      variables: designDocumentation.variableDefinitions,
      designType: randomizationDesign.designType
    },
    sampleSizeCalculation: {
      requiredSize: sampleSizeCalculation.requiredSampleSize,
      perGroup: sampleSizeCalculation.perGroupSize,
      assumptions: sampleSizeCalculation.assumptions,
      formula: sampleSizeCalculation.formula
    },
    randomizationProtocol: {
      method: randomizationDesign.randomizationMethod,
      allocation: randomizationDesign.allocationRatio,
      stratification: randomizationDesign.stratificationFactors,
      blocking: randomizationDesign.blockingScheme
    },
    powerAnalysis: {
      desiredPower,
      achievedPower: powerAnalysis.achievedPower,
      effectSize: powerAnalysis.effectSize,
      sensitivityAnalysis: powerAnalysis.sensitivityAnalysis
    },
    designDocument: designDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/mathematics/experimental-design-planning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const hypothesisDefinitionTask = defineTask('hypothesis-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Research Hypothesis`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'stata-statistical-analysis', 'monte-carlo-simulation'],
    prompt: {
      role: 'Research Methodologist specializing in hypothesis formulation',
      task: 'Formulate clear, testable research hypotheses from the research question',
      context: {
        researchQuestion: args.researchQuestion,
        studyType: args.studyType,
        variables: args.variables
      },
      instructions: [
        '1. Parse the research question to identify key components',
        '2. Identify the population of interest',
        '3. Formulate the null hypothesis (H0)',
        '4. Formulate the alternative hypothesis (H1)',
        '5. Specify if one-tailed or two-tailed test',
        '6. Define the primary outcome variable',
        '7. Define independent and dependent variables',
        '8. Identify potential confounding variables',
        '9. Specify the expected effect direction',
        '10. Ensure hypothesis is falsifiable and testable'
      ],
      outputFormat: 'JSON object with hypothesis formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['testableHypothesis', 'nullHypothesis', 'alternativeHypothesis'],
      properties: {
        testableHypothesis: { type: 'boolean' },
        nullHypothesis: { type: 'string' },
        alternativeHypothesis: { type: 'string' },
        testType: { type: 'string', enum: ['one-tailed', 'two-tailed'] },
        tailDirection: { type: 'string' },
        primaryOutcome: {
          type: 'object',
          properties: {
            variable: { type: 'string' },
            type: { type: 'string' },
            measurement: { type: 'string' }
          }
        },
        independentVariables: { type: 'array', items: { type: 'string' } },
        dependentVariables: { type: 'array', items: { type: 'string' } },
        confoundingVariables: { type: 'array', items: { type: 'string' } },
        population: { type: 'string' },
        expectedEffect: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'experimental-design', 'hypothesis']
}));

export const sampleSizeCalculationTask = defineTask('sample-size-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Calculate Required Sample Size`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'monte-carlo-simulation', 'stata-statistical-analysis'],
    prompt: {
      role: 'Biostatistician specializing in sample size calculations',
      task: 'Calculate the required sample size for the study',
      context: {
        hypothesisDefinition: args.hypothesisDefinition,
        studyType: args.studyType,
        constraints: args.constraints,
        desiredPower: args.desiredPower
      },
      instructions: [
        '1. Determine the appropriate sample size formula for the study design',
        '2. Estimate expected effect size from literature or pilot data',
        '3. Set significance level (alpha)',
        '4. Set desired statistical power (1 - beta)',
        '5. Estimate expected variability/standard deviation',
        '6. Calculate minimum required sample size',
        '7. Adjust for expected dropout/attrition',
        '8. Adjust for clustering if applicable',
        '9. Consider practical constraints (budget, time)',
        '10. Provide sensitivity analysis for assumptions'
      ],
      outputFormat: 'JSON object with sample size calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSampleSize', 'formula', 'assumptions'],
      properties: {
        requiredSampleSize: { type: 'number' },
        perGroupSize: { type: 'number' },
        formula: { type: 'string' },
        assumptions: {
          type: 'object',
          properties: {
            alpha: { type: 'number' },
            power: { type: 'number' },
            effectSize: { type: 'number' },
            standardDeviation: { type: 'number' },
            dropoutRate: { type: 'number' }
          }
        },
        adjustments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              adjustment: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        sensitivityRange: {
          type: 'object',
          properties: {
            minimum: { type: 'number' },
            recommended: { type: 'number' },
            ideal: { type: 'number' }
          }
        },
        constraintAnalysis: {
          type: 'object',
          properties: {
            feasible: { type: 'boolean' },
            limitingFactor: { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'experimental-design', 'sample-size']
}));

export const randomizationDesignTask = defineTask('randomization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Design Randomization Protocol`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'monte-carlo-simulation', 'stata-statistical-analysis'],
    prompt: {
      role: 'Clinical Trial Methodologist specializing in randomization',
      task: 'Design the randomization protocol for the experiment',
      context: {
        hypothesisDefinition: args.hypothesisDefinition,
        studyType: args.studyType,
        sampleSizeCalculation: args.sampleSizeCalculation,
        variables: args.variables,
        constraints: args.constraints
      },
      instructions: [
        '1. Select appropriate randomization method (simple, blocked, stratified)',
        '2. Determine allocation ratio between groups',
        '3. Identify stratification factors if needed',
        '4. Design blocking scheme to balance allocations',
        '5. Plan for allocation concealment',
        '6. Design blinding/masking protocol if applicable',
        '7. Plan for treatment crossover if relevant',
        '8. Address adaptive randomization if appropriate',
        '9. Plan randomization implementation (software, procedures)',
        '10. Document randomization procedures for reproducibility'
      ],
      outputFormat: 'JSON object with randomization design'
    },
    outputSchema: {
      type: 'object',
      required: ['designType', 'randomizationMethod', 'allocationRatio'],
      properties: {
        designType: { type: 'string' },
        randomizationMethod: { type: 'string', enum: ['simple', 'blocked', 'stratified', 'adaptive', 'minimization'] },
        allocationRatio: { type: 'string' },
        stratificationFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              levels: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        blockingScheme: {
          type: 'object',
          properties: {
            useBlocking: { type: 'boolean' },
            blockSize: { type: 'array', items: { type: 'number' } },
            permutedBlockDesign: { type: 'boolean' }
          }
        },
        allocationConcealment: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            implementation: { type: 'string' }
          }
        },
        blinding: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['none', 'single', 'double', 'triple'] },
            blindedParties: { type: 'array', items: { type: 'string' } }
          }
        },
        implementation: {
          type: 'object',
          properties: {
            software: { type: 'string' },
            procedures: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'experimental-design', 'randomization']
}));

export const powerAnalysisTask = defineTask('power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Conduct Power Analysis`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'monte-carlo-simulation', 'stata-statistical-analysis'],
    prompt: {
      role: 'Statistical Power Analysis Expert',
      task: 'Conduct comprehensive power analysis for the experimental design',
      context: {
        hypothesisDefinition: args.hypothesisDefinition,
        sampleSizeCalculation: args.sampleSizeCalculation,
        studyType: args.studyType,
        desiredPower: args.desiredPower
      },
      instructions: [
        '1. Calculate achieved power with proposed sample size',
        '2. Generate power curve across effect sizes',
        '3. Perform sensitivity analysis on key assumptions',
        '4. Calculate minimum detectable effect size',
        '5. Assess Type I and Type II error rates',
        '6. Analyze power for secondary endpoints',
        '7. Consider interim analysis effects on power',
        '8. Evaluate robustness to assumption violations',
        '9. Compare power across alternative designs',
        '10. Provide recommendations to improve power'
      ],
      outputFormat: 'JSON object with power analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedPower', 'effectSize', 'sensitivityAnalysis'],
      properties: {
        achievedPower: { type: 'number' },
        effectSize: {
          type: 'object',
          properties: {
            estimated: { type: 'number' },
            type: { type: 'string' },
            interpretation: { type: 'string' }
          }
        },
        minimumDetectableEffect: { type: 'number' },
        sensitivityAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              range: { type: 'array', items: { type: 'number' } },
              powerRange: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        powerCurve: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              effectSize: { type: 'number' },
              power: { type: 'number' }
            }
          }
        },
        errorRates: {
          type: 'object',
          properties: {
            typeI: { type: 'number' },
            typeII: { type: 'number' }
          }
        },
        secondaryEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              power: { type: 'number' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'experimental-design', 'power-analysis']
}));

export const designDocumentationTask = defineTask('design-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Document Design Decisions`,
  agent: {
    name: 'statistician',
    skills: ['r-statistical-computing', 'latex-math-formatter', 'stata-statistical-analysis'],
    prompt: {
      role: 'Research Protocol Documentation Specialist',
      task: 'Create comprehensive documentation of the experimental design',
      context: {
        researchQuestion: args.researchQuestion,
        hypothesisDefinition: args.hypothesisDefinition,
        sampleSizeCalculation: args.sampleSizeCalculation,
        randomizationDesign: args.randomizationDesign,
        powerAnalysis: args.powerAnalysis,
        studyType: args.studyType,
        constraints: args.constraints
      },
      instructions: [
        '1. Write executive summary of study design',
        '2. Document complete variable definitions',
        '3. Detail inclusion/exclusion criteria',
        '4. Document sample size justification',
        '5. Detail randomization procedures',
        '6. Document power analysis results',
        '7. List all statistical assumptions',
        '8. Document planned analyses',
        '9. Address limitations and threats to validity',
        '10. Generate protocol document and markdown report'
      ],
      outputFormat: 'JSON object with complete design documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'variableDefinitions', 'markdownReport'],
      properties: {
        document: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            executiveSummary: { type: 'string' },
            background: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            methodology: { type: 'object' },
            statisticalPlan: { type: 'object' },
            limitations: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' }
          }
        },
        variableDefinitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              measurement: { type: 'string' },
              role: { type: 'string' }
            }
          }
        },
        inclusionCriteria: { type: 'array', items: { type: 'string' } },
        exclusionCriteria: { type: 'array', items: { type: 'string' } },
        plannedAnalyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              analysis: { type: 'string' },
              method: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        markdownReport: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'experimental-design', 'documentation']
}));
