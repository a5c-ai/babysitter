/**
 * @process scientific-discovery/model-vs-reality-thinking
 * @description Treat statistical and ML models as approximations of reality, systematically identifying where models fail to capture true data-generating processes
 * @inputs { model: object, data: object, domain: string, assumptions: array, outputDir: string }
 * @outputs { success: boolean, modelReality Gap: object, discrepancies: array, improvements: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    model = {},
    data = {},
    domain = '',
    assumptions = [],
    outputDir = 'model-vs-reality-output',
    targetInsight = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Model vs. Reality Thinking Process');

  // ============================================================================
  // PHASE 1: MODEL SPECIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing model specification');
  const modelSpecification = await ctx.task(modelSpecificationAnalysisTask, {
    model,
    assumptions,
    outputDir
  });

  artifacts.push(...modelSpecification.artifacts);

  // ============================================================================
  // PHASE 2: REALITY CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Characterizing reality/data-generating process');
  const realityCharacterization = await ctx.task(realityCharacterizationTask, {
    data,
    domain,
    outputDir
  });

  artifacts.push(...realityCharacterization.artifacts);

  // ============================================================================
  // PHASE 3: ASSUMPTION AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 3: Auditing model assumptions');
  const assumptionAudit = await ctx.task(assumptionAuditTask, {
    modelAssumptions: modelSpecification.assumptions,
    realityCharacteristics: realityCharacterization.characteristics,
    data,
    outputDir
  });

  artifacts.push(...assumptionAudit.artifacts);

  // ============================================================================
  // PHASE 4: DISCREPANCY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying model-reality discrepancies');
  const discrepancyIdentification = await ctx.task(discrepancyIdentificationTask, {
    model: modelSpecification.specification,
    reality: realityCharacterization.characteristics,
    assumptionAudit,
    outputDir
  });

  artifacts.push(...discrepancyIdentification.artifacts);

  // ============================================================================
  // PHASE 5: MISSPECIFICATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing for model misspecification');
  const misspecificationTesting = await ctx.task(misspecificationTestingTask, {
    model,
    data,
    discrepancies: discrepancyIdentification.discrepancies,
    outputDir
  });

  artifacts.push(...misspecificationTesting.artifacts);

  // ============================================================================
  // PHASE 6: APPROXIMATION QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing approximation quality');
  const approximationAssessment = await ctx.task(approximationQualityTask, {
    model,
    data,
    discrepancies: discrepancyIdentification.discrepancies,
    misspecificationResults: misspecificationTesting.results,
    outputDir
  });

  artifacts.push(...approximationAssessment.artifacts);

  // ============================================================================
  // PHASE 7: IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating improvement recommendations');
  const improvementRecommendations = await ctx.task(improvementRecommendationsTask, {
    discrepancies: discrepancyIdentification.discrepancies,
    assumptionViolations: assumptionAudit.violations,
    approximationQuality: approximationAssessment.quality,
    outputDir
  });

  artifacts.push(...improvementRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND EPISTEMOLOGICAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing model-reality analysis');
  const synthesis = await ctx.task(modelRealitySynthesisTask, {
    modelSpecification,
    realityCharacterization,
    assumptionAudit,
    discrepancyIdentification,
    misspecificationTesting,
    approximationAssessment,
    improvementRecommendations,
    targetInsight,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const insightMet = synthesis.insightScore >= targetInsight;

  // Breakpoint: Review model-reality analysis
  await ctx.breakpoint({
    question: `Model-reality analysis complete. Insight: ${synthesis.insightScore}/${targetInsight}. ${insightMet ? 'Insight target met!' : 'Additional analysis may be needed.'} Review analysis?`,
    title: 'Model vs. Reality Thinking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        model: modelSpecification.specification.name,
        assumptionsChecked: assumptionAudit.assumptions.length,
        violationsFound: assumptionAudit.violations.length,
        discrepanciesIdentified: discrepancyIdentification.discrepancies.length,
        approximationQuality: approximationAssessment.quality.overall,
        insightScore: synthesis.insightScore,
        insightMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    model: modelSpecification.specification,
    modelRealityGap: {
      assumptions: assumptionAudit.audit,
      violations: assumptionAudit.violations,
      approximationQuality: approximationAssessment.quality
    },
    discrepancies: discrepancyIdentification.discrepancies,
    improvements: improvementRecommendations.recommendations,
    epistemologicalStatus: synthesis.epistemologicalStatus,
    insightScore: synthesis.insightScore,
    insightMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/model-vs-reality-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Model Specification Analysis
export const modelSpecificationAnalysisTask = defineTask('model-specification-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze model specification',
  agent: {
    name: 'model-analyst',
    prompt: {
      role: 'statistical modeler and ML specialist',
      task: 'Analyze the model specification and its assumptions',
      context: args,
      instructions: [
        'Document the model specification:',
        '  - Model family/type',
        '  - Functional form',
        '  - Parameters and their interpretation',
        '  - Estimation method',
        'Identify explicit assumptions:',
        '  - Distributional assumptions',
        '  - Functional form assumptions',
        '  - Independence assumptions',
        '  - Homogeneity assumptions',
        'Identify implicit assumptions:',
        '  - What is the model NOT capturing?',
        '  - What simplifications are made?',
        '  - What is assumed constant/negligible?',
        'Document the model\'s intended use',
        'Save model specification to output directory'
      ],
      outputFormat: 'JSON with specification (name, type, form, parameters), assumptions (explicit, implicit), intendedUse, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'assumptions', 'artifacts'],
      properties: {
        specification: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            functionalForm: { type: 'string' },
            parameters: { type: 'array', items: { type: 'object' } },
            estimationMethod: { type: 'string' }
          }
        },
        assumptions: {
          type: 'object',
          properties: {
            explicit: { type: 'array', items: { type: 'string' } },
            implicit: { type: 'array', items: { type: 'string' } },
            distributional: { type: 'array', items: { type: 'string' } },
            functional: { type: 'array', items: { type: 'string' } },
            independence: { type: 'array', items: { type: 'string' } }
          }
        },
        intendedUse: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'specification']
}));

// Task 2: Reality Characterization
export const realityCharacterizationTask = defineTask('reality-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize reality/data-generating process',
  agent: {
    name: 'reality-analyst',
    prompt: {
      role: 'domain scientist and data analyst',
      task: 'Characterize what we know about the true data-generating process',
      context: args,
      instructions: [
        'Describe the domain/phenomenon being modeled:',
        '  - What process generates the data?',
        '  - What are the known mechanisms?',
        '  - What factors influence outcomes?',
        'Characterize data features:',
        '  - Distributions observed',
        '  - Dependencies and correlations',
        '  - Temporal/spatial patterns',
        '  - Heterogeneity across subgroups',
        'Identify known complexities:',
        '  - Non-linearities',
        '  - Interactions',
        '  - Feedback loops',
        '  - Confounders',
        'Document domain knowledge',
        'Save reality characterization to output directory'
      ],
      outputFormat: 'JSON with characteristics (process, mechanisms, factors, dataFeatures, complexities), domainKnowledge, unknowns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'domainKnowledge', 'artifacts'],
      properties: {
        characteristics: {
          type: 'object',
          properties: {
            process: { type: 'string' },
            mechanisms: { type: 'array', items: { type: 'string' } },
            factors: { type: 'array', items: { type: 'string' } },
            dataFeatures: { type: 'object' },
            complexities: { type: 'array', items: { type: 'string' } }
          }
        },
        domainKnowledge: { type: 'string' },
        unknowns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'reality-characterization']
}));

// Task 3: Assumption Audit
export const assumptionAuditTask = defineTask('assumption-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit model assumptions',
  agent: {
    name: 'assumption-auditor',
    prompt: {
      role: 'statistical methodologist',
      task: 'Audit whether model assumptions hold in reality',
      context: args,
      instructions: [
        'For each model assumption, assess:',
        '  - Is it testable with available data?',
        '  - What does evidence suggest?',
        '  - How severely is it violated (if at all)?',
        'Check distributional assumptions:',
        '  - Normality (Q-Q plots, tests)',
        '  - Homoscedasticity (residual plots)',
        '  - Specific distribution fits',
        'Check structural assumptions:',
        '  - Linearity (component plots)',
        '  - Additivity (interaction tests)',
        '  - Independence (autocorrelation, clustering)',
        'Classify violations:',
        '  - Mild: minor impact on inference',
        '  - Moderate: noticeable impact',
        '  - Severe: invalidates inference',
        'Save assumption audit to output directory'
      ],
      outputFormat: 'JSON with audit (array with assumption, testable, evidence, violated, severity), violations, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audit', 'violations', 'artifacts'],
      properties: {
        audit: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              testable: { type: 'boolean' },
              testMethod: { type: 'string' },
              evidence: { type: 'string' },
              violated: { type: 'boolean' },
              severity: { type: 'string', enum: ['none', 'mild', 'moderate', 'severe'] }
            }
          }
        },
        violations: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'assumption-audit']
}));

// Task 4: Discrepancy Identification
export const discrepancyIdentificationTask = defineTask('discrepancy-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify model-reality discrepancies',
  agent: {
    name: 'discrepancy-analyst',
    prompt: {
      role: 'model criticism specialist',
      task: 'Identify systematic discrepancies between model and reality',
      context: args,
      instructions: [
        'Identify structural discrepancies:',
        '  - Functional form mismatches',
        '  - Missing variables/features',
        '  - Incorrect relationship direction',
        'Identify distributional discrepancies:',
        '  - Wrong distribution family',
        '  - Heteroscedasticity ignored',
        '  - Heavy tails not captured',
        'Identify scope discrepancies:',
        '  - Extrapolation beyond training range',
        '  - Population mismatch',
        '  - Temporal validity',
        'For each discrepancy:',
        '  - What does the model assume?',
        '  - What does reality show?',
        '  - What is the impact?',
        'Save discrepancy identification to output directory'
      ],
      outputFormat: 'JSON with discrepancies (array with type, modelAssumes, realityShows, impact, severity), summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['discrepancies', 'summary', 'artifacts'],
      properties: {
        discrepancies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['structural', 'distributional', 'scope', 'mechanistic'] },
              description: { type: 'string' },
              modelAssumes: { type: 'string' },
              realityShows: { type: 'string' },
              impact: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'discrepancy']
}));

// Task 5: Misspecification Testing
export const misspecificationTestingTask = defineTask('misspecification-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test for model misspecification',
  agent: {
    name: 'misspecification-tester',
    prompt: {
      role: 'econometrician and statistical tester',
      task: 'Apply formal tests for model misspecification',
      context: args,
      instructions: [
        'Apply specification tests:',
        '  - RESET test (functional form)',
        '  - Hausman test (endogeneity)',
        '  - White test (heteroscedasticity)',
        '  - Breusch-Godfrey (autocorrelation)',
        '  - Overidentification tests',
        'Apply model comparison tests:',
        '  - Likelihood ratio tests',
        '  - Vuong test (non-nested)',
        '  - Cross-validation comparison',
        'Apply predictive checks:',
        '  - Posterior predictive checks',
        '  - Out-of-sample prediction',
        '  - Calibration assessment',
        'Report test results and p-values',
        'Interpret in context of sample size and power',
        'Save test results to output directory'
      ],
      outputFormat: 'JSON with results (array with test, statistic, pValue, conclusion), overallAssessment, caveats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'overallAssessment', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              purpose: { type: 'string' },
              statistic: { type: 'number' },
              pValue: { type: 'number' },
              conclusion: { type: 'string' }
            }
          }
        },
        overallAssessment: { type: 'string' },
        caveats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'misspecification']
}));

// Task 6: Approximation Quality Assessment
export const approximationQualityTask = defineTask('approximation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess approximation quality',
  agent: {
    name: 'approximation-assessor',
    prompt: {
      role: 'model evaluation specialist',
      task: 'Assess how well the model approximates reality',
      context: args,
      instructions: [
        'Assess fit quality:',
        '  - Goodness of fit measures (R², deviance)',
        '  - Information criteria (AIC, BIC)',
        '  - Cross-validation metrics',
        'Assess prediction quality:',
        '  - In-sample vs. out-of-sample',
        '  - Prediction intervals coverage',
        '  - Calibration',
        'Assess inference quality:',
        '  - Parameter estimate reliability',
        '  - Standard error validity',
        '  - Hypothesis test validity',
        'Apply "all models are wrong" framework:',
        '  - Is the model useful despite being wrong?',
        '  - For what purposes is it adequate?',
        '  - Where does it break down?',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with quality (overall, fit, prediction, inference, usefulness), adequatePurposes, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['quality', 'adequatePurposes', 'artifacts'],
      properties: {
        quality: {
          type: 'object',
          properties: {
            overall: { type: 'string', enum: ['excellent', 'good', 'adequate', 'poor', 'inadequate'] },
            fit: { type: 'object' },
            prediction: { type: 'object' },
            inference: { type: 'object' },
            usefulness: { type: 'string' }
          }
        },
        adequatePurposes: { type: 'array', items: { type: 'string' } },
        inadequatePurposes: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'approximation-quality']
}));

// Task 7: Improvement Recommendations
export const improvementRecommendationsTask = defineTask('improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate improvement recommendations',
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'senior data scientist and modeler',
      task: 'Recommend model improvements based on identified discrepancies',
      context: args,
      instructions: [
        'For each discrepancy, suggest improvements:',
        '  - Functional form modifications',
        '  - Additional variables to include',
        '  - Alternative model families',
        '  - Robust estimation methods',
        'Prioritize improvements by:',
        '  - Impact on model quality',
        '  - Feasibility of implementation',
        '  - Data requirements',
        'Consider trade-offs:',
        '  - Complexity vs. interpretability',
        '  - Flexibility vs. overfitting',
        '  - Accuracy vs. uncertainty quantification',
        'Recommend validation approach for improvements',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array with discrepancy, improvement, impact, feasibility), priorities, tradeoffs, validationPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'priorities', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              discrepancy: { type: 'string' },
              improvement: { type: 'string' },
              implementation: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              feasibility: { type: 'string', enum: ['easy', 'moderate', 'difficult'] }
            }
          }
        },
        priorities: { type: 'array', items: { type: 'string' } },
        tradeoffs: { type: 'array', items: { type: 'object' } },
        validationPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'improvements']
}));

// Task 8: Model-Reality Synthesis
export const modelRealitySynthesisTask = defineTask('model-reality-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize model-reality analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior statistician and philosopher of science',
      task: 'Synthesize model vs. reality analysis',
      context: args,
      instructions: [
        'Synthesize findings:',
        '  - Model specification summary',
        '  - Reality characterization summary',
        '  - Key discrepancies',
        '  - Approximation quality',
        'Assess insight score (0-100):',
        '  - Assumptions clearly identified?',
        '  - Discrepancies well-characterized?',
        '  - Quality appropriately assessed?',
        '  - Improvements well-motivated?',
        'Provide epistemological assessment:',
        '  - What can we learn from this model?',
        '  - What should we NOT conclude?',
        '  - How should uncertainty be communicated?',
        'State key takeaways',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, insightScore, epistemologicalStatus, keyTakeaways, warnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'insightScore', 'epistemologicalStatus', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        insightScore: { type: 'number', minimum: 0, maximum: 100 },
        epistemologicalStatus: {
          type: 'object',
          properties: {
            validConclusions: { type: 'array', items: { type: 'string' } },
            invalidConclusions: { type: 'array', items: { type: 'string' } },
            uncertaintyStatement: { type: 'string' }
          }
        },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'model-reality', 'synthesis']
}));
