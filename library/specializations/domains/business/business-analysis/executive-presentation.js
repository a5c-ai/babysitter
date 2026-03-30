/**
 * @process ba-executive-presentation
 * @description Executive presentation development process creating compelling slide decks,
 * executive summaries, and presentation materials using pyramid principle storytelling.
 * @inputs {
 *   presentationContext: { audience: string, purpose: string, duration: string },
 *   contentInputs: { findings: object[], insights: object[], recommendations: object[] },
 *   brandGuidelines: { colors: string[], fonts: string[], templates: string },
 *   stakeholders: object[],
 *   constraints: { format: string, maxSlides: number }
 * }
 * @outputs {
 *   presentationDeck: object,
 *   executiveSummary: object,
 *   speakerNotes: object[],
 *   backupSlides: object[],
 *   handouts: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const audienceAnalysisTask = defineTask('audience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Audience and Context',
  agent: {
    name: 'audience-analyst',
    prompt: {
      role: 'Executive Communications Specialist',
      task: 'Analyze audience characteristics, expectations, and tailor messaging approach',
      context: args,
      instructions: [
        'Profile the executive audience',
        'Identify key concerns and priorities',
        'Assess technical vs business orientation',
        'Determine decision-making style',
        'Identify potential resistance points',
        'Define success criteria for presentation',
        'Recommend communication style',
        'Plan for Q&A scenarios'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        audienceProfile: {
          type: 'object',
          properties: {
            primaryAudience: { type: 'array', items: { type: 'object' } },
            secondaryAudience: { type: 'array', items: { type: 'object' } },
            keyDecisionMakers: { type: 'array', items: { type: 'string' } }
          }
        },
        audienceNeeds: {
          type: 'object',
          properties: {
            priorities: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        communicationApproach: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            tone: { type: 'string' },
            detailLevel: { type: 'string' },
            persuasionTechniques: { type: 'array', items: { type: 'string' } }
          }
        },
        anticipatedQuestions: { type: 'array', items: { type: 'object' } }
      },
      required: ['audienceProfile', 'audienceNeeds', 'communicationApproach']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const storyStructuringTask = defineTask('story-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure Presentation Story',
  agent: {
    name: 'story-structurer',
    prompt: {
      role: 'Strategic Communications Expert with McKinsey presentation experience',
      task: 'Structure presentation using pyramid principle with compelling narrative arc',
      context: args,
      instructions: [
        'Define governing thought (main message)',
        'Structure supporting arguments (MECE)',
        'Create story arc with situation-complication-resolution',
        'Plan logical flow of sections',
        'Identify key transition points',
        'Plan emotional engagement moments',
        'Structure call to action',
        'Define backup content organization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        pyramidStructure: {
          type: 'object',
          properties: {
            governingThought: { type: 'string' },
            keyLineArguments: { type: 'array', items: { type: 'string' } },
            supportingPoints: { type: 'array', items: { type: 'object' } }
          }
        },
        narrativeArc: {
          type: 'object',
          properties: {
            situation: { type: 'string' },
            complication: { type: 'string' },
            resolution: { type: 'string' },
            callToAction: { type: 'string' }
          }
        },
        sectionFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              purpose: { type: 'string' },
              keyMessages: { type: 'array', items: { type: 'string' } },
              transitionTo: { type: 'string' }
            }
          }
        },
        storyboard: { type: 'array', items: { type: 'object' } }
      },
      required: ['pyramidStructure', 'narrativeArc', 'sectionFlow']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const slideDesignTask = defineTask('slide-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Slide Deck',
  agent: {
    name: 'slide-designer',
    prompt: {
      role: 'Executive Presentation Designer',
      task: 'Design compelling slide deck with clear visuals and action titles',
      context: args,
      instructions: [
        'Create action-titled slide structure',
        'Design data visualizations for key findings',
        'Apply brand guidelines consistently',
        'Balance text and visuals appropriately',
        'Design transition and divider slides',
        'Create compelling opening and closing',
        'Design exhibits and charts',
        'Ensure accessibility compliance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        slideStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slideNumber: { type: 'number' },
              slideType: { type: 'string' },
              actionTitle: { type: 'string' },
              content: { type: 'object' },
              visuals: { type: 'array', items: { type: 'object' } },
              speakerNotes: { type: 'string' }
            }
          }
        },
        visualDesigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              visualId: { type: 'string' },
              type: { type: 'string' },
              data: { type: 'object' },
              designSpec: { type: 'object' }
            }
          }
        },
        styleGuide: { type: 'object' }
      },
      required: ['slideStructure', 'visualDesigns']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executiveSummaryTask = defineTask('executive-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Executive Summary',
  agent: {
    name: 'executive-summary-writer',
    prompt: {
      role: 'Executive Communication Writer',
      task: 'Create concise, impactful executive summary document',
      context: args,
      instructions: [
        'Distill key messages to one page',
        'Structure with clear hierarchy',
        'Highlight key findings and insights',
        'Summarize recommendations with impact',
        'Include critical data points',
        'Write for scanning and quick comprehension',
        'Include clear call to action',
        'Format for print and digital'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSummary: {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            situationOverview: { type: 'string' },
            keyFindings: { type: 'array', items: { type: 'string' } },
            keyInsights: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'object' } },
            expectedImpact: { type: 'string' },
            nextSteps: { type: 'array', items: { type: 'string' } },
            callToAction: { type: 'string' }
          }
        },
        formatting: { type: 'object' }
      },
      required: ['executiveSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const speakerNotesTask = defineTask('speaker-notes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Speaker Notes',
  agent: {
    name: 'speaker-notes-developer',
    prompt: {
      role: 'Presentation Coach and Content Developer',
      task: 'Create detailed speaker notes with talking points and timing',
      context: args,
      instructions: [
        'Write detailed talking points for each slide',
        'Include verbal transitions between slides',
        'Add timing recommendations',
        'Note emphasis points and pauses',
        'Include data callouts to highlight',
        'Add audience engagement prompts',
        'Include handling for anticipated questions',
        'Note backup slide references'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        speakerNotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slideNumber: { type: 'number' },
              talkingPoints: { type: 'array', items: { type: 'string' } },
              transition: { type: 'string' },
              timing: { type: 'string' },
              emphasisPoints: { type: 'array', items: { type: 'string' } },
              audienceEngagement: { type: 'string' },
              backupReferences: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallTiming: { type: 'object' },
        presentationTips: { type: 'array', items: { type: 'string' } }
      },
      required: ['speakerNotes']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const backupSlidesTask = defineTask('backup-slides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Backup Slides',
  agent: {
    name: 'backup-slides-creator',
    prompt: {
      role: 'Presentation Content Developer',
      task: 'Create comprehensive backup slides for deep-dive questions',
      context: args,
      instructions: [
        'Identify topics requiring detailed backup',
        'Create detailed methodology slides',
        'Develop data deep-dive exhibits',
        'Create sensitivity analysis slides',
        'Develop implementation detail slides',
        'Create risk analysis backup',
        'Prepare competitor/benchmark data',
        'Organize backup slides logically'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        backupSlides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              slideTitle: { type: 'string' },
              content: { type: 'object' },
              triggeredBy: { type: 'array', items: { type: 'string' } },
              visuals: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        backupIndex: { type: 'object' }
      },
      required: ['backupSlides']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const qaPreparationTask = defineTask('qa-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Q&A Responses',
  agent: {
    name: 'qa-preparer',
    prompt: {
      role: 'Executive Presentation Coach',
      task: 'Anticipate questions and prepare comprehensive responses',
      context: args,
      instructions: [
        'Anticipate tough questions by stakeholder',
        'Prepare concise, confident responses',
        'Link responses to backup materials',
        'Prepare bridge statements',
        'Develop responses to challenges',
        'Prepare for scope creep questions',
        'Create response for budget/resource concerns',
        'Develop risk mitigation responses'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        anticipatedQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              likelyAskedBy: { type: 'string' },
              category: { type: 'string' },
              difficulty: { type: 'string' },
              response: { type: 'string' },
              bridgeStatement: { type: 'string' },
              supportingEvidence: { type: 'array', items: { type: 'string' } },
              backupSlideRef: { type: 'string' }
            }
          }
        },
        difficultQuestionStrategies: { type: 'object' },
        redirectTechniques: { type: 'array', items: { type: 'object' } }
      },
      required: ['anticipatedQuestions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const handoutCreationTask = defineTask('handout-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Presentation Handouts',
  agent: {
    name: 'handout-creator',
    prompt: {
      role: 'Technical Writer and Document Designer',
      task: 'Create leave-behind materials and handouts for executives',
      context: args,
      instructions: [
        'Create print-friendly version of key slides',
        'Develop detailed appendix materials',
        'Create reference card with key data',
        'Design one-page summary handout',
        'Include contact and next steps information',
        'Format for professional printing',
        'Create digital version for sharing',
        'Include reading guide for complex exhibits'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        handouts: {
          type: 'object',
          properties: {
            onePager: { type: 'object' },
            detailedHandout: { type: 'object' },
            referenceCard: { type: 'object' },
            appendixMaterials: { type: 'array', items: { type: 'object' } }
          }
        },
        distributionFormat: {
          type: 'object',
          properties: {
            print: { type: 'object' },
            digital: { type: 'object' }
          }
        }
      },
      required: ['handouts']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Executive Presentation process');

  const artifacts = {
    audienceAnalysis: null,
    storyStructure: null,
    slideDesign: null,
    executiveSummary: null,
    speakerNotes: null,
    backupSlides: null,
    qaPreparation: null,
    handouts: null
  };

  // Phase 1: Audience Analysis
  ctx.log('Phase 1: Analyzing audience and context');
  const audienceResult = await ctx.task(audienceAnalysisTask, {
    presentationContext: inputs.presentationContext,
    stakeholders: inputs.stakeholders,
    contentInputs: inputs.contentInputs
  });
  artifacts.audienceAnalysis = audienceResult;

  // Phase 2: Story Structuring
  ctx.log('Phase 2: Structuring presentation story');
  const storyResult = await ctx.task(storyStructuringTask, {
    audienceAnalysis: artifacts.audienceAnalysis,
    contentInputs: inputs.contentInputs,
    presentationContext: inputs.presentationContext
  });
  artifacts.storyStructure = storyResult;

  // Phase 3: Slide Design
  ctx.log('Phase 3: Designing slide deck');
  const slideResult = await ctx.task(slideDesignTask, {
    storyStructure: artifacts.storyStructure,
    contentInputs: inputs.contentInputs,
    brandGuidelines: inputs.brandGuidelines,
    constraints: inputs.constraints
  });
  artifacts.slideDesign = slideResult;

  // Phase 4: Executive Summary
  ctx.log('Phase 4: Creating executive summary');
  const summaryResult = await ctx.task(executiveSummaryTask, {
    storyStructure: artifacts.storyStructure,
    contentInputs: inputs.contentInputs,
    audienceAnalysis: artifacts.audienceAnalysis
  });
  artifacts.executiveSummary = summaryResult;

  // Phase 5: Speaker Notes
  ctx.log('Phase 5: Developing speaker notes');
  const notesResult = await ctx.task(speakerNotesTask, {
    slideDesign: artifacts.slideDesign,
    storyStructure: artifacts.storyStructure,
    presentationContext: inputs.presentationContext
  });
  artifacts.speakerNotes = notesResult;

  // Phase 6: Backup Slides
  ctx.log('Phase 6: Creating backup slides');
  const backupResult = await ctx.task(backupSlidesTask, {
    slideDesign: artifacts.slideDesign,
    contentInputs: inputs.contentInputs,
    audienceAnalysis: artifacts.audienceAnalysis
  });
  artifacts.backupSlides = backupResult;

  // Breakpoint for presentation review
  await ctx.breakpoint('presentation-review', {
    question: 'Review the presentation deck structure and content. Is the messaging clear and compelling?',
    artifacts: {
      slideDesign: artifacts.slideDesign,
      executiveSummary: artifacts.executiveSummary,
      storyStructure: artifacts.storyStructure
    }
  });

  // Phase 7: Q&A Preparation
  ctx.log('Phase 7: Preparing Q&A responses');
  const qaResult = await ctx.task(qaPreparationTask, {
    slideDesign: artifacts.slideDesign,
    audienceAnalysis: artifacts.audienceAnalysis,
    backupSlides: artifacts.backupSlides,
    contentInputs: inputs.contentInputs
  });
  artifacts.qaPreparation = qaResult;

  // Phase 8: Handout Creation
  ctx.log('Phase 8: Creating handouts');
  const handoutResult = await ctx.task(handoutCreationTask, {
    slideDesign: artifacts.slideDesign,
    executiveSummary: artifacts.executiveSummary,
    contentInputs: inputs.contentInputs,
    brandGuidelines: inputs.brandGuidelines
  });
  artifacts.handouts = handoutResult;

  ctx.log('Executive Presentation process completed');

  return {
    success: true,
    presentationDeck: artifacts.slideDesign,
    executiveSummary: artifacts.executiveSummary.executiveSummary,
    speakerNotes: artifacts.speakerNotes.speakerNotes,
    backupSlides: artifacts.backupSlides.backupSlides,
    handouts: artifacts.handouts.handouts,
    qaPreparation: artifacts.qaPreparation,
    artifacts
  };
}
