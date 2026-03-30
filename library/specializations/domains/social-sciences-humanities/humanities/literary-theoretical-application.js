/**
 * @process humanities/literary-theoretical-application
 * @description Apply critical frameworks (formalist, structuralist, post-structuralist, postcolonial, feminist) to texts with engagement of existing scholarly criticism
 * @inputs { text: object, theoreticalFramework: string, existingCriticism: array, analyticalGoals: array }
 * @outputs { success: boolean, theoreticalAnalysis: object, criticalDialogue: object, interpretation: object, artifacts: array }
 * @recommendedSkills SK-HUM-013 (critical-theory-application), SK-HUM-005 (literary-close-reading), SK-HUM-010 (citation-scholarly-apparatus)
 * @recommendedAgents AG-HUM-004 (literary-critic-theorist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    text,
    theoreticalFramework = 'formalist',
    existingCriticism = [],
    analyticalGoals = [],
    secondaryFrameworks = [],
    outputDir = 'theoretical-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Theoretical Framework Explication
  ctx.log('info', 'Explicating theoretical framework');
  const frameworkExplication = await ctx.task(frameworkExplicationTask, {
    theoreticalFramework,
    secondaryFrameworks,
    text,
    outputDir
  });

  if (!frameworkExplication.success) {
    return {
      success: false,
      error: 'Framework explication failed',
      details: frameworkExplication,
      metadata: { processId: 'humanities/literary-theoretical-application', timestamp: startTime }
    };
  }

  artifacts.push(...frameworkExplication.artifacts);

  // Task 2: Critical Literature Review
  ctx.log('info', 'Reviewing existing criticism');
  const criticalReview = await ctx.task(criticalLiteratureReviewTask, {
    text,
    theoreticalFramework,
    existingCriticism,
    outputDir
  });

  artifacts.push(...criticalReview.artifacts);

  // Task 3: Theoretical Concepts Application
  ctx.log('info', 'Applying theoretical concepts');
  const conceptsApplication = await ctx.task(conceptsApplicationTask, {
    text,
    frameworkExplication,
    analyticalGoals,
    outputDir
  });

  artifacts.push(...conceptsApplication.artifacts);

  // Task 4: Textual Evidence Analysis
  ctx.log('info', 'Analyzing textual evidence through framework');
  const textualEvidence = await ctx.task(textualEvidenceTask, {
    text,
    conceptsApplication,
    frameworkExplication,
    outputDir
  });

  artifacts.push(...textualEvidence.artifacts);

  // Task 5: Critical Dialogue Development
  ctx.log('info', 'Developing critical dialogue');
  const criticalDialogue = await ctx.task(criticalDialogueTask, {
    conceptsApplication,
    criticalReview,
    textualEvidence,
    outputDir
  });

  artifacts.push(...criticalDialogue.artifacts);

  // Task 6: Interpretation Synthesis
  ctx.log('info', 'Synthesizing interpretation');
  const interpretationSynthesis = await ctx.task(interpretationSynthesisTask, {
    conceptsApplication,
    textualEvidence,
    criticalDialogue,
    analyticalGoals,
    outputDir
  });

  artifacts.push(...interpretationSynthesis.artifacts);

  // Task 7: Generate Theoretical Analysis Report
  ctx.log('info', 'Generating theoretical analysis report');
  const analysisReport = await ctx.task(theoreticalAnalysisReportTask, {
    text,
    frameworkExplication,
    criticalReview,
    conceptsApplication,
    textualEvidence,
    criticalDialogue,
    interpretationSynthesis,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  // Breakpoint: Review theoretical analysis
  await ctx.breakpoint({
    question: `Theoretical analysis complete using ${theoreticalFramework} framework on ${text.title || 'text'}. Review analysis?`,
    title: 'Literary Theoretical Application Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        textTitle: text.title,
        theoreticalFramework,
        conceptsApplied: conceptsApplication.concepts?.length || 0,
        criticalSources: criticalReview.sources?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    theoreticalAnalysis: {
      framework: theoreticalFramework,
      concepts: conceptsApplication.concepts,
      application: conceptsApplication.application
    },
    criticalDialogue: {
      sources: criticalReview.sources,
      engagements: criticalDialogue.engagements,
      contributions: criticalDialogue.contributions
    },
    interpretation: {
      thesis: interpretationSynthesis.thesis,
      claims: interpretationSynthesis.claims,
      evidence: textualEvidence.evidence
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/literary-theoretical-application',
      timestamp: startTime,
      textTitle: text.title,
      outputDir
    }
  };
}

// Task 1: Theoretical Framework Explication
export const frameworkExplicationTask = defineTask('framework-explication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Explicate theoretical framework',
  agent: {
    name: 'theory-specialist',
    prompt: {
      role: 'literary theory specialist',
      task: 'Explicate theoretical framework and its key concepts',
      context: args,
      instructions: [
        'Define theoretical framework and its origins',
        'Identify key theorists and foundational texts',
        'Explicate central concepts and terms',
        'Outline methodological approach',
        'Identify framework strengths and limitations',
        'Explain relevance to text under analysis',
        'Note compatible secondary frameworks',
        'Prepare concept glossary'
      ],
      outputFormat: 'JSON with success, framework, concepts, methodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'framework', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        framework: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            origins: { type: 'string' },
            keyTheorists: { type: 'array', items: { type: 'string' } }
          }
        },
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
              application: { type: 'string' }
            }
          }
        },
        methodology: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'theory', 'framework', 'literary']
}));

// Task 2: Critical Literature Review
export const criticalLiteratureReviewTask = defineTask('critical-literature-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review existing criticism',
  agent: {
    name: 'criticism-reviewer',
    prompt: {
      role: 'literary criticism specialist',
      task: 'Review and synthesize existing scholarly criticism',
      context: args,
      instructions: [
        'Survey existing criticism on text',
        'Identify major interpretive positions',
        'Note theoretical approaches used',
        'Identify scholarly debates',
        'Assess critical consensus and dissent',
        'Identify gaps in existing scholarship',
        'Evaluate quality of existing criticism',
        'Map positions for dialogue'
      ],
      outputFormat: 'JSON with sources, positions, debates, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'artifacts'],
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              author: { type: 'string' },
              work: { type: 'string' },
              position: { type: 'string' },
              approach: { type: 'string' }
            }
          }
        },
        positions: { type: 'array', items: { type: 'object' } },
        debates: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        consensus: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'criticism', 'literature-review', 'scholarship']
}));

// Task 3: Theoretical Concepts Application
export const conceptsApplicationTask = defineTask('concepts-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply theoretical concepts to text',
  agent: {
    name: 'theoretical-analyst',
    prompt: {
      role: 'theoretical literary analyst',
      task: 'Apply theoretical concepts to analyze text',
      context: args,
      instructions: [
        'Select relevant theoretical concepts',
        'Apply each concept to text systematically',
        'Identify textual elements illuminated by concepts',
        'Document productive applications',
        'Note areas of tension or difficulty',
        'Develop concept-specific analyses',
        'Track interpretive insights generated',
        'Assess framework fit with text'
      ],
      outputFormat: 'JSON with concepts, application, insights, tensions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'application', 'artifacts'],
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              relevance: { type: 'string' },
              applicationStrategy: { type: 'string' }
            }
          }
        },
        application: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              textualElement: { type: 'string' },
              analysis: { type: 'string' }
            }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        tensions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'application', 'theory', 'analysis']
}));

// Task 4: Textual Evidence Analysis
export const textualEvidenceTask = defineTask('textual-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze textual evidence through framework',
  agent: {
    name: 'evidence-analyst',
    prompt: {
      role: 'textual evidence specialist',
      task: 'Develop textual evidence supporting theoretical analysis',
      context: args,
      instructions: [
        'Identify key passages for theoretical analysis',
        'Perform close reading through theoretical lens',
        'Document evidence for each claim',
        'Analyze passage significance',
        'Note counterevidence within text',
        'Organize evidence hierarchy',
        'Develop extended analyses of key passages',
        'Connect evidence to theoretical concepts'
      ],
      outputFormat: 'JSON with evidence, keyPassages, counterevidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evidence', 'artifacts'],
      properties: {
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              passage: { type: 'string' },
              location: { type: 'string' },
              concept: { type: 'string' },
              analysis: { type: 'string' }
            }
          }
        },
        keyPassages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              passage: { type: 'string' },
              significance: { type: 'string' },
              extendedAnalysis: { type: 'string' }
            }
          }
        },
        counterevidence: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evidence', 'close-reading', 'analysis']
}));

// Task 5: Critical Dialogue Development
export const criticalDialogueTask = defineTask('critical-dialogue', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop critical dialogue',
  agent: {
    name: 'dialogue-developer',
    prompt: {
      role: 'scholarly dialogue specialist',
      task: 'Develop dialogue with existing criticism',
      context: args,
      instructions: [
        'Position analysis relative to existing criticism',
        'Engage with supporting scholarship',
        'Develop responses to contrary positions',
        'Acknowledge debts and influences',
        'Articulate points of departure',
        'Develop nuanced agreements and disagreements',
        'Identify contribution to scholarly conversation',
        'Create dialogic structure'
      ],
      outputFormat: 'JSON with engagements, contributions, departures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['engagements', 'contributions', 'artifacts'],
      properties: {
        engagements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scholar: { type: 'string' },
              position: { type: 'string' },
              response: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        contributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              contribution: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        departures: { type: 'array', items: { type: 'object' } },
        debts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dialogue', 'criticism', 'scholarship']
}));

// Task 6: Interpretation Synthesis
export const interpretationSynthesisTask = defineTask('interpretation-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize interpretation',
  agent: {
    name: 'interpretation-synthesizer',
    prompt: {
      role: 'literary interpretation specialist',
      task: 'Synthesize theoretical analysis into coherent interpretation',
      context: args,
      instructions: [
        'Formulate overarching thesis',
        'Develop supporting claims',
        'Organize argument structure',
        'Integrate theoretical concepts',
        'Synthesize textual evidence',
        'Address counterarguments',
        'Consider implications',
        'Assess interpretation strength'
      ],
      outputFormat: 'JSON with thesis, claims, structure, implications, artifacts'
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
              theoreticalBasis: { type: 'string' }
            }
          }
        },
        structure: {
          type: 'object',
          properties: {
            organization: { type: 'string' },
            sections: { type: 'array', items: { type: 'object' } }
          }
        },
        implications: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthesis', 'interpretation', 'thesis']
}));

// Task 7: Theoretical Analysis Report Generation
export const theoreticalAnalysisReportTask = defineTask('theoretical-analysis-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate theoretical analysis report',
  agent: {
    name: 'analysis-writer',
    prompt: {
      role: 'literary analysis writer',
      task: 'Generate comprehensive theoretical analysis report',
      context: args,
      instructions: [
        'Present theoretical framework context',
        'Review critical literature',
        'Present theoretical application',
        'Document textual analysis',
        'Present critical dialogue',
        'Articulate interpretation',
        'Draw conclusions',
        'Format as scholarly essay'
      ],
      outputFormat: 'JSON with reportPath, sections, thesis, artifacts'
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
        thesis: { type: 'string' },
        bibliography: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'theoretical-analysis', 'literary']
}));
