/**
 * @process humanities/text-mining-distant-reading
 * @description Apply computational text analysis methods including topic modeling, sentiment analysis, and pattern recognition across large textual corpora
 * @inputs { corpus: object, analysisTypes: array, researchQuestions: array }
 * @outputs { success: boolean, textMiningResults: object, topicModel: object, patterns: array, artifacts: array }
 * @recommendedSkills SK-HUM-009 (topic-modeling-text-mining), SK-HUM-004 (tei-text-encoding)
 * @recommendedAgents AG-HUM-005 (digital-humanities-technologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    corpus,
    analysisTypes = ['topic-modeling', 'sentiment', 'named-entity'],
    researchQuestions = [],
    preprocessingOptions = {},
    outputDir = 'text-mining-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Corpus Preprocessing
  ctx.log('info', 'Preprocessing corpus for analysis');
  const preprocessing = await ctx.task(preprocessingTask, {
    corpus,
    preprocessingOptions,
    outputDir
  });

  if (!preprocessing.success) {
    return {
      success: false,
      error: 'Preprocessing failed',
      details: preprocessing,
      metadata: { processId: 'humanities/text-mining-distant-reading', timestamp: startTime }
    };
  }

  artifacts.push(...preprocessing.artifacts);

  // Task 2: Topic Modeling
  ctx.log('info', 'Conducting topic modeling analysis');
  const topicModeling = await ctx.task(topicModelingTask, {
    preprocessing,
    researchQuestions,
    outputDir
  });

  artifacts.push(...topicModeling.artifacts);

  // Task 3: Sentiment and Emotion Analysis
  ctx.log('info', 'Conducting sentiment analysis');
  const sentimentAnalysis = await ctx.task(sentimentAnalysisTask, {
    preprocessing,
    researchQuestions,
    outputDir
  });

  artifacts.push(...sentimentAnalysis.artifacts);

  // Task 4: Named Entity Recognition
  ctx.log('info', 'Extracting named entities');
  const nerAnalysis = await ctx.task(nerAnalysisTask, {
    preprocessing,
    outputDir
  });

  artifacts.push(...nerAnalysis.artifacts);

  // Task 5: Network and Relationship Analysis
  ctx.log('info', 'Analyzing networks and relationships');
  const networkAnalysis = await ctx.task(networkAnalysisTask, {
    nerAnalysis,
    preprocessing,
    outputDir
  });

  artifacts.push(...networkAnalysis.artifacts);

  // Task 6: Temporal and Trend Analysis
  ctx.log('info', 'Analyzing temporal patterns and trends');
  const temporalAnalysis = await ctx.task(temporalAnalysisTask, {
    topicModeling,
    sentimentAnalysis,
    corpus,
    outputDir
  });

  artifacts.push(...temporalAnalysis.artifacts);

  // Task 7: Generate Distant Reading Report
  ctx.log('info', 'Generating distant reading report');
  const distantReadingReport = await ctx.task(distantReadingReportTask, {
    corpus,
    preprocessing,
    topicModeling,
    sentimentAnalysis,
    nerAnalysis,
    networkAnalysis,
    temporalAnalysis,
    researchQuestions,
    outputDir
  });

  artifacts.push(...distantReadingReport.artifacts);

  // Breakpoint: Review text mining results
  await ctx.breakpoint({
    question: `Text mining complete. Topics: ${topicModeling.topics?.length || 0}. Entities: ${nerAnalysis.entities?.length || 0}. Review results?`,
    title: 'Text Mining and Distant Reading Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        corpusName: corpus.name,
        documentsAnalyzed: preprocessing.statistics?.documents || 0,
        topicsIdentified: topicModeling.topics?.length || 0,
        entitiesExtracted: nerAnalysis.entities?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    textMiningResults: {
      preprocessing: preprocessing.statistics,
      sentimentOverview: sentimentAnalysis.overview,
      entityTypes: nerAnalysis.summary
    },
    topicModel: {
      topics: topicModeling.topics,
      coherence: topicModeling.coherence,
      distribution: topicModeling.distribution
    },
    patterns: {
      temporal: temporalAnalysis.patterns,
      network: networkAnalysis.patterns
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/text-mining-distant-reading',
      timestamp: startTime,
      corpusName: corpus.name,
      outputDir
    }
  };
}

// Task 1: Corpus Preprocessing
export const preprocessingTask = defineTask('preprocessing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Preprocess corpus for text mining',
  agent: {
    name: 'preprocessor',
    prompt: {
      role: 'text preprocessing specialist',
      task: 'Preprocess corpus for computational analysis',
      context: args,
      instructions: [
        'Tokenize texts',
        'Apply lowercasing and normalization',
        'Remove stopwords (with careful consideration)',
        'Apply stemming or lemmatization',
        'Handle punctuation and special characters',
        'Create document-term matrix',
        'Apply TF-IDF weighting',
        'Generate preprocessing statistics'
      ],
      outputFormat: 'JSON with success, statistics, matrix, vocabulary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'statistics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        statistics: {
          type: 'object',
          properties: {
            documents: { type: 'number' },
            tokens: { type: 'number' },
            vocabulary: { type: 'number' },
            avgDocLength: { type: 'number' }
          }
        },
        matrix: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            dimensions: { type: 'array', items: { type: 'number' } }
          }
        },
        vocabulary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'preprocessing', 'tokenization', 'text-mining']
}));

// Task 2: Topic Modeling
export const topicModelingTask = defineTask('topic-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct topic modeling',
  agent: {
    name: 'topic-modeler',
    prompt: {
      role: 'topic modeling specialist',
      task: 'Apply topic modeling to discover thematic structure',
      context: args,
      instructions: [
        'Select appropriate model (LDA, NMF, etc.)',
        'Determine optimal number of topics',
        'Train topic model',
        'Extract topic-word distributions',
        'Calculate document-topic distributions',
        'Evaluate model coherence',
        'Label topics interpretively',
        'Generate topic visualizations'
      ],
      outputFormat: 'JSON with topics, coherence, distribution, labels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'artifacts'],
      properties: {
        topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              label: { type: 'string' },
              words: { type: 'array', items: { type: 'object' } },
              prevalence: { type: 'number' }
            }
          }
        },
        coherence: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            metric: { type: 'string' }
          }
        },
        distribution: { type: 'object' },
        modelParameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'topic-modeling', 'lda', 'themes']
}));

// Task 3: Sentiment and Emotion Analysis
export const sentimentAnalysisTask = defineTask('sentiment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct sentiment analysis',
  agent: {
    name: 'sentiment-analyst',
    prompt: {
      role: 'sentiment analysis specialist',
      task: 'Analyze sentiment and emotion in texts',
      context: args,
      instructions: [
        'Apply sentiment classification',
        'Calculate sentiment scores',
        'Analyze emotional dimensions',
        'Identify sentiment patterns',
        'Analyze sentiment by document section',
        'Detect subjectivity vs objectivity',
        'Generate sentiment distributions',
        'Visualize sentiment patterns'
      ],
      outputFormat: 'JSON with overview, scores, emotions, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overview', 'scores', 'artifacts'],
      properties: {
        overview: {
          type: 'object',
          properties: {
            averageSentiment: { type: 'number' },
            distribution: { type: 'object' }
          }
        },
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              sentiment: { type: 'number' },
              classification: { type: 'string' }
            }
          }
        },
        emotions: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sentiment', 'emotion', 'analysis']
}));

// Task 4: Named Entity Recognition
export const nerAnalysisTask = defineTask('ner-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract named entities',
  agent: {
    name: 'ner-analyst',
    prompt: {
      role: 'named entity recognition specialist',
      task: 'Extract and analyze named entities',
      context: args,
      instructions: [
        'Apply NER models',
        'Extract persons, places, organizations',
        'Extract dates and temporal expressions',
        'Extract other relevant entity types',
        'Calculate entity frequencies',
        'Analyze entity co-occurrence',
        'Create entity index',
        'Generate entity visualizations'
      ],
      outputFormat: 'JSON with entities, summary, cooccurrence, index, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'summary', 'artifacts'],
      properties: {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string' },
              frequency: { type: 'number' },
              documents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            persons: { type: 'number' },
            places: { type: 'number' },
            organizations: { type: 'number' },
            dates: { type: 'number' }
          }
        },
        cooccurrence: { type: 'object' },
        index: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ner', 'entities', 'extraction']
}));

// Task 5: Network and Relationship Analysis
export const networkAnalysisTask = defineTask('network-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze networks and relationships',
  agent: {
    name: 'network-analyst',
    prompt: {
      role: 'network analysis specialist',
      task: 'Analyze entity networks and relationships',
      context: args,
      instructions: [
        'Build co-occurrence networks',
        'Calculate network metrics',
        'Identify central nodes',
        'Detect communities/clusters',
        'Analyze relationship types',
        'Generate network visualizations',
        'Identify key relationships',
        'Analyze network evolution if temporal'
      ],
      outputFormat: 'JSON with networks, metrics, communities, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['networks', 'patterns', 'artifacts'],
      properties: {
        networks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              nodes: { type: 'number' },
              edges: { type: 'number' },
              density: { type: 'number' }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            centralNodes: { type: 'array', items: { type: 'object' } },
            clustering: { type: 'number' }
          }
        },
        communities: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'network', 'relationships', 'graph']
}));

// Task 6: Temporal and Trend Analysis
export const temporalAnalysisTask = defineTask('temporal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze temporal patterns and trends',
  agent: {
    name: 'temporal-analyst',
    prompt: {
      role: 'temporal analysis specialist',
      task: 'Analyze temporal patterns and trends in corpus',
      context: args,
      instructions: [
        'Analyze topic evolution over time',
        'Track sentiment changes',
        'Identify trend patterns',
        'Detect change points',
        'Analyze vocabulary shifts',
        'Track entity prominence over time',
        'Generate temporal visualizations',
        'Identify periodic patterns'
      ],
      outputFormat: 'JSON with patterns, trends, changePoints, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'trends', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              period: { type: 'string' }
            }
          }
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              direction: { type: 'string' },
              magnitude: { type: 'number' }
            }
          }
        },
        changePoints: { type: 'array', items: { type: 'object' } },
        topicEvolution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'temporal', 'trends', 'evolution']
}));

// Task 7: Distant Reading Report Generation
export const distantReadingReportTask = defineTask('distant-reading-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate distant reading report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'digital humanities reporting specialist',
      task: 'Generate comprehensive distant reading report',
      context: args,
      instructions: [
        'Document corpus and preprocessing',
        'Present topic modeling results',
        'Report sentiment analysis findings',
        'Document entity extraction results',
        'Present network analysis',
        'Document temporal patterns',
        'Include all visualizations',
        'Address research questions'
      ],
      outputFormat: 'JSON with reportPath, sections, findings, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'findings', 'artifacts'],
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
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              finding: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'distant-reading', 'digital-humanities']
}));
