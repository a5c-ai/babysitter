/**
 * @process scientific-discovery/default-typicality-reasoning
 * @description Use "typically" rules that can be overridden by more specific information
 * @inputs { typicalityRules: array, specificExceptions: array, instances: array, queries: array, outputDir: string }
 * @outputs { success: boolean, conclusions: array, exceptionHandling: object, typicalityAssessments: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    typicalityRules = [],
    specificExceptions = [],
    instances = [],
    queries = [],
    outputDir = 'default-typicality-output',
    inheritanceStrategy = 'skeptical'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Default/Typicality Reasoning Process');

  // ============================================================================
  // PHASE 1: TYPICALITY RULE FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing typicality rules');
  const ruleFormalization = await ctx.task(typicalityFormalizationTask, {
    typicalityRules,
    outputDir
  });

  artifacts.push(...ruleFormalization.artifacts);

  // ============================================================================
  // PHASE 2: EXCEPTION HIERARCHY CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Constructing exception hierarchy');
  const exceptionHierarchy = await ctx.task(exceptionHierarchyTask, {
    typicalityRules: ruleFormalization.rules,
    specificExceptions,
    outputDir
  });

  artifacts.push(...exceptionHierarchy.artifacts);

  // ============================================================================
  // PHASE 3: SPECIFICITY ORDERING
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing specificity ordering');
  const specificityOrdering = await ctx.task(specificityOrderingTask, {
    rules: ruleFormalization.rules,
    exceptions: exceptionHierarchy.exceptions,
    outputDir
  });

  artifacts.push(...specificityOrdering.artifacts);

  // ============================================================================
  // PHASE 4: INSTANCE CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Classifying instances');
  const classification = await ctx.task(instanceClassificationTask, {
    instances,
    rules: ruleFormalization.rules,
    specificityOrder: specificityOrdering.order,
    outputDir
  });

  artifacts.push(...classification.artifacts);

  // ============================================================================
  // PHASE 5: DEFAULT INHERITANCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Performing default inheritance');
  const inheritance = await ctx.task(defaultInheritanceTask, {
    classification: classification.classifications,
    rules: ruleFormalization.rules,
    exceptions: exceptionHierarchy.exceptions,
    inheritanceStrategy,
    outputDir
  });

  artifacts.push(...inheritance.artifacts);

  // ============================================================================
  // PHASE 6: EXCEPTION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Handling exceptions');
  const exceptionHandling = await ctx.task(exceptionHandlingTask, {
    inheritedProperties: inheritance.properties,
    specificExceptions,
    instances,
    outputDir
  });

  artifacts.push(...exceptionHandling.artifacts);

  // ============================================================================
  // PHASE 7: QUERY ANSWERING
  // ============================================================================

  ctx.log('info', 'Phase 7: Answering queries');
  const queryAnswering = await ctx.task(typicalityQueryTask, {
    queries,
    conclusions: exceptionHandling.conclusions,
    rules: ruleFormalization.rules,
    outputDir
  });

  artifacts.push(...queryAnswering.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(typicalityQualityTask, {
    ruleFormalization,
    exceptionHierarchy,
    classification,
    inheritance,
    exceptionHandling,
    queryAnswering,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review typicality reasoning results
  await ctx.breakpoint({
    question: `Default/typicality reasoning complete. Quality score: ${qualityScore.overallScore}/100. Handled ${exceptionHandling.exceptionsApplied} exceptions. ${qualityMet ? 'Quality meets standards!' : 'Review specificity ordering and exceptions.'} Review results?`,
    title: 'Default/Typicality Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        rulesCount: typicalityRules.length,
        exceptionsCount: specificExceptions.length,
        instancesCount: instances.length,
        queriesAnswered: queryAnswering.answered.length,
        exceptionsApplied: exceptionHandling.exceptionsApplied,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(typicalityReportTask, {
    ruleFormalization,
    exceptionHierarchy,
    specificityOrdering,
    classification,
    inheritance,
    exceptionHandling,
    queryAnswering,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    conclusions: queryAnswering.conclusions,
    exceptionHandling: exceptionHandling.summary,
    typicalityAssessments: inheritance.assessments,
    queryAnswers: queryAnswering.answers,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/default-typicality-reasoning',
      timestamp: startTime,
      outputDir,
      inheritanceStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Typicality Rule Formalization
export const typicalityFormalizationTask = defineTask('typicality-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize typicality rules',
  agent: {
    name: 'typicality-formalization-agent',
    prompt: {
      role: 'default reasoning specialist',
      task: 'Formalize typicality rules in a structured format',
      context: args,
      instructions: [
        'Parse rules of form: "Typically, if X then Y" or "Xs are typically Y"',
        'Formalize as default rules: X |~ Y (X normally implies Y)',
        'Identify class membership typicalities',
        'Identify property inheritance typicalities',
        'Extract preconditions and conclusions',
        'Identify rule strength/confidence if specified',
        'Validate rule consistency',
        'Save formalized rules to output directory'
      ],
      outputFormat: 'JSON with rules (array), ruleTypes (object), ruleStrengths (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'ruleTypes', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              antecedent: { type: 'string' },
              consequent: { type: 'string' },
              type: { type: 'string' },
              strength: { type: 'number' }
            }
          }
        },
        ruleTypes: {
          type: 'object',
          properties: {
            classMembership: { type: 'number' },
            propertyInheritance: { type: 'number' },
            conditional: { type: 'number' }
          }
        },
        ruleStrengths: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'formalization']
}));

// Task 2: Exception Hierarchy Construction
export const exceptionHierarchyTask = defineTask('exception-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct exception hierarchy',
  agent: {
    name: 'exception-hierarchy-agent',
    prompt: {
      role: 'exception handling specialist',
      task: 'Build hierarchy of exceptions to typicality rules',
      context: args,
      instructions: [
        'Identify exceptions to each typicality rule',
        'Build exception hierarchy (exceptions to exceptions)',
        'Link exceptions to the rules they override',
        'Identify conflicting exceptions',
        'Determine exception scope (which instances affected)',
        'Handle named exceptions vs anonymous exceptions',
        'Create exception inheritance structure',
        'Save exception hierarchy to output directory'
      ],
      outputFormat: 'JSON with exceptions (array), hierarchy (object), conflictingExceptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['exceptions', 'hierarchy', 'artifacts'],
      properties: {
        exceptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              overrides: { type: 'string' },
              condition: { type: 'string' },
              consequence: { type: 'string' }
            }
          }
        },
        hierarchy: {
          type: 'object',
          properties: {
            levels: { type: 'number' },
            structure: { type: 'object' }
          }
        },
        conflictingExceptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              exceptions: { type: 'array' },
              conflict: { type: 'string' }
            }
          }
        },
        exceptionCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'exceptions']
}));

// Task 3: Specificity Ordering
export const specificityOrderingTask = defineTask('specificity-ordering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute specificity ordering',
  agent: {
    name: 'specificity-ordering-agent',
    prompt: {
      role: 'specificity analysis specialist',
      task: 'Compute specificity ordering between rules',
      context: args,
      instructions: [
        'More specific rules override more general rules',
        'Rule R1 is more specific than R2 if R1\'s antecedent implies R2\'s',
        'Build partial order of rules by specificity',
        'Identify maximally specific applicable rules',
        'Handle incomparable rules (neither more specific)',
        'Resolve conflicts using specificity',
        'Document specificity relationships',
        'Save specificity order to output directory'
      ],
      outputFormat: 'JSON with order (object), partialOrder (array), maximallySpecific (object), incomparablePairs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['order', 'partialOrder', 'artifacts'],
      properties: {
        order: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        partialOrder: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moreSpecific: { type: 'string' },
              lessSpecific: { type: 'string' }
            }
          }
        },
        maximallySpecific: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        incomparablePairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule1: { type: 'string' },
              rule2: { type: 'string' }
            }
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
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'specificity']
}));

// Task 4: Instance Classification
export const instanceClassificationTask = defineTask('instance-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify instances against typicality rules',
  agent: {
    name: 'instance-classification-agent',
    prompt: {
      role: 'instance classification specialist',
      task: 'Classify each instance according to typicality rules',
      context: args,
      instructions: [
        'For each instance, identify applicable typicality rules',
        'Check rule antecedent satisfaction',
        'Classify instance into categories',
        'Identify typical vs atypical instances',
        'Handle instances satisfying multiple rule antecedents',
        'Track which rules apply to which instances',
        'Compute typicality score for each instance',
        'Save classifications to output directory'
      ],
      outputFormat: 'JSON with classifications (object), typicalInstances (array), atypicalInstances (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['classifications', 'artifacts'],
      properties: {
        classifications: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              categories: { type: 'array' },
              applicableRules: { type: 'array' },
              typicalityScore: { type: 'number' }
            }
          }
        },
        typicalInstances: { type: 'array', items: { type: 'string' } },
        atypicalInstances: { type: 'array', items: { type: 'string' } },
        unclassified: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'classification']
}));

// Task 5: Default Inheritance
export const defaultInheritanceTask = defineTask('default-inheritance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform default inheritance',
  agent: {
    name: 'default-inheritance-agent',
    prompt: {
      role: 'inheritance reasoning specialist',
      task: 'Inherit properties through default rules',
      context: args,
      instructions: [
        'Apply inheritance along class hierarchies',
        'Use skeptical or credulous inheritance as specified',
        'Skeptical: inherit only if unambiguous path',
        'Credulous: inherit if any supporting path exists',
        'Handle multiple inheritance with potentially conflicting defaults',
        'Track inheritance chains',
        'Mark inherited vs directly asserted properties',
        'Save inherited properties to output directory'
      ],
      outputFormat: 'JSON with properties (object), assessments (object), inheritanceChains (array), conflicts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'assessments', 'artifacts'],
      properties: {
        properties: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              inherited: { type: 'array' },
              direct: { type: 'array' }
            }
          }
        },
        assessments: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              typicality: { type: 'number' },
              inheritedFrom: { type: 'array' }
            }
          }
        },
        inheritanceChains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instance: { type: 'string' },
              property: { type: 'string' },
              chain: { type: 'array' }
            }
          }
        },
        conflicts: { type: 'array' },
        strategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'inheritance']
}));

// Task 6: Exception Handling
export const exceptionHandlingTask = defineTask('exception-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Handle exceptions to defaults',
  agent: {
    name: 'exception-handling-agent',
    prompt: {
      role: 'exception processing specialist',
      task: 'Apply exceptions to override default conclusions',
      context: args,
      instructions: [
        'For each instance, check if any exceptions apply',
        'Override inherited properties with exception conclusions',
        'Apply exception hierarchy (exceptions to exceptions)',
        'Track which defaults were overridden by which exceptions',
        'Handle conflicting exceptions using specificity',
        'Compute final conclusions after exception handling',
        'Document exception application',
        'Save exception handling results to output directory'
      ],
      outputFormat: 'JSON with conclusions (array), summary (object), exceptionsApplied (number), overriddenDefaults (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusions', 'summary', 'exceptionsApplied', 'artifacts'],
      properties: {
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instance: { type: 'string' },
              property: { type: 'string' },
              value: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalConclusions: { type: 'number' },
            fromDefaults: { type: 'number' },
            fromExceptions: { type: 'number' }
          }
        },
        exceptionsApplied: { type: 'number' },
        overriddenDefaults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              default: { type: 'string' },
              overriddenBy: { type: 'string' },
              instance: { type: 'string' }
            }
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
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'exception-handling']
}));

// Task 7: Query Answering
export const typicalityQueryTask = defineTask('typicality-query', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Answer queries about typicality',
  agent: {
    name: 'typicality-query-agent',
    prompt: {
      role: 'query answering specialist',
      task: 'Answer queries using typicality-based reasoning',
      context: args,
      instructions: [
        'Parse queries about instance properties',
        'Look up conclusions for queried instances',
        'Handle queries about typical vs exceptional behavior',
        'Explain reasoning behind answers',
        'Handle queries about unknown instances (use defaults)',
        'Provide confidence in answers',
        'Handle queries that cannot be answered',
        'Save query answers to output directory'
      ],
      outputFormat: 'JSON with conclusions (array), answers (object), answered (array), unanswered (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusions', 'answers', 'answered', 'artifacts'],
      properties: {
        conclusions: { type: 'array' },
        answers: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              confidence: { type: 'string' },
              reasoning: { type: 'string' }
            }
          }
        },
        answered: { type: 'array', items: { type: 'string' } },
        unanswered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              reason: { type: 'string' }
            }
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
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'query']
}));

// Task 8: Quality Assessment
export const typicalityQualityTask = defineTask('typicality-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of typicality reasoning',
  agent: {
    name: 'typicality-quality-agent',
    prompt: {
      role: 'default reasoning methodology reviewer',
      task: 'Assess quality and validity of typicality-based reasoning',
      context: args,
      instructions: [
        'Evaluate rule formalization quality (weight: 20%)',
        'Assess exception hierarchy completeness (weight: 20%)',
        'Check specificity ordering correctness (weight: 15%)',
        'Evaluate inheritance reasoning (weight: 20%)',
        'Assess exception handling (weight: 15%)',
        'Evaluate query answering quality (weight: 10%)',
        'Verify logical consistency',
        'Check for proper specificity handling',
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
            ruleFormalization: { type: 'number' },
            exceptionHierarchy: { type: 'number' },
            specificityOrdering: { type: 'number' },
            inheritance: { type: 'number' },
            exceptionHandling: { type: 'number' },
            queryAnswering: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'quality']
}));

// Task 9: Report Generation
export const typicalityReportTask = defineTask('typicality-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate typicality reasoning report',
  agent: {
    name: 'typicality-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on default/typicality reasoning',
      context: args,
      instructions: [
        'Create executive summary of reasoning results',
        'Document typicality rules and their formalization',
        'Present exception hierarchy',
        'Show specificity ordering',
        'Explain instance classifications',
        'Describe inheritance reasoning',
        'Document exception handling',
        'Present query answers with explanations',
        'Include inheritance diagrams',
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
  labels: ['agent', 'scientific-discovery', 'default-typicality', 'reporting']
}));
