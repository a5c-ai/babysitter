/**
 * @process philosophy/fallacy-identification
 * @description Systematically identify formal and informal logical fallacies in arguments, classify by type, and explain why the reasoning fails
 * @inputs { argumentText: string, comprehensiveAnalysis: boolean, outputDir: string }
 * @outputs { success: boolean, fallaciesIdentified: array, classification: object, explanations: array, artifacts: array }
 * @recommendedSkills SK-PHIL-011 (fallacy-detection-analysis), SK-PHIL-002 (argument-mapping-reconstruction), SK-PHIL-001 (formal-logic-analysis)
 * @recommendedAgents AG-PHIL-001 (logic-analyst-agent), AG-PHIL-007 (critical-thinking-educator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    argumentText,
    comprehensiveAnalysis = true,
    outputDir = 'fallacy-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Argument Parsing
  ctx.log('info', 'Starting fallacy identification: Parsing argument');
  const argumentParsing = await ctx.task(argumentParsingTask, {
    argumentText,
    outputDir
  });

  if (!argumentParsing.success) {
    return {
      success: false,
      error: 'Argument parsing failed',
      details: argumentParsing,
      metadata: { processId: 'philosophy/fallacy-identification', timestamp: startTime }
    };
  }

  artifacts.push(...argumentParsing.artifacts);

  // Task 2: Formal Fallacy Detection
  ctx.log('info', 'Detecting formal fallacies');
  const formalFallacies = await ctx.task(formalFallacyDetectionTask, {
    parsedArgument: argumentParsing.parsed,
    outputDir
  });

  artifacts.push(...formalFallacies.artifacts);

  // Task 3: Informal Fallacy Detection
  ctx.log('info', 'Detecting informal fallacies');
  const informalFallacies = await ctx.task(informalFallacyDetectionTask, {
    argumentText,
    parsedArgument: argumentParsing.parsed,
    outputDir
  });

  artifacts.push(...informalFallacies.artifacts);

  // Task 4: Fallacy Classification
  ctx.log('info', 'Classifying identified fallacies');
  const fallacyClassification = await ctx.task(fallacyClassificationTask, {
    formalFallacies: formalFallacies.fallacies,
    informalFallacies: informalFallacies.fallacies,
    outputDir
  });

  artifacts.push(...fallacyClassification.artifacts);

  // Task 5: Reasoning Failure Explanation
  ctx.log('info', 'Generating explanations for reasoning failures');
  const failureExplanation = await ctx.task(failureExplanationTask, {
    allFallacies: [...formalFallacies.fallacies, ...informalFallacies.fallacies],
    argumentText,
    outputDir
  });

  artifacts.push(...failureExplanation.artifacts);

  // Breakpoint: Review fallacy analysis
  const totalFallacies = formalFallacies.fallacies.length + informalFallacies.fallacies.length;
  await ctx.breakpoint({
    question: `Fallacy analysis complete. Found ${totalFallacies} fallacies (${formalFallacies.fallacies.length} formal, ${informalFallacies.fallacies.length} informal). Review the analysis?`,
    title: 'Fallacy Identification Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalFallacies,
        formalCount: formalFallacies.fallacies.length,
        informalCount: informalFallacies.fallacies.length,
        categories: fallacyClassification.categories
      }
    }
  });

  // Task 6: Generate Fallacy Analysis Report
  ctx.log('info', 'Generating fallacy analysis report');
  const analysisReport = await ctx.task(fallacyReportTask, {
    argumentText,
    argumentParsing,
    formalFallacies,
    informalFallacies,
    fallacyClassification,
    failureExplanation,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    fallaciesIdentified: [...formalFallacies.fallacies, ...informalFallacies.fallacies],
    classification: {
      formal: formalFallacies.fallacies,
      informal: informalFallacies.fallacies,
      categories: fallacyClassification.categories,
      severityRanking: fallacyClassification.severityRanking
    },
    explanations: failureExplanation.explanations,
    correctionSuggestions: failureExplanation.corrections,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/fallacy-identification',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Argument Parsing
export const argumentParsingTask = defineTask('argument-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse argument for fallacy analysis',
  agent: {
    name: 'argument-parser',
    prompt: {
      role: 'philosophical logician',
      task: 'Parse argument into components for fallacy analysis',
      context: args,
      instructions: [
        'Identify the main claim or conclusion',
        'Extract all premises and supporting reasons',
        'Identify the logical structure and connectives',
        'Note any rhetorical elements or emotional appeals',
        'Identify the argument form if recognizable',
        'Flag areas of ambiguity or vagueness',
        'Mark any causal claims or generalizations',
        'Save parsed structure to output directory'
      ],
      outputFormat: 'JSON with success, parsed (premises, conclusion, structure), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parsed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parsed: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            structure: { type: 'string' },
            rhetoricalElements: { type: 'array', items: { type: 'string' } },
            ambiguities: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'fallacy', 'parsing']
}));

// Task 2: Formal Fallacy Detection
export const formalFallacyDetectionTask = defineTask('formal-fallacy-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect formal logical fallacies',
  agent: {
    name: 'formal-fallacy-detector',
    prompt: {
      role: 'formal logician',
      task: 'Identify formal logical fallacies in the argument structure',
      context: args,
      instructions: [
        'Check for affirming the consequent',
        'Check for denying the antecedent',
        'Check for undistributed middle term (syllogistic)',
        'Check for illicit major/minor (syllogistic)',
        'Check for four-term fallacy',
        'Check for existential fallacy',
        'Check for modal fallacies',
        'Check for quantifier shift fallacies',
        'Document each fallacy with location in argument',
        'Save formal fallacy analysis to output directory'
      ],
      outputFormat: 'JSON with fallacies (name, location, structure), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fallacies', 'artifacts'],
      properties: {
        fallacies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['formal'] },
              location: { type: 'string' },
              invalidStructure: { type: 'string' },
              validCounterpart: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'fallacy', 'formal']
}));

// Task 3: Informal Fallacy Detection
export const informalFallacyDetectionTask = defineTask('informal-fallacy-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect informal logical fallacies',
  agent: {
    name: 'informal-fallacy-detector',
    prompt: {
      role: 'critical thinking expert',
      task: 'Identify informal logical fallacies in the argument',
      context: args,
      instructions: [
        'Check for fallacies of relevance (ad hominem, appeal to authority, etc.)',
        'Check for fallacies of presumption (begging the question, false dilemma, etc.)',
        'Check for fallacies of ambiguity (equivocation, amphiboly, etc.)',
        'Check for causal fallacies (post hoc, slippery slope, etc.)',
        'Check for statistical fallacies (hasty generalization, etc.)',
        'Check for emotional appeals (fear, pity, popularity)',
        'Check for red herring and straw man',
        'Document each fallacy with textual evidence',
        'Save informal fallacy analysis to output directory'
      ],
      outputFormat: 'JSON with fallacies (name, category, evidence, severity), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fallacies', 'artifacts'],
      properties: {
        fallacies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['informal'] },
              category: { type: 'string' },
              textualEvidence: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'major'] }
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
  labels: ['agent', 'philosophy', 'fallacy', 'informal']
}));

// Task 4: Fallacy Classification
export const fallacyClassificationTask = defineTask('fallacy-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify and categorize identified fallacies',
  agent: {
    name: 'fallacy-classifier',
    prompt: {
      role: 'argumentation theorist',
      task: 'Classify all identified fallacies into systematic categories',
      context: args,
      instructions: [
        'Group fallacies by major category (relevance, presumption, ambiguity, etc.)',
        'Rank fallacies by severity and impact on argument',
        'Identify any related or overlapping fallacies',
        'Note primary vs. secondary fallacies',
        'Assess cumulative effect of multiple fallacies',
        'Create fallacy taxonomy for the argument',
        'Save classification to output directory'
      ],
      outputFormat: 'JSON with categories, severityRanking, relationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'severityRanking', 'artifacts'],
      properties: {
        categories: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        severityRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fallacy: { type: 'string' },
              severity: { type: 'number' },
              impact: { type: 'string' }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'fallacy', 'classification']
}));

// Task 5: Failure Explanation
export const failureExplanationTask = defineTask('failure-explanation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Explain why reasoning fails for each fallacy',
  agent: {
    name: 'explanation-generator',
    prompt: {
      role: 'philosophy educator',
      task: 'Provide clear explanations of why each fallacy undermines the reasoning',
      context: args,
      instructions: [
        'Explain the logical error in accessible language',
        'Show why the fallacy fails to support the conclusion',
        'Provide analogous examples to illustrate the error',
        'Contrast with correct reasoning patterns',
        'Suggest how the argument could be corrected',
        'Note any context where the reasoning might be acceptable',
        'Rate the severity of each reasoning failure',
        'Save explanations to output directory'
      ],
      outputFormat: 'JSON with explanations, corrections, examples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['explanations', 'corrections', 'artifacts'],
      properties: {
        explanations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fallacy: { type: 'string' },
              explanation: { type: 'string' },
              analogousExample: { type: 'string' },
              correctPattern: { type: 'string' }
            }
          }
        },
        corrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fallacy: { type: 'string' },
              suggestion: { type: 'string' },
              revisedArgument: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'fallacy', 'explanation']
}));

// Task 6: Fallacy Report
export const fallacyReportTask = defineTask('fallacy-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive fallacy analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophy educator and technical writer',
      task: 'Generate comprehensive fallacy identification report',
      context: args,
      instructions: [
        'Create executive summary of fallacy findings',
        'Present original argument text',
        'List all formal fallacies with explanations',
        'List all informal fallacies with explanations',
        'Provide classification taxonomy',
        'Include severity assessment',
        'Offer correction suggestions',
        'Include educational examples',
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
  labels: ['agent', 'philosophy', 'fallacy', 'reporting']
}));
