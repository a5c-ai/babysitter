/**
 * @process humanities/scholarly-article-development
 * @description Draft, revise, and prepare humanities scholarship for peer-reviewed publication including proper citation, argumentation, and formatting
 * @inputs { researchTopic: string, researchFindings: object, targetJournal: object, citationStyle: string }
 * @outputs { success: boolean, manuscript: object, revisions: array, submissionPackage: object, artifacts: array }
 * @recommendedSkills SK-HUM-010 (citation-scholarly-apparatus), SK-HUM-015 (grant-narrative-writing)
 * @recommendedAgents AG-HUM-009 (grants-publications-advisor), AG-HUM-007 (historical-narrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchTopic,
    researchFindings = {},
    targetJournal = {},
    citationStyle = 'Chicago',
    existingDrafts = [],
    outputDir = 'article-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Argument Development and Outlining
  ctx.log('info', 'Developing argument and outline');
  const argumentDevelopment = await ctx.task(argumentDevelopmentTask, {
    researchTopic,
    researchFindings,
    targetJournal,
    outputDir
  });

  if (!argumentDevelopment.success) {
    return {
      success: false,
      error: 'Argument development failed',
      details: argumentDevelopment,
      metadata: { processId: 'humanities/scholarly-article-development', timestamp: startTime }
    };
  }

  artifacts.push(...argumentDevelopment.artifacts);

  // Task 2: Literature Integration
  ctx.log('info', 'Integrating scholarly literature');
  const literatureIntegration = await ctx.task(literatureIntegrationTask, {
    argumentDevelopment,
    researchFindings,
    citationStyle,
    outputDir
  });

  artifacts.push(...literatureIntegration.artifacts);

  // Task 3: Draft Composition
  ctx.log('info', 'Composing manuscript draft');
  const draftComposition = await ctx.task(draftCompositionTask, {
    argumentDevelopment,
    literatureIntegration,
    researchFindings,
    targetJournal,
    outputDir
  });

  artifacts.push(...draftComposition.artifacts);

  // Task 4: Revision and Refinement
  ctx.log('info', 'Revising and refining manuscript');
  const revisionRefinement = await ctx.task(revisionTask, {
    draftComposition,
    argumentDevelopment,
    targetJournal,
    outputDir
  });

  artifacts.push(...revisionRefinement.artifacts);

  // Task 5: Citation and Formatting
  ctx.log('info', 'Formatting citations and references');
  const citationFormatting = await ctx.task(citationFormattingTask, {
    revisionRefinement,
    citationStyle,
    targetJournal,
    outputDir
  });

  artifacts.push(...citationFormatting.artifacts);

  // Task 6: Abstract and Metadata Preparation
  ctx.log('info', 'Preparing abstract and metadata');
  const abstractPreparation = await ctx.task(abstractPreparationTask, {
    revisionRefinement,
    targetJournal,
    outputDir
  });

  artifacts.push(...abstractPreparation.artifacts);

  // Task 7: Generate Submission Package
  ctx.log('info', 'Generating submission package');
  const submissionPackage = await ctx.task(submissionPackageTask, {
    revisionRefinement,
    citationFormatting,
    abstractPreparation,
    targetJournal,
    outputDir
  });

  artifacts.push(...submissionPackage.artifacts);

  // Breakpoint: Review manuscript
  await ctx.breakpoint({
    question: `Manuscript development complete for ${researchTopic}. Target journal: ${targetJournal.name || 'TBD'}. Word count: ${revisionRefinement.wordCount || 0}. Review manuscript?`,
    title: 'Scholarly Article Development Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        researchTopic,
        targetJournal: targetJournal.name,
        citationStyle,
        wordCount: revisionRefinement.wordCount
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    manuscript: {
      title: abstractPreparation.title,
      abstract: abstractPreparation.abstract,
      wordCount: revisionRefinement.wordCount,
      path: citationFormatting.manuscriptPath
    },
    revisions: revisionRefinement.revisions,
    submissionPackage: submissionPackage.package,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/scholarly-article-development',
      timestamp: startTime,
      researchTopic,
      outputDir
    }
  };
}

// Task 1: Argument Development and Outlining
export const argumentDevelopmentTask = defineTask('argument-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop argument and outline',
  agent: {
    name: 'argument-developer',
    prompt: {
      role: 'humanities argumentation specialist',
      task: 'Develop scholarly argument and article outline',
      context: args,
      instructions: [
        'Formulate central thesis',
        'Develop supporting claims',
        'Map evidence to claims',
        'Design argument structure',
        'Create detailed outline',
        'Plan section organization',
        'Identify counterarguments to address',
        'Consider journal requirements'
      ],
      outputFormat: 'JSON with success, thesis, claims, outline, structure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'thesis', 'outline', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        thesis: { type: 'string' },
        claims: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        outline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              content: { type: 'string' },
              subsections: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        counterarguments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'argument', 'outline', 'thesis']
}));

// Task 2: Literature Integration
export const literatureIntegrationTask = defineTask('literature-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate scholarly literature',
  agent: {
    name: 'literature-integrator',
    prompt: {
      role: 'scholarly literature specialist',
      task: 'Integrate secondary literature into argument',
      context: args,
      instructions: [
        'Identify key scholarly sources',
        'Plan literature review integration',
        'Map sources to argument sections',
        'Develop scholarly dialogue',
        'Identify gaps in scholarship',
        'Position argument in field',
        'Prepare citation tracking',
        'Note areas needing additional sources'
      ],
      outputFormat: 'JSON with sources, integration, positioning, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'integration', 'artifacts'],
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              citation: { type: 'string' },
              relevance: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        integration: {
          type: 'object',
          properties: {
            literatureReview: { type: 'string' },
            dialogue: { type: 'array', items: { type: 'object' } }
          }
        },
        positioning: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature', 'integration', 'scholarship']
}));

// Task 3: Draft Composition
export const draftCompositionTask = defineTask('draft-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose manuscript draft',
  agent: {
    name: 'draft-composer',
    prompt: {
      role: 'humanities scholarly writer',
      task: 'Compose complete manuscript draft',
      context: args,
      instructions: [
        'Write introduction with hook and thesis',
        'Develop each section per outline',
        'Integrate evidence and analysis',
        'Incorporate scholarly sources',
        'Write transitions between sections',
        'Compose conclusion',
        'Maintain scholarly voice',
        'Track word count against limits'
      ],
      outputFormat: 'JSON with draft, sections, wordCount, notes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draft', 'sections', 'artifacts'],
      properties: {
        draft: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              wordCount: { type: 'number' }
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
  labels: ['agent', 'drafting', 'composition', 'writing']
}));

// Task 4: Revision and Refinement
export const revisionTask = defineTask('revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise and refine manuscript',
  agent: {
    name: 'manuscript-reviser',
    prompt: {
      role: 'manuscript revision specialist',
      task: 'Revise and refine manuscript draft',
      context: args,
      instructions: [
        'Review argument clarity and logic',
        'Strengthen evidence integration',
        'Improve transitions and flow',
        'Refine prose style',
        'Check scholarly voice consistency',
        'Verify claim-evidence alignment',
        'Address potential reviewer concerns',
        'Polish introduction and conclusion'
      ],
      outputFormat: 'JSON with revisedDraft, revisions, improvements, wordCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['revisedDraft', 'revisions', 'artifacts'],
      properties: {
        revisedDraft: { type: 'string' },
        revisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              change: { type: 'string' }
            }
          }
        },
        improvements: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'revision', 'editing', 'refinement']
}));

// Task 5: Citation and Formatting
export const citationFormattingTask = defineTask('citation-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Format citations and references',
  agent: {
    name: 'citation-formatter',
    prompt: {
      role: 'citation and formatting specialist',
      task: 'Format manuscript citations and prepare bibliography',
      context: args,
      instructions: [
        'Format all in-text citations',
        'Compile bibliography/works cited',
        'Verify citation completeness',
        'Apply journal formatting guidelines',
        'Format headings and subheadings',
        'Apply document formatting',
        'Check footnote/endnote style',
        'Verify page formatting'
      ],
      outputFormat: 'JSON with manuscriptPath, bibliography, citationCount, formatting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['manuscriptPath', 'bibliography', 'artifacts'],
      properties: {
        manuscriptPath: { type: 'string' },
        bibliography: {
          type: 'array',
          items: { type: 'string' }
        },
        citationCount: { type: 'number' },
        formatting: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            headings: { type: 'object' },
            notes: { type: 'string' }
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
  labels: ['agent', 'citation', 'formatting', 'bibliography']
}));

// Task 6: Abstract and Metadata Preparation
export const abstractPreparationTask = defineTask('abstract-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare abstract and metadata',
  agent: {
    name: 'abstract-preparer',
    prompt: {
      role: 'abstract and metadata specialist',
      task: 'Prepare abstract and submission metadata',
      context: args,
      instructions: [
        'Compose article abstract',
        'Select keywords',
        'Prepare author information',
        'Write acknowledgments',
        'Prepare author bio if required',
        'Compile funding information',
        'Prepare conflict of interest statement',
        'Finalize article title'
      ],
      outputFormat: 'JSON with title, abstract, keywords, metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'abstract', 'keywords', 'artifacts'],
      properties: {
        title: { type: 'string' },
        abstract: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
        metadata: {
          type: 'object',
          properties: {
            authors: { type: 'array', items: { type: 'object' } },
            acknowledgments: { type: 'string' },
            funding: { type: 'string' },
            conflicts: { type: 'string' }
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
  labels: ['agent', 'abstract', 'metadata', 'submission']
}));

// Task 7: Submission Package Generation
export const submissionPackageTask = defineTask('submission-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate submission package',
  agent: {
    name: 'submission-preparer',
    prompt: {
      role: 'journal submission specialist',
      task: 'Prepare complete submission package',
      context: args,
      instructions: [
        'Compile all required documents',
        'Prepare cover letter',
        'Verify journal requirements met',
        'Prepare supplementary materials',
        'Create anonymized version if needed',
        'Prepare figure files if applicable',
        'Complete submission checklist',
        'Prepare response to reviewers template'
      ],
      outputFormat: 'JSON with package, coverLetter, checklist, files, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: {
          type: 'object',
          properties: {
            manuscript: { type: 'string' },
            coverLetter: { type: 'string' },
            supplementary: { type: 'array', items: { type: 'string' } }
          }
        },
        coverLetter: { type: 'string' },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'submission', 'package', 'journal']
}));
