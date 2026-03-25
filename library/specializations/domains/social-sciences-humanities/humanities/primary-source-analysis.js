/**
 * @process humanities/primary-source-analysis
 * @description Authenticate, date, and critically evaluate historical documents including assessment of provenance, bias, reliability, and contextualization within broader evidence
 * @inputs { sourceDocument: object, historicalContext: object, researchQuestion: string }
 * @outputs { success: boolean, sourceAnalysis: object, authentication: object, criticalEvaluation: object, artifacts: array }
 * @recommendedSkills SK-HUM-001 (primary-source-evaluation), SK-HUM-007 (archival-finding-aid-interpretation), SK-HUM-010 (citation-scholarly-apparatus)
 * @recommendedAgents AG-HUM-001 (archival-research-specialist), AG-HUM-007 (historical-narrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sourceDocument,
    historicalContext = {},
    researchQuestion,
    comparativeEvidence = [],
    outputDir = 'source-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Document Authentication
  ctx.log('info', 'Authenticating source document');
  const authentication = await ctx.task(authenticationTask, {
    sourceDocument,
    historicalContext,
    outputDir
  });

  if (!authentication.success) {
    return {
      success: false,
      error: 'Authentication analysis failed',
      details: authentication,
      metadata: { processId: 'humanities/primary-source-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...authentication.artifacts);

  // Task 2: Dating and Provenance Analysis
  ctx.log('info', 'Analyzing dating and provenance');
  const provenanceAnalysis = await ctx.task(provenanceAnalysisTask, {
    sourceDocument,
    authentication,
    historicalContext,
    outputDir
  });

  artifacts.push(...provenanceAnalysis.artifacts);

  // Task 3: Authorship and Attribution Analysis
  ctx.log('info', 'Analyzing authorship and attribution');
  const authorshipAnalysis = await ctx.task(authorshipAnalysisTask, {
    sourceDocument,
    provenanceAnalysis,
    historicalContext,
    outputDir
  });

  artifacts.push(...authorshipAnalysis.artifacts);

  // Task 4: Bias and Perspective Assessment
  ctx.log('info', 'Assessing bias and perspective');
  const biasAssessment = await ctx.task(biasAssessmentTask, {
    sourceDocument,
    authorshipAnalysis,
    historicalContext,
    outputDir
  });

  artifacts.push(...biasAssessment.artifacts);

  // Task 5: Reliability Evaluation
  ctx.log('info', 'Evaluating source reliability');
  const reliabilityEvaluation = await ctx.task(reliabilityEvaluationTask, {
    sourceDocument,
    authentication,
    provenanceAnalysis,
    authorshipAnalysis,
    biasAssessment,
    outputDir
  });

  artifacts.push(...reliabilityEvaluation.artifacts);

  // Task 6: Contextualization Analysis
  ctx.log('info', 'Contextualizing within broader evidence');
  const contextualization = await ctx.task(contextualizationTask, {
    sourceDocument,
    historicalContext,
    comparativeEvidence,
    reliabilityEvaluation,
    outputDir
  });

  artifacts.push(...contextualization.artifacts);

  // Task 7: Generate Source Analysis Report
  ctx.log('info', 'Generating source analysis report');
  const analysisReport = await ctx.task(sourceAnalysisReportTask, {
    sourceDocument,
    authentication,
    provenanceAnalysis,
    authorshipAnalysis,
    biasAssessment,
    reliabilityEvaluation,
    contextualization,
    researchQuestion,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  // Breakpoint: Review source analysis
  await ctx.breakpoint({
    question: `Source analysis complete. Reliability score: ${reliabilityEvaluation.score}/100. Authentication: ${authentication.verdict}. Review analysis?`,
    title: 'Primary Source Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        authenticationVerdict: authentication.verdict,
        datingEstimate: provenanceAnalysis.dateEstimate,
        reliabilityScore: reliabilityEvaluation.score,
        biasFactors: biasAssessment.factors?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sourceAnalysis: {
      document: sourceDocument,
      authentication: authentication.verdict,
      dating: provenanceAnalysis.dateEstimate,
      attribution: authorshipAnalysis.attribution
    },
    authentication: {
      verdict: authentication.verdict,
      evidence: authentication.evidence,
      concerns: authentication.concerns
    },
    criticalEvaluation: {
      reliability: reliabilityEvaluation,
      bias: biasAssessment,
      contextualization: contextualization
    },
    provenance: provenanceAnalysis,
    usabilityAssessment: {
      forResearchQuestion: contextualization.applicability,
      limitations: reliabilityEvaluation.limitations,
      recommendations: analysisReport.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/primary-source-analysis',
      timestamp: startTime,
      researchQuestion,
      outputDir
    }
  };
}

// Task 1: Document Authentication
export const authenticationTask = defineTask('authentication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Authenticate source document',
  agent: {
    name: 'document-authenticator',
    prompt: {
      role: 'historical document authentication specialist',
      task: 'Authenticate the source document for genuineness',
      context: args,
      instructions: [
        'Examine physical or digital characteristics',
        'Analyze writing materials, inks, papers (if applicable)',
        'Examine handwriting or typeface characteristics',
        'Look for anachronisms in content or form',
        'Compare with known authentic examples',
        'Check for signs of forgery or alteration',
        'Assess internal consistency',
        'Provide authentication verdict with confidence level'
      ],
      outputFormat: 'JSON with success, verdict, evidence, concerns, confidenceLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'verdict', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        verdict: { type: 'string', enum: ['authentic', 'likely authentic', 'uncertain', 'likely forgery', 'forgery'] },
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              finding: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        concerns: { type: 'array', items: { type: 'string' } },
        confidenceLevel: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'authentication', 'source-criticism', 'historical']
}));

// Task 2: Dating and Provenance Analysis
export const provenanceAnalysisTask = defineTask('provenance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze dating and provenance',
  agent: {
    name: 'provenance-analyst',
    prompt: {
      role: 'archival provenance specialist',
      task: 'Establish dating and trace document provenance',
      context: args,
      instructions: [
        'Analyze internal dating evidence',
        'Examine external dating indicators',
        'Trace ownership history',
        'Identify archival path to present location',
        'Document gaps in provenance chain',
        'Assess impact of provenance on reliability',
        'Note any custody concerns',
        'Provide date range estimate with justification'
      ],
      outputFormat: 'JSON with dateEstimate, provenance, gaps, assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dateEstimate', 'provenance', 'artifacts'],
      properties: {
        dateEstimate: {
          type: 'object',
          properties: {
            earliest: { type: 'string' },
            latest: { type: 'string' },
            mostLikely: { type: 'string' },
            evidence: { type: 'array', items: { type: 'string' } }
          }
        },
        provenance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              owner: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        assessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'provenance', 'dating', 'archival']
}));

// Task 3: Authorship and Attribution Analysis
export const authorshipAnalysisTask = defineTask('authorship-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze authorship and attribution',
  agent: {
    name: 'attribution-analyst',
    prompt: {
      role: 'historical attribution specialist',
      task: 'Analyze and assess document authorship',
      context: args,
      instructions: [
        'Identify claimed or attributed author',
        'Analyze stylistic evidence for authorship',
        'Compare with known works of attributed author',
        'Assess author biographical compatibility',
        'Consider ghost-writing or collaborative authorship',
        'Examine institutional or official attribution',
        'Assess attribution confidence',
        'Note alternative attribution possibilities'
      ],
      outputFormat: 'JSON with attribution, evidence, confidence, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['attribution', 'artifacts'],
      properties: {
        attribution: {
          type: 'object',
          properties: {
            claimedAuthor: { type: 'string' },
            assessedAuthor: { type: 'string' },
            confidence: { type: 'string' }
          }
        },
        evidence: {
          type: 'object',
          properties: {
            stylistic: { type: 'array', items: { type: 'string' } },
            biographical: { type: 'array', items: { type: 'string' } },
            external: { type: 'array', items: { type: 'string' } }
          }
        },
        alternatives: { type: 'array', items: { type: 'object' } },
        authorContext: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'authorship', 'attribution', 'stylistic-analysis']
}));

// Task 4: Bias and Perspective Assessment
export const biasAssessmentTask = defineTask('bias-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess bias and perspective',
  agent: {
    name: 'bias-analyst',
    prompt: {
      role: 'historical bias analysis specialist',
      task: 'Assess biases and perspectives embedded in the source',
      context: args,
      instructions: [
        'Identify author social position and interests',
        'Analyze intended audience',
        'Identify explicit biases and positions',
        'Uncover implicit assumptions',
        'Assess genre conventions affecting content',
        'Identify what is included vs excluded',
        'Analyze language and framing choices',
        'Assess how bias affects evidentiary value'
      ],
      outputFormat: 'JSON with factors, perspectives, implications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'artifacts'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        perspectives: {
          type: 'object',
          properties: {
            authorPosition: { type: 'string' },
            intendedAudience: { type: 'string' },
            purpose: { type: 'string' }
          }
        },
        silences: { type: 'array', items: { type: 'string' } },
        implications: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bias', 'perspective', 'source-criticism']
}));

// Task 5: Reliability Evaluation
export const reliabilityEvaluationTask = defineTask('reliability-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate source reliability',
  agent: {
    name: 'reliability-evaluator',
    prompt: {
      role: 'historical evidence evaluation specialist',
      task: 'Synthesize analysis to evaluate overall source reliability',
      context: args,
      instructions: [
        'Synthesize authentication findings',
        'Weight provenance and dating evidence',
        'Factor in authorship assessment',
        'Account for identified biases',
        'Assess internal consistency',
        'Compare with corroborating evidence',
        'Assign reliability score 0-100',
        'Document limitations and caveats'
      ],
      outputFormat: 'JSON with score, assessment, strengths, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: {
          type: 'object',
          properties: {
            overall: { type: 'string' },
            byCategory: { type: 'object' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        useCases: {
          type: 'object',
          properties: {
            strongFor: { type: 'array', items: { type: 'string' } },
            weakFor: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'reliability', 'evaluation', 'evidence']
}));

// Task 6: Contextualization Analysis
export const contextualizationTask = defineTask('contextualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Contextualize within broader evidence',
  agent: {
    name: 'contextualizer',
    prompt: {
      role: 'historical contextualization specialist',
      task: 'Situate source within broader historical evidence and context',
      context: args,
      instructions: [
        'Place source in historical context of creation',
        'Compare with contemporary sources',
        'Identify corroborating evidence',
        'Note contradicting evidence',
        'Assess uniqueness of source',
        'Evaluate contribution to historical understanding',
        'Identify gaps source fills',
        'Assess applicability to research question'
      ],
      outputFormat: 'JSON with context, comparisons, applicability, contribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['context', 'applicability', 'artifacts'],
      properties: {
        context: {
          type: 'object',
          properties: {
            historicalMoment: { type: 'string' },
            contemporarySources: { type: 'array', items: { type: 'string' } },
            historiography: { type: 'string' }
          }
        },
        comparisons: {
          type: 'object',
          properties: {
            corroborating: { type: 'array', items: { type: 'string' } },
            contradicting: { type: 'array', items: { type: 'string' } }
          }
        },
        applicability: {
          type: 'object',
          properties: {
            toResearchQuestion: { type: 'string' },
            strength: { type: 'string' },
            caveats: { type: 'array', items: { type: 'string' } }
          }
        },
        contribution: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contextualization', 'historical-context', 'evidence']
}));

// Task 7: Source Analysis Report Generation
export const sourceAnalysisReportTask = defineTask('source-analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate source analysis report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'historical source analysis specialist',
      task: 'Generate comprehensive source analysis report',
      context: args,
      instructions: [
        'Summarize source description and identification',
        'Present authentication findings',
        'Document dating and provenance',
        'Present authorship analysis',
        'Summarize bias assessment',
        'Present reliability evaluation',
        'Document contextualization',
        'Provide recommendations for use in research'
      ],
      outputFormat: 'JSON with reportPath, recommendations, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        citationNote: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'source-analysis', 'documentation']
}));
