/**
 * @process scientific-discovery/defeasible-reasoning
 * @description Conclusions that can be defeated by counterevidence or stronger rules
 * @inputs { defeasibleRules: array, strictRules: array, facts: array, defeaters: array, outputDir: string }
 * @outputs { success: boolean, supportedConclusions: array, defeatedConclusions: array, argumentStructure: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    defeasibleRules = [],
    strictRules = [],
    facts = [],
    defeaters = [],
    outputDir = 'defeasible-reasoning-output',
    inferenceLevel = 'ambiguity-blocking'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Defeasible Reasoning Process');

  // ============================================================================
  // PHASE 1: RULE BASE FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing rule base');
  const ruleFormalization = await ctx.task(defeasibleRuleFormalizationTask, {
    defeasibleRules,
    strictRules,
    facts,
    outputDir
  });

  artifacts.push(...ruleFormalization.artifacts);

  // ============================================================================
  // PHASE 2: DEFEATER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying defeaters');
  const defeaterIdentification = await ctx.task(defeaterIdentificationTask, {
    rules: ruleFormalization.rules,
    defeaters,
    outputDir
  });

  artifacts.push(...defeaterIdentification.artifacts);

  // ============================================================================
  // PHASE 3: RULE PRIORITY DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Determining rule priorities');
  const priorityDetermination = await ctx.task(rulePriorityTask, {
    rules: ruleFormalization.rules,
    defeaters: defeaterIdentification.defeaters,
    outputDir
  });

  artifacts.push(...priorityDetermination.artifacts);

  // ============================================================================
  // PHASE 4: ARGUMENT CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Constructing arguments');
  const argumentConstruction = await ctx.task(argumentConstructionTask, {
    rules: ruleFormalization.rules,
    facts,
    priorities: priorityDetermination.priorities,
    outputDir
  });

  artifacts.push(...argumentConstruction.artifacts);

  // ============================================================================
  // PHASE 5: DEFEAT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing defeats between arguments');
  const defeatAnalysis = await ctx.task(defeatAnalysisTask, {
    arguments: argumentConstruction.arguments,
    defeaters: defeaterIdentification.defeaters,
    priorities: priorityDetermination.priorities,
    outputDir
  });

  artifacts.push(...defeatAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: WARRANTED CONCLUSION COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Computing warranted conclusions');
  const warrantedConclusions = await ctx.task(warrantedConclusionTask, {
    arguments: argumentConstruction.arguments,
    defeats: defeatAnalysis.defeats,
    inferenceLevel,
    outputDir
  });

  artifacts.push(...warrantedConclusions.artifacts);

  // ============================================================================
  // PHASE 7: DIALECTICAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing dialectical analysis');
  const dialecticalAnalysis = await ctx.task(dialecticalAnalysisTask, {
    arguments: argumentConstruction.arguments,
    defeats: defeatAnalysis.defeats,
    warranted: warrantedConclusions.warranted,
    outputDir
  });

  artifacts.push(...dialecticalAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(defeasibleQualityTask, {
    ruleFormalization,
    defeaterIdentification,
    argumentConstruction,
    defeatAnalysis,
    warrantedConclusions,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review defeasible reasoning results
  await ctx.breakpoint({
    question: `Defeasible reasoning complete. Quality score: ${qualityScore.overallScore}/100. Warranted: ${warrantedConclusions.warranted.length}, Defeated: ${warrantedConclusions.defeated.length}. ${qualityMet ? 'Quality meets standards!' : 'Review defeaters and priorities.'} Review results?`,
    title: 'Defeasible Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        defeasibleRulesCount: defeasibleRules.length,
        strictRulesCount: strictRules.length,
        argumentsConstructed: argumentConstruction.arguments.length,
        warrantedCount: warrantedConclusions.warranted.length,
        defeatedCount: warrantedConclusions.defeated.length,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(defeasibleReportTask, {
    ruleFormalization,
    defeaterIdentification,
    priorityDetermination,
    argumentConstruction,
    defeatAnalysis,
    warrantedConclusions,
    dialecticalAnalysis,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    supportedConclusions: warrantedConclusions.warranted,
    defeatedConclusions: warrantedConclusions.defeated,
    argumentStructure: dialecticalAnalysis.structure,
    defeatRelations: defeatAnalysis.defeats,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/defeasible-reasoning',
      timestamp: startTime,
      outputDir,
      inferenceLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Rule Base Formalization
export const defeasibleRuleFormalizationTask = defineTask('defeasible-rule-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize defeasible rule base',
  agent: {
    name: 'defeasible-rule-agent',
    prompt: {
      role: 'defeasible logic specialist',
      task: 'Formalize the defeasible rule base',
      context: args,
      instructions: [
        'Distinguish strict rules (->): cannot be defeated',
        'Distinguish defeasible rules (=>): can be defeated',
        'Parse rule structure: antecedent => consequent',
        'Identify rule names/labels for reference',
        'Handle negation (strong and weak)',
        'Extract literals from facts',
        'Validate rule syntax',
        'Build rule dependency structure',
        'Save formalized rules to output directory'
      ],
      outputFormat: 'JSON with rules (object), literals (array), ruleTypes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'literals', 'artifacts'],
      properties: {
        rules: {
          type: 'object',
          properties: {
            strict: { type: 'array' },
            defeasible: { type: 'array' }
          }
        },
        literals: { type: 'array', items: { type: 'string' } },
        ruleTypes: {
          type: 'object',
          properties: {
            strictCount: { type: 'number' },
            defeasibleCount: { type: 'number' }
          }
        },
        ruleDependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'formalization']
}));

// Task 2: Defeater Identification
export const defeaterIdentificationTask = defineTask('defeater-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify defeaters for defeasible rules',
  agent: {
    name: 'defeater-identification-agent',
    prompt: {
      role: 'defeater analysis specialist',
      task: 'Identify all defeaters for defeasible rules',
      context: args,
      instructions: [
        'Identify rebutting defeaters: conclude opposite of conclusion',
        'Identify undercutting defeaters: attack rule applicability, not conclusion',
        'Parse explicit defeater rules (~>): undercutters',
        'Find implicit defeaters from contradictory conclusions',
        'Link defeaters to the rules they defeat',
        'Handle transitive defeating',
        'Classify defeater strength',
        'Save defeaters to output directory'
      ],
      outputFormat: 'JSON with defeaters (array), rebutters (array), undercutters (array), defeaterMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['defeaters', 'rebutters', 'undercutters', 'artifacts'],
      properties: {
        defeaters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              defeats: { type: 'string' },
              condition: { type: 'string' }
            }
          }
        },
        rebutters: { type: 'array' },
        undercutters: { type: 'array' },
        defeaterMap: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'defeaters']
}));

// Task 3: Rule Priority Determination
export const rulePriorityTask = defineTask('rule-priority', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine rule priorities',
  agent: {
    name: 'rule-priority-agent',
    prompt: {
      role: 'priority ordering specialist',
      task: 'Determine priority ordering between conflicting rules',
      context: args,
      instructions: [
        'Extract explicit priority relations from input',
        'Infer implicit priorities from specificity',
        'Strict rules have highest priority',
        'Build priority ordering: r1 > r2 means r1 overrides r2 in conflict',
        'Handle incomparable rules (no priority relation)',
        'Resolve priority cycles if any',
        'Document priority justifications',
        'Save priorities to output directory'
      ],
      outputFormat: 'JSON with priorities (object), priorityOrder (array), incomparable (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['priorities', 'priorityOrder', 'artifacts'],
      properties: {
        priorities: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        priorityOrder: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              higher: { type: 'string' },
              lower: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        incomparable: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule1: { type: 'string' },
              rule2: { type: 'string' }
            }
          }
        },
        priorityJustifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'priority']
}));

// Task 4: Argument Construction
export const argumentConstructionTask = defineTask('argument-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct arguments from rules',
  agent: {
    name: 'argument-construction-agent',
    prompt: {
      role: 'argument construction specialist',
      task: 'Construct arguments supporting conclusions',
      context: args,
      instructions: [
        'Build argument trees from rules and facts',
        'Argument: sequence of rules leading to conclusion',
        'Start from facts, apply rules to derive conclusions',
        'Track sub-arguments (premises of arguments)',
        'Identify strict vs defeasible arguments',
        'Compute argument strength from rule priorities',
        'Build all possible arguments for each literal',
        'Save arguments to output directory'
      ],
      outputFormat: 'JSON with arguments (array), argumentMap (object), conclusionSupport (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['arguments', 'argumentMap', 'artifacts'],
      properties: {
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              conclusion: { type: 'string' },
              rules: { type: 'array' },
              premises: { type: 'array' },
              subArguments: { type: 'array' },
              strength: { type: 'number' },
              isStrict: { type: 'boolean' }
            }
          }
        },
        argumentMap: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        conclusionSupport: {
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
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'arguments']
}));

// Task 5: Defeat Analysis
export const defeatAnalysisTask = defineTask('defeat-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze defeats between arguments',
  agent: {
    name: 'defeat-analysis-agent',
    prompt: {
      role: 'defeat relation specialist',
      task: 'Determine which arguments defeat which',
      context: args,
      instructions: [
        'Argument A defeats B if A rebuts or undercuts B',
        'Rebuts: A\'s conclusion contradicts B\'s conclusion or premise',
        'Undercuts: A\'s conclusion negates applicability of rule in B',
        'Apply priorities: A defeats B only if A not less preferred than B',
        'Identify blocked defeats (priority prevents defeat)',
        'Build defeat graph between arguments',
        'Handle symmetric defeats (mutual defeat)',
        'Save defeat analysis to output directory'
      ],
      outputFormat: 'JSON with defeats (array), defeatGraph (object), symmetricDefeats (array), blockedDefeats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['defeats', 'defeatGraph', 'artifacts'],
      properties: {
        defeats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attacker: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string' },
              point: { type: 'string' }
            }
          }
        },
        defeatGraph: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' }
          }
        },
        symmetricDefeats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              arg1: { type: 'string' },
              arg2: { type: 'string' }
            }
          }
        },
        blockedDefeats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'defeats']
}));

// Task 6: Warranted Conclusion Computation
export const warrantedConclusionTask = defineTask('warranted-conclusion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute warranted conclusions',
  agent: {
    name: 'warranted-conclusion-agent',
    prompt: {
      role: 'warrant computation specialist',
      task: 'Determine which conclusions are warranted (justified)',
      context: args,
      instructions: [
        'Apply specified inference level:',
        '- Ambiguity blocking: block if any undefeated counter-argument',
        '- Ambiguity propagating: propagate ambiguity through chains',
        'Conclusion warranted if supported by undefeated argument',
        'Argument undefeated if all attackers are themselves defeated',
        'Use Dung semantics: grounded, preferred, stable',
        'Compute warranted, defeated, and ambiguous conclusions',
        'Track warrant justification for each conclusion',
        'Save warranted conclusions to output directory'
      ],
      outputFormat: 'JSON with warranted (array), defeated (array), ambiguous (array), warrantJustification (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['warranted', 'defeated', 'artifacts'],
      properties: {
        warranted: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              supportingArgument: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        },
        defeated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              defeatedBy: { type: 'string' }
            }
          }
        },
        ambiguous: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        warrantJustification: { type: 'object' },
        semanticsUsed: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'warrant']
}));

// Task 7: Dialectical Analysis
export const dialecticalAnalysisTask = defineTask('dialectical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform dialectical analysis',
  agent: {
    name: 'dialectical-analysis-agent',
    prompt: {
      role: 'dialectical analysis specialist',
      task: 'Analyze the dialectical structure of argumentation',
      context: args,
      instructions: [
        'Build dialectical trees for each conclusion',
        'Proponent presents argument, opponent attacks',
        'Alternate pro/con levels in tree',
        'Mark nodes as won/lost based on children',
        'Conclusion warranted if proponent wins dialectical tree',
        'Identify key defeating arguments',
        'Analyze argument chains',
        'Save dialectical analysis to output directory'
      ],
      outputFormat: 'JSON with structure (object), dialecticalTrees (object), keyDefenses (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'dialecticalTrees', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            totalArguments: { type: 'number' },
            defeatedArguments: { type: 'number' },
            undefeatedArguments: { type: 'number' }
          }
        },
        dialecticalTrees: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              root: { type: 'string' },
              levels: { type: 'array' },
              winner: { type: 'string' }
            }
          }
        },
        keyDefenses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              argument: { type: 'string' },
              defends: { type: 'string' },
              against: { type: 'string' }
            }
          }
        },
        argumentChains: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'dialectical']
}));

// Task 8: Quality Assessment
export const defeasibleQualityTask = defineTask('defeasible-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of defeasible reasoning',
  agent: {
    name: 'defeasible-quality-agent',
    prompt: {
      role: 'defeasible reasoning methodology reviewer',
      task: 'Assess quality and validity of defeasible reasoning process',
      context: args,
      instructions: [
        'Evaluate rule formalization quality (weight: 20%)',
        'Assess defeater identification (weight: 20%)',
        'Check argument construction validity (weight: 20%)',
        'Evaluate defeat analysis correctness (weight: 20%)',
        'Assess warrant computation (weight: 20%)',
        'Verify logical consistency',
        'Check for proper priority handling',
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
            defeaterIdentification: { type: 'number' },
            argumentConstruction: { type: 'number' },
            defeatAnalysis: { type: 'number' },
            warrantComputation: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'quality']
}));

// Task 9: Report Generation
export const defeasibleReportTask = defineTask('defeasible-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate defeasible reasoning report',
  agent: {
    name: 'defeasible-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on defeasible reasoning',
      context: args,
      instructions: [
        'Create executive summary of reasoning results',
        'Document rule base structure',
        'Present defeaters and their targets',
        'Show priority ordering',
        'Present argument structures',
        'Explain defeat relations',
        'Document warranted vs defeated conclusions',
        'Include dialectical tree visualizations',
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
  labels: ['agent', 'scientific-discovery', 'defeasible-reasoning', 'reporting']
}));
