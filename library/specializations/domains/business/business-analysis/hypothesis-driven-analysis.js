/**
 * @process ba-hypothesis-driven-analysis
 * @description Structured hypothesis-driven problem solving process using McKinsey-style
 * pyramid principle, issue trees, and data-driven hypothesis testing for business analysis.
 * @inputs {
 *   problemContext: { businessUnit: string, domain: string, problemType: string },
 *   problemStatement: string,
 *   initialHypotheses: string[],
 *   availableData: { sources: string[], limitations: string[] },
 *   stakeholders: object[],
 *   constraints: { timeline: string, resources: string, access: string[] }
 * }
 * @outputs {
 *   issueTree: object,
 *   hypotheses: object[],
 *   analysisWorkplan: object,
 *   findings: object[],
 *   synthesizedInsights: object,
 *   recommendations: object[]
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const problemStructuringTask = defineTask('problem-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure Problem Using Issue Trees',
  agent: {
    name: 'problem-structurer',
    prompt: {
      role: 'Strategy Consultant specializing in problem structuring and McKinsey-style analysis',
      task: 'Structure the problem using MECE issue trees and identify key questions to answer',
      context: args,
      instructions: [
        'Analyze and refine the problem statement',
        'Create MECE (Mutually Exclusive, Collectively Exhaustive) issue tree',
        'Identify primary branches and sub-branches',
        'Define key questions at each level',
        'Prioritize issues by impact and feasibility',
        'Map issues to potential data sources',
        'Identify analytical approaches for each branch',
        'Create problem structuring summary'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        refinedProblem: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            scope: { type: 'string' },
            boundaries: { type: 'array', items: { type: 'string' } }
          }
        },
        issueTree: {
          type: 'object',
          properties: {
            root: { type: 'string' },
            branches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  issue: { type: 'string' },
                  keyQuestions: { type: 'array', items: { type: 'string' } },
                  subBranches: { type: 'array', items: { type: 'object' } },
                  priority: { type: 'string' },
                  dataRequired: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        keyQuestions: { type: 'array', items: { type: 'object' } },
        priorityMatrix: { type: 'object' }
      },
      required: ['refinedProblem', 'issueTree', 'keyQuestions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const hypothesisFormulationTask = defineTask('hypothesis-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate and Prioritize Hypotheses',
  agent: {
    name: 'hypothesis-formulator',
    prompt: {
      role: 'Business Analyst with expertise in hypothesis-driven consulting',
      task: 'Develop testable hypotheses for each issue branch with clear testing criteria',
      context: args,
      instructions: [
        'Review issue tree and key questions',
        'Formulate initial hypotheses for each branch',
        'Ensure hypotheses are specific and testable',
        'Define what would prove/disprove each hypothesis',
        'Identify data and analysis needed to test',
        'Prioritize hypotheses by impact and testability',
        'Create hypothesis tracking structure',
        'Link hypotheses to potential recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              issueId: { type: 'string' },
              statement: { type: 'string' },
              rationale: { type: 'string' },
              testCriteria: {
                type: 'object',
                properties: {
                  proveIf: { type: 'array', items: { type: 'string' } },
                  disproveIf: { type: 'array', items: { type: 'string' } }
                }
              },
              dataRequired: { type: 'array', items: { type: 'string' } },
              analysisApproach: { type: 'string' },
              priority: { type: 'string' },
              confidence: { type: 'string' },
              linkedRecommendation: { type: 'string' }
            }
          }
        },
        priorityOrder: { type: 'array', items: { type: 'string' } },
        hypothesisTree: { type: 'object' }
      },
      required: ['hypotheses', 'priorityOrder']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analysisWorkplanTask = defineTask('analysis-workplan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Analysis Workplan',
  agent: {
    name: 'analysis-planner',
    prompt: {
      role: 'Analytics Lead specializing in hypothesis testing and data analysis',
      task: 'Create detailed workplan for testing each hypothesis with specific analyses',
      context: args,
      instructions: [
        'Map hypotheses to specific analyses',
        'Identify data requirements and sources',
        'Define analytical methods for each hypothesis',
        'Estimate effort and timeline for each analysis',
        'Identify dependencies between analyses',
        'Plan for data collection and preparation',
        'Define output format for each analysis',
        'Create analysis sprint plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysisWorkplan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              analysisId: { type: 'string' },
              hypothesisId: { type: 'string' },
              analysisName: { type: 'string' },
              method: { type: 'string' },
              dataRequired: { type: 'array', items: { type: 'object' } },
              steps: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              outputFormat: { type: 'string' }
            }
          }
        },
        dataCollectionPlan: { type: 'object' },
        sprintPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'number' },
              analyses: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        resourceRequirements: { type: 'object' }
      },
      required: ['analysisWorkplan', 'sprintPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const hypothesisTestingTask = defineTask('hypothesis-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Hypothesis Testing Analysis',
  agent: {
    name: 'hypothesis-tester',
    prompt: {
      role: 'Data Analyst specializing in hypothesis testing and business analytics',
      task: 'Execute analysis to test hypotheses and document findings',
      context: args,
      instructions: [
        'Execute planned analyses for hypothesis testing',
        'Document data sources and methodology',
        'Record quantitative and qualitative findings',
        'Determine hypothesis status (proved/disproved/inconclusive)',
        'Calculate confidence levels',
        'Identify unexpected findings',
        'Document limitations and caveats',
        'Create supporting exhibits'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesisId: { type: 'string' },
              analysisId: { type: 'string' },
              status: { type: 'string', enum: ['proved', 'disproved', 'partially_proved', 'inconclusive'] },
              confidence: { type: 'string' },
              keyFindings: { type: 'array', items: { type: 'string' } },
              supportingData: { type: 'object' },
              unexpectedInsights: { type: 'array', items: { type: 'string' } },
              limitations: { type: 'array', items: { type: 'string' } },
              exhibits: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        dataQuality: { type: 'object' },
        additionalQuestionsRaised: { type: 'array', items: { type: 'string' } }
      },
      required: ['findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const insightSynthesisTask = defineTask('insight-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Insights from Findings',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'Senior Consultant specializing in insight synthesis and storytelling',
      task: 'Synthesize findings into coherent insights using pyramid principle',
      context: args,
      instructions: [
        'Review all hypothesis testing findings',
        'Identify patterns and themes across findings',
        'Synthesize findings into key insights',
        'Structure insights using pyramid principle',
        'Create governing thought/main message',
        'Develop supporting arguments',
        'Quantify impact where possible',
        'Create insight storyline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        synthesizedInsights: {
          type: 'object',
          properties: {
            governingThought: { type: 'string' },
            keyInsights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  insight: { type: 'string' },
                  supportingPoints: { type: 'array', items: { type: 'string' } },
                  evidence: { type: 'array', items: { type: 'string' } },
                  impact: { type: 'string' }
                }
              }
            },
            pyramidStructure: { type: 'object' }
          }
        },
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              relatedFindings: { type: 'array', items: { type: 'string' } },
              implication: { type: 'string' }
            }
          }
        },
        storyLine: { type: 'object' }
      },
      required: ['synthesizedInsights', 'themes']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const recommendationDevelopmentTask = defineTask('recommendation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Actionable Recommendations',
  agent: {
    name: 'recommendation-developer',
    prompt: {
      role: 'Strategy Consultant specializing in recommendation development',
      task: 'Translate insights into specific, actionable recommendations with implementation guidance',
      context: args,
      instructions: [
        'Review synthesized insights',
        'Develop specific recommendations',
        'Ensure recommendations are actionable and specific',
        'Prioritize recommendations by impact and feasibility',
        'Define success metrics for each recommendation',
        'Outline implementation considerations',
        'Identify risks and mitigation',
        'Create recommendation roadmap'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              linkedInsights: { type: 'array', items: { type: 'string' } },
              expectedImpact: { type: 'object' },
              implementationSteps: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' },
              resources: { type: 'string' },
              risks: { type: 'array', items: { type: 'object' } },
              successMetrics: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        prioritizationMatrix: { type: 'object' },
        implementationRoadmap: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'object' } }
      },
      required: ['recommendations', 'implementationRoadmap']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const deliverablePackagingTask = defineTask('deliverable-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Package Final Deliverables',
  agent: {
    name: 'deliverable-packager',
    prompt: {
      role: 'Engagement Manager specializing in consulting deliverables',
      task: 'Package all analysis outputs into client-ready deliverables',
      context: args,
      instructions: [
        'Structure executive summary',
        'Organize findings and insights',
        'Format recommendations section',
        'Create supporting appendices',
        'Design presentation storyline',
        'Prepare backup slides/exhibits',
        'Create one-page summary',
        'Prepare Q&A anticipation guide'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: { type: 'object' },
        mainDeliverable: {
          type: 'object',
          properties: {
            problemContext: { type: 'object' },
            approachOverview: { type: 'object' },
            keyFindings: { type: 'array', items: { type: 'object' } },
            insights: { type: 'array', items: { type: 'object' } },
            recommendations: { type: 'array', items: { type: 'object' } },
            implementationRoadmap: { type: 'object' },
            appendices: { type: 'array', items: { type: 'object' } }
          }
        },
        presentationOutline: { type: 'object' },
        onePager: { type: 'object' },
        anticipatedQuestions: { type: 'array', items: { type: 'object' } }
      },
      required: ['executiveSummary', 'mainDeliverable']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Hypothesis-Driven Analysis process');

  const artifacts = {
    problemStructure: null,
    hypotheses: null,
    analysisWorkplan: null,
    findings: null,
    insights: null,
    recommendations: null,
    deliverables: null
  };

  // Phase 1: Problem Structuring
  ctx.log('Phase 1: Structuring problem using issue trees');
  const structureResult = await ctx.task(problemStructuringTask, {
    problemContext: inputs.problemContext,
    problemStatement: inputs.problemStatement,
    initialHypotheses: inputs.initialHypotheses,
    constraints: inputs.constraints
  });
  artifacts.problemStructure = structureResult;

  // Phase 2: Hypothesis Formulation
  ctx.log('Phase 2: Formulating and prioritizing hypotheses');
  const hypothesesResult = await ctx.task(hypothesisFormulationTask, {
    problemStructure: artifacts.problemStructure,
    initialHypotheses: inputs.initialHypotheses,
    availableData: inputs.availableData
  });
  artifacts.hypotheses = hypothesesResult;

  // Phase 3: Analysis Workplan
  ctx.log('Phase 3: Creating analysis workplan');
  const workplanResult = await ctx.task(analysisWorkplanTask, {
    hypotheses: artifacts.hypotheses,
    availableData: inputs.availableData,
    constraints: inputs.constraints
  });
  artifacts.analysisWorkplan = workplanResult;

  // Breakpoint for workplan approval
  await ctx.breakpoint('workplan-approval', {
    question: 'Review the analysis workplan. Are the hypotheses and analytical approaches appropriate?',
    artifacts: {
      problemStructure: artifacts.problemStructure,
      hypotheses: artifacts.hypotheses,
      analysisWorkplan: artifacts.analysisWorkplan
    }
  });

  // Phase 4: Hypothesis Testing
  ctx.log('Phase 4: Executing hypothesis testing analysis');
  const findingsResult = await ctx.task(hypothesisTestingTask, {
    hypotheses: artifacts.hypotheses,
    analysisWorkplan: artifacts.analysisWorkplan,
    availableData: inputs.availableData
  });
  artifacts.findings = findingsResult;

  // Phase 5: Insight Synthesis
  ctx.log('Phase 5: Synthesizing insights from findings');
  const insightsResult = await ctx.task(insightSynthesisTask, {
    findings: artifacts.findings,
    hypotheses: artifacts.hypotheses,
    problemStructure: artifacts.problemStructure
  });
  artifacts.insights = insightsResult;

  // Phase 6: Recommendation Development
  ctx.log('Phase 6: Developing actionable recommendations');
  const recommendationsResult = await ctx.task(recommendationDevelopmentTask, {
    insights: artifacts.insights,
    findings: artifacts.findings,
    problemContext: inputs.problemContext,
    constraints: inputs.constraints
  });
  artifacts.recommendations = recommendationsResult;

  // Breakpoint for recommendations review
  await ctx.breakpoint('recommendations-review', {
    question: 'Review the insights and recommendations. Are they well-supported and actionable?',
    artifacts: {
      insights: artifacts.insights,
      recommendations: artifacts.recommendations
    }
  });

  // Phase 7: Deliverable Packaging
  ctx.log('Phase 7: Packaging final deliverables');
  const deliverablesResult = await ctx.task(deliverablePackagingTask, {
    problemStructure: artifacts.problemStructure,
    findings: artifacts.findings,
    insights: artifacts.insights,
    recommendations: artifacts.recommendations,
    stakeholders: inputs.stakeholders
  });
  artifacts.deliverables = deliverablesResult;

  ctx.log('Hypothesis-Driven Analysis process completed');

  return {
    success: true,
    issueTree: artifacts.problemStructure.issueTree,
    hypotheses: artifacts.hypotheses.hypotheses,
    analysisWorkplan: artifacts.analysisWorkplan,
    findings: artifacts.findings.findings,
    synthesizedInsights: artifacts.insights.synthesizedInsights,
    recommendations: artifacts.recommendations.recommendations,
    artifacts
  };
}
