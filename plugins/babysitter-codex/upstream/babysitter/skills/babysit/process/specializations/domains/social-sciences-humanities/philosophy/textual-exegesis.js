/**
 * @process philosophy/textual-exegesis
 * @description Conduct systematic interpretation of philosophical and theological texts using historical-critical, literary, and hermeneutical methods
 * @inputs { textSource: string, textPassage: string, interpretiveMethod: string, outputDir: string }
 * @outputs { success: boolean, interpretation: object, hermeneuticalAnalysis: object, contextualFindings: object, artifacts: array }
 * @recommendedSkills SK-PHIL-004 (hermeneutical-interpretation), SK-PHIL-005 (conceptual-analysis), SK-PHIL-013 (scholarly-literature-synthesis)
 * @recommendedAgents AG-PHIL-003 (hermeneutics-specialist-agent), AG-PHIL-005 (philosophical-theologian-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    textSource,
    textPassage,
    interpretiveMethod = 'hermeneutical',
    outputDir = 'exegesis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Text Identification and Context
  ctx.log('info', 'Starting textual exegesis: Identifying text and context');
  const textIdentification = await ctx.task(textIdentificationTask, {
    textSource,
    textPassage,
    outputDir
  });

  if (!textIdentification.success) {
    return {
      success: false,
      error: 'Text identification failed',
      details: textIdentification,
      metadata: { processId: 'philosophy/textual-exegesis', timestamp: startTime }
    };
  }

  artifacts.push(...textIdentification.artifacts);

  // Task 2: Historical-Critical Analysis
  ctx.log('info', 'Conducting historical-critical analysis');
  const historicalAnalysis = await ctx.task(historicalCriticalTask, {
    textInfo: textIdentification.textInfo,
    textPassage,
    outputDir
  });

  artifacts.push(...historicalAnalysis.artifacts);

  // Task 3: Literary Analysis
  ctx.log('info', 'Conducting literary analysis');
  const literaryAnalysis = await ctx.task(literaryAnalysisTask, {
    textPassage,
    textInfo: textIdentification.textInfo,
    outputDir
  });

  artifacts.push(...literaryAnalysis.artifacts);

  // Task 4: Semantic and Conceptual Analysis
  ctx.log('info', 'Analyzing semantics and key concepts');
  const semanticAnalysis = await ctx.task(semanticAnalysisTask, {
    textPassage,
    historicalContext: historicalAnalysis.context,
    outputDir
  });

  artifacts.push(...semanticAnalysis.artifacts);

  // Task 5: Hermeneutical Interpretation
  ctx.log('info', `Applying ${interpretiveMethod} interpretation`);
  const hermeneuticalInterpretation = await ctx.task(hermeneuticalInterpretationTask, {
    textPassage,
    textInfo: textIdentification.textInfo,
    historicalAnalysis: historicalAnalysis.analysis,
    literaryAnalysis: literaryAnalysis.analysis,
    semanticAnalysis: semanticAnalysis.analysis,
    interpretiveMethod,
    outputDir
  });

  artifacts.push(...hermeneuticalInterpretation.artifacts);

  // Task 6: Reception History
  ctx.log('info', 'Examining reception history');
  const receptionHistory = await ctx.task(receptionHistoryTask, {
    textSource,
    textPassage,
    textInfo: textIdentification.textInfo,
    outputDir
  });

  artifacts.push(...receptionHistory.artifacts);

  // Breakpoint: Review exegesis results
  await ctx.breakpoint({
    question: `Textual exegesis complete using ${interpretiveMethod} method. Review the interpretation?`,
    title: 'Textual Exegesis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        textSource,
        interpretiveMethod,
        keyConceptsIdentified: semanticAnalysis.analysis.keyConcepts?.length || 0,
        interpretationCount: receptionHistory.interpretations?.length || 0
      }
    }
  });

  // Task 7: Generate Exegesis Report
  ctx.log('info', 'Generating textual exegesis report');
  const exegesisReport = await ctx.task(exegesisReportTask, {
    textSource,
    textPassage,
    textIdentification,
    historicalAnalysis,
    literaryAnalysis,
    semanticAnalysis,
    hermeneuticalInterpretation,
    receptionHistory,
    outputDir
  });

  artifacts.push(...exegesisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    interpretation: {
      passage: textPassage,
      source: textSource,
      mainInterpretation: hermeneuticalInterpretation.interpretation,
      alternativeReadings: hermeneuticalInterpretation.alternatives
    },
    hermeneuticalAnalysis: {
      method: interpretiveMethod,
      preunderstanding: hermeneuticalInterpretation.preunderstanding,
      fusionOfHorizons: hermeneuticalInterpretation.fusionOfHorizons,
      applicationToday: hermeneuticalInterpretation.application
    },
    contextualFindings: {
      historicalContext: historicalAnalysis.context,
      literaryFeatures: literaryAnalysis.analysis.features,
      keyConcepts: semanticAnalysis.analysis.keyConcepts,
      receptionHistory: receptionHistory.interpretations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/textual-exegesis',
      timestamp: startTime,
      interpretiveMethod,
      outputDir
    }
  };
}

// Task 1: Text Identification
export const textIdentificationTask = defineTask('text-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify text and establish context',
  agent: {
    name: 'text-identifier',
    prompt: {
      role: 'philosophical scholar',
      task: 'Identify the text, author, and basic contextual information',
      context: args,
      instructions: [
        'Identify the work and author',
        'Determine the date and place of composition',
        'Identify the genre of the text',
        'Note the place of passage within the larger work',
        'Identify the intended audience',
        'Note the occasion or purpose of writing',
        'Identify any textual variants or manuscript issues',
        'Save text identification to output directory'
      ],
      outputFormat: 'JSON with success, textInfo (author, work, date, genre, context), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'textInfo', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        textInfo: {
          type: 'object',
          properties: {
            author: { type: 'string' },
            work: { type: 'string' },
            dateOfComposition: { type: 'string' },
            genre: { type: 'string' },
            intendedAudience: { type: 'string' },
            occasionOfWriting: { type: 'string' },
            textualVariants: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'exegesis', 'identification']
}));

// Task 2: Historical-Critical Analysis
export const historicalCriticalTask = defineTask('historical-critical', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct historical-critical analysis',
  agent: {
    name: 'historical-critic',
    prompt: {
      role: 'historical-critical scholar',
      task: 'Apply historical-critical methods to understand the text in its original context',
      context: args,
      instructions: [
        'Investigate the historical situation of composition',
        'Examine the social and political context',
        'Identify sources used by the author',
        'Analyze the tradition history (if applicable)',
        'Consider form-critical analysis (genre conventions)',
        'Examine redaction (editorial) history',
        'Note relevant historical events or figures',
        'Save historical-critical analysis to output directory'
      ],
      outputFormat: 'JSON with analysis, context (historical, social, political), sources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'context', 'artifacts'],
      properties: {
        analysis: { type: 'string' },
        context: {
          type: 'object',
          properties: {
            historicalSituation: { type: 'string' },
            socialContext: { type: 'string' },
            politicalContext: { type: 'string' },
            relevantEvents: { type: 'array', items: { type: 'string' } }
          }
        },
        sources: { type: 'array', items: { type: 'string' } },
        traditionHistory: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'exegesis', 'historical-critical']
}));

// Task 3: Literary Analysis
export const literaryAnalysisTask = defineTask('literary-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct literary analysis',
  agent: {
    name: 'literary-analyst',
    prompt: {
      role: 'literary scholar',
      task: 'Analyze the literary features and structure of the text',
      context: args,
      instructions: [
        'Identify the literary genre and form',
        'Analyze the structure and organization',
        'Identify rhetorical devices and figures of speech',
        'Analyze argumentative structure (if applicable)',
        'Note narrative elements (if applicable)',
        'Identify stylistic features',
        'Analyze the use of language and diction',
        'Save literary analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (features, structure, rhetoric, style), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            genre: { type: 'string' },
            structure: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            rhetoricalDevices: { type: 'array', items: { type: 'string' } },
            argumentativeStructure: { type: 'string' },
            stylisticFeatures: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'exegesis', 'literary']
}));

// Task 4: Semantic Analysis
export const semanticAnalysisTask = defineTask('semantic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze semantics and key concepts',
  agent: {
    name: 'semantic-analyst',
    prompt: {
      role: 'philosophical linguist',
      task: 'Analyze the meaning of key terms and concepts in historical context',
      context: args,
      instructions: [
        'Identify key terms and concepts',
        'Research historical meanings of key terms',
        'Note semantic range and connotations',
        'Compare usage elsewhere in author works',
        'Compare usage in contemporary texts',
        'Identify technical or specialized usage',
        'Note translation issues (if relevant)',
        'Save semantic analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (keyConcepts, termAnalyses, semanticField), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            keyConcepts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  term: { type: 'string' },
                  meaning: { type: 'string' },
                  semanticRange: { type: 'array', items: { type: 'string' } },
                  usageElsewhere: { type: 'string' }
                }
              }
            },
            semanticField: { type: 'string' },
            translationIssues: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'exegesis', 'semantic']
}));

// Task 5: Hermeneutical Interpretation
export const hermeneuticalInterpretationTask = defineTask('hermeneutical-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply hermeneutical interpretation',
  agent: {
    name: 'hermeneutician',
    prompt: {
      role: 'philosophical hermeneutician',
      task: 'Develop a comprehensive interpretation using hermeneutical methods',
      context: args,
      instructions: [
        'Integrate historical, literary, and semantic findings',
        'Apply hermeneutical circle (part-whole relations)',
        'Consider pre-understanding and prejudices',
        'Seek fusion of horizons between text and interpreter',
        'Develop the meaning and significance of the text',
        'Consider application to contemporary context',
        'Note alternative interpretations',
        'Save hermeneutical interpretation to output directory'
      ],
      outputFormat: 'JSON with interpretation, preunderstanding, fusionOfHorizons, application, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'artifacts'],
      properties: {
        interpretation: { type: 'string' },
        preunderstanding: { type: 'string' },
        fusionOfHorizons: { type: 'string' },
        application: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interpretation: { type: 'string' },
              basis: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'exegesis', 'hermeneutics']
}));

// Task 6: Reception History
export const receptionHistoryTask = defineTask('reception-history', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Examine reception history',
  agent: {
    name: 'reception-historian',
    prompt: {
      role: 'intellectual historian',
      task: 'Examine how the text has been interpreted throughout history',
      context: args,
      instructions: [
        'Survey major interpretations in history',
        'Identify interpretive schools or traditions',
        'Note influential readings and their impact',
        'Identify contested interpretations',
        'Note shifts in interpretation over time',
        'Consider contemporary scholarly debates',
        'Assess the interpretive tradition',
        'Save reception history to output directory'
      ],
      outputFormat: 'JSON with interpretations (historical, schools, debates), influences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretations', 'artifacts'],
      properties: {
        interpretations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              interpreter: { type: 'string' },
              interpretation: { type: 'string' },
              influence: { type: 'string' }
            }
          }
        },
        schools: { type: 'array', items: { type: 'string' } },
        debates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'exegesis', 'reception-history']
}));

// Task 7: Exegesis Report
export const exegesisReportTask = defineTask('exegesis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate textual exegesis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophical scholar and technical writer',
      task: 'Generate comprehensive textual exegesis report',
      context: args,
      instructions: [
        'Create executive summary of interpretation',
        'Present the text and identify source',
        'Document historical-critical findings',
        'Present literary analysis',
        'Detail semantic analysis of key concepts',
        'Present the hermeneutical interpretation',
        'Include reception history',
        'Note alternative readings and debates',
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
  labels: ['agent', 'philosophy', 'exegesis', 'reporting']
}));
