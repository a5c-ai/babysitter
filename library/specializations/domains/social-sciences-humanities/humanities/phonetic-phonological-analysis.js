/**
 * @process humanities/phonetic-phonological-analysis
 * @description Analyze sound systems using IPA transcription, acoustic analysis, and phonological rule formulation for language description
 * @inputs { languageData: object, recordingCorpus: array, analysisGoals: array }
 * @outputs { success: boolean, phoneticAnalysis: object, phonologicalSystem: object, rules: array, artifacts: array }
 * @recommendedSkills SK-HUM-003 (ipa-transcription-phonological-analysis), SK-HUM-012 (morphosyntactic-analysis)
 * @recommendedAgents AG-HUM-003 (documentary-linguist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageData,
    recordingCorpus = [],
    analysisGoals = [],
    existingDescriptions = [],
    outputDir = 'phonetic-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Phonetic Inventory Establishment
  ctx.log('info', 'Establishing phonetic inventory');
  const phoneticInventory = await ctx.task(phoneticInventoryTask, {
    languageData,
    recordingCorpus,
    existingDescriptions,
    outputDir
  });

  if (!phoneticInventory.success) {
    return {
      success: false,
      error: 'Phonetic inventory establishment failed',
      details: phoneticInventory,
      metadata: { processId: 'humanities/phonetic-phonological-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...phoneticInventory.artifacts);

  // Task 2: Acoustic Analysis
  ctx.log('info', 'Conducting acoustic analysis');
  const acousticAnalysis = await ctx.task(acousticAnalysisTask, {
    recordingCorpus,
    phoneticInventory,
    outputDir
  });

  artifacts.push(...acousticAnalysis.artifacts);

  // Task 3: Phonemic Analysis
  ctx.log('info', 'Conducting phonemic analysis');
  const phonemicAnalysis = await ctx.task(phonemicAnalysisTask, {
    phoneticInventory,
    acousticAnalysis,
    languageData,
    outputDir
  });

  artifacts.push(...phonemicAnalysis.artifacts);

  // Task 4: Allophonic Distribution Analysis
  ctx.log('info', 'Analyzing allophonic distribution');
  const allophonicAnalysis = await ctx.task(allophonicAnalysisTask, {
    phoneticInventory,
    phonemicAnalysis,
    outputDir
  });

  artifacts.push(...allophonicAnalysis.artifacts);

  // Task 5: Phonological Rule Formulation
  ctx.log('info', 'Formulating phonological rules');
  const ruleFormulation = await ctx.task(ruleFormulationTask, {
    phonemicAnalysis,
    allophonicAnalysis,
    outputDir
  });

  artifacts.push(...ruleFormulation.artifacts);

  // Task 6: Prosodic Analysis
  ctx.log('info', 'Analyzing prosodic features');
  const prosodicAnalysis = await ctx.task(prosodicAnalysisTask, {
    recordingCorpus,
    acousticAnalysis,
    languageData,
    outputDir
  });

  artifacts.push(...prosodicAnalysis.artifacts);

  // Task 7: Generate Phonological Description
  ctx.log('info', 'Generating phonological description');
  const phonologicalDescription = await ctx.task(phonologicalDescriptionTask, {
    phoneticInventory,
    acousticAnalysis,
    phonemicAnalysis,
    allophonicAnalysis,
    ruleFormulation,
    prosodicAnalysis,
    outputDir
  });

  artifacts.push(...phonologicalDescription.artifacts);

  // Breakpoint: Review phonological analysis
  await ctx.breakpoint({
    question: `Phonological analysis complete for ${languageData.name || 'language'}. Phonemes: ${phonemicAnalysis.phonemes?.length || 0}. Rules: ${ruleFormulation.rules?.length || 0}. Review analysis?`,
    title: 'Phonetic and Phonological Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        languageName: languageData.name,
        phonemes: phonemicAnalysis.phonemes?.length || 0,
        rules: ruleFormulation.rules?.length || 0,
        consonants: phoneticInventory.consonants?.length || 0,
        vowels: phoneticInventory.vowels?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    phoneticAnalysis: {
      consonants: phoneticInventory.consonants,
      vowels: phoneticInventory.vowels,
      acousticMeasurements: acousticAnalysis.measurements
    },
    phonologicalSystem: {
      phonemes: phonemicAnalysis.phonemes,
      allophones: allophonicAnalysis.allophones,
      prosody: prosodicAnalysis.features
    },
    rules: ruleFormulation.rules,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/phonetic-phonological-analysis',
      timestamp: startTime,
      languageName: languageData.name,
      outputDir
    }
  };
}

// Task 1: Phonetic Inventory Establishment
export const phoneticInventoryTask = defineTask('phonetic-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish phonetic inventory',
  agent: {
    name: 'phonetician',
    prompt: {
      role: 'phonetic documentation specialist',
      task: 'Establish comprehensive phonetic inventory',
      context: args,
      instructions: [
        'Identify all consonant phones with IPA',
        'Identify all vowel phones with IPA',
        'Document articulatory descriptions',
        'Note phonetic detail variations',
        'Create consonant chart',
        'Create vowel chart',
        'Document secondary articulations',
        'Note rare or unusual phones'
      ],
      outputFormat: 'JSON with success, consonants, vowels, charts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'consonants', 'vowels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        consonants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ipa: { type: 'string' },
              manner: { type: 'string' },
              place: { type: 'string' },
              voicing: { type: 'string' }
            }
          }
        },
        vowels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ipa: { type: 'string' },
              height: { type: 'string' },
              backness: { type: 'string' },
              rounding: { type: 'string' }
            }
          }
        },
        charts: { type: 'object' },
        secondaryArticulations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phonetics', 'inventory', 'ipa']
}));

// Task 2: Acoustic Analysis
export const acousticAnalysisTask = defineTask('acoustic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct acoustic analysis',
  agent: {
    name: 'acoustic-analyst',
    prompt: {
      role: 'acoustic phonetics specialist',
      task: 'Conduct acoustic analysis of speech sounds',
      context: args,
      instructions: [
        'Measure vowel formants (F1, F2, F3)',
        'Analyze consonant acoustics',
        'Measure VOT for stops',
        'Analyze fricative spectra',
        'Measure duration patterns',
        'Analyze pitch patterns',
        'Create acoustic vowel plots',
        'Document acoustic landmarks'
      ],
      outputFormat: 'JSON with measurements, formants, spectral, duration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['measurements', 'artifacts'],
      properties: {
        measurements: {
          type: 'object',
          properties: {
            vowelFormants: { type: 'array', items: { type: 'object' } },
            consonantMeasures: { type: 'array', items: { type: 'object' } },
            durations: { type: 'object' }
          }
        },
        formants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vowel: { type: 'string' },
              f1: { type: 'number' },
              f2: { type: 'number' },
              f3: { type: 'number' }
            }
          }
        },
        vot: { type: 'array', items: { type: 'object' } },
        spectralData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'acoustics', 'formants', 'analysis']
}));

// Task 3: Phonemic Analysis
export const phonemicAnalysisTask = defineTask('phonemic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct phonemic analysis',
  agent: {
    name: 'phonologist',
    prompt: {
      role: 'phonemic analysis specialist',
      task: 'Establish phonemic inventory through contrastive analysis',
      context: args,
      instructions: [
        'Identify minimal pairs',
        'Establish phonemic contrasts',
        'Determine phonemic inventory',
        'Distinguish phonemes from allophones',
        'Document complementary distribution',
        'Analyze free variation',
        'Document near-minimal pairs',
        'Create phoneme chart'
      ],
      outputFormat: 'JSON with phonemes, minimalPairs, contrasts, inventory, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phonemes', 'minimalPairs', 'artifacts'],
      properties: {
        phonemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phoneme: { type: 'string' },
              type: { type: 'string' },
              features: { type: 'object' }
            }
          }
        },
        minimalPairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contrast: { type: 'string' },
              word1: { type: 'string' },
              word2: { type: 'string' },
              gloss1: { type: 'string' },
              gloss2: { type: 'string' }
            }
          }
        },
        contrasts: { type: 'array', items: { type: 'object' } },
        freeVariation: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phonemes', 'contrasts', 'minimal-pairs']
}));

// Task 4: Allophonic Distribution Analysis
export const allophonicAnalysisTask = defineTask('allophonic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze allophonic distribution',
  agent: {
    name: 'allophone-analyst',
    prompt: {
      role: 'allophonic distribution specialist',
      task: 'Analyze allophonic distribution patterns',
      context: args,
      instructions: [
        'Identify allophones for each phoneme',
        'Document conditioning environments',
        'Distinguish complementary distribution from free variation',
        'Identify elsewhere conditions',
        'Document phonetic detail rules',
        'Analyze gradient vs categorical patterns',
        'Create allophone tables',
        'Document exceptions'
      ],
      outputFormat: 'JSON with allophones, distributions, environments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allophones', 'distributions', 'artifacts'],
      properties: {
        allophones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phoneme: { type: 'string' },
              allophones: { type: 'array', items: { type: 'string' } },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        distributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              allophone: { type: 'string' },
              environment: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        freeVariation: { type: 'array', items: { type: 'object' } },
        exceptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'allophones', 'distribution', 'phonology']
}));

// Task 5: Phonological Rule Formulation
export const ruleFormulationTask = defineTask('rule-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate phonological rules',
  agent: {
    name: 'rule-formulator',
    prompt: {
      role: 'phonological rule specialist',
      task: 'Formulate phonological rules for the language',
      context: args,
      instructions: [
        'Formulate allophonic rules',
        'Identify phonological processes',
        'Write rules in formal notation',
        'Establish rule ordering',
        'Identify feeding and bleeding relationships',
        'Document optional vs obligatory rules',
        'Analyze rule domains',
        'Document exceptions and lexical items'
      ],
      outputFormat: 'JSON with rules, processes, ordering, domains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formalNotation: { type: 'string' },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        processes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              process: { type: 'string' },
              type: { type: 'string' },
              rule: { type: 'string' }
            }
          }
        },
        ordering: { type: 'array', items: { type: 'object' } },
        domains: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rules', 'phonology', 'formal']
}));

// Task 6: Prosodic Analysis
export const prosodicAnalysisTask = defineTask('prosodic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze prosodic features',
  agent: {
    name: 'prosodist',
    prompt: {
      role: 'prosodic analysis specialist',
      task: 'Analyze prosodic features of the language',
      context: args,
      instructions: [
        'Analyze stress patterns',
        'Document tone system if present',
        'Analyze intonation patterns',
        'Identify prosodic domains',
        'Document syllable weight',
        'Analyze rhythm type',
        'Document phrase-level prosody',
        'Analyze focus and prominence'
      ],
      outputFormat: 'JSON with features, stress, tone, intonation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'artifacts'],
      properties: {
        features: {
          type: 'object',
          properties: {
            stress: { type: 'object' },
            tone: { type: 'object' },
            intonation: { type: 'object' }
          }
        },
        stress: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            domain: { type: 'string' },
            rules: { type: 'array', items: { type: 'string' } }
          }
        },
        tone: {
          type: 'object',
          properties: {
            hasTone: { type: 'boolean' },
            inventory: { type: 'array', items: { type: 'string' } },
            patterns: { type: 'array', items: { type: 'object' } }
          }
        },
        intonation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prosody', 'stress', 'tone']
}));

// Task 7: Phonological Description Generation
export const phonologicalDescriptionTask = defineTask('phonological-description', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate phonological description',
  agent: {
    name: 'description-writer',
    prompt: {
      role: 'phonological description specialist',
      task: 'Generate comprehensive phonological description',
      context: args,
      instructions: [
        'Present phonetic inventory',
        'Document phonemic analysis',
        'Present allophonic rules',
        'Document phonological processes',
        'Present prosodic analysis',
        'Include acoustic data',
        'Create summary tables',
        'Format as grammatical description'
      ],
      outputFormat: 'JSON with reportPath, sections, tables, artifacts'
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
        tables: {
          type: 'object',
          properties: {
            consonants: { type: 'string' },
            vowels: { type: 'string' },
            phonemes: { type: 'string' }
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
  labels: ['agent', 'description', 'phonology', 'documentation']
}));
