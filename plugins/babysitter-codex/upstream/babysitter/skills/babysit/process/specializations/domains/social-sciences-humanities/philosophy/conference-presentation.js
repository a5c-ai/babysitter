/**
 * @process philosophy/conference-presentation
 * @description Prepare philosophical arguments for oral presentation, including abstract submission, paper preparation, and response to questions and objections
 * @inputs { paperTopic: string, thesis: string, conferenceType: string, timeLimit: number, outputDir: string }
 * @outputs { success: boolean, presentationMaterials: object, abstract: string, talkOutline: object, qaPreparation: object, artifacts: array }
 * @recommendedSkills SK-PHIL-010 (philosophical-writing-argumentation), SK-PHIL-014 (socratic-dialogue-facilitation), SK-PHIL-002 (argument-mapping-reconstruction)
 * @recommendedAgents AG-PHIL-006 (academic-philosophy-writer-agent), AG-PHIL-007 (critical-thinking-educator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    paperTopic,
    thesis,
    conferenceType = 'academic',
    timeLimit = 20,
    outputDir = 'conference-presentation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Abstract Development
  ctx.log('info', 'Starting conference presentation: Developing abstract');
  const abstractDevelopment = await ctx.task(abstractDevelopmentTask, {
    paperTopic,
    thesis,
    conferenceType,
    outputDir
  });

  if (!abstractDevelopment.success) {
    return {
      success: false,
      error: 'Abstract development failed',
      details: abstractDevelopment,
      metadata: { processId: 'philosophy/conference-presentation', timestamp: startTime }
    };
  }

  artifacts.push(...abstractDevelopment.artifacts);

  // Task 2: Talk Structure Planning
  ctx.log('info', 'Planning talk structure');
  const talkStructure = await ctx.task(talkStructureTask, {
    thesis,
    abstractContent: abstractDevelopment.abstract,
    timeLimit,
    outputDir
  });

  artifacts.push(...talkStructure.artifacts);

  // Task 3: Key Arguments Selection
  ctx.log('info', 'Selecting key arguments for presentation');
  const argumentSelection = await ctx.task(argumentSelectionTask, {
    thesis,
    talkStructure: talkStructure.structure,
    timeLimit,
    outputDir
  });

  artifacts.push(...argumentSelection.artifacts);

  // Task 4: Presentation Script Development
  ctx.log('info', 'Developing presentation script');
  const scriptDevelopment = await ctx.task(scriptDevelopmentTask, {
    talkStructure: talkStructure.structure,
    arguments: argumentSelection.selected,
    timeLimit,
    outputDir
  });

  artifacts.push(...scriptDevelopment.artifacts);

  // Task 5: Q&A Preparation
  ctx.log('info', 'Preparing for Q&A');
  const qaPreparation = await ctx.task(qaPreparationTask, {
    thesis,
    arguments: argumentSelection.selected,
    outputDir
  });

  artifacts.push(...qaPreparation.artifacts);

  // Task 6: Visual Aids Planning
  ctx.log('info', 'Planning visual aids');
  const visualAids = await ctx.task(visualAidsTask, {
    talkStructure: talkStructure.structure,
    arguments: argumentSelection.selected,
    timeLimit,
    outputDir
  });

  artifacts.push(...visualAids.artifacts);

  // Breakpoint: Review presentation materials
  await ctx.breakpoint({
    question: `Conference presentation materials complete. ${timeLimit}-minute talk prepared. Review the materials?`,
    title: 'Conference Presentation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        paperTopic,
        timeLimit,
        argumentsIncluded: argumentSelection.selected.length,
        anticipatedQuestions: qaPreparation.questions.length
      }
    }
  });

  // Task 7: Generate Presentation Package
  ctx.log('info', 'Generating presentation package');
  const presentationPackage = await ctx.task(presentationPackageTask, {
    abstractDevelopment,
    talkStructure,
    argumentSelection,
    scriptDevelopment,
    qaPreparation,
    visualAids,
    outputDir
  });

  artifacts.push(...presentationPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    presentationMaterials: {
      script: scriptDevelopment.script,
      slides: visualAids.slides,
      handout: presentationPackage.handout
    },
    abstract: abstractDevelopment.abstract,
    talkOutline: {
      structure: talkStructure.structure,
      timing: talkStructure.timing,
      arguments: argumentSelection.selected
    },
    qaPreparation: {
      anticipatedQuestions: qaPreparation.questions,
      preparedResponses: qaPreparation.responses,
      difficultQuestions: qaPreparation.difficult
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/conference-presentation',
      timestamp: startTime,
      conferenceType,
      outputDir
    }
  };
}

// Task definitions
export const abstractDevelopmentTask = defineTask('abstract-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop conference abstract',
  agent: {
    name: 'abstract-writer',
    prompt: {
      role: 'philosophical presenter',
      task: 'Develop a compelling conference abstract',
      context: args,
      instructions: [
        'Write engaging opening sentence',
        'State the thesis clearly',
        'Summarize main argument',
        'Note contribution to the field',
        'Keep within word limits (typically 150-300)',
        'Use clear, accessible language',
        'Make the abstract self-contained',
        'Save abstract to output directory'
      ],
      outputFormat: 'JSON with success, abstract, components (opening, thesis, argument, contribution), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'abstract', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        abstract: { type: 'string' },
        components: {
          type: 'object',
          properties: {
            opening: { type: 'string' },
            thesis: { type: 'string' },
            argument: { type: 'string' },
            contribution: { type: 'string' }
          }
        },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'presentation', 'abstract']
}));

export const talkStructureTask = defineTask('talk-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan talk structure',
  agent: {
    name: 'structure-planner',
    prompt: {
      role: 'philosophical presenter',
      task: 'Plan the structure of the talk',
      context: args,
      instructions: [
        'Plan introduction (2-3 minutes)',
        'Plan main argument sections',
        'Plan objection/response section',
        'Plan conclusion (2-3 minutes)',
        'Allocate time to each section',
        'Ensure logical flow',
        'Leave time for Q&A setup',
        'Save talk structure to output directory'
      ],
      outputFormat: 'JSON with structure (sections, flow), timing (allocations), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'timing', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  content: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            flow: { type: 'string' }
          }
        },
        timing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              minutes: { type: 'number' }
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
  labels: ['agent', 'philosophy', 'presentation', 'structure']
}));

export const argumentSelectionTask = defineTask('argument-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select key arguments',
  agent: {
    name: 'argument-selector',
    prompt: {
      role: 'philosophical presenter',
      task: 'Select which arguments to include in the presentation',
      context: args,
      instructions: [
        'Identify all possible arguments',
        'Select most compelling arguments given time',
        'Prioritize for oral presentation',
        'Ensure arguments are clear and followable',
        'Plan supporting examples',
        'Note arguments to defer to paper',
        'Balance depth and breadth',
        'Save argument selection to output directory'
      ],
      outputFormat: 'JSON with selected (arguments with presentation notes), deferred, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selected', 'artifacts'],
      properties: {
        selected: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              argument: { type: 'string' },
              presentationNotes: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              timeAllocation: { type: 'number' }
            }
          }
        },
        deferred: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'presentation', 'arguments']
}));

export const scriptDevelopmentTask = defineTask('script-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop presentation script',
  agent: {
    name: 'script-writer',
    prompt: {
      role: 'philosophical presenter',
      task: 'Develop the presentation script',
      context: args,
      instructions: [
        'Write full script for the talk',
        'Use conversational academic style',
        'Include transitions between sections',
        'Add timing cues',
        'Include audience engagement points',
        'Ensure clarity for oral delivery',
        'Note places for emphasis',
        'Save script to output directory'
      ],
      outputFormat: 'JSON with script (fullText, sections, timingCues), speakingNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['script', 'artifacts'],
      properties: {
        script: {
          type: 'object',
          properties: {
            fullText: { type: 'string' },
            sections: { type: 'array', items: { type: 'object' } },
            timingCues: { type: 'array', items: { type: 'string' } }
          }
        },
        speakingNotes: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        estimatedDuration: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'presentation', 'script']
}));

export const qaPreparationTask = defineTask('qa-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for Q&A',
  agent: {
    name: 'qa-preparer',
    prompt: {
      role: 'philosophical presenter',
      task: 'Prepare for questions and objections',
      context: args,
      instructions: [
        'Anticipate likely questions',
        'Anticipate objections',
        'Prepare responses to each',
        'Identify difficult questions',
        'Prepare strategies for difficult questions',
        'Note what to acknowledge vs. defend',
        'Practice concise responses',
        'Save Q&A preparation to output directory'
      ],
      outputFormat: 'JSON with questions, responses, difficult, strategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'responses', 'artifacts'],
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string' },
              likelihood: { type: 'string' }
            }
          }
        },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              toQuestion: { type: 'string' },
              response: { type: 'string' }
            }
          }
        },
        difficult: { type: 'array', items: { type: 'string' } },
        strategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'presentation', 'qa']
}));

export const visualAidsTask = defineTask('visual-aids', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan visual aids',
  agent: {
    name: 'visuals-planner',
    prompt: {
      role: 'philosophical presenter',
      task: 'Plan visual aids (slides) for the presentation',
      context: args,
      instructions: [
        'Plan slide content and sequence',
        'Keep slides minimal and clear',
        'Use for key points, quotes, diagrams',
        'Plan title slide',
        'Plan outline slide',
        'Plan argument visualization',
        'Note when to advance slides',
        'Save visual aids plan to output directory'
      ],
      outputFormat: 'JSON with slides (content, purpose), slideNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['slides', 'artifacts'],
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } },
              purpose: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        slideNotes: { type: 'array', items: { type: 'string' } },
        totalSlides: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'presentation', 'visuals']
}));

export const presentationPackageTask = defineTask('presentation-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate presentation package',
  agent: {
    name: 'package-generator',
    prompt: {
      role: 'philosophical presenter',
      task: 'Generate complete presentation package',
      context: args,
      instructions: [
        'Compile all presentation materials',
        'Create handout version of paper',
        'Finalize abstract',
        'Finalize slides',
        'Compile Q&A preparation notes',
        'Create presenter checklist',
        'Package all materials',
        'Save presentation package to output directory'
      ],
      outputFormat: 'JSON with package (abstract, script, slides, handout, qaGuide), checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: {
          type: 'object',
          properties: {
            abstract: { type: 'string' },
            script: { type: 'string' },
            slideSummary: { type: 'string' },
            handout: { type: 'string' },
            qaGuide: { type: 'string' }
          }
        },
        handout: { type: 'string' },
        checklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'presentation', 'package']
}));
