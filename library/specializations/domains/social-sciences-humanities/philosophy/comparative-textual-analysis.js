/**
 * @process philosophy/comparative-textual-analysis
 * @description Compare multiple texts, translations, or interpretations to develop nuanced understanding and identify interpretive traditions and controversies
 * @inputs { texts: array, comparisonType: string, focusAreas: array, outputDir: string }
 * @outputs { success: boolean, comparativeFindings: object, interpretiveTraditions: array, controversies: array, artifacts: array }
 * @recommendedSkills SK-PHIL-004 (hermeneutical-interpretation), SK-PHIL-009 (comparative-religion-analysis), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-003 (hermeneutics-specialist-agent), AG-PHIL-008 (comparative-religion-scholar-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    texts,
    comparisonType = 'interpretive',
    focusAreas = [],
    outputDir = 'comparative-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Text Preparation and Alignment
  ctx.log('info', 'Starting comparative analysis: Preparing and aligning texts');
  const textPreparation = await ctx.task(textPreparationTask, {
    texts,
    comparisonType,
    outputDir
  });

  if (!textPreparation.success) {
    return {
      success: false,
      error: 'Text preparation failed',
      details: textPreparation,
      metadata: { processId: 'philosophy/comparative-textual-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...textPreparation.artifacts);

  // Task 2: Individual Text Analysis
  const textAnalyses = [];
  for (let i = 0; i < texts.length; i++) {
    ctx.log('info', `Analyzing text ${i + 1}`);
    const textAnalysis = await ctx.task(individualTextAnalysisTask, {
      text: texts[i],
      textIndex: i,
      focusAreas,
      outputDir
    });
    textAnalyses.push(textAnalysis);
    artifacts.push(...textAnalysis.artifacts);
  }

  // Task 3: Systematic Comparison
  ctx.log('info', 'Conducting systematic comparison');
  const systematicComparison = await ctx.task(systematicComparisonTask, {
    textAnalyses,
    comparisonType,
    focusAreas,
    outputDir
  });

  artifacts.push(...systematicComparison.artifacts);

  // Task 4: Interpretive Tradition Identification
  ctx.log('info', 'Identifying interpretive traditions');
  const traditionIdentification = await ctx.task(traditionIdentificationTask, {
    texts,
    textAnalyses,
    comparison: systematicComparison.comparison,
    outputDir
  });

  artifacts.push(...traditionIdentification.artifacts);

  // Task 5: Controversy Analysis
  ctx.log('info', 'Analyzing interpretive controversies');
  const controversyAnalysis = await ctx.task(controversyAnalysisTask, {
    comparison: systematicComparison.comparison,
    traditions: traditionIdentification.traditions,
    outputDir
  });

  artifacts.push(...controversyAnalysis.artifacts);

  // Task 6: Synthesis and Integration
  ctx.log('info', 'Synthesizing comparative findings');
  const synthesis = await ctx.task(synthesisTask, {
    textAnalyses,
    comparison: systematicComparison.comparison,
    traditions: traditionIdentification.traditions,
    controversies: controversyAnalysis.controversies,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  // Breakpoint: Review comparative analysis
  await ctx.breakpoint({
    question: `Comparative textual analysis complete. Compared ${texts.length} texts. Found ${traditionIdentification.traditions.length} traditions and ${controversyAnalysis.controversies.length} controversies. Review the analysis?`,
    title: 'Comparative Textual Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        textsCompared: texts.length,
        comparisonType,
        traditionsFound: traditionIdentification.traditions.length,
        controversiesFound: controversyAnalysis.controversies.length
      }
    }
  });

  // Task 7: Generate Comparative Report
  ctx.log('info', 'Generating comparative analysis report');
  const comparativeReport = await ctx.task(comparativeReportTask, {
    texts,
    textPreparation,
    textAnalyses,
    systematicComparison,
    traditionIdentification,
    controversyAnalysis,
    synthesis,
    outputDir
  });

  artifacts.push(...comparativeReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    comparativeFindings: {
      similarities: systematicComparison.comparison.similarities,
      differences: systematicComparison.comparison.differences,
      patterns: systematicComparison.comparison.patterns,
      synthesis: synthesis.integratedReading
    },
    interpretiveTraditions: traditionIdentification.traditions,
    controversies: controversyAnalysis.controversies,
    nuancedUnderstanding: synthesis.nuancedUnderstanding,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/comparative-textual-analysis',
      timestamp: startTime,
      comparisonType,
      textsCompared: texts.length,
      outputDir
    }
  };
}

// Task 1: Text Preparation
export const textPreparationTask = defineTask('text-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare and align texts for comparison',
  agent: {
    name: 'text-preparer',
    prompt: {
      role: 'textual scholar',
      task: 'Prepare and align the texts for systematic comparison',
      context: args,
      instructions: [
        'Identify each text source and version',
        'For translations: identify original language and translator',
        'Create alignment structure for comparison',
        'Identify comparable sections or passages',
        'Note any textual variants or editions',
        'Establish comparison framework',
        'Document any preparation assumptions',
        'Save text preparation to output directory'
      ],
      outputFormat: 'JSON with success, preparedTexts, alignmentStructure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'preparedTexts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        preparedTexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              version: { type: 'string' },
              translator: { type: 'string' },
              language: { type: 'string' }
            }
          }
        },
        alignmentStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative', 'preparation']
}));

// Task 2: Individual Text Analysis
export const individualTextAnalysisTask = defineTask('individual-text-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze individual text',
  agent: {
    name: 'text-analyst',
    prompt: {
      role: 'textual scholar',
      task: 'Analyze the individual text for comparative purposes',
      context: args,
      instructions: [
        'Identify main themes and arguments',
        'Extract key concepts and terminology',
        'Note stylistic and rhetorical features',
        'Identify interpretive choices made',
        'Note emphases and de-emphases',
        'Document the interpretive stance',
        'Focus on specified areas if provided',
        'Save individual analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (themes, concepts, style, interpretiveStance), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            themes: { type: 'array', items: { type: 'string' } },
            keyConcepts: { type: 'array', items: { type: 'string' } },
            style: { type: 'string' },
            rhetoricalFeatures: { type: 'array', items: { type: 'string' } },
            interpretiveStance: { type: 'string' },
            emphases: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'comparative', 'individual-analysis']
}));

// Task 3: Systematic Comparison
export const systematicComparisonTask = defineTask('systematic-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct systematic comparison of texts',
  agent: {
    name: 'comparative-analyst',
    prompt: {
      role: 'comparative scholar',
      task: 'Systematically compare the analyzed texts',
      context: args,
      instructions: [
        'Compare themes and arguments across texts',
        'Identify key similarities',
        'Identify significant differences',
        'Note patterns across texts',
        'Compare treatment of key concepts',
        'Analyze stylistic variations',
        'Note interpretive divergences',
        'Save comparison to output directory'
      ],
      outputFormat: 'JSON with comparison (similarities, differences, patterns, conceptComparisons), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            similarities: { type: 'array', items: { type: 'string' } },
            differences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  aspect: { type: 'string' },
                  texts: { type: 'object' },
                  significance: { type: 'string' }
                }
              }
            },
            patterns: { type: 'array', items: { type: 'string' } },
            conceptComparisons: { type: 'array', items: { type: 'object' } }
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
  labels: ['agent', 'philosophy', 'comparative', 'systematic']
}));

// Task 4: Tradition Identification
export const traditionIdentificationTask = defineTask('tradition-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify interpretive traditions',
  agent: {
    name: 'tradition-analyst',
    prompt: {
      role: 'intellectual historian',
      task: 'Identify the interpretive traditions represented in the texts',
      context: args,
      instructions: [
        'Identify schools of interpretation represented',
        'Link texts to broader interpretive traditions',
        'Note historical development of traditions',
        'Identify key figures and influences',
        'Characterize each tradition approach',
        'Note relationships between traditions',
        'Identify genealogies of interpretation',
        'Save tradition identification to output directory'
      ],
      outputFormat: 'JSON with traditions (name, characteristics, texts, influences), relationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['traditions', 'artifacts'],
      properties: {
        traditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              associatedTexts: { type: 'array', items: { type: 'number' } },
              keyFigures: { type: 'array', items: { type: 'string' } },
              historicalPeriod: { type: 'string' }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative', 'traditions']
}));

// Task 5: Controversy Analysis
export const controversyAnalysisTask = defineTask('controversy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze interpretive controversies',
  agent: {
    name: 'controversy-analyst',
    prompt: {
      role: 'intellectual historian',
      task: 'Identify and analyze interpretive controversies across the texts',
      context: args,
      instructions: [
        'Identify points of interpretive disagreement',
        'Characterize the nature of each controversy',
        'Identify the stakes of each dispute',
        'Note the arguments on each side',
        'Assess the current state of each debate',
        'Identify any resolution or consensus',
        'Note ongoing unresolved issues',
        'Save controversy analysis to output directory'
      ],
      outputFormat: 'JSON with controversies (issue, positions, stakes, resolution), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['controversies', 'artifacts'],
      properties: {
        controversies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              positions: { type: 'array', items: { type: 'object' } },
              stakes: { type: 'string' },
              currentState: { type: 'string' },
              resolution: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'comparative', 'controversies']
}));

// Task 6: Synthesis
export const synthesisTask = defineTask('synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize comparative findings',
  agent: {
    name: 'synthesis-expert',
    prompt: {
      role: 'philosophical scholar',
      task: 'Synthesize all comparative findings into a nuanced understanding',
      context: args,
      instructions: [
        'Integrate insights from all analyses',
        'Develop a nuanced understanding of the subject',
        'Identify what the comparison reveals',
        'Note methodological insights',
        'Formulate integrated reading if possible',
        'Acknowledge irreducible plurality where it exists',
        'Identify further questions raised',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with integratedReading, nuancedUnderstanding, insights, furtherQuestions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedReading', 'nuancedUnderstanding', 'artifacts'],
      properties: {
        integratedReading: { type: 'string' },
        nuancedUnderstanding: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        methodologicalLessons: { type: 'array', items: { type: 'string' } },
        furtherQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative', 'synthesis']
}));

// Task 7: Comparative Report
export const comparativeReportTask = defineTask('comparative-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comparative textual analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'comparative scholar and technical writer',
      task: 'Generate comprehensive comparative textual analysis report',
      context: args,
      instructions: [
        'Create executive summary of comparative findings',
        'Present the texts compared',
        'Document individual text analyses',
        'Present systematic comparison',
        'Document interpretive traditions',
        'Present controversy analysis',
        'Include synthesis and nuanced understanding',
        'Note limitations and further questions',
        'Format as professional scholarly report',
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
  labels: ['agent', 'philosophy', 'comparative', 'reporting']
}));
