/**
 * @process philosophy/bioethics-deliberation
 * @description Conduct structured ethical deliberation for healthcare decisions, research protocols, and clinical cases using bioethical principles and case-based reasoning
 * @inputs { caseDescription: string, deliberationType: string, committeeSize: number, outputDir: string }
 * @outputs { success: boolean, deliberationProcess: object, ethicalAssessment: object, recommendations: array, artifacts: array }
 * @recommendedSkills SK-PHIL-012 (bioethics-deliberation), SK-PHIL-003 (ethical-framework-application), SK-PHIL-014 (socratic-dialogue-facilitation)
 * @recommendedAgents AG-PHIL-002 (ethics-consultant-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    caseDescription,
    deliberationType = 'clinical',
    committeeSize = 5,
    outputDir = 'bioethics-deliberation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Case Presentation and Fact Gathering
  ctx.log('info', 'Starting bioethics deliberation: Gathering case facts');
  const casePresentation = await ctx.task(casePresentationTask, {
    caseDescription,
    deliberationType,
    outputDir
  });

  if (!casePresentation.success) {
    return {
      success: false,
      error: 'Case presentation failed',
      details: casePresentation,
      metadata: { processId: 'philosophy/bioethics-deliberation', timestamp: startTime }
    };
  }

  artifacts.push(...casePresentation.artifacts);

  // Task 2: Stakeholder and Values Identification
  ctx.log('info', 'Identifying stakeholders and values');
  const stakeholderValues = await ctx.task(stakeholderValuesTask, {
    caseFacts: casePresentation.facts,
    deliberationType,
    outputDir
  });

  artifacts.push(...stakeholderValues.artifacts);

  // Task 3: Principle-Based Analysis
  ctx.log('info', 'Conducting principle-based analysis');
  const principleAnalysis = await ctx.task(principleAnalysisTask, {
    caseFacts: casePresentation.facts,
    stakeholders: stakeholderValues.stakeholders,
    values: stakeholderValues.values,
    outputDir
  });

  artifacts.push(...principleAnalysis.artifacts);

  // Task 4: Case-Based Reasoning
  ctx.log('info', 'Applying case-based reasoning');
  const caseBasedReasoning = await ctx.task(caseBasedReasoningTask, {
    caseFacts: casePresentation.facts,
    ethicalIssues: principleAnalysis.issues,
    outputDir
  });

  artifacts.push(...caseBasedReasoning.artifacts);

  // Task 5: Committee Deliberation Simulation
  ctx.log('info', 'Simulating committee deliberation');
  const committeeDeliberation = await ctx.task(committeeDeliberationTask, {
    principleAnalysis: principleAnalysis.analysis,
    caseBasedReasoning: caseBasedReasoning.analysis,
    stakeholders: stakeholderValues.stakeholders,
    committeeSize,
    outputDir
  });

  artifacts.push(...committeeDeliberation.artifacts);

  // Task 6: Recommendation Formulation
  ctx.log('info', 'Formulating ethical recommendations');
  const recommendations = await ctx.task(recommendationFormulationTask, {
    deliberationOutcome: committeeDeliberation.outcome,
    principleAnalysis: principleAnalysis.analysis,
    caseFacts: casePresentation.facts,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // Breakpoint: Review deliberation results
  await ctx.breakpoint({
    question: `Bioethics deliberation complete. ${committeeDeliberation.outcome.consensus ? 'Committee reached consensus.' : 'Committee has dissenting views.'} Review the deliberation?`,
    title: 'Bioethics Deliberation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        deliberationType,
        consensus: committeeDeliberation.outcome.consensus,
        primaryRecommendation: recommendations.primary,
        stakeholderCount: stakeholderValues.stakeholders.length
      }
    }
  });

  // Task 7: Generate Deliberation Report
  ctx.log('info', 'Generating bioethics deliberation report');
  const deliberationReport = await ctx.task(deliberationReportTask, {
    caseDescription,
    casePresentation,
    stakeholderValues,
    principleAnalysis,
    caseBasedReasoning,
    committeeDeliberation,
    recommendations,
    outputDir
  });

  artifacts.push(...deliberationReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    deliberationProcess: {
      type: deliberationType,
      caseFacts: casePresentation.facts,
      stakeholders: stakeholderValues.stakeholders,
      valuesAtStake: stakeholderValues.values,
      principleAnalysis: principleAnalysis.analysis,
      precedentCases: caseBasedReasoning.precedents
    },
    ethicalAssessment: {
      issues: principleAnalysis.issues,
      principleBalancing: principleAnalysis.balancing,
      committeeDeliberation: committeeDeliberation.outcome
    },
    recommendations: recommendations.recommendations,
    dissent: committeeDeliberation.outcome.dissent,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/bioethics-deliberation',
      timestamp: startTime,
      deliberationType,
      outputDir
    }
  };
}

// Task 1: Case Presentation
export const casePresentationTask = defineTask('case-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Present case and gather facts',
  agent: {
    name: 'case-presenter',
    prompt: {
      role: 'bioethics consultant',
      task: 'Present the case and gather all relevant facts for ethical deliberation',
      context: args,
      instructions: [
        'Extract clinical/research facts from the case',
        'Identify the patient/subject information (anonymized)',
        'Document medical history and current condition',
        'Identify the decision or action requiring ethical review',
        'Note any time constraints or urgency',
        'Identify relevant institutional policies',
        'Document any prior treatment or decisions',
        'Save case presentation to output directory'
      ],
      outputFormat: 'JSON with success, facts (medical, decision, context), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'facts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        facts: {
          type: 'object',
          properties: {
            medicalFacts: { type: 'array', items: { type: 'string' } },
            decisionRequired: { type: 'string' },
            context: { type: 'string' },
            urgency: { type: 'string' },
            priorDecisions: { type: 'array', items: { type: 'string' } },
            institutionalPolicies: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'bioethics', 'case-presentation']
}));

// Task 2: Stakeholder and Values Identification
export const stakeholderValuesTask = defineTask('stakeholder-values', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify stakeholders and values',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'bioethics consultant',
      task: 'Identify all stakeholders and the values at stake in this case',
      context: args,
      instructions: [
        'Identify patient/subject and their expressed wishes',
        'Identify family members and their interests',
        'Identify healthcare providers and their obligations',
        'Identify institutional stakeholders',
        'Identify societal interests if relevant',
        'Document values important to each stakeholder',
        'Note any conflicts between stakeholder values',
        'Save stakeholder analysis to output directory'
      ],
      outputFormat: 'JSON with stakeholders, values, conflicts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'values', 'artifacts'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              interests: { type: 'array', items: { type: 'string' } },
              wishes: { type: 'string' },
              decisionCapacity: { type: 'string' }
            }
          }
        },
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              stakeholder: { type: 'string' },
              weight: { type: 'string' }
            }
          }
        },
        conflicts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'bioethics', 'stakeholders']
}));

// Task 3: Principle-Based Analysis
export const principleAnalysisTask = defineTask('principle-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct principle-based ethical analysis',
  agent: {
    name: 'principle-analyst',
    prompt: {
      role: 'bioethicist',
      task: 'Apply bioethical principles (Beauchamp & Childress) to analyze the case',
      context: args,
      instructions: [
        'Apply principle of respect for autonomy',
        'Apply principle of beneficence',
        'Apply principle of non-maleficence',
        'Apply principle of justice',
        'Identify which principles are in tension',
        'Assess how to balance competing principles',
        'Consider specification of principles for this case',
        'Save principle analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (principleApplications), issues, balancing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'issues', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            autonomy: {
              type: 'object',
              properties: {
                application: { type: 'string' },
                supports: { type: 'string' },
                concerns: { type: 'array', items: { type: 'string' } }
              }
            },
            beneficence: { type: 'object' },
            nonMaleficence: { type: 'object' },
            justice: { type: 'object' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        balancing: {
          type: 'object',
          properties: {
            tensions: { type: 'array', items: { type: 'string' } },
            resolution: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'bioethics', 'principles']
}));

// Task 4: Case-Based Reasoning
export const caseBasedReasoningTask = defineTask('case-based-reasoning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply case-based reasoning',
  agent: {
    name: 'casuistry-analyst',
    prompt: {
      role: 'bioethicist',
      task: 'Apply casuistic reasoning using paradigm cases and analogical analysis',
      context: args,
      instructions: [
        'Identify paradigm cases with clear ethical judgments',
        'Find cases analogous to the current situation',
        'Identify morally relevant features for comparison',
        'Note similarities and differences with precedent cases',
        'Draw conclusions from analogical reasoning',
        'Consider counterexamples or disanalogies',
        'Assess strength of casuistic argument',
        'Save case-based analysis to output directory'
      ],
      outputFormat: 'JSON with analysis, precedents, analogies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'precedents', 'artifacts'],
      properties: {
        analysis: { type: 'string' },
        precedents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              caseName: { type: 'string' },
              description: { type: 'string' },
              verdict: { type: 'string' },
              relevantFeatures: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        analogies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              precedent: { type: 'string' },
              similarities: { type: 'array', items: { type: 'string' } },
              differences: { type: 'array', items: { type: 'string' } },
              implication: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'bioethics', 'casuistry']
}));

// Task 5: Committee Deliberation
export const committeeDeliberationTask = defineTask('committee-deliberation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulate ethics committee deliberation',
  agent: {
    name: 'committee-facilitator',
    prompt: {
      role: 'ethics committee chair',
      task: 'Simulate a structured ethics committee deliberation process',
      context: args,
      instructions: [
        'Present different perspectives on the case',
        'Facilitate discussion of principle applications',
        'Consider stakeholder perspectives',
        'Identify areas of agreement',
        'Document areas of disagreement',
        'Work toward consensus where possible',
        'Record dissenting opinions',
        'Save deliberation outcome to output directory'
      ],
      outputFormat: 'JSON with outcome (consensus, positions, dissent), deliberationNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outcome', 'artifacts'],
      properties: {
        outcome: {
          type: 'object',
          properties: {
            consensus: { type: 'boolean' },
            majorityPosition: { type: 'string' },
            positions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  position: { type: 'string' },
                  reasoning: { type: 'string' },
                  support: { type: 'number' }
                }
              }
            },
            dissent: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  position: { type: 'string' },
                  reasoning: { type: 'string' }
                }
              }
            }
          }
        },
        deliberationNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'bioethics', 'committee']
}));

// Task 6: Recommendation Formulation
export const recommendationFormulationTask = defineTask('recommendation-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate ethical recommendations',
  agent: {
    name: 'recommendation-formulator',
    prompt: {
      role: 'bioethics consultant',
      task: 'Formulate clear ethical recommendations based on deliberation',
      context: args,
      instructions: [
        'State primary recommendation clearly',
        'Provide ethical justification',
        'Specify conditions or limitations',
        'Offer alternative courses of action',
        'Note required safeguards',
        'Specify follow-up considerations',
        'Include documentation requirements',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with primary, recommendations, alternatives, safeguards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primary', 'recommendations', 'artifacts'],
      properties: {
        primary: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              justification: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alternatives: { type: 'array', items: { type: 'string' } },
        safeguards: { type: 'array', items: { type: 'string' } },
        followUp: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'bioethics', 'recommendations']
}));

// Task 7: Deliberation Report
export const deliberationReportTask = defineTask('deliberation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate bioethics deliberation report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'bioethics consultant and technical writer',
      task: 'Generate comprehensive bioethics deliberation report',
      context: args,
      instructions: [
        'Create executive summary with recommendation',
        'Present case facts and context',
        'Document stakeholders and values',
        'Detail principle-based analysis',
        'Include case-based reasoning',
        'Document committee deliberation process',
        'Present recommendations with justification',
        'Include dissenting views',
        'Note limitations and caveats',
        'Format as professional clinical ethics report',
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
  labels: ['agent', 'philosophy', 'bioethics', 'reporting']
}));
