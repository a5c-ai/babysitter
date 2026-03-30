/**
 * @process scientific-discovery/non-monotonic-reasoning
 * @description Adding information can retract previous conclusions - reasoning with defeasible inference
 * @inputs { knowledgeBase: array, newInformation: array, priorities: object, skepticalMode: boolean, outputDir: string }
 * @outputs { success: boolean, conclusions: array, retractedConclusions: array, extensionAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeBase = [],
    newInformation = [],
    priorities = {},
    skepticalMode = true,
    outputDir = 'non-monotonic-output',
    reasoningSemantics = 'stable-model'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Non-Monotonic Reasoning Process');

  // ============================================================================
  // PHASE 1: KNOWLEDGE BASE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing knowledge base structure');
  const kbAnalysis = await ctx.task(knowledgeBaseAnalysisTask, {
    knowledgeBase,
    outputDir
  });

  artifacts.push(...kbAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DEFAULT RULE EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Extracting and formalizing default rules');
  const defaultExtraction = await ctx.task(defaultExtractionTask, {
    knowledgeBase,
    priorities,
    outputDir
  });

  artifacts.push(...defaultExtraction.artifacts);

  // ============================================================================
  // PHASE 3: INITIAL EXTENSION COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing initial extensions');
  const initialExtensions = await ctx.task(extensionComputationTask, {
    knowledgeBase,
    defaults: defaultExtraction.defaults,
    reasoningSemantics,
    outputDir
  });

  artifacts.push(...initialExtensions.artifacts);

  // ============================================================================
  // PHASE 4: NEW INFORMATION INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Integrating new information');
  const integration = await ctx.task(informationIntegrationTask, {
    currentExtensions: initialExtensions.extensions,
    newInformation,
    knowledgeBase,
    defaults: defaultExtraction.defaults,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 5: BELIEF REVISION
  // ============================================================================

  ctx.log('info', 'Phase 5: Revising beliefs based on new information');
  const beliefRevision = await ctx.task(beliefRevisionTask, {
    currentBeliefs: integration.currentBeliefs,
    conflicts: integration.conflicts,
    priorities,
    outputDir
  });

  artifacts.push(...beliefRevision.artifacts);

  // ============================================================================
  // PHASE 6: RETRACTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing retractions');
  const retractionAnalysis = await ctx.task(retractionAnalysisTask, {
    originalConclusions: initialExtensions.conclusions,
    revisedConclusions: beliefRevision.conclusions,
    outputDir
  });

  artifacts.push(...retractionAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: SKEPTICAL/CREDULOUS INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing inference under selected semantics');
  const finalInference = await ctx.task(skepticalCredulouTask, {
    extensions: beliefRevision.extensions,
    skepticalMode,
    outputDir
  });

  artifacts.push(...finalInference.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(nonMonotonicQualityTask, {
    kbAnalysis,
    defaultExtraction,
    beliefRevision,
    retractionAnalysis,
    finalInference,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review non-monotonic reasoning results
  await ctx.breakpoint({
    question: `Non-monotonic reasoning complete. Quality score: ${qualityScore.overallScore}/100. Retracted ${retractionAnalysis.retractedCount} conclusions. ${qualityMet ? 'Quality meets standards!' : 'Review defaults and priorities.'} Review results?`,
    title: 'Non-Monotonic Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        knowledgeBaseSize: kbAnalysis.size,
        defaultsCount: defaultExtraction.defaults.length,
        extensionsCount: beliefRevision.extensions.length,
        conclusionsCount: finalInference.conclusions.length,
        retractedCount: retractionAnalysis.retractedCount,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(nonMonotonicReportTask, {
    kbAnalysis,
    defaultExtraction,
    initialExtensions,
    beliefRevision,
    retractionAnalysis,
    finalInference,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    conclusions: finalInference.conclusions,
    retractedConclusions: retractionAnalysis.retracted,
    extensionAnalysis: {
      extensions: beliefRevision.extensions,
      extensionCount: beliefRevision.extensions.length,
      semantics: reasoningSemantics
    },
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/non-monotonic-reasoning',
      timestamp: startTime,
      outputDir,
      reasoningSemantics,
      skepticalMode
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Knowledge Base Analysis
export const knowledgeBaseAnalysisTask = defineTask('kb-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge base structure',
  agent: {
    name: 'kb-analysis-agent',
    prompt: {
      role: 'knowledge representation expert',
      task: 'Analyze the structure of the knowledge base for non-monotonic reasoning',
      context: args,
      instructions: [
        'Parse knowledge base statements',
        'Identify strict rules (classical logic)',
        'Identify defeasible rules (defaults)',
        'Identify facts (ground assertions)',
        'Identify exceptions and overrides',
        'Build dependency graph between rules',
        'Identify potential conflicts',
        'Count elements by type',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with size (number), strictRules (array), defeasibleRules (array), facts (array), conflicts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['size', 'strictRules', 'defeasibleRules', 'facts', 'artifacts'],
      properties: {
        size: { type: 'number' },
        strictRules: { type: 'array' },
        defeasibleRules: { type: 'array' },
        facts: { type: 'array' },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rules: { type: 'array' },
              type: { type: 'string' }
            }
          }
        },
        dependencyGraph: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'analysis']
}));

// Task 2: Default Rule Extraction
export const defaultExtractionTask = defineTask('default-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract and formalize default rules',
  agent: {
    name: 'default-extraction-agent',
    prompt: {
      role: 'default logic specialist',
      task: 'Extract and formalize default rules from knowledge base',
      context: args,
      instructions: [
        'Format defaults as: prerequisite : justification / consequent',
        'Identify normal defaults (prerequisite = justification)',
        'Identify semi-normal defaults',
        'Extract priorities between defaults',
        'Handle specificity (more specific defaults override general)',
        'Identify supernormal defaults (always applicable)',
        'Validate default syntax and semantics',
        'Save defaults to output directory'
      ],
      outputFormat: 'JSON with defaults (array), priorities (object), defaultTypes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['defaults', 'priorities', 'artifacts'],
      properties: {
        defaults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              prerequisite: { type: 'string' },
              justification: { type: 'array' },
              consequent: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        priorities: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        defaultTypes: {
          type: 'object',
          properties: {
            normal: { type: 'number' },
            semiNormal: { type: 'number' },
            supernormal: { type: 'number' }
          }
        },
        specificityOrder: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'defaults']
}));

// Task 3: Extension Computation
export const extensionComputationTask = defineTask('extension-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute extensions of default theory',
  agent: {
    name: 'extension-computation-agent',
    prompt: {
      role: 'default logic computation specialist',
      task: 'Compute extensions (consistent belief sets) of the default theory',
      context: args,
      instructions: [
        'Apply extension semantics based on reasoningSemantics:',
        '- Reiter extensions: fixed point of default application',
        '- Stable models: answer set semantics',
        '- Well-founded semantics',
        'Start with facts and strict rules',
        'Apply applicable defaults iteratively',
        'Check consistency after each default application',
        'Identify all extensions (may be multiple)',
        'Handle no-extension case',
        'Save extensions to output directory'
      ],
      outputFormat: 'JSON with extensions (array), conclusions (array), extensionCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['extensions', 'conclusions', 'artifacts'],
      properties: {
        extensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              beliefs: { type: 'array' },
              appliedDefaults: { type: 'array' }
            }
          }
        },
        conclusions: { type: 'array', items: { type: 'string' } },
        extensionCount: { type: 'number' },
        semantics: { type: 'string' },
        noExtension: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'extensions']
}));

// Task 4: Information Integration
export const informationIntegrationTask = defineTask('information-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate new information',
  agent: {
    name: 'information-integration-agent',
    prompt: {
      role: 'belief update specialist',
      task: 'Integrate new information into existing belief state',
      context: args,
      instructions: [
        'Add new facts to knowledge base',
        'Check consistency with existing beliefs',
        'Identify conflicts with current conclusions',
        'Identify defaults whose prerequisites are now satisfied',
        'Identify defaults whose justifications are now violated',
        'Track which beliefs are affected by new information',
        'Prepare for belief revision',
        'Save integration results to output directory'
      ],
      outputFormat: 'JSON with currentBeliefs (array), conflicts (array), newlyApplicableDefaults (array), violatedJustifications (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentBeliefs', 'conflicts', 'artifacts'],
      properties: {
        currentBeliefs: { type: 'array', items: { type: 'string' } },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              newInfo: { type: 'string' },
              conflictsWith: { type: 'array' }
            }
          }
        },
        newlyApplicableDefaults: { type: 'array' },
        violatedJustifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              default: { type: 'string' },
              violatedBy: { type: 'string' }
            }
          }
        },
        affectedBeliefs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'integration']
}));

// Task 5: Belief Revision
export const beliefRevisionTask = defineTask('belief-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise beliefs based on new information',
  agent: {
    name: 'belief-revision-agent',
    prompt: {
      role: 'belief revision specialist',
      task: 'Revise belief state to accommodate new information',
      context: args,
      instructions: [
        'Apply AGM-style revision or prioritized base revision',
        'Resolve conflicts using priorities',
        'Retract beliefs that conflict with certain new information',
        'Retract default conclusions whose justifications are violated',
        'Recompute extensions with updated knowledge base',
        'Minimize belief change (principle of minimal mutilation)',
        'Track all retractions and additions',
        'Save revised beliefs to output directory'
      ],
      outputFormat: 'JSON with conclusions (array), extensions (array), retractions (array), additions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusions', 'extensions', 'artifacts'],
      properties: {
        conclusions: { type: 'array', items: { type: 'string' } },
        extensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              beliefs: { type: 'array' }
            }
          }
        },
        retractions: { type: 'array', items: { type: 'string' } },
        additions: { type: 'array', items: { type: 'string' } },
        revisionMethod: { type: 'string' },
        beliefChangeSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'revision']
}));

// Task 6: Retraction Analysis
export const retractionAnalysisTask = defineTask('retraction-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze retractions',
  agent: {
    name: 'retraction-analysis-agent',
    prompt: {
      role: 'retraction analysis specialist',
      task: 'Analyze which conclusions were retracted and why',
      context: args,
      instructions: [
        'Compare original and revised conclusions',
        'Identify retracted conclusions',
        'Explain why each conclusion was retracted',
        'Classify retractions: conflict-based, specificity-based, justification-violation',
        'Identify cascade retractions (retractions causing other retractions)',
        'Assess retraction impact',
        'Document the non-monotonic behavior',
        'Save retraction analysis to output directory'
      ],
      outputFormat: 'JSON with retracted (array), retractedCount (number), retractionReasons (object), cascades (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['retracted', 'retractedCount', 'artifacts'],
      properties: {
        retracted: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              reason: { type: 'string' },
              causedBy: { type: 'string' }
            }
          }
        },
        retractedCount: { type: 'number' },
        retractionReasons: {
          type: 'object',
          properties: {
            conflictBased: { type: 'number' },
            specificityBased: { type: 'number' },
            justificationViolation: { type: 'number' }
          }
        },
        cascades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              cascadedRetractions: { type: 'array' }
            }
          }
        },
        impactAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'retraction']
}));

// Task 7: Skeptical/Credulous Inference
export const skepticalCredulouTask = defineTask('skeptical-credulous', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform skeptical or credulous inference',
  agent: {
    name: 'inference-mode-agent',
    prompt: {
      role: 'non-monotonic inference specialist',
      task: 'Compute final conclusions under skeptical or credulous semantics',
      context: args,
      instructions: [
        'Skeptical: conclusion holds if in ALL extensions',
        'Credulous: conclusion holds if in SOME extension',
        'For skeptical: compute intersection of all extensions',
        'For credulous: compute union of all extensions',
        'Mark conclusions by inference mode',
        'Identify conclusions in only some extensions',
        'Provide confidence based on extension coverage',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with conclusions (array), inferenceMode (string), extensionCoverage (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusions', 'inferenceMode', 'artifacts'],
      properties: {
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              status: { type: 'string' },
              extensionCount: { type: 'number' }
            }
          }
        },
        inferenceMode: { type: 'string' },
        extensionCoverage: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        skepticalConclusions: { type: 'array' },
        credulousOnlyConclusions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'inference']
}));

// Task 8: Quality Assessment
export const nonMonotonicQualityTask = defineTask('non-monotonic-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of non-monotonic reasoning',
  agent: {
    name: 'non-monotonic-quality-agent',
    prompt: {
      role: 'non-monotonic reasoning methodology reviewer',
      task: 'Assess quality and validity of non-monotonic reasoning process',
      context: args,
      instructions: [
        'Evaluate knowledge base analysis (weight: 15%)',
        'Assess default extraction quality (weight: 20%)',
        'Check extension computation correctness (weight: 25%)',
        'Evaluate belief revision appropriateness (weight: 20%)',
        'Assess inference completeness (weight: 20%)',
        'Verify semantics are applied correctly',
        'Check for proper handling of priorities',
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
            kbAnalysis: { type: 'number' },
            defaultExtraction: { type: 'number' },
            extensionComputation: { type: 'number' },
            beliefRevision: { type: 'number' },
            inference: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'quality']
}));

// Task 9: Report Generation
export const nonMonotonicReportTask = defineTask('non-monotonic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate non-monotonic reasoning report',
  agent: {
    name: 'non-monotonic-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on non-monotonic reasoning',
      context: args,
      instructions: [
        'Create executive summary of reasoning results',
        'Document knowledge base structure',
        'Present default rules and priorities',
        'Show extension computation process',
        'Explain belief revision steps',
        'Analyze retractions and their causes',
        'Present final conclusions with confidence',
        'Include extension diagrams',
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
  labels: ['agent', 'scientific-discovery', 'non-monotonic', 'reporting']
}));
