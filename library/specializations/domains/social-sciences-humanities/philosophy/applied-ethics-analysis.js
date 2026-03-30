/**
 * @process philosophy/applied-ethics-analysis
 * @description Analyze practical moral problems using multiple ethical frameworks (deontological, consequentialist, virtue ethics), identify stakeholders, and develop reasoned ethical recommendations
 * @inputs { caseDescription: string, frameworks: array, stakeholderAnalysis: boolean, outputDir: string }
 * @outputs { success: boolean, ethicalAnalysis: object, frameworkEvaluations: array, recommendations: array, artifacts: array }
 * @recommendedSkills SK-PHIL-003 (ethical-framework-application), SK-PHIL-014 (socratic-dialogue-facilitation), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-002 (ethics-consultant-agent), AG-PHIL-007 (critical-thinking-educator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    caseDescription,
    frameworks = ['deontological', 'consequentialist', 'virtue'],
    stakeholderAnalysis = true,
    outputDir = 'ethics-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Case Analysis and Issue Identification
  ctx.log('info', 'Starting applied ethics analysis: Analyzing case');
  const caseAnalysis = await ctx.task(caseAnalysisTask, {
    caseDescription,
    outputDir
  });

  if (!caseAnalysis.success) {
    return {
      success: false,
      error: 'Case analysis failed',
      details: caseAnalysis,
      metadata: { processId: 'philosophy/applied-ethics-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...caseAnalysis.artifacts);

  // Task 2: Stakeholder Identification (if requested)
  let stakeholders = null;
  if (stakeholderAnalysis) {
    ctx.log('info', 'Identifying stakeholders');
    stakeholders = await ctx.task(stakeholderIdentificationTask, {
      caseDescription,
      issues: caseAnalysis.issues,
      outputDir
    });
    artifacts.push(...stakeholders.artifacts);
  }

  // Task 3: Framework Applications (parallel for each framework)
  const frameworkResults = [];
  for (const framework of frameworks) {
    ctx.log('info', `Applying ${framework} framework`);
    const frameworkAnalysis = await ctx.task(frameworkApplicationTask, {
      caseDescription,
      issues: caseAnalysis.issues,
      framework,
      stakeholders: stakeholders?.identified,
      outputDir
    });
    frameworkResults.push(frameworkAnalysis);
    artifacts.push(...frameworkAnalysis.artifacts);
  }

  // Task 4: Framework Comparison and Synthesis
  ctx.log('info', 'Comparing and synthesizing framework results');
  const frameworkSynthesis = await ctx.task(frameworkSynthesisTask, {
    frameworkResults,
    issues: caseAnalysis.issues,
    outputDir
  });

  artifacts.push(...frameworkSynthesis.artifacts);

  // Task 5: Ethical Recommendation Development
  ctx.log('info', 'Developing ethical recommendations');
  const recommendations = await ctx.task(recommendationDevelopmentTask, {
    caseAnalysis,
    frameworkResults,
    synthesis: frameworkSynthesis.synthesis,
    stakeholders: stakeholders?.identified,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // Breakpoint: Review ethics analysis
  await ctx.breakpoint({
    question: `Applied ethics analysis complete. Analyzed using ${frameworks.length} frameworks. ${frameworkSynthesis.synthesis.consensus ? 'Frameworks reach consensus.' : 'Frameworks diverge.'} Review the analysis?`,
    title: 'Applied Ethics Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        frameworks,
        issueCount: caseAnalysis.issues.length,
        stakeholderCount: stakeholders?.identified?.length || 0,
        hasConsensus: frameworkSynthesis.synthesis.consensus,
        recommendationCount: recommendations.recommendations.length
      }
    }
  });

  // Task 6: Generate Ethics Analysis Report
  ctx.log('info', 'Generating ethics analysis report');
  const analysisReport = await ctx.task(ethicsReportTask, {
    caseDescription,
    caseAnalysis,
    stakeholders,
    frameworkResults,
    frameworkSynthesis,
    recommendations,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    ethicalAnalysis: {
      case: caseDescription,
      issues: caseAnalysis.issues,
      stakeholders: stakeholders?.identified,
      moralDimensions: caseAnalysis.moralDimensions
    },
    frameworkEvaluations: frameworkResults.map(r => ({
      framework: r.framework,
      verdict: r.verdict,
      reasoning: r.reasoning,
      principles: r.principles
    })),
    synthesis: frameworkSynthesis.synthesis,
    recommendations: recommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/applied-ethics-analysis',
      timestamp: startTime,
      frameworks,
      outputDir
    }
  };
}

// Task 1: Case Analysis
export const caseAnalysisTask = defineTask('case-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze ethical case and identify issues',
  agent: {
    name: 'ethics-analyst',
    prompt: {
      role: 'applied ethicist',
      task: 'Analyze the ethical case and identify key moral issues',
      context: args,
      instructions: [
        'Identify the central ethical dilemma or question',
        'List all relevant moral issues at stake',
        'Identify competing values or principles in tension',
        'Note relevant factual considerations',
        'Identify what decisions need to be made',
        'Note any time constraints or urgency factors',
        'Identify moral dimensions (autonomy, beneficence, justice, etc.)',
        'Save case analysis to output directory'
      ],
      outputFormat: 'JSON with success, issues, moralDimensions, decisionPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'issues', 'moralDimensions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        moralDimensions: { type: 'array', items: { type: 'string' } },
        competingValues: { type: 'array', items: { type: 'string' } },
        decisionPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ethics', 'case-analysis']
}));

// Task 2: Stakeholder Identification
export const stakeholderIdentificationTask = defineTask('stakeholder-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and analyze stakeholders',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'applied ethicist',
      task: 'Identify all stakeholders and their interests in the ethical case',
      context: args,
      instructions: [
        'Identify all directly affected parties',
        'Identify indirectly affected parties',
        'Note each stakeholder interests and concerns',
        'Identify power dynamics between stakeholders',
        'Note vulnerable or marginalized stakeholders',
        'Consider future generations if relevant',
        'Identify stakeholder rights and claims',
        'Save stakeholder analysis to output directory'
      ],
      outputFormat: 'JSON with identified (stakeholders with interests, rights), powerDynamics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['identified', 'artifacts'],
      properties: {
        identified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              interests: { type: 'array', items: { type: 'string' } },
              rights: { type: 'array', items: { type: 'string' } },
              vulnerabilities: { type: 'array', items: { type: 'string' } },
              power: { type: 'string' }
            }
          }
        },
        powerDynamics: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ethics', 'stakeholder']
}));

// Task 3: Framework Application
export const frameworkApplicationTask = defineTask('framework-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply ethical framework to case',
  agent: {
    name: 'ethics-framework-analyst',
    prompt: {
      role: 'moral philosopher',
      task: 'Apply the specified ethical framework to analyze the case',
      context: args,
      instructions: [
        'For deontological: apply Kantian duties, categorical imperative, rights-based analysis',
        'For consequentialist: assess outcomes, calculate utility, consider all affected parties',
        'For virtue ethics: consider character, virtues, what a virtuous person would do',
        'Identify relevant principles from the framework',
        'Apply principles to the specific case',
        'Reach a verdict or recommendation based on framework',
        'Note limitations or difficulties in applying the framework',
        'Save framework analysis to output directory'
      ],
      outputFormat: 'JSON with framework, verdict, reasoning, principles, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'verdict', 'reasoning', 'artifacts'],
      properties: {
        framework: { type: 'string' },
        verdict: { type: 'string' },
        reasoning: { type: 'string' },
        principles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              application: { type: 'string' }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ethics', 'framework']
}));

// Task 4: Framework Synthesis
export const frameworkSynthesisTask = defineTask('framework-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare and synthesize framework results',
  agent: {
    name: 'ethics-synthesizer',
    prompt: {
      role: 'moral philosopher',
      task: 'Compare framework results and synthesize ethical guidance',
      context: args,
      instructions: [
        'Compare verdicts across frameworks',
        'Identify areas of agreement and disagreement',
        'Analyze reasons for any divergence',
        'Weigh framework considerations',
        'Identify which framework is most applicable to case',
        'Develop synthesis position if possible',
        'Note any irresolvable conflicts',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with synthesis (consensus, agreements, disagreements, weightedPosition), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'artifacts'],
      properties: {
        synthesis: {
          type: 'object',
          properties: {
            consensus: { type: 'boolean' },
            agreements: { type: 'array', items: { type: 'string' } },
            disagreements: { type: 'array', items: { type: 'string' } },
            weightedPosition: { type: 'string' },
            dominantFramework: { type: 'string' },
            irresolvableConflicts: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'ethics', 'synthesis']
}));

// Task 5: Recommendation Development
export const recommendationDevelopmentTask = defineTask('recommendation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop ethical recommendations',
  agent: {
    name: 'ethics-advisor',
    prompt: {
      role: 'applied ethicist',
      task: 'Develop concrete ethical recommendations for the case',
      context: args,
      instructions: [
        'Formulate primary ethical recommendation',
        'Provide justification grounded in ethical analysis',
        'Consider practical implementation challenges',
        'Identify any conditions or qualifications',
        'Suggest alternative courses of action',
        'Note potential objections and responses',
        'Consider long-term implications',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (primary, alternatives, justification), implementation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              justification: { type: 'string' },
              priority: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alternatives: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'string' },
        potentialObjections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ethics', 'recommendations']
}));

// Task 6: Ethics Report
export const ethicsReportTask = defineTask('ethics-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate applied ethics analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'applied ethicist and technical writer',
      task: 'Generate comprehensive applied ethics analysis report',
      context: args,
      instructions: [
        'Create executive summary with key recommendation',
        'Present case description and context',
        'Document identified ethical issues',
        'Present stakeholder analysis if performed',
        'Detail each framework analysis',
        'Present synthesis and comparison',
        'Provide detailed recommendations with justification',
        'Include dissenting considerations',
        'Format as professional Markdown report',
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
  labels: ['agent', 'philosophy', 'ethics', 'reporting']
}));
