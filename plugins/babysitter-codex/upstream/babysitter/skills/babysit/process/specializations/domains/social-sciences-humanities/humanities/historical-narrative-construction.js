/**
 * @process humanities/historical-narrative-construction
 * @description Develop historical arguments and narratives through evidence synthesis, historiographical positioning, and addressing counterevidence with scholarly rigor
 * @inputs { researchQuestion: string, evidenceBase: array, historiographicalContext: object, targetAudience: string }
 * @outputs { success: boolean, historicalNarrative: object, argumentStructure: object, historiographicalPosition: object, artifacts: array }
 * @recommendedSkills SK-HUM-001 (primary-source-evaluation), SK-HUM-010 (citation-scholarly-apparatus), SK-HUM-005 (literary-close-reading)
 * @recommendedAgents AG-HUM-007 (historical-narrator), AG-HUM-001 (archival-research-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    evidenceBase = [],
    historiographicalContext = {},
    targetAudience = 'scholarly',
    outputDir = 'narrative-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Evidence Synthesis
  ctx.log('info', 'Synthesizing evidence base');
  const evidenceSynthesis = await ctx.task(evidenceSynthesisTask, {
    researchQuestion,
    evidenceBase,
    outputDir
  });

  if (!evidenceSynthesis.success) {
    return {
      success: false,
      error: 'Evidence synthesis failed',
      details: evidenceSynthesis,
      metadata: { processId: 'humanities/historical-narrative-construction', timestamp: startTime }
    };
  }

  artifacts.push(...evidenceSynthesis.artifacts);

  // Task 2: Historiographical Positioning
  ctx.log('info', 'Establishing historiographical position');
  const historiographicalPosition = await ctx.task(historiographicalPositioningTask, {
    researchQuestion,
    historiographicalContext,
    evidenceSynthesis,
    outputDir
  });

  artifacts.push(...historiographicalPosition.artifacts);

  // Task 3: Argument Development
  ctx.log('info', 'Developing historical argument');
  const argumentDevelopment = await ctx.task(argumentDevelopmentTask, {
    researchQuestion,
    evidenceSynthesis,
    historiographicalPosition,
    outputDir
  });

  artifacts.push(...argumentDevelopment.artifacts);

  // Task 4: Counterevidence Analysis
  ctx.log('info', 'Analyzing counterevidence');
  const counterevidenceAnalysis = await ctx.task(counterevidenceAnalysisTask, {
    argumentDevelopment,
    evidenceBase,
    historiographicalContext,
    outputDir
  });

  artifacts.push(...counterevidenceAnalysis.artifacts);

  // Task 5: Narrative Structure Design
  ctx.log('info', 'Designing narrative structure');
  const narrativeStructure = await ctx.task(narrativeStructureTask, {
    argumentDevelopment,
    evidenceSynthesis,
    targetAudience,
    outputDir
  });

  artifacts.push(...narrativeStructure.artifacts);

  // Task 6: Scholarly Apparatus Integration
  ctx.log('info', 'Integrating scholarly apparatus');
  const scholarlyApparatus = await ctx.task(scholarlyApparatusTask, {
    argumentDevelopment,
    evidenceBase,
    historiographicalPosition,
    outputDir
  });

  artifacts.push(...scholarlyApparatus.artifacts);

  // Task 7: Generate Historical Narrative Draft
  ctx.log('info', 'Generating historical narrative draft');
  const narrativeDraft = await ctx.task(narrativeDraftTask, {
    evidenceSynthesis,
    historiographicalPosition,
    argumentDevelopment,
    counterevidenceAnalysis,
    narrativeStructure,
    scholarlyApparatus,
    targetAudience,
    outputDir
  });

  artifacts.push(...narrativeDraft.artifacts);

  // Breakpoint: Review historical narrative
  await ctx.breakpoint({
    question: `Historical narrative draft complete for: ${researchQuestion}. Argument strength: ${argumentDevelopment.strength}. Review narrative?`,
    title: 'Historical Narrative Construction Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        researchQuestion,
        evidenceCount: evidenceBase.length,
        argumentStrength: argumentDevelopment.strength,
        historiographicalSchool: historiographicalPosition.school
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    historicalNarrative: {
      thesis: argumentDevelopment.thesis,
      structure: narrativeStructure.outline,
      draftPath: narrativeDraft.draftPath
    },
    argumentStructure: {
      thesis: argumentDevelopment.thesis,
      mainClaims: argumentDevelopment.claims,
      evidenceMapping: evidenceSynthesis.mapping,
      counterarguments: counterevidenceAnalysis.counterarguments
    },
    historiographicalPosition: {
      school: historiographicalPosition.school,
      influences: historiographicalPosition.influences,
      contribution: historiographicalPosition.contribution
    },
    scholarlyApparatus: scholarlyApparatus.apparatus,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/historical-narrative-construction',
      timestamp: startTime,
      researchQuestion,
      outputDir
    }
  };
}

// Task 1: Evidence Synthesis
export const evidenceSynthesisTask = defineTask('evidence-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize evidence base',
  agent: {
    name: 'evidence-synthesizer',
    prompt: {
      role: 'historical evidence analyst',
      task: 'Synthesize and organize evidence base for historical argument',
      context: args,
      instructions: [
        'Catalog and categorize available evidence',
        'Assess evidence quality and reliability',
        'Identify patterns and themes across evidence',
        'Map evidence to potential claims',
        'Identify evidence gaps',
        'Weight evidence by significance',
        'Create evidence hierarchy',
        'Document evidence chains and connections'
      ],
      outputFormat: 'JSON with success, synthesis, mapping, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'synthesis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        synthesis: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'object' } },
            patterns: { type: 'array', items: { type: 'string' } },
            hierarchy: { type: 'object' }
          }
        },
        mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidence: { type: 'string' },
              potentialClaims: { type: 'array', items: { type: 'string' } },
              strength: { type: 'string' }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evidence', 'synthesis', 'historical']
}));

// Task 2: Historiographical Positioning
export const historiographicalPositioningTask = defineTask('historiographical-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish historiographical position',
  agent: {
    name: 'historiographer',
    prompt: {
      role: 'historiography specialist',
      task: 'Position argument within historiographical landscape',
      context: args,
      instructions: [
        'Review existing scholarship on topic',
        'Identify major historiographical schools',
        'Map scholarly debates and positions',
        'Identify gaps in existing scholarship',
        'Position new argument within debates',
        'Acknowledge intellectual debts',
        'Identify points of departure',
        'Articulate contribution to field'
      ],
      outputFormat: 'JSON with school, influences, debates, contribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['school', 'contribution', 'artifacts'],
      properties: {
        school: { type: 'string' },
        influences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scholar: { type: 'string' },
              work: { type: 'string' },
              influence: { type: 'string' }
            }
          }
        },
        debates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              positions: { type: 'array', items: { type: 'string' } },
              ownPosition: { type: 'string' }
            }
          }
        },
        contribution: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'historiography', 'scholarship', 'positioning']
}));

// Task 3: Argument Development
export const argumentDevelopmentTask = defineTask('argument-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop historical argument',
  agent: {
    name: 'argument-developer',
    prompt: {
      role: 'historical argumentation specialist',
      task: 'Develop rigorous historical argument from evidence',
      context: args,
      instructions: [
        'Formulate clear thesis statement',
        'Develop main supporting claims',
        'Link claims to evidence',
        'Establish causal relationships',
        'Identify necessary qualifications',
        'Develop argument logic flow',
        'Address scope and limitations',
        'Assess argument strength'
      ],
      outputFormat: 'JSON with thesis, claims, logic, strength, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['thesis', 'claims', 'artifacts'],
      properties: {
        thesis: { type: 'string' },
        claims: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              reasoning: { type: 'string' }
            }
          }
        },
        logic: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            causalLinks: { type: 'array', items: { type: 'object' } }
          }
        },
        qualifications: { type: 'array', items: { type: 'string' } },
        strength: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'argument', 'thesis', 'historical']
}));

// Task 4: Counterevidence Analysis
export const counterevidenceAnalysisTask = defineTask('counterevidence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze counterevidence',
  agent: {
    name: 'counterevidence-analyst',
    prompt: {
      role: 'critical historical analyst',
      task: 'Analyze and address counterevidence and alternative interpretations',
      context: args,
      instructions: [
        'Identify evidence that challenges thesis',
        'Analyze alternative interpretations',
        'Assess strength of counterarguments',
        'Develop responses to counterevidence',
        'Integrate acknowledgments into argument',
        'Identify necessary modifications',
        'Strengthen argument through engagement',
        'Document unresolved tensions'
      ],
      outputFormat: 'JSON with counterarguments, responses, modifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['counterarguments', 'responses', 'artifacts'],
      properties: {
        counterarguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              counterargument: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              strength: { type: 'string' }
            }
          }
        },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              counterargument: { type: 'string' },
              response: { type: 'string' },
              strategy: { type: 'string' }
            }
          }
        },
        modifications: { type: 'array', items: { type: 'string' } },
        unresolvedTensions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'counterevidence', 'criticism', 'argumentation']
}));

// Task 5: Narrative Structure Design
export const narrativeStructureTask = defineTask('narrative-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design narrative structure',
  agent: {
    name: 'narrative-designer',
    prompt: {
      role: 'historical narrative specialist',
      task: 'Design effective narrative structure for historical argument',
      context: args,
      instructions: [
        'Choose appropriate narrative mode',
        'Design chapter/section structure',
        'Plan argument flow and pacing',
        'Integrate evidence presentation',
        'Design opening and conclusion',
        'Plan transitions and connections',
        'Consider audience engagement',
        'Balance analysis and narrative'
      ],
      outputFormat: 'JSON with mode, outline, pacing, transitions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mode', 'outline', 'artifacts'],
      properties: {
        mode: { type: 'string' },
        outline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              content: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        pacing: { type: 'object' },
        transitions: { type: 'array', items: { type: 'object' } },
        openingStrategy: { type: 'string' },
        conclusion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'narrative', 'structure', 'writing']
}));

// Task 6: Scholarly Apparatus Integration
export const scholarlyApparatusTask = defineTask('scholarly-apparatus', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate scholarly apparatus',
  agent: {
    name: 'scholarly-editor',
    prompt: {
      role: 'scholarly editing specialist',
      task: 'Develop scholarly apparatus for historical narrative',
      context: args,
      instructions: [
        'Plan footnote/endnote strategy',
        'Organize bibliography by type',
        'Develop citation approach',
        'Plan appendices if needed',
        'Create glossary for technical terms',
        'Design index structure',
        'Plan illustrations and maps',
        'Establish documentation standards'
      ],
      outputFormat: 'JSON with apparatus, citationStrategy, supplements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apparatus', 'artifacts'],
      properties: {
        apparatus: {
          type: 'object',
          properties: {
            noteStrategy: { type: 'string' },
            bibliographyOrganization: { type: 'object' },
            appendices: { type: 'array', items: { type: 'string' } }
          }
        },
        citationStrategy: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            archivalFormat: { type: 'string' }
          }
        },
        supplements: {
          type: 'object',
          properties: {
            glossary: { type: 'boolean' },
            index: { type: 'object' },
            illustrations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'apparatus', 'citation', 'editing']
}));

// Task 7: Narrative Draft Generation
export const narrativeDraftTask = defineTask('narrative-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate historical narrative draft',
  agent: {
    name: 'historical-writer',
    prompt: {
      role: 'historical writer',
      task: 'Generate draft historical narrative integrating all elements',
      context: args,
      instructions: [
        'Write compelling introduction with thesis',
        'Develop each section per outline',
        'Integrate evidence effectively',
        'Address counterarguments appropriately',
        'Maintain scholarly rigor',
        'Create engaging narrative flow',
        'Write strong conclusion',
        'Apply scholarly apparatus consistently'
      ],
      outputFormat: 'JSON with draftPath, sections, wordCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath', 'artifacts'],
      properties: {
        draftPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              wordCount: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        wordCount: { type: 'number' },
        notes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'writing', 'narrative', 'historical']
}));
