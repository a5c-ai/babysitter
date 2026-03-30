/**
 * @process humanities/corpus-linguistics-analysis
 * @description Build, annotate, and analyze linguistic corpora using computational tools for pattern discovery and quantitative language analysis
 * @inputs { corpusSpecification: object, analysisGoals: array, annotationRequirements: array }
 * @outputs { success: boolean, corpusMetadata: object, analysisResults: object, patterns: array, artifacts: array }
 * @recommendedSkills SK-HUM-009 (topic-modeling-text-mining), SK-HUM-003 (ipa-transcription-phonological-analysis), SK-HUM-012 (morphosyntactic-analysis)
 * @recommendedAgents AG-HUM-003 (documentary-linguist), AG-HUM-005 (digital-humanities-technologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    corpusSpecification,
    analysisGoals = [],
    annotationRequirements = [],
    existingCorpora = [],
    outputDir = 'corpus-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Corpus Design and Compilation
  ctx.log('info', 'Designing and compiling corpus');
  const corpusDesign = await ctx.task(corpusDesignTask, {
    corpusSpecification,
    existingCorpora,
    outputDir
  });

  if (!corpusDesign.success) {
    return {
      success: false,
      error: 'Corpus design failed',
      details: corpusDesign,
      metadata: { processId: 'humanities/corpus-linguistics-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...corpusDesign.artifacts);

  // Task 2: Corpus Annotation
  ctx.log('info', 'Annotating corpus');
  const corpusAnnotation = await ctx.task(corpusAnnotationTask, {
    corpusDesign,
    annotationRequirements,
    outputDir
  });

  artifacts.push(...corpusAnnotation.artifacts);

  // Task 3: Frequency Analysis
  ctx.log('info', 'Conducting frequency analysis');
  const frequencyAnalysis = await ctx.task(frequencyAnalysisTask, {
    corpusDesign,
    corpusAnnotation,
    analysisGoals,
    outputDir
  });

  artifacts.push(...frequencyAnalysis.artifacts);

  // Task 4: Concordance and Collocation Analysis
  ctx.log('info', 'Analyzing concordances and collocations');
  const concordanceAnalysis = await ctx.task(concordanceAnalysisTask, {
    corpusDesign,
    corpusAnnotation,
    analysisGoals,
    outputDir
  });

  artifacts.push(...concordanceAnalysis.artifacts);

  // Task 5: Statistical Pattern Analysis
  ctx.log('info', 'Conducting statistical pattern analysis');
  const patternAnalysis = await ctx.task(patternAnalysisTask, {
    frequencyAnalysis,
    concordanceAnalysis,
    analysisGoals,
    outputDir
  });

  artifacts.push(...patternAnalysis.artifacts);

  // Task 6: Comparative Corpus Analysis
  ctx.log('info', 'Conducting comparative analysis');
  const comparativeAnalysis = await ctx.task(comparativeAnalysisTask, {
    corpusDesign,
    frequencyAnalysis,
    existingCorpora,
    outputDir
  });

  artifacts.push(...comparativeAnalysis.artifacts);

  // Task 7: Generate Corpus Analysis Report
  ctx.log('info', 'Generating corpus analysis report');
  const analysisReport = await ctx.task(corpusReportTask, {
    corpusDesign,
    corpusAnnotation,
    frequencyAnalysis,
    concordanceAnalysis,
    patternAnalysis,
    comparativeAnalysis,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  // Breakpoint: Review corpus analysis
  await ctx.breakpoint({
    question: `Corpus analysis complete. Tokens: ${corpusDesign.statistics?.tokens || 0}. Patterns found: ${patternAnalysis.patterns?.length || 0}. Review analysis?`,
    title: 'Corpus Linguistics Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        corpusName: corpusSpecification.name,
        tokens: corpusDesign.statistics?.tokens || 0,
        types: corpusDesign.statistics?.types || 0,
        patternsFound: patternAnalysis.patterns?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    corpusMetadata: {
      name: corpusSpecification.name,
      statistics: corpusDesign.statistics,
      annotation: corpusAnnotation.summary
    },
    analysisResults: {
      frequencies: frequencyAnalysis.results,
      collocations: concordanceAnalysis.collocations,
      keywords: frequencyAnalysis.keywords
    },
    patterns: patternAnalysis.patterns,
    comparisons: comparativeAnalysis.comparisons,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/corpus-linguistics-analysis',
      timestamp: startTime,
      corpusName: corpusSpecification.name,
      outputDir
    }
  };
}

// Task 1: Corpus Design and Compilation
export const corpusDesignTask = defineTask('corpus-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design and compile corpus',
  agent: {
    name: 'corpus-designer',
    prompt: {
      role: 'corpus compilation specialist',
      task: 'Design and compile linguistic corpus',
      context: args,
      instructions: [
        'Define corpus design criteria',
        'Establish sampling parameters',
        'Define text selection criteria',
        'Compile text collection',
        'Clean and preprocess texts',
        'Establish file format standards',
        'Calculate corpus statistics',
        'Document metadata schema'
      ],
      outputFormat: 'JSON with success, design, statistics, metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'statistics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            criteria: { type: 'array', items: { type: 'string' } },
            sampling: { type: 'object' }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            tokens: { type: 'number' },
            types: { type: 'number' },
            texts: { type: 'number' },
            ttr: { type: 'number' }
          }
        },
        metadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'corpus', 'design', 'compilation']
}));

// Task 2: Corpus Annotation
export const corpusAnnotationTask = defineTask('corpus-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Annotate corpus',
  agent: {
    name: 'annotator',
    prompt: {
      role: 'corpus annotation specialist',
      task: 'Annotate corpus with linguistic information',
      context: args,
      instructions: [
        'Apply tokenization',
        'Apply part-of-speech tagging',
        'Apply lemmatization',
        'Parse syntactic structure if needed',
        'Apply named entity recognition if needed',
        'Add custom annotation layers',
        'Validate annotation quality',
        'Document annotation scheme'
      ],
      outputFormat: 'JSON with summary, layers, quality, schema, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'layers', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            annotationLayers: { type: 'array', items: { type: 'string' } },
            coverage: { type: 'number' },
            quality: { type: 'number' }
          }
        },
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              tool: { type: 'string' }
            }
          }
        },
        quality: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            validation: { type: 'string' }
          }
        },
        schema: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'annotation', 'pos-tagging', 'parsing']
}));

// Task 3: Frequency Analysis
export const frequencyAnalysisTask = defineTask('frequency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct frequency analysis',
  agent: {
    name: 'frequency-analyst',
    prompt: {
      role: 'corpus frequency analysis specialist',
      task: 'Conduct comprehensive frequency analysis',
      context: args,
      instructions: [
        'Generate word frequency lists',
        'Calculate lemma frequencies',
        'Generate n-gram frequencies',
        'Calculate type-token ratios',
        'Identify keywords (vs reference corpus)',
        'Analyze frequency distributions',
        'Generate POS frequency tables',
        'Create frequency visualizations'
      ],
      outputFormat: 'JSON with results, wordlist, keywords, ngrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            totalTokens: { type: 'number' },
            totalTypes: { type: 'number' },
            ttr: { type: 'number' }
          }
        },
        wordlist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              frequency: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        keywords: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              keyness: { type: 'number' },
              frequency: { type: 'number' }
            }
          }
        },
        ngrams: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'frequency', 'wordlist', 'statistics']
}));

// Task 4: Concordance and Collocation Analysis
export const concordanceAnalysisTask = defineTask('concordance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze concordances and collocations',
  agent: {
    name: 'concordance-analyst',
    prompt: {
      role: 'concordance and collocation specialist',
      task: 'Analyze concordances and collocations',
      context: args,
      instructions: [
        'Generate KWIC concordances',
        'Calculate collocate statistics',
        'Analyze collocation patterns',
        'Calculate MI, t-score, log-likelihood',
        'Identify significant collocates',
        'Analyze collocational networks',
        'Generate collocation graphs',
        'Analyze semantic prosody'
      ],
      outputFormat: 'JSON with concordances, collocations, statistics, networks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['concordances', 'collocations', 'artifacts'],
      properties: {
        concordances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              count: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        collocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              collocate: { type: 'string' },
              frequency: { type: 'number' },
              mi: { type: 'number' },
              tscore: { type: 'number' }
            }
          }
        },
        statistics: { type: 'object' },
        networks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'concordance', 'collocation', 'kwic']
}));

// Task 5: Statistical Pattern Analysis
export const patternAnalysisTask = defineTask('pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct statistical pattern analysis',
  agent: {
    name: 'pattern-analyst',
    prompt: {
      role: 'corpus pattern analysis specialist',
      task: 'Identify and analyze linguistic patterns',
      context: args,
      instructions: [
        'Identify significant patterns',
        'Apply statistical tests',
        'Conduct cluster analysis',
        'Apply topic modeling if applicable',
        'Analyze dispersion patterns',
        'Identify register/genre patterns',
        'Analyze diachronic patterns if applicable',
        'Document pattern significance'
      ],
      outputFormat: 'JSON with patterns, clusters, topics, significance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'number' },
              significance: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        clusters: { type: 'array', items: { type: 'object' } },
        topics: { type: 'array', items: { type: 'object' } },
        dispersion: { type: 'object' },
        significance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patterns', 'statistics', 'analysis']
}));

// Task 6: Comparative Corpus Analysis
export const comparativeAnalysisTask = defineTask('comparative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct comparative corpus analysis',
  agent: {
    name: 'comparative-analyst',
    prompt: {
      role: 'comparative corpus analysis specialist',
      task: 'Compare corpus with reference corpora',
      context: args,
      instructions: [
        'Compare frequency distributions',
        'Calculate keyness statistics',
        'Compare collocation patterns',
        'Analyze register differences',
        'Compare grammatical patterns',
        'Identify distinctive features',
        'Generate comparison visualizations',
        'Document significant differences'
      ],
      outputFormat: 'JSON with comparisons, keyness, differences, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons', 'artifacts'],
      properties: {
        comparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              referenceCorpus: { type: 'string' },
              metric: { type: 'string' },
              findings: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyness: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              keyness: { type: 'number' },
              direction: { type: 'string' }
            }
          }
        },
        differences: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'comparison', 'keyness', 'reference']
}));

// Task 7: Corpus Analysis Report Generation
export const corpusReportTask = defineTask('corpus-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate corpus analysis report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'corpus linguistics documentation specialist',
      task: 'Generate comprehensive corpus analysis report',
      context: args,
      instructions: [
        'Document corpus design and compilation',
        'Present annotation methodology',
        'Report frequency analysis results',
        'Present collocation findings',
        'Document pattern analysis',
        'Present comparative findings',
        'Include visualizations',
        'Format as research report'
      ],
      outputFormat: 'JSON with reportPath, sections, tables, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        tables: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'corpus-linguistics', 'documentation']
}));
