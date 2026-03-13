/**
 * @process philosophy/canonical-contextual-reading
 * @description Interpret texts within their canonical, historical, and cultural contexts, attending to genre, authorial intent, and reception history
 * @inputs { textPassage: string, canonicalWork: string, interpretiveGoal: string, outputDir: string }
 * @outputs { success: boolean, contextualInterpretation: object, canonicalPlacement: object, receptionAnalysis: object, artifacts: array }
 * @recommendedSkills SK-PHIL-004 (hermeneutical-interpretation), SK-PHIL-008 (theological-synthesis), SK-PHIL-013 (scholarly-literature-synthesis)
 * @recommendedAgents AG-PHIL-003 (hermeneutics-specialist-agent), AG-PHIL-005 (philosophical-theologian-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    textPassage,
    canonicalWork,
    interpretiveGoal = 'comprehensive',
    outputDir = 'canonical-reading-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Canonical Context Identification
  ctx.log('info', 'Starting canonical reading: Identifying canonical context');
  const canonicalContext = await ctx.task(canonicalContextTask, {
    textPassage,
    canonicalWork,
    outputDir
  });

  if (!canonicalContext.success) {
    return {
      success: false,
      error: 'Canonical context identification failed',
      details: canonicalContext,
      metadata: { processId: 'philosophy/canonical-contextual-reading', timestamp: startTime }
    };
  }

  artifacts.push(...canonicalContext.artifacts);

  // Task 2: Historical Context Analysis
  ctx.log('info', 'Analyzing historical context');
  const historicalContext = await ctx.task(historicalContextTask, {
    textPassage,
    canonicalInfo: canonicalContext.info,
    outputDir
  });

  artifacts.push(...historicalContext.artifacts);

  // Task 3: Cultural Context Analysis
  ctx.log('info', 'Analyzing cultural context');
  const culturalContext = await ctx.task(culturalContextTask, {
    textPassage,
    canonicalInfo: canonicalContext.info,
    historicalContext: historicalContext.context,
    outputDir
  });

  artifacts.push(...culturalContext.artifacts);

  // Task 4: Genre Analysis
  ctx.log('info', 'Analyzing genre conventions');
  const genreAnalysis = await ctx.task(genreAnalysisTask, {
    textPassage,
    canonicalInfo: canonicalContext.info,
    outputDir
  });

  artifacts.push(...genreAnalysis.artifacts);

  // Task 5: Authorial Intent Investigation
  ctx.log('info', 'Investigating authorial intent');
  const authorIntentAnalysis = await ctx.task(authorIntentTask, {
    textPassage,
    canonicalInfo: canonicalContext.info,
    historicalContext: historicalContext.context,
    outputDir
  });

  artifacts.push(...authorIntentAnalysis.artifacts);

  // Task 6: Reception History Analysis
  ctx.log('info', 'Analyzing reception history');
  const receptionHistoryAnalysis = await ctx.task(receptionHistoryAnalysisTask, {
    canonicalWork,
    textPassage,
    outputDir
  });

  artifacts.push(...receptionHistoryAnalysis.artifacts);

  // Task 7: Integrated Interpretation
  ctx.log('info', 'Developing integrated contextual interpretation');
  const integratedInterpretation = await ctx.task(integratedInterpretationTask, {
    textPassage,
    canonicalContext,
    historicalContext,
    culturalContext,
    genreAnalysis,
    authorIntentAnalysis,
    receptionHistoryAnalysis,
    interpretiveGoal,
    outputDir
  });

  artifacts.push(...integratedInterpretation.artifacts);

  // Breakpoint: Review interpretation results
  await ctx.breakpoint({
    question: `Canonical contextual reading complete. Interpretation developed with ${interpretiveGoal} goal. Review the interpretation?`,
    title: 'Canonical Contextual Reading Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        canonicalWork,
        interpretiveGoal,
        genre: genreAnalysis.genre,
        receptionTraditions: receptionHistoryAnalysis.traditions?.length || 0
      }
    }
  });

  // Task 8: Generate Reading Report
  ctx.log('info', 'Generating canonical reading report');
  const readingReport = await ctx.task(readingReportTask, {
    textPassage,
    canonicalWork,
    canonicalContext,
    historicalContext,
    culturalContext,
    genreAnalysis,
    authorIntentAnalysis,
    receptionHistoryAnalysis,
    integratedInterpretation,
    outputDir
  });

  artifacts.push(...readingReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contextualInterpretation: {
      passage: textPassage,
      interpretation: integratedInterpretation.interpretation,
      contextualMeaning: integratedInterpretation.contextualMeaning,
      contemporaryRelevance: integratedInterpretation.contemporaryRelevance
    },
    canonicalPlacement: {
      work: canonicalWork,
      placement: canonicalContext.info.placement,
      canonicalSignificance: canonicalContext.info.significance,
      genre: genreAnalysis.genre
    },
    receptionAnalysis: {
      traditions: receptionHistoryAnalysis.traditions,
      keyInterpretations: receptionHistoryAnalysis.keyInterpretations,
      currentScholarship: receptionHistoryAnalysis.currentScholarship
    },
    authorIntentFindings: authorIntentAnalysis.findings,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/canonical-contextual-reading',
      timestamp: startTime,
      interpretiveGoal,
      outputDir
    }
  };
}

// Task 1: Canonical Context
export const canonicalContextTask = defineTask('canonical-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify canonical context',
  agent: {
    name: 'canon-analyst',
    prompt: {
      role: 'philosophical scholar',
      task: 'Identify the canonical context and significance of the text',
      context: args,
      instructions: [
        'Identify the canonical status of the work',
        'Determine the place of passage within the work',
        'Identify the work place in the author corpus',
        'Note the work place in the broader canon',
        'Identify intertextual connections within canon',
        'Note the canonical significance of the passage',
        'Identify any canonical controversies',
        'Save canonical context to output directory'
      ],
      outputFormat: 'JSON with success, info (placement, significance, intertexts, status), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'info', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        info: {
          type: 'object',
          properties: {
            canonicalStatus: { type: 'string' },
            placement: { type: 'string' },
            placeInCorpus: { type: 'string' },
            placeInCanon: { type: 'string' },
            intertextualConnections: { type: 'array', items: { type: 'string' } },
            significance: { type: 'string' },
            controversies: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'canonical', 'context']
}));

// Task 2: Historical Context
export const historicalContextTask = defineTask('historical-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze historical context',
  agent: {
    name: 'historical-analyst',
    prompt: {
      role: 'intellectual historian',
      task: 'Analyze the historical context of the text',
      context: args,
      instructions: [
        'Identify the historical period and events',
        'Note political and social circumstances',
        'Identify intellectual currents of the time',
        'Note relevant debates or controversies',
        'Identify the author historical situation',
        'Note how history shaped the text',
        'Identify historical references in the text',
        'Save historical context to output directory'
      ],
      outputFormat: 'JSON with context (period, events, circumstances, currents), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['context', 'artifacts'],
      properties: {
        context: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            historicalEvents: { type: 'array', items: { type: 'string' } },
            politicalCircumstances: { type: 'string' },
            socialCircumstances: { type: 'string' },
            intellectualCurrents: { type: 'array', items: { type: 'string' } },
            contemporaryDebates: { type: 'array', items: { type: 'string' } },
            authorSituation: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'canonical', 'historical']
}));

// Task 3: Cultural Context
export const culturalContextTask = defineTask('cultural-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cultural context',
  agent: {
    name: 'cultural-analyst',
    prompt: {
      role: 'cultural historian',
      task: 'Analyze the cultural context of the text',
      context: args,
      instructions: [
        'Identify the cultural setting and assumptions',
        'Note religious and spiritual context',
        'Identify cultural values and norms',
        'Note artistic and aesthetic context',
        'Identify cultural references in the text',
        'Note language and linguistic context',
        'Identify cultural practices referenced',
        'Save cultural context to output directory'
      ],
      outputFormat: 'JSON with context (setting, values, references, language), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['context', 'artifacts'],
      properties: {
        context: {
          type: 'object',
          properties: {
            culturalSetting: { type: 'string' },
            religiousContext: { type: 'string' },
            culturalValues: { type: 'array', items: { type: 'string' } },
            aestheticContext: { type: 'string' },
            culturalReferences: { type: 'array', items: { type: 'string' } },
            linguisticContext: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'canonical', 'cultural']
}));

// Task 4: Genre Analysis
export const genreAnalysisTask = defineTask('genre-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze genre conventions',
  agent: {
    name: 'genre-analyst',
    prompt: {
      role: 'literary scholar',
      task: 'Analyze the genre and its conventions for proper interpretation',
      context: args,
      instructions: [
        'Identify the genre of the text',
        'Document genre conventions and expectations',
        'Note how genre shapes interpretation',
        'Identify genre-specific rhetorical strategies',
        'Note any genre innovations or departures',
        'Compare with other works in the genre',
        'Assess genre impact on meaning',
        'Save genre analysis to output directory'
      ],
      outputFormat: 'JSON with genre, conventions, interpretiveImplications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['genre', 'conventions', 'artifacts'],
      properties: {
        genre: { type: 'string' },
        conventions: { type: 'array', items: { type: 'string' } },
        rhetoricalStrategies: { type: 'array', items: { type: 'string' } },
        innovations: { type: 'array', items: { type: 'string' } },
        interpretiveImplications: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'canonical', 'genre']
}));

// Task 5: Author Intent
export const authorIntentTask = defineTask('author-intent', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Investigate authorial intent',
  agent: {
    name: 'intent-investigator',
    prompt: {
      role: 'philosophical scholar',
      task: 'Investigate the authorial intent behind the text',
      context: args,
      instructions: [
        'Research the author stated purposes',
        'Examine biographical evidence',
        'Consider the author other works',
        'Analyze the author correspondence if available',
        'Consider the intended audience',
        'Note any explicit authorial commentary',
        'Assess reliability of intent evidence',
        'Save intent analysis to output directory'
      ],
      outputFormat: 'JSON with findings (statedPurpose, evidence, intendedAudience, reliability), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            statedPurpose: { type: 'string' },
            biographicalEvidence: { type: 'array', items: { type: 'string' } },
            otherWorksEvidence: { type: 'string' },
            intendedAudience: { type: 'string' },
            authorCommentary: { type: 'string' },
            reliability: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'canonical', 'intent']
}));

// Task 6: Reception History
export const receptionHistoryAnalysisTask = defineTask('reception-history-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze reception history',
  agent: {
    name: 'reception-analyst',
    prompt: {
      role: 'intellectual historian',
      task: 'Analyze the reception history of the text',
      context: args,
      instructions: [
        'Survey major interpretive traditions',
        'Identify key historical interpreters',
        'Note how interpretation has changed over time',
        'Identify influential readings',
        'Note current scholarly consensus (if any)',
        'Identify ongoing debates',
        'Assess the text reception trajectory',
        'Save reception history to output directory'
      ],
      outputFormat: 'JSON with traditions, keyInterpretations, currentScholarship, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['traditions', 'keyInterpretations', 'artifacts'],
      properties: {
        traditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              period: { type: 'string' },
              characteristics: { type: 'string' }
            }
          }
        },
        keyInterpretations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interpreter: { type: 'string' },
              period: { type: 'string' },
              interpretation: { type: 'string' },
              influence: { type: 'string' }
            }
          }
        },
        currentScholarship: { type: 'string' },
        ongoingDebates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'canonical', 'reception']
}));

// Task 7: Integrated Interpretation
export const integratedInterpretationTask = defineTask('integrated-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop integrated contextual interpretation',
  agent: {
    name: 'interpretive-synthesizer',
    prompt: {
      role: 'philosophical hermeneutician',
      task: 'Develop an integrated interpretation drawing on all contextual analyses',
      context: args,
      instructions: [
        'Integrate canonical, historical, and cultural contexts',
        'Apply genre-appropriate interpretation',
        'Consider authorial intent evidence',
        'Engage with reception history',
        'Develop a contextually grounded interpretation',
        'Note the meaning for original context',
        'Consider contemporary relevance',
        'Save integrated interpretation to output directory'
      ],
      outputFormat: 'JSON with interpretation, contextualMeaning, contemporaryRelevance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'contextualMeaning', 'artifacts'],
      properties: {
        interpretation: { type: 'string' },
        contextualMeaning: { type: 'string' },
        originalMeaning: { type: 'string' },
        contemporaryRelevance: { type: 'string' },
        interpretiveJustification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'canonical', 'interpretation']
}));

// Task 8: Reading Report
export const readingReportTask = defineTask('reading-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate canonical contextual reading report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophical scholar and technical writer',
      task: 'Generate comprehensive canonical contextual reading report',
      context: args,
      instructions: [
        'Create executive summary of interpretation',
        'Present the text and canonical context',
        'Document historical context',
        'Document cultural context',
        'Present genre analysis',
        'Include authorial intent findings',
        'Present reception history',
        'Detail the integrated interpretation',
        'Note contemporary relevance',
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
  labels: ['agent', 'philosophy', 'canonical', 'reporting']
}));
