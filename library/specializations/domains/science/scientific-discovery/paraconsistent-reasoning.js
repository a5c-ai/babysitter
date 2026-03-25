/**
 * @process scientific-discovery/paraconsistent-reasoning
 * @description Tolerate contradictions without deriving everything - reasoning with inconsistent information
 * @inputs { knowledgeBase: array, contradictions: array, queries: array, inferenceStrategy: string, outputDir: string }
 * @outputs { success: boolean, validConclusions: array, contradictionAnalysis: object, localizedInconsistencies: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeBase = [],
    contradictions = [],
    queries = [],
    inferenceStrategy = 'lpinference', // lpinference, relevant, lfoinference
    outputDir = 'paraconsistent-output',
    toleranceLevel = 'local' // local, global
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Paraconsistent Reasoning Process');

  // ============================================================================
  // PHASE 1: KNOWLEDGE BASE PARSING
  // ============================================================================

  ctx.log('info', 'Phase 1: Parsing knowledge base for contradictions');
  const kbParsing = await ctx.task(paraconsistentParsingTask, {
    knowledgeBase,
    contradictions,
    outputDir
  });

  artifacts.push(...kbParsing.artifacts);

  // ============================================================================
  // PHASE 2: CONTRADICTION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Detecting and localizing contradictions');
  const contradictionDetection = await ctx.task(contradictionDetectionTask, {
    knowledgeBase: kbParsing.parsedKB,
    explicitContradictions: contradictions,
    outputDir
  });

  artifacts.push(...contradictionDetection.artifacts);

  // ============================================================================
  // PHASE 3: PARACONSISTENT LOGIC SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up paraconsistent logic system');
  const logicSetup = await ctx.task(paraconsistentLogicSetupTask, {
    inferenceStrategy,
    toleranceLevel,
    outputDir
  });

  artifacts.push(...logicSetup.artifacts);

  // ============================================================================
  // PHASE 4: INCONSISTENCY LOCALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Localizing inconsistencies');
  const localization = await ctx.task(inconsistencyLocalizationTask, {
    contradictions: contradictionDetection.contradictions,
    knowledgeBase: kbParsing.parsedKB,
    outputDir
  });

  artifacts.push(...localization.artifacts);

  // ============================================================================
  // PHASE 5: CONSISTENT SUBBASE EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Extracting consistent subbases');
  const subbaseExtraction = await ctx.task(consistentSubbaseTask, {
    knowledgeBase: kbParsing.parsedKB,
    localizedInconsistencies: localization.localizedAreas,
    outputDir
  });

  artifacts.push(...subbaseExtraction.artifacts);

  // ============================================================================
  // PHASE 6: PARACONSISTENT INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Performing paraconsistent inference');
  const inference = await ctx.task(paraconsistentInferenceTask, {
    knowledgeBase: kbParsing.parsedKB,
    consistentSubbases: subbaseExtraction.subbases,
    logicSystem: logicSetup.system,
    queries,
    outputDir
  });

  artifacts.push(...inference.artifacts);

  // ============================================================================
  // PHASE 7: TRUTH VALUE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing truth values in paraconsistent logic');
  const truthAnalysis = await ctx.task(paraconsistentTruthTask, {
    conclusions: inference.conclusions,
    contradictions: contradictionDetection.contradictions,
    outputDir
  });

  artifacts.push(...truthAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(paraconsistentQualityTask, {
    kbParsing,
    contradictionDetection,
    localization,
    inference,
    truthAnalysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review paraconsistent reasoning results
  await ctx.breakpoint({
    question: `Paraconsistent reasoning complete. Quality score: ${qualityScore.overallScore}/100. Found ${contradictionDetection.contradictions.length} contradictions, derived ${inference.validConclusions.length} valid conclusions. ${qualityMet ? 'Quality meets standards!' : 'Review inconsistency handling.'} Review results?`,
    title: 'Paraconsistent Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        knowledgeBaseSize: kbParsing.parsedKB.length,
        contradictionsFound: contradictionDetection.contradictions.length,
        localizedAreas: localization.localizedAreas.length,
        validConclusions: inference.validConclusions.length,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(paraconsistentReportTask, {
    kbParsing,
    contradictionDetection,
    localization,
    subbaseExtraction,
    inference,
    truthAnalysis,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    validConclusions: inference.validConclusions,
    contradictionAnalysis: {
      contradictions: contradictionDetection.contradictions,
      localizedAreas: localization.localizedAreas
    },
    localizedInconsistencies: localization.localizedAreas,
    truthValueAssignments: truthAnalysis.assignments,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/paraconsistent-reasoning',
      timestamp: startTime,
      outputDir,
      inferenceStrategy,
      toleranceLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Paraconsistent Parsing
export const paraconsistentParsingTask = defineTask('paraconsistent-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse knowledge base for paraconsistent reasoning',
  agent: {
    name: 'paraconsistent-parsing-agent',
    prompt: {
      role: 'paraconsistent logic specialist',
      task: 'Parse the knowledge base for paraconsistent reasoning',
      context: args,
      instructions: [
        'Parse all statements in knowledge base',
        'Identify positive and negative literals',
        'Handle explicit contradictions (A and not-A)',
        'Distinguish strong negation from weak negation',
        'Identify implications and rules',
        'Build statement index for efficient lookup',
        'Validate syntax for paraconsistent logic',
        'Save parsed KB to output directory'
      ],
      outputFormat: 'JSON with parsedKB (array), literals (object), rules (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['parsedKB', 'literals', 'artifacts'],
      properties: {
        parsedKB: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              type: { type: 'string' },
              negated: { type: 'boolean' }
            }
          }
        },
        literals: {
          type: 'object',
          properties: {
            positive: { type: 'array' },
            negative: { type: 'array' }
          }
        },
        rules: { type: 'array' },
        statementCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'parsing']
}));

// Task 2: Contradiction Detection
export const contradictionDetectionTask = defineTask('contradiction-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect contradictions in knowledge base',
  agent: {
    name: 'contradiction-detection-agent',
    prompt: {
      role: 'inconsistency detection specialist',
      task: 'Detect all contradictions in the knowledge base',
      context: args,
      instructions: [
        'Find explicit contradictions: both A and not-A asserted',
        'Find implicit contradictions: A and rules imply not-A',
        'Classify contradictions by type and source',
        'Identify contradiction pairs',
        'Assess contradiction severity',
        'Build contradiction graph',
        'Document all detected contradictions',
        'Save contradiction analysis to output directory'
      ],
      outputFormat: 'JSON with contradictions (array), contradictionPairs (array), implicitContradictions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contradictions', 'contradictionPairs', 'artifacts'],
      properties: {
        contradictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              positive: { type: 'string' },
              negative: { type: 'string' },
              type: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        contradictionPairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement1: { type: 'string' },
              statement2: { type: 'string' }
            }
          }
        },
        implicitContradictions: { type: 'array' },
        contradictionCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'detection']
}));

// Task 3: Paraconsistent Logic Setup
export const paraconsistentLogicSetupTask = defineTask('paraconsistent-logic-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up paraconsistent logic system',
  agent: {
    name: 'paraconsistent-logic-agent',
    prompt: {
      role: 'paraconsistent logic expert',
      task: 'Configure the paraconsistent logic system',
      context: args,
      instructions: [
        'Configure based on inferenceStrategy:',
        '- LP (Logic of Paradox): three-valued, contradiction tolerated',
        '- Relevant logic: require relevance between premise and conclusion',
        '- LFI (Logics of Formal Inconsistency): explicit consistency operators',
        'Define truth values (T, F, B for "both")',
        'Define inference rules that dont explode from contradictions',
        'Configure tolerance level (local vs global)',
        'Document system properties',
        'Save logic system to output directory'
      ],
      outputFormat: 'JSON with system (object), truthValues (array), inferenceRules (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'truthValues', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            strategy: { type: 'string' },
            toleranceLevel: { type: 'string' },
            description: { type: 'string' }
          }
        },
        truthValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              meaning: { type: 'string' }
            }
          }
        },
        inferenceRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pattern: { type: 'string' },
              preserves: { type: 'string' }
            }
          }
        },
        explosionPrevented: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'setup']
}));

// Task 4: Inconsistency Localization
export const inconsistencyLocalizationTask = defineTask('inconsistency-localization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Localize inconsistencies',
  agent: {
    name: 'inconsistency-localization-agent',
    prompt: {
      role: 'inconsistency localization specialist',
      task: 'Localize inconsistencies to specific areas of knowledge base',
      context: args,
      instructions: [
        'Identify minimal inconsistent subsets (MIS)',
        'Group related contradictions together',
        'Determine scope of each inconsistency',
        'Identify statements involved in each inconsistency',
        'Create inconsistency clusters',
        'Determine which conclusions are affected by which inconsistencies',
        'Enable local reasoning in consistent parts',
        'Save localization to output directory'
      ],
      outputFormat: 'JSON with localizedAreas (array), minimalInconsistentSubsets (array), affectedStatements (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['localizedAreas', 'minimalInconsistentSubsets', 'artifacts'],
      properties: {
        localizedAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statements: { type: 'array' },
              contradictions: { type: 'array' },
              scope: { type: 'string' }
            }
          }
        },
        minimalInconsistentSubsets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statements: { type: 'array' },
              size: { type: 'number' }
            }
          }
        },
        affectedStatements: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        consistentRegions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'localization']
}));

// Task 5: Consistent Subbase Extraction
export const consistentSubbaseTask = defineTask('consistent-subbase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract consistent subbases',
  agent: {
    name: 'consistent-subbase-agent',
    prompt: {
      role: 'consistent subbase specialist',
      task: 'Extract maximal consistent subbases from knowledge base',
      context: args,
      instructions: [
        'Find maximal consistent subsets (MCS) of KB',
        'Each MCS is a largest subset without contradictions',
        'May have multiple MCS (alternative consistent views)',
        'Track which statements are in which MCS',
        'Identify statements in all MCS (core consistent part)',
        'Identify statements in no MCS (always problematic)',
        'Use for argumentation-based reasoning',
        'Save subbases to output directory'
      ],
      outputFormat: 'JSON with subbases (array), coreConsistent (array), alwaysProblematic (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['subbases', 'coreConsistent', 'artifacts'],
      properties: {
        subbases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statements: { type: 'array' },
              size: { type: 'number' }
            }
          }
        },
        coreConsistent: { type: 'array', items: { type: 'string' } },
        alwaysProblematic: { type: 'array', items: { type: 'string' } },
        subbaseCount: { type: 'number' },
        coreSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'subbase']
}));

// Task 6: Paraconsistent Inference
export const paraconsistentInferenceTask = defineTask('paraconsistent-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform paraconsistent inference',
  agent: {
    name: 'paraconsistent-inference-agent',
    prompt: {
      role: 'paraconsistent inference specialist',
      task: 'Perform inference that tolerates contradictions',
      context: args,
      instructions: [
        'Apply inference rules that dont cause explosion',
        'From A and not-A, do NOT derive arbitrary B',
        'Use logic system rules for valid inferences',
        'Answer queries using paraconsistent reasoning',
        'Track which conclusions depend on contradictions',
        'Identify "safe" conclusions (independent of contradictions)',
        'Provide confidence based on MCS support',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with conclusions (array), validConclusions (array), contradictionDependent (array), safeConclusions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusions', 'validConclusions', 'artifacts'],
      properties: {
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              derivation: { type: 'array' },
              dependsOnContradiction: { type: 'boolean' }
            }
          }
        },
        validConclusions: { type: 'array', items: { type: 'string' } },
        contradictionDependent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              dependsOn: { type: 'array' }
            }
          }
        },
        safeConclusions: { type: 'array', items: { type: 'string' } },
        queryAnswers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'inference']
}));

// Task 7: Paraconsistent Truth Analysis
export const paraconsistentTruthTask = defineTask('paraconsistent-truth', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze truth values in paraconsistent logic',
  agent: {
    name: 'paraconsistent-truth-agent',
    prompt: {
      role: 'paraconsistent truth value analyst',
      task: 'Analyze truth value assignments in paraconsistent logic',
      context: args,
      instructions: [
        'Assign three-valued truth: True, False, Both (contradictory)',
        'Statements in contradiction get value "Both"',
        'Propagate truth values through inference',
        'Identify statements with determinate truth',
        'Identify statements with indeterminate/contradictory truth',
        'Compute degrees of truth if using many-valued logic',
        'Document truth value assignments',
        'Save truth analysis to output directory'
      ],
      outputFormat: 'JSON with assignments (object), determinateStatements (array), contradictoryStatements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'determinateStatements', 'artifacts'],
      properties: {
        assignments: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              truthValue: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        determinateStatements: { type: 'array', items: { type: 'string' } },
        contradictoryStatements: { type: 'array', items: { type: 'string' } },
        unknownStatements: { type: 'array', items: { type: 'string' } },
        truthDistribution: {
          type: 'object',
          properties: {
            true: { type: 'number' },
            false: { type: 'number' },
            both: { type: 'number' },
            unknown: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'truth']
}));

// Task 8: Quality Assessment
export const paraconsistentQualityTask = defineTask('paraconsistent-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of paraconsistent reasoning',
  agent: {
    name: 'paraconsistent-quality-agent',
    prompt: {
      role: 'paraconsistent reasoning methodology reviewer',
      task: 'Assess quality and validity of paraconsistent reasoning process',
      context: args,
      instructions: [
        'Evaluate KB parsing quality (weight: 15%)',
        'Assess contradiction detection completeness (weight: 20%)',
        'Check inconsistency localization (weight: 20%)',
        'Evaluate paraconsistent inference validity (weight: 25%)',
        'Assess truth value analysis (weight: 20%)',
        'Verify explosion is prevented',
        'Check for proper contradiction handling',
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
            kbParsing: { type: 'number' },
            contradictionDetection: { type: 'number' },
            localization: { type: 'number' },
            inference: { type: 'number' },
            truthAnalysis: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'quality']
}));

// Task 9: Report Generation
export const paraconsistentReportTask = defineTask('paraconsistent-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate paraconsistent reasoning report',
  agent: {
    name: 'paraconsistent-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on paraconsistent reasoning',
      context: args,
      instructions: [
        'Create executive summary of reasoning results',
        'Document knowledge base and contradictions',
        'Explain paraconsistent logic system used',
        'Present contradiction localization',
        'Show consistent subbases',
        'Present valid conclusions',
        'Analyze truth value assignments',
        'Include contradiction visualizations',
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
  labels: ['agent', 'scientific-discovery', 'paraconsistent', 'reporting']
}));
