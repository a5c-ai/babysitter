/**
 * @process humanities/language-documentation-project
 * @description Conduct comprehensive endangered language documentation including phonological, morphological, and syntactic analysis with community collaboration
 * @inputs { language: object, communityContext: object, documentationGoals: array, existingResources: array }
 * @outputs { success: boolean, languageDocumentation: object, grammaticalSketch: object, lexicalDatabase: object, artifacts: array }
 * @recommendedSkills SK-HUM-003 (ipa-transcription-phonological-analysis), SK-HUM-012 (morphosyntactic-analysis), SK-HUM-006 (research-ethics-irb-navigation)
 * @recommendedAgents AG-HUM-003 (documentary-linguist), AG-HUM-008 (research-ethics-consultant)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    language,
    communityContext = {},
    documentationGoals = [],
    existingResources = [],
    collaborators = [],
    outputDir = 'language-documentation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Community Collaboration Framework
  ctx.log('info', 'Establishing community collaboration framework');
  const communityFramework = await ctx.task(communityCollaborationTask, {
    language,
    communityContext,
    collaborators,
    outputDir
  });

  if (!communityFramework.success) {
    return {
      success: false,
      error: 'Community collaboration framework failed',
      details: communityFramework,
      metadata: { processId: 'humanities/language-documentation-project', timestamp: startTime }
    };
  }

  artifacts.push(...communityFramework.artifacts);

  // Task 2: Phonological Documentation
  ctx.log('info', 'Documenting phonological system');
  const phonologicalDoc = await ctx.task(phonologicalDocumentationTask, {
    language,
    existingResources,
    outputDir
  });

  artifacts.push(...phonologicalDoc.artifacts);

  // Task 3: Morphological Analysis
  ctx.log('info', 'Analyzing morphological system');
  const morphologicalAnalysis = await ctx.task(morphologicalAnalysisTask, {
    language,
    phonologicalDoc,
    outputDir
  });

  artifacts.push(...morphologicalAnalysis.artifacts);

  // Task 4: Syntactic Analysis
  ctx.log('info', 'Analyzing syntactic structures');
  const syntacticAnalysis = await ctx.task(syntacticAnalysisTask, {
    language,
    morphologicalAnalysis,
    outputDir
  });

  artifacts.push(...syntacticAnalysis.artifacts);

  // Task 5: Lexical Documentation
  ctx.log('info', 'Developing lexical database');
  const lexicalDocumentation = await ctx.task(lexicalDocumentationTask, {
    language,
    phonologicalDoc,
    morphologicalAnalysis,
    outputDir
  });

  artifacts.push(...lexicalDocumentation.artifacts);

  // Task 6: Text Collection and Annotation
  ctx.log('info', 'Collecting and annotating texts');
  const textCollection = await ctx.task(textCollectionTask, {
    language,
    grammaticalAnalysis: { phonologicalDoc, morphologicalAnalysis, syntacticAnalysis },
    communityContext,
    outputDir
  });

  artifacts.push(...textCollection.artifacts);

  // Task 7: Generate Language Documentation Report
  ctx.log('info', 'Generating language documentation report');
  const documentationReport = await ctx.task(documentationReportTask, {
    language,
    communityFramework,
    phonologicalDoc,
    morphologicalAnalysis,
    syntacticAnalysis,
    lexicalDocumentation,
    textCollection,
    outputDir
  });

  artifacts.push(...documentationReport.artifacts);

  // Breakpoint: Review language documentation
  await ctx.breakpoint({
    question: `Language documentation complete for ${language.name || 'language'}. Lexical entries: ${lexicalDocumentation.entries?.length || 0}. Review documentation?`,
    title: 'Language Documentation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        languageName: language.name,
        phonemes: phonologicalDoc.phonemes?.length || 0,
        lexicalEntries: lexicalDocumentation.entries?.length || 0,
        textsCollected: textCollection.texts?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    languageDocumentation: {
      language: language.name,
      classification: language.classification,
      endangermentStatus: language.endangermentStatus
    },
    grammaticalSketch: {
      phonology: phonologicalDoc.analysis,
      morphology: morphologicalAnalysis.analysis,
      syntax: syntacticAnalysis.analysis
    },
    lexicalDatabase: {
      entries: lexicalDocumentation.entries,
      semanticDomains: lexicalDocumentation.domains
    },
    textCorpus: textCollection.texts,
    communityCollaboration: communityFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/language-documentation-project',
      timestamp: startTime,
      languageName: language.name,
      outputDir
    }
  };
}

// Task 1: Community Collaboration Framework
export const communityCollaborationTask = defineTask('community-collaboration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish community collaboration framework',
  agent: {
    name: 'community-liaison',
    prompt: {
      role: 'community-based language documentation specialist',
      task: 'Establish ethical community collaboration framework',
      context: args,
      instructions: [
        'Identify community stakeholders and partners',
        'Establish community ownership protocols',
        'Develop data sharing agreements',
        'Create training plans for community members',
        'Establish benefit-sharing framework',
        'Develop consent protocols for speakers',
        'Create communication and feedback mechanisms',
        'Document community language goals'
      ],
      outputFormat: 'JSON with success, framework, partners, agreements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'framework', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        framework: {
          type: 'object',
          properties: {
            ownership: { type: 'string' },
            sharing: { type: 'object' },
            benefits: { type: 'array', items: { type: 'string' } }
          }
        },
        partners: { type: 'array', items: { type: 'object' } },
        agreements: { type: 'array', items: { type: 'object' } },
        communityGoals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'collaboration', 'ethics']
}));

// Task 2: Phonological Documentation
export const phonologicalDocumentationTask = defineTask('phonological-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document phonological system',
  agent: {
    name: 'phonologist',
    prompt: {
      role: 'phonological documentation specialist',
      task: 'Document the phonological system of the language',
      context: args,
      instructions: [
        'Establish phoneme inventory (consonants and vowels)',
        'Document allophonic variation',
        'Analyze syllable structure',
        'Document prosodic features (stress, tone)',
        'Identify phonological processes',
        'Document phonotactic constraints',
        'Create IPA transcription conventions',
        'Develop practical orthography if needed'
      ],
      outputFormat: 'JSON with phonemes, analysis, processes, orthography, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phonemes', 'analysis', 'artifacts'],
      properties: {
        phonemes: {
          type: 'object',
          properties: {
            consonants: { type: 'array', items: { type: 'object' } },
            vowels: { type: 'array', items: { type: 'object' } }
          }
        },
        analysis: {
          type: 'object',
          properties: {
            syllableStructure: { type: 'string' },
            prosody: { type: 'object' },
            phonotactics: { type: 'object' }
          }
        },
        processes: { type: 'array', items: { type: 'object' } },
        orthography: {
          type: 'object',
          properties: {
            system: { type: 'string' },
            conventions: { type: 'object' }
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
  labels: ['agent', 'phonology', 'documentation', 'linguistics']
}));

// Task 3: Morphological Analysis
export const morphologicalAnalysisTask = defineTask('morphological-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze morphological system',
  agent: {
    name: 'morphologist',
    prompt: {
      role: 'morphological analysis specialist',
      task: 'Analyze the morphological system of the language',
      context: args,
      instructions: [
        'Identify word classes (parts of speech)',
        'Document derivational morphology',
        'Document inflectional morphology',
        'Analyze morphological typology',
        'Document morphophonological processes',
        'Analyze compounding and clitics',
        'Create morpheme inventory',
        'Document paradigms'
      ],
      outputFormat: 'JSON with analysis, wordClasses, morphemes, paradigms, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'wordClasses', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            typology: { type: 'string' },
            derivational: { type: 'object' },
            inflectional: { type: 'object' }
          }
        },
        wordClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              class: { type: 'string' },
              properties: { type: 'object' },
              morphology: { type: 'object' }
            }
          }
        },
        morphemes: { type: 'array', items: { type: 'object' } },
        paradigms: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'morphology', 'analysis', 'linguistics']
}));

// Task 4: Syntactic Analysis
export const syntacticAnalysisTask = defineTask('syntactic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze syntactic structures',
  agent: {
    name: 'syntactician',
    prompt: {
      role: 'syntactic analysis specialist',
      task: 'Analyze the syntactic structures of the language',
      context: args,
      instructions: [
        'Determine basic word order',
        'Analyze phrase structure',
        'Document clause types',
        'Analyze grammatical relations',
        'Document complex sentence structures',
        'Analyze alignment and case marking',
        'Document information structure',
        'Analyze subordination and coordination'
      ],
      outputFormat: 'JSON with analysis, wordOrder, clauseTypes, constructions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            wordOrder: { type: 'string' },
            alignment: { type: 'string' },
            phraseStructure: { type: 'object' }
          }
        },
        wordOrder: {
          type: 'object',
          properties: {
            basic: { type: 'string' },
            variations: { type: 'array', items: { type: 'string' } }
          }
        },
        clauseTypes: { type: 'array', items: { type: 'object' } },
        constructions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'syntax', 'analysis', 'linguistics']
}));

// Task 5: Lexical Documentation
export const lexicalDocumentationTask = defineTask('lexical-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop lexical database',
  agent: {
    name: 'lexicographer',
    prompt: {
      role: 'documentary lexicography specialist',
      task: 'Develop comprehensive lexical database',
      context: args,
      instructions: [
        'Establish lexical entry structure',
        'Collect core vocabulary',
        'Document semantic domains',
        'Record cultural vocabulary',
        'Include example sentences',
        'Document collocations and idioms',
        'Record loanwords and etymology',
        'Create multimedia entries where possible'
      ],
      outputFormat: 'JSON with entries, domains, structure, statistics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['entries', 'domains', 'artifacts'],
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              headword: { type: 'string' },
              pos: { type: 'string' },
              definition: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        domains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string' },
              entries: { type: 'number' }
            }
          }
        },
        structure: { type: 'object' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lexicon', 'dictionary', 'documentation']
}));

// Task 6: Text Collection and Annotation
export const textCollectionTask = defineTask('text-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and annotate texts',
  agent: {
    name: 'text-collector',
    prompt: {
      role: 'language documentation text specialist',
      task: 'Collect and annotate diverse text genres',
      context: args,
      instructions: [
        'Collect diverse text genres (narrative, procedural, etc.)',
        'Record natural discourse',
        'Create interlinear glossed texts',
        'Document oral traditions',
        'Annotate texts grammatically',
        'Link to lexical database',
        'Include metadata for all texts',
        'Create accessible text archive'
      ],
      outputFormat: 'JSON with texts, genres, annotations, archive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['texts', 'genres', 'artifacts'],
      properties: {
        texts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              genre: { type: 'string' },
              speaker: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        genres: { type: 'array', items: { type: 'string' } },
        annotations: {
          type: 'object',
          properties: {
            tiers: { type: 'array', items: { type: 'string' } },
            conventions: { type: 'object' }
          }
        },
        archive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'texts', 'annotation', 'corpus']
}));

// Task 7: Documentation Report Generation
export const documentationReportTask = defineTask('documentation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate language documentation report',
  agent: {
    name: 'documentation-writer',
    prompt: {
      role: 'language documentation specialist',
      task: 'Generate comprehensive language documentation report',
      context: args,
      instructions: [
        'Present language overview and classification',
        'Document community collaboration',
        'Present phonological analysis',
        'Document morphological analysis',
        'Present syntactic analysis',
        'Summarize lexical documentation',
        'Document text corpus',
        'Format as grammatical sketch'
      ],
      outputFormat: 'JSON with reportPath, sections, statistics, artifacts'
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
        statistics: {
          type: 'object',
          properties: {
            phonemes: { type: 'number' },
            lexicalEntries: { type: 'number' },
            textsCollected: { type: 'number' },
            hoursRecorded: { type: 'number' }
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
  labels: ['agent', 'documentation', 'report', 'linguistics']
}));
