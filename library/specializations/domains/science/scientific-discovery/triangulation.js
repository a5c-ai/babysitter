/**
 * @process domains/science/scientific-discovery/triangulation
 * @description Triangulation: Use multiple independent methods to converge on a result
 * @inputs {
 *   researchQuestion: string,
 *   phenomenon: string,
 *   methods: array,
 *   convergenceThreshold: number
 * }
 * @outputs {
 *   success: boolean,
 *   convergentFindings: array,
 *   methodResults: array,
 *   triangulatedConclusion: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    phenomenon,
    methods = ['quantitative', 'qualitative', 'computational'],
    convergenceThreshold = 75,
    domain = 'general science'
  } = inputs;

  const methodResults = [];
  const startTime = ctx.now();

  // Phase 1: Design Independent Methods
  ctx.log('info', 'Designing independent research methods for triangulation');
  const methodDesigns = await ctx.task(designMethodsTask, {
    researchQuestion,
    phenomenon,
    requestedMethods: methods,
    domain
  });

  // Phase 2: Execute Each Method in Parallel
  ctx.log('info', 'Executing independent methods in parallel');
  const methodExecutions = await ctx.parallel.all(
    methodDesigns.methods.map(method =>
      ctx.task(executeMethodTask, {
        researchQuestion,
        phenomenon,
        method,
        domain
      })
    )
  );

  methodResults.push(...methodExecutions);

  // Phase 3: Assess Method Independence
  ctx.log('info', 'Assessing independence of methods');
  const independenceAssessment = await ctx.task(assessIndependenceTask, {
    researchQuestion,
    methodDesigns: methodDesigns.methods,
    methodResults,
    domain
  });

  await ctx.breakpoint({
    question: `Methods executed. Independence score: ${independenceAssessment.independenceScore}%. Review method results?`,
    title: 'Triangulation - Method Execution Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/method-designs.json', format: 'json' },
        { path: 'artifacts/method-results.json', format: 'json' },
        { path: 'artifacts/independence-assessment.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Identify Convergent Findings
  ctx.log('info', 'Identifying convergent findings across methods');
  const convergenceAnalysis = await ctx.task(analyzeConvergenceTask, {
    researchQuestion,
    methodResults,
    convergenceThreshold,
    domain
  });

  // Phase 5: Identify Divergent Findings
  ctx.log('info', 'Analyzing divergent findings');
  const divergenceAnalysis = await ctx.task(analyzeDivergenceTask, {
    researchQuestion,
    methodResults,
    convergenceAnalysis,
    domain
  });

  // Phase 6: Resolve Discrepancies
  ctx.log('info', 'Attempting to resolve discrepancies');
  const discrepancyResolution = await ctx.task(resolveDiscrepanciesTask, {
    researchQuestion,
    divergentFindings: divergenceAnalysis.divergentFindings,
    methodResults,
    domain
  });

  // Phase 7: Synthesize Triangulated Conclusion
  ctx.log('info', 'Synthesizing triangulated conclusion');
  const triangulatedConclusion = await ctx.task(synthesizeTriangulationTask, {
    researchQuestion,
    phenomenon,
    methodResults,
    convergenceAnalysis,
    divergenceAnalysis,
    discrepancyResolution,
    independenceAssessment,
    domain
  });

  await ctx.breakpoint({
    question: `Triangulation complete. Convergence: ${convergenceAnalysis.overallConvergence}%. Review triangulated conclusion?`,
    title: 'Triangulation - Final Results',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/convergence-analysis.json', format: 'json' },
        { path: 'artifacts/triangulated-conclusion.md', format: 'markdown' }
      ]
    }
  });

  return {
    success: convergenceAnalysis.overallConvergence >= convergenceThreshold,
    processId: 'domains/science/scientific-discovery/triangulation',
    researchQuestion,
    phenomenon,
    methodDesigns: methodDesigns.methods,
    methodResults,
    independenceAssessment,
    convergentFindings: convergenceAnalysis.convergentFindings,
    divergentFindings: divergenceAnalysis.divergentFindings,
    discrepancyResolution,
    triangulatedConclusion,
    metadata: {
      methodCount: methods.length,
      overallConvergence: convergenceAnalysis.overallConvergence,
      independenceScore: independenceAssessment.independenceScore,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const designMethodsTask = defineTask('design-methods', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Independent Research Methods',
  agent: {
    name: 'method-designer',
    prompt: {
      role: 'research methodologist',
      task: 'Design multiple independent methods to investigate the research question',
      context: args,
      instructions: [
        'Design methods that are truly independent of each other',
        'Ensure each method has different assumptions and approaches',
        'Include diverse epistemological foundations',
        'Specify data collection procedures for each method',
        'Define analysis techniques for each method',
        'Identify potential biases and mitigation strategies',
        'Ensure methods collectively cover different aspects of the phenomenon'
      ],
      outputFormat: 'JSON with method designs, independence rationale, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['methods'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              dataCollection: { type: 'string' },
              analysisTechnique: { type: 'string' },
              potentialBiases: { type: 'array', items: { type: 'string' } },
              independenceRationale: { type: 'string' }
            }
          }
        },
        coverageAnalysis: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'method-design']
}));

export const executeMethodTask = defineTask('execute-method', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Method: ${args.method.name}`,
  agent: {
    name: 'method-executor',
    prompt: {
      role: 'research scientist',
      task: 'Execute the research method and produce findings',
      context: args,
      instructions: [
        'Follow the method design strictly',
        'Collect data according to specified procedures',
        'Apply the analysis technique rigorously',
        'Document all findings, including unexpected results',
        'Note any deviations from the planned procedure',
        'Assess confidence in results',
        'Identify limitations of this method'
      ],
      outputFormat: 'JSON with findings, data, analysis results, confidence assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['methodId', 'findings', 'confidence'],
      properties: {
        methodId: { type: 'string' },
        findings: { type: 'array', items: { type: 'object' } },
        data: { type: 'object' },
        analysisResults: { type: 'object' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        limitations: { type: 'array', items: { type: 'string' } },
        deviations: { type: 'array', items: { type: 'string' } },
        unexpectedResults: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'method-execution']
}));

export const assessIndependenceTask = defineTask('assess-independence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Method Independence',
  agent: {
    name: 'independence-assessor',
    prompt: {
      role: 'methodological reviewer',
      task: 'Assess the true independence of the methods used',
      context: args,
      instructions: [
        'Analyze whether methods share common assumptions',
        'Check for shared data sources or instruments',
        'Identify any methodological dependencies',
        'Assess epistemological diversity',
        'Score overall independence 0-100',
        'Identify threats to independence',
        'Recommend adjustments if independence is compromised'
      ],
      outputFormat: 'JSON with independence score, analysis, threats, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['independenceScore', 'analysis'],
      properties: {
        independenceScore: { type: 'number', minimum: 0, maximum: 100 },
        analysis: { type: 'string' },
        sharedAssumptions: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        threats: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'independence-assessment']
}));

export const analyzeConvergenceTask = defineTask('analyze-convergence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Convergent Findings',
  agent: {
    name: 'convergence-analyst',
    prompt: {
      role: 'research synthesist',
      task: 'Identify findings that converge across multiple methods',
      context: args,
      instructions: [
        'Compare findings across all methods',
        'Identify consistent results supported by multiple methods',
        'Assess the strength of convergence for each finding',
        'Calculate overall convergence score',
        'Rank convergent findings by confidence',
        'Document the evidence base for each convergent finding',
        'Note partial convergences'
      ],
      outputFormat: 'JSON with convergent findings, convergence scores, evidence'
    },
    outputSchema: {
      type: 'object',
      required: ['convergentFindings', 'overallConvergence'],
      properties: {
        convergentFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              supportingMethods: { type: 'array', items: { type: 'string' } },
              convergenceStrength: { type: 'number' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallConvergence: { type: 'number', minimum: 0, maximum: 100 },
        partialConvergences: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'convergence-analysis']
}));

export const analyzeDivergenceTask = defineTask('analyze-divergence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Divergent Findings',
  agent: {
    name: 'divergence-analyst',
    prompt: {
      role: 'critical researcher',
      task: 'Identify and analyze findings that diverge across methods',
      context: args,
      instructions: [
        'Identify findings that differ across methods',
        'Analyze potential reasons for divergence',
        'Distinguish true contradictions from complementary findings',
        'Assess whether divergence reflects method limitations',
        'Identify which method is likely more reliable for each divergence',
        'Note divergences that require further investigation',
        'Classify divergences by type and severity'
      ],
      outputFormat: 'JSON with divergent findings, analysis, classifications'
    },
    outputSchema: {
      type: 'object',
      required: ['divergentFindings'],
      properties: {
        divergentFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              conflictingMethods: { type: 'array', items: { type: 'string' } },
              divergenceType: { type: 'string' },
              possibleReasons: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' }
            }
          }
        },
        trueContradictions: { type: 'array', items: { type: 'string' } },
        complementaryFindings: { type: 'array', items: { type: 'string' } },
        methodLimitations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'divergence-analysis']
}));

export const resolveDiscrepanciesTask = defineTask('resolve-discrepancies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resolve Discrepancies Between Methods',
  agent: {
    name: 'discrepancy-resolver',
    prompt: {
      role: 'senior research scientist',
      task: 'Attempt to resolve discrepancies between divergent findings',
      context: args,
      instructions: [
        'Investigate each significant discrepancy',
        'Propose explanations that reconcile divergent findings',
        'Identify method-specific artifacts vs genuine differences',
        'Suggest additional tests to resolve ambiguities',
        'Determine which findings should be weighted more heavily',
        'Document unresolvable discrepancies',
        'Provide confidence assessment for each resolution'
      ],
      outputFormat: 'JSON with resolutions, unresolved items, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['resolutions'],
      properties: {
        resolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              discrepancy: { type: 'string' },
              resolution: { type: 'string' },
              confidence: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        unresolvedDiscrepancies: { type: 'array', items: { type: 'string' } },
        additionalTestsNeeded: { type: 'array', items: { type: 'string' } },
        weightingRecommendations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'discrepancy-resolution']
}));

export const synthesizeTriangulationTask = defineTask('synthesize-triangulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Triangulated Conclusion',
  agent: {
    name: 'triangulation-synthesizer',
    prompt: {
      role: 'senior research scientist',
      task: 'Synthesize all findings into a triangulated conclusion',
      context: args,
      instructions: [
        'Integrate convergent findings into main conclusions',
        'Appropriately weight evidence from different methods',
        'Account for resolved and unresolved discrepancies',
        'Assess overall confidence in triangulated conclusion',
        'Identify the strongest evidence-backed claims',
        'Note limitations and caveats',
        'Provide recommendations for future research'
      ],
      outputFormat: 'JSON with triangulated conclusion, confidence, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['conclusion', 'mainFindings', 'confidence'],
      properties: {
        conclusion: { type: 'string' },
        mainFindings: { type: 'array', items: { type: 'object' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        evidenceStrength: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        caveats: { type: 'array', items: { type: 'string' } },
        futureResearch: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'triangulation', 'synthesis']
}));
