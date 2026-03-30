/**
 * @process philosophy/ethical-theory-comparison
 * @description Compare and evaluate competing ethical theories on specific moral questions, identifying strengths, weaknesses, and practical implications of each approach
 * @inputs { moralQuestion: string, theories: array, includeMetaethics: boolean, outputDir: string }
 * @outputs { success: boolean, theoryAnalyses: array, comparison: object, practicalImplications: object, artifacts: array }
 * @recommendedSkills SK-PHIL-003 (ethical-framework-application), SK-PHIL-005 (conceptual-analysis), SK-PHIL-013 (scholarly-literature-synthesis)
 * @recommendedAgents AG-PHIL-002 (ethics-consultant-agent), AG-PHIL-004 (metaphysics-epistemology-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    moralQuestion,
    theories = ['utilitarianism', 'deontology', 'virtue-ethics', 'care-ethics'],
    includeMetaethics = false,
    outputDir = 'theory-comparison-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Question Analysis
  ctx.log('info', 'Starting ethical theory comparison: Analyzing moral question');
  const questionAnalysis = await ctx.task(questionAnalysisTask, {
    moralQuestion,
    outputDir
  });

  if (!questionAnalysis.success) {
    return {
      success: false,
      error: 'Question analysis failed',
      details: questionAnalysis,
      metadata: { processId: 'philosophy/ethical-theory-comparison', timestamp: startTime }
    };
  }

  artifacts.push(...questionAnalysis.artifacts);

  // Task 2: Theory Applications
  const theoryResults = [];
  for (const theory of theories) {
    ctx.log('info', `Applying ${theory} to the moral question`);
    const theoryApplication = await ctx.task(theoryApplicationTask, {
      moralQuestion,
      questionAnalysis: questionAnalysis.analysis,
      theory,
      outputDir
    });
    theoryResults.push(theoryApplication);
    artifacts.push(...theoryApplication.artifacts);
  }

  // Task 3: Metaethical Analysis (if requested)
  let metaethicalAnalysis = null;
  if (includeMetaethics) {
    ctx.log('info', 'Conducting metaethical analysis');
    metaethicalAnalysis = await ctx.task(metaethicalAnalysisTask, {
      theories,
      theoryResults,
      outputDir
    });
    artifacts.push(...metaethicalAnalysis.artifacts);
  }

  // Task 4: Comparative Evaluation
  ctx.log('info', 'Comparing ethical theories');
  const comparativeEvaluation = await ctx.task(comparativeEvaluationTask, {
    theoryResults,
    questionAnalysis: questionAnalysis.analysis,
    outputDir
  });

  artifacts.push(...comparativeEvaluation.artifacts);

  // Task 5: Practical Implications
  ctx.log('info', 'Analyzing practical implications');
  const practicalImplications = await ctx.task(practicalImplicationsTask, {
    theoryResults,
    comparison: comparativeEvaluation.comparison,
    moralQuestion,
    outputDir
  });

  artifacts.push(...practicalImplications.artifacts);

  // Breakpoint: Review comparison results
  await ctx.breakpoint({
    question: `Theory comparison complete. Analyzed ${theories.length} theories. ${comparativeEvaluation.comparison.convergence ? 'Theories converge.' : 'Theories diverge.'} Review the analysis?`,
    title: 'Ethical Theory Comparison Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        theoriesAnalyzed: theories,
        convergence: comparativeEvaluation.comparison.convergence,
        dominantTheory: comparativeEvaluation.comparison.strongest
      }
    }
  });

  // Task 6: Generate Comparison Report
  ctx.log('info', 'Generating theory comparison report');
  const comparisonReport = await ctx.task(comparisonReportTask, {
    moralQuestion,
    questionAnalysis,
    theoryResults,
    metaethicalAnalysis,
    comparativeEvaluation,
    practicalImplications,
    outputDir
  });

  artifacts.push(...comparisonReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    theoryAnalyses: theoryResults.map(r => ({
      theory: r.theory,
      verdict: r.verdict,
      reasoning: r.reasoning,
      strengths: r.strengths,
      weaknesses: r.weaknesses
    })),
    comparison: {
      convergence: comparativeEvaluation.comparison.convergence,
      agreements: comparativeEvaluation.comparison.agreements,
      disagreements: comparativeEvaluation.comparison.disagreements,
      strongest: comparativeEvaluation.comparison.strongest,
      evaluationCriteria: comparativeEvaluation.criteria
    },
    practicalImplications: practicalImplications.implications,
    metaethics: metaethicalAnalysis?.analysis,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/ethical-theory-comparison',
      timestamp: startTime,
      theories,
      outputDir
    }
  };
}

// Task 1: Question Analysis
export const questionAnalysisTask = defineTask('question-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the moral question for theory comparison',
  agent: {
    name: 'ethics-analyst',
    prompt: {
      role: 'moral philosopher',
      task: 'Analyze the moral question to prepare for multi-theory evaluation',
      context: args,
      instructions: [
        'Clarify the moral question precisely',
        'Identify the type of ethical question (normative, applied, metaethical)',
        'Identify key moral concepts involved',
        'Note features that different theories may emphasize',
        'Identify stakeholders and interests',
        'Consider factual assumptions underlying the question',
        'Note any cultural or contextual factors',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with success, analysis (question, type, concepts, features), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            clarifiedQuestion: { type: 'string' },
            questionType: { type: 'string' },
            keyConcepts: { type: 'array', items: { type: 'string' } },
            relevantFeatures: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'string' } },
            factualAssumptions: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'ethics', 'question-analysis']
}));

// Task 2: Theory Application
export const theoryApplicationTask = defineTask('theory-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply ethical theory to moral question',
  agent: {
    name: 'ethics-theorist',
    prompt: {
      role: 'moral philosopher',
      task: 'Apply the specified ethical theory to analyze the moral question',
      context: args,
      instructions: [
        'Present the core principles of the theory',
        'Apply theory to the specific question',
        'Determine the theory verdict on the question',
        'Explain the reasoning process',
        'Identify strengths of this approach for this question',
        'Identify weaknesses or limitations',
        'Note any internal debates within the theory',
        'Save theory application to output directory'
      ],
      outputFormat: 'JSON with theory, verdict, reasoning, strengths, weaknesses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['theory', 'verdict', 'reasoning', 'artifacts'],
      properties: {
        theory: { type: 'string' },
        principles: { type: 'array', items: { type: 'string' } },
        verdict: { type: 'string' },
        reasoning: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        internalDebates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'ethics', 'theory-application']
}));

// Task 3: Metaethical Analysis
export const metaethicalAnalysisTask = defineTask('metaethical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct metaethical analysis of theories',
  agent: {
    name: 'metaethics-analyst',
    prompt: {
      role: 'metaethicist',
      task: 'Analyze the metaethical assumptions underlying each theory',
      context: args,
      instructions: [
        'Identify each theory metaethical commitments',
        'Analyze moral realism vs. anti-realism implications',
        'Consider cognitivism vs. non-cognitivism',
        'Examine naturalism vs. non-naturalism',
        'Assess foundationalism vs. coherentism',
        'Note metaethical disagreements between theories',
        'Evaluate metaethical plausibility',
        'Save metaethical analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (theoryCommitments, comparisons), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            theoryCommitments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  theory: { type: 'string' },
                  ontology: { type: 'string' },
                  epistemology: { type: 'string' },
                  semantics: { type: 'string' }
                }
              }
            },
            metaethicalComparisons: { type: 'array', items: { type: 'string' } },
            implications: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'metaethics', 'analysis']
}));

// Task 4: Comparative Evaluation
export const comparativeEvaluationTask = defineTask('comparative-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare and evaluate ethical theories',
  agent: {
    name: 'theory-comparator',
    prompt: {
      role: 'moral philosopher',
      task: 'Systematically compare ethical theories on the given question',
      context: args,
      instructions: [
        'Identify where theories agree in their verdicts',
        'Identify where theories disagree',
        'Analyze reasons for disagreement',
        'Evaluate theories on explanatory power',
        'Evaluate theories on action-guidance',
        'Evaluate theories on handling counterexamples',
        'Assess which theory is strongest for this question',
        'Save comparative evaluation to output directory'
      ],
      outputFormat: 'JSON with comparison (convergence, agreements, disagreements, strongest), criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'criteria', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            convergence: { type: 'boolean' },
            agreements: { type: 'array', items: { type: 'string' } },
            disagreements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  issue: { type: 'string' },
                  positions: { type: 'object' },
                  reason: { type: 'string' }
                }
              }
            },
            strongest: { type: 'string' },
            strongestReason: { type: 'string' }
          }
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              rankings: { type: 'object' }
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
  labels: ['agent', 'philosophy', 'ethics', 'comparison']
}));

// Task 5: Practical Implications
export const practicalImplicationsTask = defineTask('practical-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze practical implications of theories',
  agent: {
    name: 'practical-analyst',
    prompt: {
      role: 'applied ethicist',
      task: 'Analyze the practical implications of each theory for decision-making',
      context: args,
      instructions: [
        'Identify what each theory recommends in practice',
        'Compare practical outcomes across theories',
        'Note which theory provides clearest guidance',
        'Consider implementation challenges for each',
        'Identify policy implications of each theory',
        'Note when theories lead to different actions',
        'Assess real-world feasibility',
        'Save practical implications to output directory'
      ],
      outputFormat: 'JSON with implications (byTheory, comparisons, actionGuidance), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'artifacts'],
      properties: {
        implications: {
          type: 'object',
          properties: {
            byTheory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  theory: { type: 'string' },
                  recommendation: { type: 'string' },
                  implementationChallenges: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            comparisons: { type: 'array', items: { type: 'string' } },
            clearest: { type: 'string' },
            policyImplications: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'ethics', 'practical']
}));

// Task 6: Comparison Report
export const comparisonReportTask = defineTask('comparison-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate ethical theory comparison report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'moral philosopher and technical writer',
      task: 'Generate comprehensive ethical theory comparison report',
      context: args,
      instructions: [
        'Create executive summary of theory comparison',
        'Present the moral question clearly',
        'Detail each theory analysis',
        'Present comparative evaluation',
        'Include metaethical analysis if performed',
        'Document practical implications',
        'Provide synthesis or recommendation',
        'Note limitations of the comparison',
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
