/**
 * @process scientific-discovery/rough-set-reasoning
 * @description Approximate concepts via lower/upper bounds given limited features - handling vagueness from incomplete information
 * @inputs { informationSystem: object, decisionAttribute: string, targetConcept: string, reductComputation: boolean, outputDir: string }
 * @outputs { success: boolean, lowerApproximation: array, upperApproximation: array, boundaryRegion: array, reducts: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    informationSystem = {},
    decisionAttribute = '',
    targetConcept = '',
    reductComputation = true,
    outputDir = 'rough-set-output',
    significanceThreshold = 0.05
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Rough Set Reasoning Process');

  // ============================================================================
  // PHASE 1: INFORMATION SYSTEM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing information system');
  const systemAnalysis = await ctx.task(informationSystemAnalysisTask, {
    informationSystem,
    decisionAttribute,
    outputDir
  });

  artifacts.push(...systemAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: INDISCERNIBILITY RELATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Computing indiscernibility relations');
  const indiscernibility = await ctx.task(indiscernibilityTask, {
    informationSystem,
    attributes: systemAnalysis.conditionAttributes,
    outputDir
  });

  artifacts.push(...indiscernibility.artifacts);

  // ============================================================================
  // PHASE 3: APPROXIMATION COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing lower and upper approximations');
  const approximations = await ctx.task(approximationComputationTask, {
    informationSystem,
    indiscernibilityClasses: indiscernibility.equivalenceClasses,
    targetConcept,
    decisionAttribute,
    outputDir
  });

  artifacts.push(...approximations.artifacts);

  // ============================================================================
  // PHASE 4: BOUNDARY REGION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing boundary region');
  const boundaryAnalysis = await ctx.task(boundaryRegionTask, {
    lowerApproximation: approximations.lower,
    upperApproximation: approximations.upper,
    informationSystem,
    outputDir
  });

  artifacts.push(...boundaryAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: ROUGHNESS AND ACCURACY MEASURES
  // ============================================================================

  ctx.log('info', 'Phase 5: Computing roughness and accuracy measures');
  const roughnessMeasures = await ctx.task(roughnessMeasuresTask, {
    lowerApproximation: approximations.lower,
    upperApproximation: approximations.upper,
    targetConcept,
    informationSystem,
    outputDir
  });

  artifacts.push(...roughnessMeasures.artifacts);

  // ============================================================================
  // PHASE 6: ATTRIBUTE REDUCTION (OPTIONAL)
  // ============================================================================

  let reducts = { reducts: [], coreAttributes: [] };
  if (reductComputation) {
    ctx.log('info', 'Phase 6: Computing attribute reducts');
    reducts = await ctx.task(attributeReductionTask, {
      informationSystem,
      decisionAttribute,
      significanceThreshold,
      outputDir
    });
    artifacts.push(...reducts.artifacts);
  }

  // ============================================================================
  // PHASE 7: DECISION RULE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating decision rules');
  const decisionRules = await ctx.task(decisionRuleGenerationTask, {
    informationSystem,
    approximations,
    reducts: reducts.reducts,
    decisionAttribute,
    outputDir
  });

  artifacts.push(...decisionRules.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(roughSetQualityTask, {
    systemAnalysis,
    approximations,
    roughnessMeasures,
    reducts,
    decisionRules,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review rough set results
  await ctx.breakpoint({
    question: `Rough set analysis complete. Accuracy: ${roughnessMeasures.accuracy.toFixed(3)}. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Review boundary region and reducts.'} Review results?`,
    title: 'Rough Set Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        objectsCount: systemAnalysis.objectCount,
        attributesCount: systemAnalysis.attributeCount,
        lowerApproximationSize: approximations.lower.length,
        upperApproximationSize: approximations.upper.length,
        boundarySize: boundaryAnalysis.boundarySize,
        accuracy: roughnessMeasures.accuracy,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(roughSetReportTask, {
    systemAnalysis,
    indiscernibility,
    approximations,
    boundaryAnalysis,
    roughnessMeasures,
    reducts,
    decisionRules,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    lowerApproximation: approximations.lower,
    upperApproximation: approximations.upper,
    boundaryRegion: boundaryAnalysis.boundary,
    reducts: reducts.reducts,
    accuracy: roughnessMeasures.accuracy,
    roughness: roughnessMeasures.roughness,
    decisionRules: decisionRules.rules,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/rough-set-reasoning',
      timestamp: startTime,
      outputDir,
      targetConcept,
      reductComputation
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Information System Analysis
export const informationSystemAnalysisTask = defineTask('information-system-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze information system structure',
  agent: {
    name: 'information-system-agent',
    prompt: {
      role: 'rough set theory expert',
      task: 'Analyze the information system (decision table) structure',
      context: args,
      instructions: [
        'Parse information system: U (universe), A (attributes), V (values), f (information function)',
        'Identify condition attributes and decision attribute',
        'Count objects (rows) and attributes (columns)',
        'Analyze attribute value domains',
        'Identify missing values if any',
        'Check for inconsistent objects (same conditions, different decision)',
        'Compute basic statistics for attributes',
        'Validate information system format',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with objectCount (number), attributeCount (number), conditionAttributes (array), decisionAttribute (string), inconsistentObjects (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectCount', 'attributeCount', 'conditionAttributes', 'artifacts'],
      properties: {
        objectCount: { type: 'number' },
        attributeCount: { type: 'number' },
        conditionAttributes: { type: 'array', items: { type: 'string' } },
        decisionAttribute: { type: 'string' },
        attributeDomains: { type: 'object' },
        missingValues: { type: 'object' },
        inconsistentObjects: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'analysis']
}));

// Task 2: Indiscernibility Relation
export const indiscernibilityTask = defineTask('indiscernibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute indiscernibility relations',
  agent: {
    name: 'indiscernibility-agent',
    prompt: {
      role: 'equivalence relation specialist',
      task: 'Compute indiscernibility equivalence classes',
      context: args,
      instructions: [
        'Two objects are indiscernible if they have same values for all attributes in B',
        'Compute IND(B) = {(x,y) : forall a in B, a(x) = a(y)}',
        'Partition universe into equivalence classes [x]_B',
        'Compute equivalence classes for full attribute set',
        'Compute equivalence classes for subsets if needed',
        'Count number of equivalence classes',
        'Identify singleton classes (uniquely describable objects)',
        'Save equivalence classes to output directory'
      ],
      outputFormat: 'JSON with equivalenceClasses (array), classCount (number), singletonClasses (array), indiscernibilityMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['equivalenceClasses', 'classCount', 'artifacts'],
      properties: {
        equivalenceClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              classId: { type: 'string' },
              objects: { type: 'array' },
              representativeValues: { type: 'object' }
            }
          }
        },
        classCount: { type: 'number' },
        singletonClasses: { type: 'array' },
        indiscernibilityMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'indiscernibility']
}));

// Task 3: Approximation Computation
export const approximationComputationTask = defineTask('approximation-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute lower and upper approximations',
  agent: {
    name: 'approximation-agent',
    prompt: {
      role: 'rough set approximation specialist',
      task: 'Compute lower and upper approximations of the target concept',
      context: args,
      instructions: [
        'Lower approximation: B_(X) = {x : [x]_B subset X}',
        'Lower = union of equivalence classes entirely contained in X',
        'Upper approximation: B^(X) = {x : [x]_B intersection X != empty}',
        'Upper = union of equivalence classes overlapping with X',
        'Identify objects definitely in concept (lower)',
        'Identify objects possibly in concept (upper)',
        'Verify: lower subset target subset upper',
        'Save approximations to output directory'
      ],
      outputFormat: 'JSON with lower (array), upper (array), definitelyIn (array), possiblyIn (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lower', 'upper', 'artifacts'],
      properties: {
        lower: { type: 'array', items: { type: 'string' } },
        upper: { type: 'array', items: { type: 'string' } },
        definitelyIn: { type: 'array', items: { type: 'string' } },
        possiblyIn: { type: 'array', items: { type: 'string' } },
        definitelyOut: { type: 'array', items: { type: 'string' } },
        classesInLower: { type: 'array' },
        classesInUpper: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'approximation']
}));

// Task 4: Boundary Region Analysis
export const boundaryRegionTask = defineTask('boundary-region', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze boundary region',
  agent: {
    name: 'boundary-region-agent',
    prompt: {
      role: 'vagueness analysis specialist',
      task: 'Analyze the boundary region representing vagueness',
      context: args,
      instructions: [
        'Boundary region: BN_B(X) = B^(X) - B_(X)',
        'Boundary = objects that cannot be classified with certainty',
        'Analyze why objects are in boundary (which attributes cause ambiguity)',
        'Identify equivalence classes straddling the boundary',
        'Assess severity of boundary (size relative to concept)',
        'Suggest attributes that could resolve boundary',
        'Document boundary characteristics',
        'Save boundary analysis to output directory'
      ],
      outputFormat: 'JSON with boundary (array), boundarySize (number), boundaryClasses (array), ambiguityAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundary', 'boundarySize', 'artifacts'],
      properties: {
        boundary: { type: 'array', items: { type: 'string' } },
        boundarySize: { type: 'number' },
        boundaryClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              classId: { type: 'string' },
              inConcept: { type: 'number' },
              notInConcept: { type: 'number' }
            }
          }
        },
        ambiguityAnalysis: {
          type: 'object',
          properties: {
            primaryCauses: { type: 'array' },
            resolutionSuggestions: { type: 'array' }
          }
        },
        boundaryProportion: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'boundary']
}));

// Task 5: Roughness Measures
export const roughnessMeasuresTask = defineTask('roughness-measures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute roughness and accuracy measures',
  agent: {
    name: 'roughness-measures-agent',
    prompt: {
      role: 'rough set metrics specialist',
      task: 'Compute roughness and accuracy measures for the approximation',
      context: args,
      instructions: [
        'Accuracy of approximation: alpha_B(X) = |B_(X)| / |B^(X)|',
        'Roughness: rho_B(X) = 1 - alpha_B(X)',
        'Quality of classification: gamma_B(D) = |POS_B(D)| / |U|',
        'Dependency degree: measures how much decision depends on conditions',
        'Compute measures for target concept',
        'Interpret: alpha=1 means concept is crisp (definable)',
        'Interpret: alpha<1 means concept is rough (vague)',
        'Save measures to output directory'
      ],
      outputFormat: 'JSON with accuracy (number), roughness (number), qualityOfClassification (number), dependencyDegree (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accuracy', 'roughness', 'artifacts'],
      properties: {
        accuracy: { type: 'number' },
        roughness: { type: 'number' },
        qualityOfClassification: { type: 'number' },
        dependencyDegree: { type: 'number' },
        positiveRegionSize: { type: 'number' },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'measures']
}));

// Task 6: Attribute Reduction
export const attributeReductionTask = defineTask('attribute-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute attribute reducts',
  agent: {
    name: 'attribute-reduction-agent',
    prompt: {
      role: 'feature selection specialist',
      task: 'Compute reducts (minimal attribute sets preserving classification)',
      context: args,
      instructions: [
        'Reduct: minimal subset R of attributes such that IND(R) = IND(C)',
        'Core: intersection of all reducts (essential attributes)',
        'Compute all reducts or representative reducts',
        'Verify each reduct maintains positive region',
        'Compute attribute significance',
        'Identify dispensable vs indispensable attributes',
        'Rank attributes by importance',
        'Save reducts to output directory'
      ],
      outputFormat: 'JSON with reducts (array), coreAttributes (array), attributeSignificance (object), dispensableAttributes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reducts', 'coreAttributes', 'artifacts'],
      properties: {
        reducts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attributes: { type: 'array' },
              size: { type: 'number' }
            }
          }
        },
        coreAttributes: { type: 'array', items: { type: 'string' } },
        attributeSignificance: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        dispensableAttributes: { type: 'array', items: { type: 'string' } },
        minimalReductSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'reduction']
}));

// Task 7: Decision Rule Generation
export const decisionRuleGenerationTask = defineTask('decision-rule-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate decision rules from rough set analysis',
  agent: {
    name: 'decision-rule-agent',
    prompt: {
      role: 'rule induction specialist',
      task: 'Generate decision rules from rough set approximations',
      context: args,
      instructions: [
        'Generate certain rules from lower approximation',
        'Generate possible rules from boundary region',
        'Use reduct attributes for minimal rules',
        'Compute rule support (how many objects)',
        'Compute rule confidence (accuracy)',
        'Generate rules in IF-THEN format',
        'Simplify rules by removing redundant conditions',
        'Validate rules against information system',
        'Save decision rules to output directory'
      ],
      outputFormat: 'JSON with rules (array), certainRules (array), possibleRules (array), ruleStatistics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'certainRules', 'possibleRules', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              conditions: { type: 'object' },
              decision: { type: 'string' },
              support: { type: 'number' },
              confidence: { type: 'number' },
              type: { type: 'string' }
            }
          }
        },
        certainRules: { type: 'array' },
        possibleRules: { type: 'array' },
        ruleStatistics: {
          type: 'object',
          properties: {
            totalRules: { type: 'number' },
            averageConditions: { type: 'number' },
            averageSupport: { type: 'number' },
            averageConfidence: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'rough-set', 'rules']
}));

// Task 8: Quality Assessment
export const roughSetQualityTask = defineTask('rough-set-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of rough set analysis',
  agent: {
    name: 'rough-set-quality-agent',
    prompt: {
      role: 'rough set methodology reviewer',
      task: 'Assess quality and validity of rough set analysis',
      context: args,
      instructions: [
        'Evaluate information system analysis (weight: 15%)',
        'Assess indiscernibility computation (weight: 20%)',
        'Check approximation correctness (weight: 25%)',
        'Evaluate roughness measures (weight: 15%)',
        'Assess reduct quality if computed (weight: 15%)',
        'Evaluate decision rule quality (weight: 10%)',
        'Verify mathematical correctness',
        'Check for computational completeness',
        'Calculate weighted overall quality score (0-100)',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number), componentScores (object), issues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            informationSystem: { type: 'number' },
            indiscernibility: { type: 'number' },
            approximations: { type: 'number' },
            roughnessMeasures: { type: 'number' },
            reducts: { type: 'number' },
            decisionRules: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'quality']
}));

// Task 9: Report Generation
export const roughSetReportTask = defineTask('rough-set-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate rough set analysis report',
  agent: {
    name: 'rough-set-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on rough set reasoning',
      context: args,
      instructions: [
        'Create executive summary of analysis results',
        'Document information system structure',
        'Present indiscernibility classes',
        'Show lower and upper approximations',
        'Analyze boundary region',
        'Present roughness and accuracy measures',
        'List reducts and core attributes',
        'Present decision rules',
        'Include visualizations (Venn diagrams, etc.)',
        'List assumptions and limitations',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'rough-set', 'reporting']
}));
