/**
 * @process philosophy/evidence-assessment
 * @description Evaluate the quality, relevance, and sufficiency of evidence for claims, applying standards appropriate to different domains of inquiry
 * @inputs { claim: string, evidence: array, domainOfInquiry: string, outputDir: string }
 * @outputs { success: boolean, evidenceEvaluation: object, qualityAssessment: object, sufficiencyJudgment: object, artifacts: array }
 * @recommendedSkills SK-PHIL-007 (evidence-justification-assessment), SK-PHIL-011 (fallacy-detection-analysis), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-004 (metaphysics-epistemology-agent), AG-PHIL-007 (critical-thinking-educator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    claim,
    evidence,
    domainOfInquiry = 'general',
    outputDir = 'evidence-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Claim and Evidence Cataloging
  ctx.log('info', 'Starting evidence assessment: Cataloging claim and evidence');
  const cataloging = await ctx.task(catalogingTask, {
    claim,
    evidence,
    domainOfInquiry,
    outputDir
  });

  if (!cataloging.success) {
    return {
      success: false,
      error: 'Cataloging failed',
      details: cataloging,
      metadata: { processId: 'philosophy/evidence-assessment', timestamp: startTime }
    };
  }

  artifacts.push(...cataloging.artifacts);

  // Task 2: Relevance Assessment
  ctx.log('info', 'Assessing evidence relevance');
  const relevanceAssessment = await ctx.task(relevanceAssessmentTask, {
    catalogedClaim: cataloging.catalogedClaim,
    catalogedEvidence: cataloging.catalogedEvidence,
    outputDir
  });

  artifacts.push(...relevanceAssessment.artifacts);

  // Task 3: Quality Evaluation
  ctx.log('info', 'Evaluating evidence quality');
  const qualityEvaluation = await ctx.task(qualityEvaluationTask, {
    catalogedEvidence: cataloging.catalogedEvidence,
    domainOfInquiry,
    outputDir
  });

  artifacts.push(...qualityEvaluation.artifacts);

  // Task 4: Domain-Specific Standards Application
  ctx.log('info', `Applying ${domainOfInquiry} domain standards`);
  const standardsApplication = await ctx.task(standardsApplicationTask, {
    claim: cataloging.catalogedClaim,
    evidence: cataloging.catalogedEvidence,
    domainOfInquiry,
    qualityEvaluation,
    outputDir
  });

  artifacts.push(...standardsApplication.artifacts);

  // Task 5: Sufficiency Judgment
  ctx.log('info', 'Judging evidence sufficiency');
  const sufficiencyJudgment = await ctx.task(sufficiencyJudgmentTask, {
    claim: cataloging.catalogedClaim,
    relevanceAssessment,
    qualityEvaluation,
    standardsApplication,
    outputDir
  });

  artifacts.push(...sufficiencyJudgment.artifacts);

  // Task 6: Counterevidence and Defeaters
  ctx.log('info', 'Analyzing counterevidence and defeaters');
  const counterEvidenceAnalysis = await ctx.task(counterEvidenceTask, {
    claim: cataloging.catalogedClaim,
    evidence: cataloging.catalogedEvidence,
    outputDir
  });

  artifacts.push(...counterEvidenceAnalysis.artifacts);

  // Breakpoint: Review evidence assessment
  await ctx.breakpoint({
    question: `Evidence assessment complete. Evidence is ${sufficiencyJudgment.isSufficient ? 'SUFFICIENT' : 'INSUFFICIENT'} for the claim. Review the assessment?`,
    title: 'Evidence Assessment Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        domain: domainOfInquiry,
        evidenceCount: evidence.length,
        relevantEvidenceCount: relevanceAssessment.relevantCount,
        isSufficient: sufficiencyJudgment.isSufficient,
        overallQuality: qualityEvaluation.overallQuality
      }
    }
  });

  // Task 7: Generate Evidence Report
  ctx.log('info', 'Generating evidence assessment report');
  const evidenceReport = await ctx.task(evidenceReportTask, {
    claim,
    evidence,
    cataloging,
    relevanceAssessment,
    qualityEvaluation,
    standardsApplication,
    sufficiencyJudgment,
    counterEvidenceAnalysis,
    outputDir
  });

  artifacts.push(...evidenceReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    evidenceEvaluation: {
      claim,
      catalogedEvidence: cataloging.catalogedEvidence,
      relevance: relevanceAssessment.assessments,
      relevantCount: relevanceAssessment.relevantCount
    },
    qualityAssessment: {
      overallQuality: qualityEvaluation.overallQuality,
      individualQuality: qualityEvaluation.individual,
      domainStandards: standardsApplication.standardsMet
    },
    sufficiencyJudgment: {
      isSufficient: sufficiencyJudgment.isSufficient,
      confidence: sufficiencyJudgment.confidence,
      gaps: sufficiencyJudgment.gaps,
      recommendation: sufficiencyJudgment.recommendation
    },
    counterEvidence: counterEvidenceAnalysis.counterEvidence,
    defeaters: counterEvidenceAnalysis.defeaters,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/evidence-assessment',
      timestamp: startTime,
      domainOfInquiry,
      outputDir
    }
  };
}

// Task 1: Cataloging
export const catalogingTask = defineTask('cataloging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Catalog claim and evidence',
  agent: {
    name: 'evidence-cataloger',
    prompt: {
      role: 'philosopher of science',
      task: 'Catalog and organize the claim and evidence for systematic assessment',
      context: args,
      instructions: [
        'Clarify and catalog the claim precisely',
        'Identify the type of claim (empirical, normative, etc.)',
        'Catalog each piece of evidence',
        'Classify evidence types (testimonial, empirical, logical, etc.)',
        'Note the source of each evidence',
        'Identify the domain of inquiry',
        'Note relevant standards for the domain',
        'Save cataloging to output directory'
      ],
      outputFormat: 'JSON with success, catalogedClaim, catalogedEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'catalogedClaim', 'catalogedEvidence', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        catalogedClaim: {
          type: 'object',
          properties: {
            claim: { type: 'string' },
            type: { type: 'string' },
            domain: { type: 'string' },
            precision: { type: 'string' }
          }
        },
        catalogedEvidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidence: { type: 'string' },
              type: { type: 'string' },
              source: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'evidence', 'cataloging']
}));

// Task 2: Relevance Assessment
export const relevanceAssessmentTask = defineTask('relevance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess evidence relevance',
  agent: {
    name: 'relevance-assessor',
    prompt: {
      role: 'philosopher of science',
      task: 'Assess the relevance of each piece of evidence to the claim',
      context: args,
      instructions: [
        'For each evidence: determine if relevant to the claim',
        'Assess degree of relevance (highly, moderately, marginally)',
        'Identify the relevance relationship (supports, undermines, neutral)',
        'Consider direct vs. indirect relevance',
        'Note any relevance only to background assumptions',
        'Count total relevant evidence',
        'Note any irrelevant evidence',
        'Save relevance assessment to output directory'
      ],
      outputFormat: 'JSON with assessments (evidence, relevance, degree), relevantCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'relevantCount', 'artifacts'],
      properties: {
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidence: { type: 'string' },
              isRelevant: { type: 'boolean' },
              degree: { type: 'string' },
              relationship: { type: 'string' },
              relevanceType: { type: 'string' }
            }
          }
        },
        relevantCount: { type: 'number' },
        irrelevantEvidence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'evidence', 'relevance']
}));

// Task 3: Quality Evaluation
export const qualityEvaluationTask = defineTask('quality-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate evidence quality',
  agent: {
    name: 'quality-evaluator',
    prompt: {
      role: 'philosopher of science',
      task: 'Evaluate the quality of each piece of evidence',
      context: args,
      instructions: [
        'Assess reliability of each evidence source',
        'Evaluate credibility of testimonial evidence',
        'Assess methodological quality of empirical evidence',
        'Evaluate validity of logical evidence',
        'Consider potential biases',
        'Assess independence of evidence pieces',
        'Determine overall evidence quality',
        'Save quality evaluation to output directory'
      ],
      outputFormat: 'JSON with individual (evidence, quality, reliability), overallQuality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['individual', 'overallQuality', 'artifacts'],
      properties: {
        individual: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidence: { type: 'string' },
              quality: { type: 'string' },
              reliability: { type: 'string' },
              biases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallQuality: { type: 'string' },
        independence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'evidence', 'quality']
}));

// Task 4: Standards Application
export const standardsApplicationTask = defineTask('standards-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply domain-specific standards',
  agent: {
    name: 'standards-applier',
    prompt: {
      role: 'philosopher of science',
      task: 'Apply the appropriate evidential standards for the domain of inquiry',
      context: args,
      instructions: [
        'Identify standards appropriate to the domain',
        'For science: apply empirical standards',
        'For history: apply historical evidence standards',
        'For law: apply legal evidence standards',
        'For philosophy: apply argumentative standards',
        'Assess whether evidence meets domain standards',
        'Note any standards not met',
        'Save standards application to output directory'
      ],
      outputFormat: 'JSON with standards, standardsMet, standardsNotMet, domainAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'standardsMet', 'artifacts'],
      properties: {
        standards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              domain: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        standardsMet: { type: 'array', items: { type: 'string' } },
        standardsNotMet: { type: 'array', items: { type: 'string' } },
        domainAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'evidence', 'standards']
}));

// Task 5: Sufficiency Judgment
export const sufficiencyJudgmentTask = defineTask('sufficiency-judgment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Judge evidence sufficiency',
  agent: {
    name: 'sufficiency-judge',
    prompt: {
      role: 'philosopher of science',
      task: 'Judge whether the evidence is sufficient to warrant belief in the claim',
      context: args,
      instructions: [
        'Synthesize relevance, quality, and standards assessments',
        'Determine if evidence meets threshold for rational belief',
        'Assess confidence level warranted by evidence',
        'Identify any gaps in the evidence',
        'Consider what additional evidence would be needed',
        'Provide recommendation regarding the claim',
        'Note any conditions on the judgment',
        'Save sufficiency judgment to output directory'
      ],
      outputFormat: 'JSON with isSufficient, confidence, gaps, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isSufficient', 'confidence', 'artifacts'],
      properties: {
        isSufficient: { type: 'boolean' },
        confidence: { type: 'string' },
        threshold: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        additionalEvidenceNeeded: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'evidence', 'sufficiency']
}));

// Task 6: Counter Evidence
export const counterEvidenceTask = defineTask('counter-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze counterevidence and defeaters',
  agent: {
    name: 'counterevidence-analyst',
    prompt: {
      role: 'philosopher of science',
      task: 'Identify and analyze counterevidence and potential defeaters',
      context: args,
      instructions: [
        'Identify any evidence that undermines the claim',
        'Identify potential rebutting defeaters',
        'Identify potential undercutting defeaters',
        'Assess the strength of counterevidence',
        'Consider how counterevidence affects sufficiency',
        'Weigh evidence against counterevidence',
        'Determine net evidential support',
        'Save counterevidence analysis to output directory'
      ],
      outputFormat: 'JSON with counterEvidence, defeaters, netSupport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['counterEvidence', 'defeaters', 'artifacts'],
      properties: {
        counterEvidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidence: { type: 'string' },
              strength: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        defeaters: {
          type: 'object',
          properties: {
            rebutting: { type: 'array', items: { type: 'string' } },
            undercutting: { type: 'array', items: { type: 'string' } }
          }
        },
        netSupport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'evidence', 'counterevidence']
}));

// Task 7: Evidence Report
export const evidenceReportTask = defineTask('evidence-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate evidence assessment report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosopher of science and technical writer',
      task: 'Generate comprehensive evidence assessment report',
      context: args,
      instructions: [
        'Create executive summary with sufficiency judgment',
        'Present the claim and cataloged evidence',
        'Document relevance assessment',
        'Present quality evaluation',
        'Include domain standards application',
        'Present sufficiency judgment',
        'Include counterevidence analysis',
        'Note conclusions and recommendations',
        'Format as professional philosophical report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'evidence', 'reporting']
}));
