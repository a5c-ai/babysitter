/**
 * @process philosophy/philosophical-paper-drafting
 * @description Compose philosophical papers following conventions of clarity, rigor, and scholarly engagement, including thesis development, argumentation, and objection handling
 * @inputs { topic: string, thesis: string, targetLength: string, paperType: string, outputDir: string }
 * @outputs { success: boolean, paperDraft: object, structuralOutline: object, argumentMap: object, artifacts: array }
 * @recommendedSkills SK-PHIL-010 (philosophical-writing-argumentation), SK-PHIL-002 (argument-mapping-reconstruction), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-006 (academic-philosophy-writer-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    topic,
    thesis,
    targetLength = 'standard',
    paperType = 'argumentative',
    outputDir = 'paper-drafting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Thesis Refinement
  ctx.log('info', 'Starting philosophical paper drafting: Refining thesis');
  const thesisRefinement = await ctx.task(thesisRefinementTask, {
    topic,
    thesis,
    paperType,
    outputDir
  });

  if (!thesisRefinement.success) {
    return {
      success: false,
      error: 'Thesis refinement failed',
      details: thesisRefinement,
      metadata: { processId: 'philosophy/philosophical-paper-drafting', timestamp: startTime }
    };
  }

  artifacts.push(...thesisRefinement.artifacts);

  // Task 2: Argument Development
  ctx.log('info', 'Developing main arguments');
  const argumentDevelopment = await ctx.task(argumentDevelopmentTask, {
    refinedThesis: thesisRefinement.refined,
    topic,
    outputDir
  });

  artifacts.push(...argumentDevelopment.artifacts);

  // Task 3: Objection Anticipation
  ctx.log('info', 'Anticipating and addressing objections');
  const objectionHandling = await ctx.task(objectionHandlingTask, {
    thesis: thesisRefinement.refined,
    arguments: argumentDevelopment.arguments,
    outputDir
  });

  artifacts.push(...objectionHandling.artifacts);

  // Task 4: Paper Structure Planning
  ctx.log('info', 'Planning paper structure');
  const structurePlanning = await ctx.task(structurePlanningTask, {
    thesis: thesisRefinement.refined,
    arguments: argumentDevelopment.arguments,
    objections: objectionHandling.objections,
    targetLength,
    paperType,
    outputDir
  });

  artifacts.push(...structurePlanning.artifacts);

  // Task 5: Introduction Drafting
  ctx.log('info', 'Drafting introduction');
  const introductionDraft = await ctx.task(introductionDraftingTask, {
    thesis: thesisRefinement.refined,
    structure: structurePlanning.structure,
    topic,
    outputDir
  });

  artifacts.push(...introductionDraft.artifacts);

  // Task 6: Body Section Drafting
  ctx.log('info', 'Drafting body sections');
  const bodyDraft = await ctx.task(bodyDraftingTask, {
    structure: structurePlanning.structure,
    arguments: argumentDevelopment.arguments,
    objections: objectionHandling.objections,
    outputDir
  });

  artifacts.push(...bodyDraft.artifacts);

  // Task 7: Conclusion Drafting
  ctx.log('info', 'Drafting conclusion');
  const conclusionDraft = await ctx.task(conclusionDraftingTask, {
    thesis: thesisRefinement.refined,
    arguments: argumentDevelopment.arguments,
    bodyContent: bodyDraft.content,
    outputDir
  });

  artifacts.push(...conclusionDraft.artifacts);

  // Breakpoint: Review paper draft
  await ctx.breakpoint({
    question: `Paper draft complete. ${argumentDevelopment.arguments.length} main arguments developed. Review the draft?`,
    title: 'Philosophical Paper Draft Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        topic,
        paperType,
        targetLength,
        argumentCount: argumentDevelopment.arguments.length,
        objectionsAddressed: objectionHandling.objections.length
      }
    }
  });

  // Task 8: Full Draft Assembly
  ctx.log('info', 'Assembling full draft');
  const fullDraft = await ctx.task(draftAssemblyTask, {
    introduction: introductionDraft.content,
    body: bodyDraft.content,
    conclusion: conclusionDraft.content,
    structure: structurePlanning.structure,
    outputDir
  });

  artifacts.push(...fullDraft.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    paperDraft: {
      title: thesisRefinement.refined.title,
      thesis: thesisRefinement.refined.thesis,
      fullDraft: fullDraft.assembled,
      sections: fullDraft.sections
    },
    structuralOutline: structurePlanning.structure,
    argumentMap: {
      mainArguments: argumentDevelopment.arguments,
      supportingArguments: argumentDevelopment.supporting,
      objections: objectionHandling.objections,
      responses: objectionHandling.responses
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/philosophical-paper-drafting',
      timestamp: startTime,
      paperType,
      outputDir
    }
  };
}

// Task definitions
export const thesisRefinementTask = defineTask('thesis-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine the philosophical thesis',
  agent: {
    name: 'thesis-refiner',
    prompt: {
      role: 'philosophical writer',
      task: 'Refine and sharpen the philosophical thesis',
      context: args,
      instructions: [
        'Clarify the main claim precisely',
        'Ensure thesis is arguable (not trivial or obvious)',
        'Make thesis specific and focused',
        'Ensure thesis is philosophically interesting',
        'Draft a clear thesis statement',
        'Develop a working title',
        'Identify the paper\'s contribution',
        'Save refined thesis to output directory'
      ],
      outputFormat: 'JSON with success, refined (thesis, title, contribution, scope), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'refined', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        refined: {
          type: 'object',
          properties: {
            thesis: { type: 'string' },
            title: { type: 'string' },
            contribution: { type: 'string' },
            scope: { type: 'string' },
            mainClaim: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'writing', 'thesis']
}));

export const argumentDevelopmentTask = defineTask('argument-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop main arguments',
  agent: {
    name: 'argument-developer',
    prompt: {
      role: 'philosophical writer',
      task: 'Develop the main arguments supporting the thesis',
      context: args,
      instructions: [
        'Identify main arguments for the thesis',
        'Develop each argument in valid form',
        'Identify premises that need support',
        'Develop supporting sub-arguments',
        'Ensure arguments are sound as well as valid',
        'Order arguments strategically',
        'Note any assumptions requiring acknowledgment',
        'Save argument development to output directory'
      ],
      outputFormat: 'JSON with arguments (main, supporting), order, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['arguments', 'artifacts'],
      properties: {
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              premises: { type: 'array', items: { type: 'string' } },
              conclusion: { type: 'string' },
              support: { type: 'string' }
            }
          }
        },
        supporting: { type: 'array', items: { type: 'object' } },
        order: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'writing', 'arguments']
}));

export const objectionHandlingTask = defineTask('objection-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Anticipate and address objections',
  agent: {
    name: 'objection-handler',
    prompt: {
      role: 'philosophical writer',
      task: 'Anticipate objections and develop responses',
      context: args,
      instructions: [
        'Identify strongest objections to the thesis',
        'Identify objections to each main argument',
        'Develop responses to each objection',
        'Acknowledge any concessions needed',
        'Determine which objections to include in paper',
        'Order objections by importance',
        'Ensure responses are adequate',
        'Save objection handling to output directory'
      ],
      outputFormat: 'JSON with objections, responses, concessions, inclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objections', 'responses', 'artifacts'],
      properties: {
        objections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objection: { type: 'string' },
              target: { type: 'string' },
              strength: { type: 'string' }
            }
          }
        },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              toObjection: { type: 'string' },
              response: { type: 'string' },
              adequacy: { type: 'string' }
            }
          }
        },
        concessions: { type: 'array', items: { type: 'string' } },
        inclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'writing', 'objections']
}));

export const structurePlanningTask = defineTask('structure-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan paper structure',
  agent: {
    name: 'structure-planner',
    prompt: {
      role: 'philosophical writer',
      task: 'Plan the overall structure of the philosophical paper',
      context: args,
      instructions: [
        'Design the overall paper structure',
        'Plan section organization',
        'Allocate content to sections',
        'Plan argument flow',
        'Determine where to place objections',
        'Ensure logical progression',
        'Estimate section lengths',
        'Save structure plan to output directory'
      ],
      outputFormat: 'JSON with structure (outline, sections, flow, lengths), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            outline: { type: 'array', items: { type: 'string' } },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  content: { type: 'array', items: { type: 'string' } },
                  length: { type: 'string' }
                }
              }
            },
            flow: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'writing', 'structure']
}));

export const introductionDraftingTask = defineTask('introduction-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft introduction',
  agent: {
    name: 'introduction-drafter',
    prompt: {
      role: 'philosophical writer',
      task: 'Draft the paper introduction',
      context: args,
      instructions: [
        'Open with engaging hook or context',
        'Introduce the topic and its importance',
        'State the thesis clearly',
        'Provide roadmap of the paper',
        'Set appropriate scope and limitations',
        'Engage with relevant literature briefly',
        'Make the contribution clear',
        'Save introduction draft to output directory'
      ],
      outputFormat: 'JSON with content (text, elements), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            hook: { type: 'string' },
            thesis: { type: 'string' },
            roadmap: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'writing', 'introduction']
}));

export const bodyDraftingTask = defineTask('body-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft body sections',
  agent: {
    name: 'body-drafter',
    prompt: {
      role: 'philosophical writer',
      task: 'Draft the body sections of the paper',
      context: args,
      instructions: [
        'Draft each section according to structure',
        'Present arguments clearly and rigorously',
        'Provide support for premises',
        'Include objections at appropriate points',
        'Develop responses to objections',
        'Use clear transitions between sections',
        'Maintain focus on thesis throughout',
        'Save body draft to output directory'
      ],
      outputFormat: 'JSON with content (sections, fullText), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: {
          type: 'object',
          properties: {
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  text: { type: 'string' }
                }
              }
            },
            fullText: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'writing', 'body']
}));

export const conclusionDraftingTask = defineTask('conclusion-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft conclusion',
  agent: {
    name: 'conclusion-drafter',
    prompt: {
      role: 'philosophical writer',
      task: 'Draft the paper conclusion',
      context: args,
      instructions: [
        'Summarize main arguments',
        'Restate thesis in light of arguments',
        'Note what has been established',
        'Acknowledge limitations',
        'Suggest implications or applications',
        'Point to future research directions',
        'End with strong closing',
        'Save conclusion draft to output directory'
      ],
      outputFormat: 'JSON with content (text, elements), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            summary: { type: 'string' },
            implications: { type: 'string' },
            futureDirections: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'writing', 'conclusion']
}));

export const draftAssemblyTask = defineTask('draft-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble full draft',
  agent: {
    name: 'draft-assembler',
    prompt: {
      role: 'philosophical writer',
      task: 'Assemble the full paper draft',
      context: args,
      instructions: [
        'Combine introduction, body, and conclusion',
        'Ensure smooth transitions',
        'Check for consistency throughout',
        'Add section headings as needed',
        'Format according to conventions',
        'Create table of contents if needed',
        'Note any revision needs',
        'Save assembled draft to output directory'
      ],
      outputFormat: 'JSON with assembled (fullPaper, sections), revisionNeeds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assembled', 'artifacts'],
      properties: {
        assembled: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              text: { type: 'string' }
            }
          }
        },
        revisionNeeds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'writing', 'assembly']
}));
