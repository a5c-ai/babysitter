/**
 * @process social-sciences/experimental-design
 * @description Design randomized controlled trials and laboratory experiments with proper controls, randomization strategies, and power analysis for behavioral and social research
 * @inputs { researchQuestion: string, hypotheses: array, targetPopulation: object, constraints: object, outputDir: string }
 * @outputs { success: boolean, experimentDesign: object, powerAnalysis: object, randomizationPlan: object, artifacts: array }
 * @recommendedSkills SK-SS-001 (quantitative-methods), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    hypotheses = [],
    targetPopulation = {},
    constraints = {},
    outputDir = 'experimental-design-output',
    targetPower = 0.80,
    significanceLevel = 0.05
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Experimental Design process');

  // ============================================================================
  // PHASE 1: RESEARCH QUESTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing research question and hypotheses');
  const questionAnalysis = await ctx.task(researchQuestionAnalysisTask, {
    researchQuestion,
    hypotheses,
    targetPopulation,
    outputDir
  });

  artifacts.push(...questionAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: EXPERIMENTAL DESIGN SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting appropriate experimental design');
  const designSelection = await ctx.task(designSelectionTask, {
    questionAnalysis,
    hypotheses,
    constraints,
    outputDir
  });

  artifacts.push(...designSelection.artifacts);

  // ============================================================================
  // PHASE 3: POWER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting power analysis for sample size determination');
  const powerAnalysis = await ctx.task(powerAnalysisTask, {
    designSelection,
    hypotheses,
    targetPower,
    significanceLevel,
    targetPopulation,
    outputDir
  });

  artifacts.push(...powerAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: RANDOMIZATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing randomization strategy');
  const randomizationPlan = await ctx.task(randomizationStrategyTask, {
    designSelection,
    powerAnalysis,
    targetPopulation,
    outputDir
  });

  artifacts.push(...randomizationPlan.artifacts);

  // ============================================================================
  // PHASE 5: CONTROL GROUP DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing control conditions');
  const controlDesign = await ctx.task(controlGroupDesignTask, {
    designSelection,
    researchQuestion,
    hypotheses,
    outputDir
  });

  artifacts.push(...controlDesign.artifacts);

  // ============================================================================
  // PHASE 6: INTERNAL VALIDITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing threats to internal validity');
  const validityAssessment = await ctx.task(internalValidityAssessmentTask, {
    designSelection,
    randomizationPlan,
    controlDesign,
    outputDir
  });

  artifacts.push(...validityAssessment.artifacts);

  // ============================================================================
  // PHASE 7: EXPERIMENTAL PROTOCOL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing experimental protocol');
  const protocolDevelopment = await ctx.task(protocolDevelopmentTask, {
    designSelection,
    randomizationPlan,
    controlDesign,
    powerAnalysis,
    validityAssessment,
    outputDir
  });

  artifacts.push(...protocolDevelopment.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Scoring experimental design quality');
  const qualityScore = await ctx.task(designQualityScoringTask, {
    questionAnalysis,
    designSelection,
    powerAnalysis,
    randomizationPlan,
    controlDesign,
    validityAssessment,
    protocolDevelopment,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const designScore = qualityScore.overallScore;
  const qualityMet = designScore >= 80;

  // Breakpoint: Review experimental design
  await ctx.breakpoint({
    question: `Experimental design complete. Quality score: ${designScore}/100. ${qualityMet ? 'Design meets quality standards!' : 'Design may need refinement.'} Review and approve?`,
    title: 'Experimental Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        designScore,
        qualityMet,
        designType: designSelection.selectedDesign,
        requiredSampleSize: powerAnalysis.requiredSampleSize,
        randomizationMethod: randomizationPlan.method,
        validityThreats: validityAssessment.threatsIdentified
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    designScore,
    qualityMet,
    experimentDesign: {
      type: designSelection.selectedDesign,
      rationale: designSelection.rationale,
      conditions: designSelection.conditions,
      factors: designSelection.factors
    },
    powerAnalysis: {
      requiredSampleSize: powerAnalysis.requiredSampleSize,
      expectedPower: powerAnalysis.expectedPower,
      effectSize: powerAnalysis.effectSize,
      significanceLevel
    },
    randomizationPlan: {
      method: randomizationPlan.method,
      stratificationVariables: randomizationPlan.stratificationVariables,
      blockingDesign: randomizationPlan.blockingDesign
    },
    controlDesign: {
      controlType: controlDesign.controlType,
      blindingProcedure: controlDesign.blindingProcedure
    },
    validityAssessment: {
      threatsIdentified: validityAssessment.threatsIdentified,
      mitigationStrategies: validityAssessment.mitigationStrategies
    },
    protocol: protocolDevelopment.protocolPath,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/experimental-design',
      timestamp: startTime,
      researchQuestion,
      outputDir
    }
  };
}

// Task 1: Research Question Analysis
export const researchQuestionAnalysisTask = defineTask('research-question-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze research question and hypotheses',
  agent: {
    name: 'research-methodologist',
    prompt: {
      role: 'senior research methodologist specializing in experimental design',
      task: 'Analyze the research question and hypotheses to determine appropriate experimental approach',
      context: args,
      instructions: [
        'Evaluate research question clarity and testability',
        'Assess whether hypotheses are falsifiable and specific',
        'Identify independent variables (treatments/manipulations)',
        'Identify dependent variables (outcomes/measures)',
        'Identify potential confounding variables',
        'Identify moderating and mediating variables',
        'Assess causal claims being made',
        'Evaluate alignment with experimental vs quasi-experimental approach',
        'Document operationalization requirements',
        'Generate research question analysis report'
      ],
      outputFormat: 'JSON with questionClarity, hypothesesAssessment, variables, causalModel, recommendedApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questionClarity', 'variables', 'recommendedApproach', 'artifacts'],
      properties: {
        questionClarity: { type: 'number', minimum: 0, maximum: 100 },
        hypothesesAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              testability: { type: 'string' },
              specificity: { type: 'string' }
            }
          }
        },
        variables: {
          type: 'object',
          properties: {
            independent: { type: 'array', items: { type: 'string' } },
            dependent: { type: 'array', items: { type: 'string' } },
            confounding: { type: 'array', items: { type: 'string' } },
            moderating: { type: 'array', items: { type: 'string' } },
            mediating: { type: 'array', items: { type: 'string' } }
          }
        },
        causalModel: { type: 'object' },
        recommendedApproach: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'research-question']
}));

// Task 2: Design Selection
export const designSelectionTask = defineTask('design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate experimental design',
  agent: {
    name: 'experimental-designer',
    prompt: {
      role: 'experimental design specialist',
      task: 'Select the most appropriate experimental design based on research requirements',
      context: args,
      instructions: [
        'Evaluate between-subjects vs within-subjects designs',
        'Consider factorial designs for multiple factors',
        'Assess need for repeated measures',
        'Consider mixed designs (split-plot)',
        'Evaluate crossover designs if appropriate',
        'Consider Solomon four-group design for testing effects',
        'Assess Latin square designs for counterbalancing',
        'Document design notation (e.g., R O X O)',
        'Justify design selection based on research question',
        'Identify design limitations and trade-offs',
        'Generate design selection report'
      ],
      outputFormat: 'JSON with selectedDesign, rationale, conditions, factors, designNotation, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedDesign', 'rationale', 'conditions', 'artifacts'],
      properties: {
        selectedDesign: { type: 'string' },
        rationale: { type: 'string' },
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              treatmentLevel: { type: 'string' }
            }
          }
        },
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              levels: { type: 'array', items: { type: 'string' } },
              type: { type: 'string' }
            }
          }
        },
        designNotation: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'design-selection']
}));

// Task 3: Power Analysis
export const powerAnalysisTask = defineTask('power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct power analysis for sample size',
  agent: {
    name: 'statistical-analyst',
    prompt: {
      role: 'biostatistician specializing in power analysis',
      task: 'Conduct comprehensive power analysis to determine required sample size',
      context: args,
      instructions: [
        'Determine expected effect size based on prior research or pilot data',
        'Use Cohen conventions if no prior data (small=0.2, medium=0.5, large=0.8)',
        'Calculate required sample size for target power (typically 0.80)',
        'Account for expected attrition/dropout rates',
        'Consider multiple comparisons corrections if applicable',
        'Calculate power for different sample sizes (sensitivity analysis)',
        'Provide minimum detectable effect size at proposed sample',
        'Account for clustering if applicable (design effect)',
        'Document software/method used for calculations',
        'Generate power analysis report with power curves'
      ],
      outputFormat: 'JSON with requiredSampleSize, expectedPower, effectSize, attritionAdjustment, sensitivityAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSampleSize', 'expectedPower', 'effectSize', 'artifacts'],
      properties: {
        requiredSampleSize: { type: 'number' },
        sampleSizePerCondition: { type: 'number' },
        expectedPower: { type: 'number' },
        effectSize: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            type: { type: 'string' },
            interpretation: { type: 'string' }
          }
        },
        attritionAdjustment: { type: 'number' },
        sensitivityAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sampleSize: { type: 'number' },
              power: { type: 'number' }
            }
          }
        },
        minimumDetectableEffect: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'power-analysis']
}));

// Task 4: Randomization Strategy
export const randomizationStrategyTask = defineTask('randomization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop randomization strategy',
  agent: {
    name: 'randomization-specialist',
    prompt: {
      role: 'clinical trials methodologist specializing in randomization',
      task: 'Develop comprehensive randomization strategy for the experimental design',
      context: args,
      instructions: [
        'Select randomization method (simple, stratified, block, adaptive)',
        'Identify stratification variables for balanced groups',
        'Design blocking scheme if using blocked randomization',
        'Determine block sizes (fixed vs variable)',
        'Plan for allocation concealment',
        'Design randomization sequence generation procedure',
        'Plan for unequal allocation ratios if needed',
        'Consider covariate-adaptive randomization if appropriate',
        'Document randomization software/tools',
        'Generate randomization protocol document'
      ],
      outputFormat: 'JSON with method, stratificationVariables, blockingDesign, allocationConcealment, sequenceGeneration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'sequenceGeneration', 'artifacts'],
      properties: {
        method: { type: 'string' },
        stratificationVariables: { type: 'array', items: { type: 'string' } },
        blockingDesign: {
          type: 'object',
          properties: {
            blockSizes: { type: 'array', items: { type: 'number' } },
            blockType: { type: 'string' }
          }
        },
        allocationRatio: { type: 'string' },
        allocationConcealment: { type: 'string' },
        sequenceGeneration: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            software: { type: 'string' },
            seed: { type: 'string' }
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
  labels: ['agent', 'experimental-design', 'randomization']
}));

// Task 5: Control Group Design
export const controlGroupDesignTask = defineTask('control-group-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design control conditions',
  agent: {
    name: 'control-design-specialist',
    prompt: {
      role: 'experimental methodologist specializing in control conditions',
      task: 'Design appropriate control conditions and blinding procedures',
      context: args,
      instructions: [
        'Select control type (no treatment, placebo, active control, waitlist)',
        'Design placebo conditions that match treatment credibility',
        'Plan for blinding (single, double, triple blind)',
        'Design procedures for maintaining blinding integrity',
        'Plan manipulation checks for treatment fidelity',
        'Design attention control conditions if needed',
        'Plan for treatment-as-usual comparisons if applicable',
        'Document ethical considerations for control conditions',
        'Design blinding assessment procedures',
        'Generate control condition protocol'
      ],
      outputFormat: 'JSON with controlType, placeboDesign, blindingProcedure, manipulationChecks, ethicalConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['controlType', 'blindingProcedure', 'artifacts'],
      properties: {
        controlType: { type: 'string' },
        placeboDesign: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            credibilityMatching: { type: 'string' }
          }
        },
        blindingProcedure: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            whoIsBlinded: { type: 'array', items: { type: 'string' } },
            proceduresMaintaining: { type: 'array', items: { type: 'string' } }
          }
        },
        manipulationChecks: { type: 'array', items: { type: 'string' } },
        blindingAssessment: { type: 'string' },
        ethicalConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'control-design']
}));

// Task 6: Internal Validity Assessment
export const internalValidityAssessmentTask = defineTask('internal-validity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess threats to internal validity',
  agent: {
    name: 'validity-assessor',
    prompt: {
      role: 'research methodologist specializing in validity assessment',
      task: 'Identify and assess threats to internal validity and develop mitigation strategies',
      context: args,
      instructions: [
        'Assess selection bias threats',
        'Evaluate history and maturation threats',
        'Identify testing and instrumentation effects',
        'Assess regression to the mean threats',
        'Evaluate attrition/mortality threats',
        'Identify diffusion of treatment threats',
        'Assess compensatory equalization threats',
        'Evaluate experimenter expectancy effects',
        'Identify demand characteristics',
        'Develop mitigation strategies for each threat',
        'Generate validity assessment report'
      ],
      outputFormat: 'JSON with threatsIdentified, severityRatings, mitigationStrategies, residualRisk, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['threatsIdentified', 'mitigationStrategies', 'artifacts'],
      properties: {
        threatsIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              likelihood: { type: 'string' }
            }
          }
        },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              strategy: { type: 'string' },
              effectiveness: { type: 'string' }
            }
          }
        },
        residualRisk: { type: 'string' },
        validityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'validity']
}));

// Task 7: Protocol Development
export const protocolDevelopmentTask = defineTask('protocol-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop experimental protocol',
  agent: {
    name: 'protocol-developer',
    prompt: {
      role: 'senior experimental researcher',
      task: 'Develop comprehensive experimental protocol document',
      context: args,
      instructions: [
        'Document study objectives and hypotheses',
        'Detail participant eligibility criteria',
        'Describe recruitment procedures',
        'Document informed consent process',
        'Detail randomization and allocation procedures',
        'Describe intervention/treatment procedures step-by-step',
        'Document measurement procedures and timing',
        'Describe data collection instruments',
        'Detail safety monitoring procedures',
        'Document data management plan',
        'Include timeline and milestones',
        'Generate IRB-ready protocol document'
      ],
      outputFormat: 'JSON with protocolPath, sections, timelineEstimate, irbReadiness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocolPath', 'sections', 'artifacts'],
      properties: {
        protocolPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        timelineEstimate: { type: 'string' },
        irbReadiness: { type: 'number' },
        ethicsConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'protocol']
}));

// Task 8: Design Quality Scoring
export const designQualityScoringTask = defineTask('design-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score experimental design quality',
  agent: {
    name: 'design-quality-assessor',
    prompt: {
      role: 'senior methodological reviewer',
      task: 'Assess overall experimental design quality and rigor',
      context: args,
      instructions: [
        'Evaluate research question clarity (weight: 10%)',
        'Assess design appropriateness for research question (weight: 20%)',
        'Evaluate power analysis adequacy (weight: 15%)',
        'Assess randomization rigor (weight: 15%)',
        'Evaluate control condition design (weight: 15%)',
        'Assess internal validity protections (weight: 15%)',
        'Evaluate protocol completeness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify critical gaps and weaknesses',
        'Provide specific recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            questionClarity: { type: 'number' },
            designAppropriateness: { type: 'number' },
            powerAnalysis: { type: 'number' },
            randomization: { type: 'number' },
            controlDesign: { type: 'number' },
            internalValidity: { type: 'number' },
            protocolCompleteness: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'quality-scoring']
}));
