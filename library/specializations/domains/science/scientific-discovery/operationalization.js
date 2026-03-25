/**
 * @process scientific-discovery/operationalization
 * @description Turn abstract psychological and social science concepts into measurable variables with valid indicators and reliable measurement procedures
 * @inputs { concept: string, domain: string, context: object, existingMeasures: array, outputDir: string }
 * @outputs { success: boolean, operationalization: object, measurementPlan: object, validityAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    concept = '',
    domain = '',
    context = {},
    existingMeasures = [],
    outputDir = 'operationalization-output',
    targetValidity = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Operationalization Process');

  // ============================================================================
  // PHASE 1: CONCEPTUAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing the abstract concept');
  const conceptualAnalysis = await ctx.task(conceptualAnalysisTask, {
    concept,
    domain,
    context,
    outputDir
  });

  artifacts.push(...conceptualAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DIMENSIONAL DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Decomposing concept into dimensions');
  const dimensionalDecomposition = await ctx.task(dimensionalDecompositionTask, {
    concept,
    conceptualAnalysis,
    outputDir
  });

  artifacts.push(...dimensionalDecomposition.artifacts);

  // ============================================================================
  // PHASE 3: INDICATOR IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying observable indicators');
  const indicatorIdentification = await ctx.task(indicatorIdentificationTask, {
    concept,
    dimensions: dimensionalDecomposition.dimensions,
    existingMeasures,
    outputDir
  });

  artifacts.push(...indicatorIdentification.artifacts);

  // ============================================================================
  // PHASE 4: MEASUREMENT PROCEDURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing measurement procedures');
  const measurementDesign = await ctx.task(measurementProcedureDesignTask, {
    indicators: indicatorIdentification.indicators,
    context,
    outputDir
  });

  artifacts.push(...measurementDesign.artifacts);

  // ============================================================================
  // PHASE 5: VALIDITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing validity');
  const validityAssessment = await ctx.task(validityAssessmentTask, {
    concept,
    conceptualAnalysis,
    indicators: indicatorIdentification.indicators,
    measurementDesign,
    outputDir
  });

  artifacts.push(...validityAssessment.artifacts);

  // ============================================================================
  // PHASE 6: RELIABILITY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning reliability assessment');
  const reliabilityPlanning = await ctx.task(reliabilityPlanningTask, {
    measurementDesign,
    indicators: indicatorIdentification.indicators,
    outputDir
  });

  artifacts.push(...reliabilityPlanning.artifacts);

  // ============================================================================
  // PHASE 7: BIAS AND LIMITATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing biases and limitations');
  const biasAnalysis = await ctx.task(biasLimitationAnalysisTask, {
    concept,
    operationalization: measurementDesign,
    validityAssessment,
    context,
    outputDir
  });

  artifacts.push(...biasAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing operationalization');
  const synthesis = await ctx.task(operationalizationSynthesisTask, {
    concept,
    conceptualAnalysis,
    dimensionalDecomposition,
    indicatorIdentification,
    measurementDesign,
    validityAssessment,
    reliabilityPlanning,
    biasAnalysis,
    targetValidity,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const validityMet = synthesis.validityScore >= targetValidity;

  // Breakpoint: Review operationalization
  await ctx.breakpoint({
    question: `Operationalization complete. Validity: ${synthesis.validityScore}/${targetValidity}. ${validityMet ? 'Validity target met!' : 'Additional refinement may be needed.'} Review operationalization?`,
    title: 'Operationalization Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        concept,
        dimensions: dimensionalDecomposition.dimensions.length,
        indicators: indicatorIdentification.indicators.length,
        validityScore: synthesis.validityScore,
        validityMet,
        biasesIdentified: biasAnalysis.biases.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    concept,
    operationalization: {
      definition: conceptualAnalysis.definition,
      dimensions: dimensionalDecomposition.dimensions,
      indicators: indicatorIdentification.indicators,
      measurementProcedures: measurementDesign.procedures
    },
    measurementPlan: measurementDesign.plan,
    validityAssessment: validityAssessment.assessment,
    reliability: reliabilityPlanning.plan,
    biases: biasAnalysis.biases,
    limitations: biasAnalysis.limitations,
    validityScore: synthesis.validityScore,
    validityMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/operationalization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Conceptual Analysis
export const conceptualAnalysisTask = defineTask('conceptual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the abstract concept',
  agent: {
    name: 'concept-analyst',
    prompt: {
      role: 'theoretical psychologist and measurement specialist',
      task: 'Provide rigorous conceptual analysis of the abstract construct',
      context: args,
      instructions: [
        'Define the concept precisely:',
        '  - Core meaning and essence',
        '  - Historical development of the construct',
        '  - Theoretical context and framework',
        'Distinguish from related concepts:',
        '  - Similar but distinct constructs',
        '  - Superordinate and subordinate concepts',
        '  - Antonyms and contrasts',
        'Identify theoretical propositions:',
        '  - What does having more/less of this concept mean?',
        '  - What are expected correlates?',
        '  - What are theorized causes and effects?',
        'Review existing definitions in literature',
        'Specify the concept at the appropriate level of abstraction',
        'Save conceptual analysis to output directory'
      ],
      outputFormat: 'JSON with definition (core, boundaries, distinctiveness), theoreticalContext, relatedConcepts, propositions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'theoreticalContext', 'artifacts'],
      properties: {
        definition: {
          type: 'object',
          properties: {
            core: { type: 'string' },
            boundaries: { type: 'array', items: { type: 'string' } },
            distinctiveness: { type: 'array', items: { type: 'object' } }
          }
        },
        theoreticalContext: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            history: { type: 'string' },
            currentStatus: { type: 'string' }
          }
        },
        relatedConcepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              relationship: { type: 'string' },
              distinction: { type: 'string' }
            }
          }
        },
        propositions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'conceptual-analysis']
}));

// Task 2: Dimensional Decomposition
export const dimensionalDecompositionTask = defineTask('dimensional-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose concept into dimensions',
  agent: {
    name: 'dimension-analyst',
    prompt: {
      role: 'psychometrician and construct analyst',
      task: 'Decompose the concept into measurable dimensions/facets',
      context: args,
      instructions: [
        'Identify whether concept is unidimensional or multidimensional',
        'If multidimensional, identify distinct dimensions/facets:',
        '  - What are the component aspects?',
        '  - Are they conceptually distinct?',
        '  - How do they relate to each other?',
        'For each dimension specify:',
        '  - Definition',
        '  - Theoretical importance',
        '  - Relationship to other dimensions',
        'Consider hierarchical structure (second-order factors)',
        'Review factor analytic evidence from literature',
        'Specify whether dimensions are formative or reflective',
        'Save dimensional analysis to output directory'
      ],
      outputFormat: 'JSON with dimensions (array with name, definition, importance, relationships), structure, factorEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'structure', 'artifacts'],
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              theoreticalImportance: { type: 'string' },
              relationshipToOthers: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        structure: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['unidimensional', 'multidimensional', 'hierarchical'] },
            indicatorType: { type: 'string', enum: ['reflective', 'formative', 'mixed'] },
            correlationalStructure: { type: 'string' }
          }
        },
        factorEvidence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'dimensional-decomposition']
}));

// Task 3: Indicator Identification
export const indicatorIdentificationTask = defineTask('indicator-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify observable indicators',
  agent: {
    name: 'indicator-specialist',
    prompt: {
      role: 'measurement specialist and survey methodologist',
      task: 'Identify observable indicators for each dimension',
      context: args,
      instructions: [
        'For each dimension, identify potential indicators:',
        '  - Self-report items (attitudes, beliefs, experiences)',
        '  - Behavioral indicators (observable actions)',
        '  - Physiological indicators (biological markers)',
        '  - Performance indicators (task outcomes)',
        'Review existing measures in literature',
        'For each indicator assess:',
        '  - Face validity (does it look like it measures the concept?)',
        '  - Feasibility (can it be measured in your context?)',
        '  - Sensitivity (can it detect differences?)',
        '  - Specificity (is it unique to this concept?)',
        'Ensure adequate content coverage for each dimension',
        'Consider response formats (Likert, behavioral frequency, etc.)',
        'Save indicator identification to output directory'
      ],
      outputFormat: 'JSON with indicators (array with name, dimension, type, faceValidity, feasibility, responseFormat), contentCoverage, existingMeasures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'contentCoverage', 'artifacts'],
      properties: {
        indicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dimension: { type: 'string' },
              type: { type: 'string', enum: ['self-report', 'behavioral', 'physiological', 'performance'] },
              description: { type: 'string' },
              faceValidity: { type: 'string', enum: ['high', 'medium', 'low'] },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              responseFormat: { type: 'string' }
            }
          }
        },
        contentCoverage: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        existingMeasures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'indicator-identification']
}));

// Task 4: Measurement Procedure Design
export const measurementProcedureDesignTask = defineTask('measurement-procedure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design measurement procedures',
  agent: {
    name: 'procedure-designer',
    prompt: {
      role: 'research methodologist and protocol designer',
      task: 'Design standardized measurement procedures for each indicator',
      context: args,
      instructions: [
        'For each indicator, design measurement procedure:',
        '  - Exact wording/specification',
        '  - Administration protocol',
        '  - Scoring rules',
        '  - Required materials/equipment',
        'Specify standardization requirements:',
        '  - Interviewer/observer training',
        '  - Environmental conditions',
        '  - Timing and duration',
        'Design quality control procedures:',
        '  - Attention checks',
        '  - Validity indicators',
        '  - Data cleaning rules',
        'Create composite scoring plan:',
        '  - How to combine indicators into dimension scores',
        '  - How to combine dimensions into overall scores',
        '  - Weighting scheme (if applicable)',
        'Save measurement design to output directory'
      ],
      outputFormat: 'JSON with procedures (array with indicator, protocol, scoring), standardization, qualityControl, compositeScoring, plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'standardization', 'plan', 'artifacts'],
      properties: {
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              specification: { type: 'string' },
              protocol: { type: 'string' },
              scoringRules: { type: 'object' },
              materials: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        standardization: {
          type: 'object',
          properties: {
            training: { type: 'string' },
            conditions: { type: 'string' },
            timing: { type: 'string' }
          }
        },
        qualityControl: {
          type: 'object',
          properties: {
            attentionChecks: { type: 'array', items: { type: 'string' } },
            validityIndicators: { type: 'array', items: { type: 'string' } },
            cleaningRules: { type: 'array', items: { type: 'string' } }
          }
        },
        compositeScoring: { type: 'object' },
        plan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'measurement-design']
}));

// Task 5: Validity Assessment
export const validityAssessmentTask = defineTask('validity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess validity',
  agent: {
    name: 'validity-assessor',
    prompt: {
      role: 'psychometrician specializing in validity',
      task: 'Assess the validity of the operationalization',
      context: args,
      instructions: [
        'Assess content validity:',
        '  - Does the measure cover the full conceptual domain?',
        '  - Are all dimensions adequately represented?',
        '  - Expert judgment of item relevance',
        'Plan construct validity assessment:',
        '  - Convergent validity (correlation with similar measures)',
        '  - Discriminant validity (independence from different measures)',
        '  - Known-groups validity (differentiates expected groups)',
        'Plan criterion validity assessment:',
        '  - Concurrent validity (correlation with current criterion)',
        '  - Predictive validity (prediction of future criterion)',
        'Consider face validity and consequential validity',
        'Design validation study plan',
        'Save validity assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (content, construct, criterion, face), validationPlan, expectedEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'validationPlan', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            content: {
              type: 'object',
              properties: {
                coverage: { type: 'string' },
                expertJudgment: { type: 'string' },
                score: { type: 'number' }
              }
            },
            construct: {
              type: 'object',
              properties: {
                convergent: { type: 'object' },
                discriminant: { type: 'object' },
                knownGroups: { type: 'object' }
              }
            },
            criterion: {
              type: 'object',
              properties: {
                concurrent: { type: 'object' },
                predictive: { type: 'object' }
              }
            },
            face: { type: 'string' }
          }
        },
        validationPlan: { type: 'string' },
        expectedEvidence: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'validity']
}));

// Task 6: Reliability Planning
export const reliabilityPlanningTask = defineTask('reliability-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan reliability assessment',
  agent: {
    name: 'reliability-planner',
    prompt: {
      role: 'psychometrician specializing in reliability',
      task: 'Plan assessment of measurement reliability',
      context: args,
      instructions: [
        'Plan internal consistency assessment:',
        '  - Cronbach\'s alpha calculation',
        '  - Item-total correlations',
        '  - Split-half reliability',
        'Plan test-retest reliability:',
        '  - Appropriate time interval',
        '  - Expected stability',
        '  - Sample requirements',
        'Plan inter-rater reliability (if applicable):',
        '  - Cohen\'s kappa or ICC',
        '  - Rater training standards',
        'Specify acceptable reliability thresholds',
        'Identify potential reliability threats',
        'Design reliability improvement strategies',
        'Save reliability planning to output directory'
      ],
      outputFormat: 'JSON with plan (internalConsistency, testRetest, interRater), thresholds, threats, improvementStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'thresholds', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            internalConsistency: {
              type: 'object',
              properties: {
                methods: { type: 'array', items: { type: 'string' } },
                expectedAlpha: { type: 'number' }
              }
            },
            testRetest: {
              type: 'object',
              properties: {
                interval: { type: 'string' },
                expectedCorrelation: { type: 'number' },
                sampleSize: { type: 'number' }
              }
            },
            interRater: {
              type: 'object',
              properties: {
                applicable: { type: 'boolean' },
                method: { type: 'string' },
                expectedAgreement: { type: 'number' }
              }
            }
          }
        },
        thresholds: {
          type: 'object',
          properties: {
            minimumAlpha: { type: 'number' },
            minimumTestRetest: { type: 'number' },
            minimumInterRater: { type: 'number' }
          }
        },
        threats: { type: 'array', items: { type: 'string' } },
        improvementStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'reliability']
}));

// Task 7: Bias and Limitation Analysis
export const biasLimitationAnalysisTask = defineTask('bias-limitation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze biases and limitations',
  agent: {
    name: 'bias-analyst',
    prompt: {
      role: 'methodologist specializing in measurement bias',
      task: 'Identify biases and limitations of the operationalization',
      context: args,
      instructions: [
        'Identify response biases:',
        '  - Social desirability bias',
        '  - Acquiescence bias',
        '  - Extreme response style',
        '  - Reference group effects',
        'Identify method biases:',
        '  - Common method variance',
        '  - Order effects',
        '  - Context effects',
        'Identify sampling/generalizability limitations:',
        '  - Population specificity',
        '  - Cultural applicability',
        '  - Temporal stability',
        'Assess construct underrepresentation/contamination',
        'Identify practical limitations',
        'Recommend bias mitigation strategies',
        'Save bias analysis to output directory'
      ],
      outputFormat: 'JSON with biases (array), methodBiases, limitations, constructIssues, mitigationStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['biases', 'limitations', 'artifacts'],
      properties: {
        biases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['response', 'method', 'sampling', 'construct'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        methodBiases: { type: 'array', items: { type: 'object' } },
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitation: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        constructIssues: {
          type: 'object',
          properties: {
            underrepresentation: { type: 'string' },
            contamination: { type: 'string' }
          }
        },
        mitigationStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'bias-analysis']
}));

// Task 8: Operationalization Synthesis
export const operationalizationSynthesisTask = defineTask('operationalization-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize operationalization',
  agent: {
    name: 'operationalization-synthesizer',
    prompt: {
      role: 'senior measurement scientist',
      task: 'Synthesize complete operationalization documentation',
      context: args,
      instructions: [
        'Integrate all analyses into comprehensive operationalization',
        'Create complete measurement documentation:',
        '  - Conceptual definition',
        '  - Dimensional structure',
        '  - Indicators and items',
        '  - Administration procedures',
        '  - Scoring instructions',
        'Assess overall validity score (0-100):',
        '  - Conceptual clarity',
        '  - Content coverage',
        '  - Indicator quality',
        '  - Procedure standardization',
        '  - Bias management',
        'Provide implementation recommendations',
        'Identify areas for future development',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with documentation, validityScore, recommendations, futureDevelopment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'validityScore', 'artifacts'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            conceptualDefinition: { type: 'string' },
            dimensionalStructure: { type: 'object' },
            indicators: { type: 'array', items: { type: 'object' } },
            procedures: { type: 'string' },
            scoring: { type: 'string' }
          }
        },
        validityScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        futureDevelopment: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'operationalization', 'synthesis']
}));
