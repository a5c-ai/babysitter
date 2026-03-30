/**
 * @process arts-culture/exhibition-development
 * @description Comprehensive workflow for planning, organizing, and installing exhibitions including concept development, artwork selection, loan coordination, installation design, and interpretive programming
 * @inputs { exhibitionTitle: string, theme: string, targetOpeningDate: string, budget: number, venueSpecs: object }
 * @outputs { success: boolean, exhibitionPlan: object, artworkList: array, installationDesign: object, artifacts: array }
 * @recommendedSkills SK-AC-001 (curatorial-research), SK-AC-004 (exhibition-design), SK-AC-008 (interpretive-writing), SK-AC-003 (collection-documentation)
 * @recommendedAgents AG-AC-001 (curator-agent), AG-AC-010 (exhibition-designer-agent), AG-AC-006 (registrar-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    exhibitionTitle,
    theme,
    targetOpeningDate,
    budget = 100000,
    venueSpecs = {},
    curatorName = 'Lead Curator',
    outputDir = 'exhibition-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Exhibition Concept Development
  ctx.log('info', 'Starting exhibition development: Concept formulation');
  const conceptResult = await ctx.task(conceptDevelopmentTask, {
    exhibitionTitle,
    theme,
    targetOpeningDate,
    curatorName,
    outputDir
  });

  if (!conceptResult.success) {
    return {
      success: false,
      error: 'Concept development failed',
      details: conceptResult,
      metadata: { processId: 'arts-culture/exhibition-development', timestamp: startTime }
    };
  }

  artifacts.push(...conceptResult.artifacts);

  // Task 2: Artwork Selection and Research
  ctx.log('info', 'Conducting artwork selection and research');
  const artworkSelection = await ctx.task(artworkSelectionTask, {
    conceptDocument: conceptResult.conceptDocument,
    theme,
    budget,
    outputDir
  });

  artifacts.push(...artworkSelection.artifacts);

  // Task 3: Loan Coordination Planning
  ctx.log('info', 'Planning loan coordination');
  const loanCoordination = await ctx.task(loanCoordinationTask, {
    artworkList: artworkSelection.selectedArtworks,
    targetOpeningDate,
    budget,
    outputDir
  });

  artifacts.push(...loanCoordination.artifacts);

  // Task 4: Installation Design
  ctx.log('info', 'Developing installation design');
  const installationDesign = await ctx.task(installationDesignTask, {
    artworkList: artworkSelection.selectedArtworks,
    venueSpecs,
    conceptDocument: conceptResult.conceptDocument,
    outputDir
  });

  artifacts.push(...installationDesign.artifacts);

  // Task 5: Interpretive Programming
  ctx.log('info', 'Developing interpretive programming');
  const interpretiveProgramming = await ctx.task(interpretiveProgrammingTask, {
    exhibitionTitle,
    theme,
    conceptDocument: conceptResult.conceptDocument,
    artworkList: artworkSelection.selectedArtworks,
    outputDir
  });

  artifacts.push(...interpretiveProgramming.artifacts);

  // Task 6: Budget and Timeline Development
  ctx.log('info', 'Creating budget and timeline');
  const budgetTimeline = await ctx.task(budgetTimelineTask, {
    exhibitionTitle,
    targetOpeningDate,
    budget,
    loanCoordination,
    installationDesign,
    interpretiveProgramming,
    outputDir
  });

  artifacts.push(...budgetTimeline.artifacts);

  // Breakpoint: Review exhibition plan
  await ctx.breakpoint({
    question: `Exhibition plan for "${exhibitionTitle}" complete. ${artworkSelection.selectedArtworks.length} artworks selected, budget: $${budget}. Review and approve?`,
    title: 'Exhibition Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        exhibitionTitle,
        theme,
        targetOpeningDate,
        totalArtworks: artworkSelection.selectedArtworks.length,
        loanCount: loanCoordination.requiredLoans,
        estimatedBudget: budgetTimeline.totalEstimate
      }
    }
  });

  // Task 7: Generate Exhibition Documentation
  ctx.log('info', 'Generating comprehensive exhibition documentation');
  const documentation = await ctx.task(exhibitionDocumentationTask, {
    exhibitionTitle,
    conceptResult,
    artworkSelection,
    loanCoordination,
    installationDesign,
    interpretiveProgramming,
    budgetTimeline,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    exhibitionPlan: {
      title: exhibitionTitle,
      theme,
      concept: conceptResult.conceptDocument,
      openingDate: targetOpeningDate
    },
    artworkList: artworkSelection.selectedArtworks,
    installationDesign: installationDesign.designPlan,
    interpretivePrograms: interpretiveProgramming.programs,
    budget: budgetTimeline,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/exhibition-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Concept Development
export const conceptDevelopmentTask = defineTask('concept-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop exhibition concept',
  agent: {
    name: 'exhibition-curator',
    prompt: {
      role: 'museum curator',
      task: 'Develop comprehensive exhibition concept and curatorial statement',
      context: args,
      instructions: [
        'Research the exhibition theme thoroughly',
        'Develop a compelling curatorial narrative',
        'Define exhibition objectives and key messages',
        'Identify target audiences and engagement strategies',
        'Outline thematic sections and visitor journey',
        'Create concept document with rationale',
        'Define aesthetic and interpretive approach',
        'Save concept document to output directory'
      ],
      outputFormat: 'JSON with success, conceptDocument, thematicSections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'conceptDocument', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        conceptDocument: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            curatorialStatement: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            targetAudience: { type: 'array', items: { type: 'string' } },
            narrativeArc: { type: 'string' }
          }
        },
        thematicSections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curatorial', 'exhibition', 'concept-development']
}));

// Task 2: Artwork Selection
export const artworkSelectionTask = defineTask('artwork-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select artworks for exhibition',
  agent: {
    name: 'art-researcher',
    prompt: {
      role: 'curatorial researcher',
      task: 'Research and select artworks that support the exhibition concept',
      context: args,
      instructions: [
        'Research artworks relevant to exhibition theme',
        'Identify works from permanent collection and potential loans',
        'Evaluate artwork condition and availability',
        'Consider artwork provenance and exhibition history',
        'Balance media types, time periods, and perspectives',
        'Create artwork checklist with rationale',
        'Prioritize artworks for loan requests',
        'Document research sources and references'
      ],
      outputFormat: 'JSON with selectedArtworks, alternates, researchNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedArtworks', 'artifacts'],
      properties: {
        selectedArtworks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              artist: { type: 'string' },
              date: { type: 'string' },
              medium: { type: 'string' },
              dimensions: { type: 'string' },
              owner: { type: 'string' },
              loanRequired: { type: 'boolean' }
            }
          }
        },
        alternateWorks: { type: 'array' },
        researchNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'curatorial', 'artwork-selection', 'research']
}));

// Task 3: Loan Coordination
export const loanCoordinationTask = defineTask('loan-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate artwork loans',
  agent: {
    name: 'registrar',
    prompt: {
      role: 'museum registrar',
      task: 'Plan and coordinate artwork loan requests',
      context: args,
      instructions: [
        'Identify lending institutions and private collectors',
        'Draft loan request letters',
        'Calculate loan fees and insurance requirements',
        'Plan shipping and courier arrangements',
        'Create loan timeline with deadlines',
        'Document special handling requirements',
        'Prepare facility reports for lenders',
        'Establish backup options for declined loans'
      ],
      outputFormat: 'JSON with requiredLoans, loanRequests, timeline, budgetEstimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredLoans', 'loanRequests', 'artifacts'],
      properties: {
        requiredLoans: { type: 'number' },
        loanRequests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              artwork: { type: 'string' },
              lender: { type: 'string' },
              estimatedFee: { type: 'number' },
              insuranceValue: { type: 'number' },
              specialRequirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: { type: 'object' },
        budgetEstimate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'registrar', 'loans', 'coordination']
}));

// Task 4: Installation Design
export const installationDesignTask = defineTask('installation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design exhibition installation',
  agent: {
    name: 'exhibition-designer',
    prompt: {
      role: 'exhibition designer',
      task: 'Create installation design and gallery layout',
      context: args,
      instructions: [
        'Analyze venue specifications and constraints',
        'Create gallery floor plan with artwork placement',
        'Design visitor circulation and sightlines',
        'Specify lighting requirements per artwork',
        'Plan wall colors, cases, and mounts',
        'Consider accessibility requirements (ADA/AAM)',
        'Develop graphic design standards for labels',
        'Create construction documents and specifications'
      ],
      outputFormat: 'JSON with designPlan, floorPlan, lightingPlan, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['designPlan', 'artifacts'],
      properties: {
        designPlan: {
          type: 'object',
          properties: {
            sections: { type: 'array' },
            circulationPath: { type: 'string' },
            colorScheme: { type: 'object' },
            lightingApproach: { type: 'string' }
          }
        },
        floorPlan: { type: 'string' },
        lightingPlan: { type: 'object' },
        specifications: { type: 'object' },
        materialsList: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design', 'installation', 'exhibition']
}));

// Task 5: Interpretive Programming
export const interpretiveProgrammingTask = defineTask('interpretive-programming', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop interpretive programming',
  agent: {
    name: 'education-curator',
    prompt: {
      role: 'museum educator',
      task: 'Develop interpretive programs and educational content',
      context: args,
      instructions: [
        'Write exhibition labels and didactic panels',
        'Develop audio guide or multimedia content',
        'Plan docent training and tour scripts',
        'Create educational programs for schools',
        'Design family and children activities',
        'Plan public programs (lectures, workshops, events)',
        'Develop digital engagement strategies',
        'Create teacher resources and curriculum guides'
      ],
      outputFormat: 'JSON with programs, labels, tourScript, educationalMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['programs', 'artifacts'],
      properties: {
        programs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              audience: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        labels: { type: 'array' },
        tourScript: { type: 'string' },
        educationalMaterials: { type: 'array' },
        digitalContent: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'interpretation', 'programming']
}));

// Task 6: Budget and Timeline
export const budgetTimelineTask = defineTask('budget-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create budget and timeline',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'arts project manager',
      task: 'Develop comprehensive budget and project timeline',
      context: args,
      instructions: [
        'Create detailed exhibition budget by category',
        'Include loan fees, shipping, insurance costs',
        'Budget for design, fabrication, installation',
        'Include marketing and programming costs',
        'Develop master project timeline with milestones',
        'Identify critical path and dependencies',
        'Plan contingencies and risk mitigation',
        'Create Gantt chart or project schedule'
      ],
      outputFormat: 'JSON with totalEstimate, budgetBreakdown, timeline, milestones, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEstimate', 'budgetBreakdown', 'timeline', 'artifacts'],
      properties: {
        totalEstimate: { type: 'number' },
        budgetBreakdown: {
          type: 'object',
          properties: {
            loans: { type: 'number' },
            shipping: { type: 'number' },
            insurance: { type: 'number' },
            design: { type: 'number' },
            fabrication: { type: 'number' },
            marketing: { type: 'number' },
            programming: { type: 'number' },
            contingency: { type: 'number' }
          }
        },
        timeline: { type: 'object' },
        milestones: { type: 'array' },
        criticalPath: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'project-management', 'budget', 'timeline']
}));

// Task 7: Exhibition Documentation
export const exhibitionDocumentationTask = defineTask('exhibition-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate exhibition documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'museum documentation specialist',
      task: 'Compile comprehensive exhibition documentation package',
      context: args,
      instructions: [
        'Create exhibition overview document',
        'Compile artwork checklist with full metadata',
        'Generate loan documentation package',
        'Create installation documentation',
        'Compile interpretive content package',
        'Generate budget summary and approvals',
        'Create stakeholder presentation',
        'Prepare board or committee briefing materials'
      ],
      outputFormat: 'JSON with documentationPackage, summaryReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPackage', 'artifacts'],
      properties: {
        documentationPackage: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            checklist: { type: 'string' },
            loanDocs: { type: 'string' },
            installationDocs: { type: 'string' }
          }
        },
        summaryReport: { type: 'string' },
        presentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'exhibition', 'reporting']
}));
