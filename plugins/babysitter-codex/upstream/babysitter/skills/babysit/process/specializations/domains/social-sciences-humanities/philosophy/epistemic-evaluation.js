/**
 * @process philosophy/epistemic-evaluation
 * @description Assess knowledge claims, belief justification, and epistemic warrant using foundationalist, coherentist, reliabilist, or virtue epistemological frameworks
 * @inputs { knowledgeClaim: string, epistemicFramework: string, assessJustification: boolean, outputDir: string }
 * @outputs { success: boolean, epistemicAssessment: object, justificationAnalysis: object, warrantEvaluation: object, artifacts: array }
 * @recommendedSkills SK-PHIL-007 (evidence-justification-assessment), SK-PHIL-005 (conceptual-analysis), SK-PHIL-002 (argument-mapping-reconstruction)
 * @recommendedAgents AG-PHIL-004 (metaphysics-epistemology-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeClaim,
    epistemicFramework = 'multi-framework',
    assessJustification = true,
    outputDir = 'epistemic-evaluation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Claim Analysis
  ctx.log('info', 'Starting epistemic evaluation: Analyzing the claim');
  const claimAnalysis = await ctx.task(claimAnalysisTask, {
    knowledgeClaim,
    outputDir
  });

  if (!claimAnalysis.success) {
    return {
      success: false,
      error: 'Claim analysis failed',
      details: claimAnalysis,
      metadata: { processId: 'philosophy/epistemic-evaluation', timestamp: startTime }
    };
  }

  artifacts.push(...claimAnalysis.artifacts);

  // Task 2: Belief Assessment
  ctx.log('info', 'Assessing belief conditions');
  const beliefAssessment = await ctx.task(beliefAssessmentTask, {
    claim: claimAnalysis.analyzed,
    outputDir
  });

  artifacts.push(...beliefAssessment.artifacts);

  // Task 3: Truth Condition Evaluation
  ctx.log('info', 'Evaluating truth conditions');
  const truthEvaluation = await ctx.task(truthEvaluationTask, {
    claim: claimAnalysis.analyzed,
    outputDir
  });

  artifacts.push(...truthEvaluation.artifacts);

  // Task 4: Justification Analysis (if requested)
  let justificationAnalysis = null;
  if (assessJustification) {
    ctx.log('info', `Analyzing justification using ${epistemicFramework} framework`);
    justificationAnalysis = await ctx.task(justificationAnalysisTask, {
      claim: claimAnalysis.analyzed,
      epistemicFramework,
      outputDir
    });
    artifacts.push(...justificationAnalysis.artifacts);
  }

  // Task 5: Warrant Evaluation
  ctx.log('info', 'Evaluating epistemic warrant');
  const warrantEvaluation = await ctx.task(warrantEvaluationTask, {
    claim: claimAnalysis.analyzed,
    beliefAssessment,
    truthEvaluation,
    justificationAnalysis,
    epistemicFramework,
    outputDir
  });

  artifacts.push(...warrantEvaluation.artifacts);

  // Task 6: Gettier Problem Check
  ctx.log('info', 'Checking for Gettier-style problems');
  const gettierCheck = await ctx.task(gettierCheckTask, {
    claim: claimAnalysis.analyzed,
    justificationAnalysis,
    warrantEvaluation,
    outputDir
  });

  artifacts.push(...gettierCheck.artifacts);

  // Breakpoint: Review epistemic evaluation
  await ctx.breakpoint({
    question: `Epistemic evaluation complete. Claim ${warrantEvaluation.knowledgeStatus}. Review the evaluation?`,
    title: 'Epistemic Evaluation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        claim: knowledgeClaim,
        framework: epistemicFramework,
        knowledgeStatus: warrantEvaluation.knowledgeStatus,
        gettierIssues: gettierCheck.hasGettierIssues
      }
    }
  });

  // Task 7: Generate Epistemic Report
  ctx.log('info', 'Generating epistemic evaluation report');
  const epistemicReport = await ctx.task(epistemicReportTask, {
    knowledgeClaim,
    claimAnalysis,
    beliefAssessment,
    truthEvaluation,
    justificationAnalysis,
    warrantEvaluation,
    gettierCheck,
    outputDir
  });

  artifacts.push(...epistemicReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    epistemicAssessment: {
      claim: knowledgeClaim,
      analyzedClaim: claimAnalysis.analyzed,
      beliefStatus: beliefAssessment.status,
      truthStatus: truthEvaluation.status,
      knowledgeStatus: warrantEvaluation.knowledgeStatus
    },
    justificationAnalysis: justificationAnalysis ? {
      framework: epistemicFramework,
      justificationStatus: justificationAnalysis.status,
      justificationStructure: justificationAnalysis.structure,
      strengths: justificationAnalysis.strengths,
      weaknesses: justificationAnalysis.weaknesses
    } : null,
    warrantEvaluation: {
      hasWarrant: warrantEvaluation.hasWarrant,
      warrantType: warrantEvaluation.warrantType,
      gettierIssues: gettierCheck.hasGettierIssues,
      finalAssessment: warrantEvaluation.finalAssessment
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/epistemic-evaluation',
      timestamp: startTime,
      epistemicFramework,
      outputDir
    }
  };
}

// Task 1: Claim Analysis
export const claimAnalysisTask = defineTask('claim-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the knowledge claim',
  agent: {
    name: 'claim-analyst',
    prompt: {
      role: 'epistemologist',
      task: 'Analyze the knowledge claim for epistemic evaluation',
      context: args,
      instructions: [
        'Identify the propositional content of the claim',
        'Identify the subject (knower) if specified',
        'Clarify any ambiguities in the claim',
        'Identify the type of knowledge (propositional, procedural, acquaintance)',
        'Note the domain of the claim (empirical, mathematical, moral, etc.)',
        'Identify what evidence would be relevant',
        'Note any contextual factors',
        'Save claim analysis to output directory'
      ],
      outputFormat: 'JSON with success, analyzed (proposition, subject, type, domain), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analyzed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analyzed: {
          type: 'object',
          properties: {
            proposition: { type: 'string' },
            subject: { type: 'string' },
            knowledgeType: { type: 'string' },
            domain: { type: 'string' },
            relevantEvidence: { type: 'array', items: { type: 'string' } },
            contextualFactors: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'epistemology', 'claim-analysis']
}));

// Task 2: Belief Assessment
export const beliefAssessmentTask = defineTask('belief-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess belief conditions',
  agent: {
    name: 'belief-assessor',
    prompt: {
      role: 'epistemologist',
      task: 'Assess whether the belief condition for knowledge is met',
      context: args,
      instructions: [
        'Determine if the subject believes the proposition',
        'Assess the degree of belief (full belief vs. credence)',
        'Consider dispositional vs. occurrent belief',
        'Note any belief-forming processes involved',
        'Consider if belief is voluntary or involuntary',
        'Assess stability of the belief',
        'Note any relevant psychological factors',
        'Save belief assessment to output directory'
      ],
      outputFormat: 'JSON with status, beliefType, degree, process, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'string' },
        beliefType: { type: 'string' },
        degree: { type: 'string' },
        process: { type: 'string' },
        stability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'epistemology', 'belief']
}));

// Task 3: Truth Evaluation
export const truthEvaluationTask = defineTask('truth-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate truth conditions',
  agent: {
    name: 'truth-evaluator',
    prompt: {
      role: 'epistemologist',
      task: 'Evaluate whether the truth condition for knowledge is met',
      context: args,
      instructions: [
        'Assess the truth value of the proposition',
        'Consider available evidence for truth',
        'Note uncertainty about truth value',
        'Consider the theory of truth applicable',
        'Assess reliability of truth-determining methods',
        'Note any defeaters for truth',
        'Consider counterfactual robustness',
        'Save truth evaluation to output directory'
      ],
      outputFormat: 'JSON with status, evidence, uncertainty, defeaters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'string' },
        evidence: { type: 'array', items: { type: 'string' } },
        uncertainty: { type: 'string' },
        truthTheory: { type: 'string' },
        defeaters: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'epistemology', 'truth']
}));

// Task 4: Justification Analysis
export const justificationAnalysisTask = defineTask('justification-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze justification',
  agent: {
    name: 'justification-analyst',
    prompt: {
      role: 'epistemologist',
      task: 'Analyze the justification for the belief using the specified framework',
      context: args,
      instructions: [
        'For foundationalism: identify basic beliefs and inferential structure',
        'For coherentism: assess coherence with belief system',
        'For reliabilism: evaluate reliability of belief-forming process',
        'For virtue epistemology: assess intellectual virtues involved',
        'Identify the justification structure',
        'Assess strength of justification',
        'Identify strengths and weaknesses',
        'Save justification analysis to output directory'
      ],
      outputFormat: 'JSON with status, structure, strengths, weaknesses, frameworkAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'structure', 'artifacts'],
      properties: {
        status: { type: 'string' },
        structure: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            basicBeliefs: { type: 'array', items: { type: 'string' } },
            inferences: { type: 'array', items: { type: 'string' } },
            coherenceFactors: { type: 'array', items: { type: 'string' } },
            reliabilityFactors: { type: 'array', items: { type: 'string' } },
            virtuesInvolved: { type: 'array', items: { type: 'string' } }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'epistemology', 'justification']
}));

// Task 5: Warrant Evaluation
export const warrantEvaluationTask = defineTask('warrant-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate epistemic warrant',
  agent: {
    name: 'warrant-evaluator',
    prompt: {
      role: 'epistemologist',
      task: 'Evaluate overall epistemic warrant for the knowledge claim',
      context: args,
      instructions: [
        'Synthesize belief, truth, and justification assessments',
        'Determine if warrant conditions are met',
        'Identify the type of warrant (if any)',
        'Consider anti-luck conditions',
        'Assess if belief is properly based on justification',
        'Determine overall knowledge status',
        'Note any conditions not fully met',
        'Save warrant evaluation to output directory'
      ],
      outputFormat: 'JSON with hasWarrant, warrantType, knowledgeStatus, finalAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasWarrant', 'knowledgeStatus', 'artifacts'],
      properties: {
        hasWarrant: { type: 'boolean' },
        warrantType: { type: 'string' },
        knowledgeStatus: { type: 'string' },
        antiLuckCondition: { type: 'string' },
        properBasing: { type: 'string' },
        finalAssessment: { type: 'string' },
        unmetConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'epistemology', 'warrant']
}));

// Task 6: Gettier Check
export const gettierCheckTask = defineTask('gettier-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check for Gettier-style problems',
  agent: {
    name: 'gettier-checker',
    prompt: {
      role: 'epistemologist',
      task: 'Check for Gettier-style problems with the justified true belief',
      context: args,
      instructions: [
        'Consider if the case involves epistemic luck',
        'Check for disconnection between justification and truth',
        'Consider if belief is true for wrong reasons',
        'Analyze whether anti-Gettier conditions are met',
        'Consider relevant defeaters',
        'Assess sensitivity and safety of the belief',
        'Determine if knowledge despite Gettier concerns',
        'Save Gettier check to output directory'
      ],
      outputFormat: 'JSON with hasGettierIssues, issues, antiGettierConditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasGettierIssues', 'artifacts'],
      properties: {
        hasGettierIssues: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        antiGettierConditions: {
          type: 'object',
          properties: {
            sensitivity: { type: 'string' },
            safety: { type: 'string' },
            noDefeaters: { type: 'string' }
          }
        },
        analysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'epistemology', 'gettier']
}));

// Task 7: Epistemic Report
export const epistemicReportTask = defineTask('epistemic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate epistemic evaluation report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'epistemologist and technical writer',
      task: 'Generate comprehensive epistemic evaluation report',
      context: args,
      instructions: [
        'Create executive summary with knowledge status',
        'Present the knowledge claim analyzed',
        'Document belief assessment',
        'Document truth evaluation',
        'Present justification analysis',
        'Include warrant evaluation',
        'Present Gettier problem analysis',
        'Note conclusions and caveats',
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
  labels: ['agent', 'philosophy', 'epistemology', 'reporting']
}));
