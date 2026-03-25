/**
 * @process humanities/grant-proposal-development
 * @description Prepare competitive research funding proposals for humanities projects including NEH, ACLS, and foundation grants
 * @inputs { projectDescription: object, fundingSource: object, budgetParameters: object, timeline: object }
 * @outputs { success: boolean, proposalPackage: object, narratives: object, budget: object, artifacts: array }
 * @recommendedSkills SK-HUM-015 (grant-narrative-writing), SK-HUM-010 (citation-scholarly-apparatus)
 * @recommendedAgents AG-HUM-009 (grants-publications-advisor)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectDescription,
    fundingSource = {},
    budgetParameters = {},
    timeline = {},
    supportingMaterials = [],
    outputDir = 'grant-proposal-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Funder Requirements Analysis
  ctx.log('info', 'Analyzing funder requirements');
  const funderAnalysis = await ctx.task(funderAnalysisTask, {
    fundingSource,
    projectDescription,
    outputDir
  });

  if (!funderAnalysis.success) {
    return {
      success: false,
      error: 'Funder analysis failed',
      details: funderAnalysis,
      metadata: { processId: 'humanities/grant-proposal-development', timestamp: startTime }
    };
  }

  artifacts.push(...funderAnalysis.artifacts);

  // Task 2: Project Narrative Development
  ctx.log('info', 'Developing project narrative');
  const narrativeDevelopment = await ctx.task(narrativeDevelopmentTask, {
    projectDescription,
    funderAnalysis,
    outputDir
  });

  artifacts.push(...narrativeDevelopment.artifacts);

  // Task 3: Methodology and Work Plan
  ctx.log('info', 'Developing methodology and work plan');
  const methodologyPlan = await ctx.task(methodologyPlanTask, {
    projectDescription,
    timeline,
    funderAnalysis,
    outputDir
  });

  artifacts.push(...methodologyPlan.artifacts);

  // Task 4: Budget Development
  ctx.log('info', 'Developing project budget');
  const budgetDevelopment = await ctx.task(budgetDevelopmentTask, {
    budgetParameters,
    methodologyPlan,
    funderAnalysis,
    outputDir
  });

  artifacts.push(...budgetDevelopment.artifacts);

  // Task 5: Supporting Materials Preparation
  ctx.log('info', 'Preparing supporting materials');
  const supportingPrep = await ctx.task(supportingMaterialsTask, {
    projectDescription,
    supportingMaterials,
    funderAnalysis,
    outputDir
  });

  artifacts.push(...supportingPrep.artifacts);

  // Task 6: Impact and Dissemination Plan
  ctx.log('info', 'Developing impact and dissemination plan');
  const impactPlan = await ctx.task(impactPlanTask, {
    projectDescription,
    funderAnalysis,
    outputDir
  });

  artifacts.push(...impactPlan.artifacts);

  // Task 7: Generate Proposal Package
  ctx.log('info', 'Generating proposal package');
  const proposalPackage = await ctx.task(proposalPackageTask, {
    funderAnalysis,
    narrativeDevelopment,
    methodologyPlan,
    budgetDevelopment,
    supportingPrep,
    impactPlan,
    outputDir
  });

  artifacts.push(...proposalPackage.artifacts);

  // Breakpoint: Review grant proposal
  await ctx.breakpoint({
    question: `Grant proposal complete for "${projectDescription.title || 'project'}". Funder: ${fundingSource.name}. Budget: $${budgetDevelopment.totalBudget || 0}. Review proposal?`,
    title: 'Grant Proposal Development Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectTitle: projectDescription.title,
        funderName: fundingSource.name,
        totalBudget: budgetDevelopment.totalBudget,
        duration: timeline.duration
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    proposalPackage: {
      path: proposalPackage.packagePath,
      components: proposalPackage.components,
      checklist: proposalPackage.checklist
    },
    narratives: {
      projectNarrative: narrativeDevelopment.narrative,
      methodology: methodologyPlan.methodology,
      impact: impactPlan.plan
    },
    budget: {
      total: budgetDevelopment.totalBudget,
      breakdown: budgetDevelopment.breakdown,
      justification: budgetDevelopment.justification
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/grant-proposal-development',
      timestamp: startTime,
      projectTitle: projectDescription.title,
      outputDir
    }
  };
}

// Task 1: Funder Requirements Analysis
export const funderAnalysisTask = defineTask('funder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze funder requirements',
  agent: {
    name: 'funder-analyst',
    prompt: {
      role: 'grant funding specialist',
      task: 'Analyze funder requirements and priorities',
      context: args,
      instructions: [
        'Review funding opportunity announcement',
        'Identify eligibility requirements',
        'Analyze review criteria',
        'Identify funder priorities',
        'Note formatting requirements',
        'Identify required documents',
        'Note deadline and submission process',
        'Identify strategic alignment opportunities'
      ],
      outputFormat: 'JSON with success, requirements, criteria, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirements: {
          type: 'object',
          properties: {
            eligibility: { type: 'array', items: { type: 'string' } },
            documents: { type: 'array', items: { type: 'string' } },
            formatting: { type: 'object' }
          }
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              weight: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        priorities: { type: 'array', items: { type: 'string' } },
        deadline: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'funder', 'requirements', 'analysis']
}));

// Task 2: Project Narrative Development
export const narrativeDevelopmentTask = defineTask('narrative-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop project narrative',
  agent: {
    name: 'narrative-developer',
    prompt: {
      role: 'grant narrative specialist',
      task: 'Develop compelling project narrative',
      context: args,
      instructions: [
        'Craft project introduction and significance',
        'Articulate research questions',
        'Present intellectual merit',
        'Describe project scope',
        'Address funder priorities',
        'Present preliminary work',
        'Articulate innovation',
        'Write to review criteria'
      ],
      outputFormat: 'JSON with narrative, sections, significance, innovation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'sections', 'artifacts'],
      properties: {
        narrative: { type: 'string' },
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
        significance: { type: 'string' },
        innovation: { type: 'string' },
        researchQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'narrative', 'significance', 'proposal']
}));

// Task 3: Methodology and Work Plan
export const methodologyPlanTask = defineTask('methodology-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop methodology and work plan',
  agent: {
    name: 'methodology-planner',
    prompt: {
      role: 'research methodology planning specialist',
      task: 'Develop methodology and detailed work plan',
      context: args,
      instructions: [
        'Describe research methodology',
        'Develop detailed work plan',
        'Create project timeline',
        'Define milestones and deliverables',
        'Address feasibility',
        'Identify potential challenges',
        'Describe project management',
        'Include evaluation plan'
      ],
      outputFormat: 'JSON with methodology, workPlan, timeline, milestones, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'workPlan', 'artifacts'],
      properties: {
        methodology: { type: 'string' },
        workPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: { type: 'array', items: { type: 'object' } },
        challenges: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'methodology', 'work-plan', 'timeline']
}));

// Task 4: Budget Development
export const budgetDevelopmentTask = defineTask('budget-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop project budget',
  agent: {
    name: 'budget-developer',
    prompt: {
      role: 'grant budget specialist',
      task: 'Develop detailed project budget',
      context: args,
      instructions: [
        'Calculate personnel costs',
        'Estimate travel expenses',
        'Calculate equipment and supplies',
        'Include participant costs if applicable',
        'Calculate indirect costs',
        'Prepare budget justification',
        'Ensure funder compliance',
        'Create multi-year budget if needed'
      ],
      outputFormat: 'JSON with totalBudget, breakdown, justification, compliance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'breakdown', 'justification', 'artifacts'],
      properties: {
        totalBudget: { type: 'number' },
        breakdown: {
          type: 'object',
          properties: {
            personnel: { type: 'number' },
            travel: { type: 'number' },
            equipment: { type: 'number' },
            supplies: { type: 'number' },
            other: { type: 'number' },
            indirect: { type: 'number' }
          }
        },
        justification: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              amount: { type: 'number' },
              justification: { type: 'string' }
            }
          }
        },
        compliance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'budget', 'costs', 'justification']
}));

// Task 5: Supporting Materials Preparation
export const supportingMaterialsTask = defineTask('supporting-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare supporting materials',
  agent: {
    name: 'materials-preparer',
    prompt: {
      role: 'grant supporting materials specialist',
      task: 'Prepare required supporting materials',
      context: args,
      instructions: [
        'Prepare CV/biosketch',
        'Compile letters of support',
        'Prepare bibliography',
        'Create data management plan',
        'Prepare work samples if required',
        'Compile institutional documents',
        'Prepare appendices',
        'Ensure format compliance'
      ],
      outputFormat: 'JSON with materials, cv, letters, dataManagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        cv: { type: 'object' },
        letters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        dataManagement: { type: 'string' },
        appendices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supporting-materials', 'cv', 'letters']
}));

// Task 6: Impact and Dissemination Plan
export const impactPlanTask = defineTask('impact-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop impact and dissemination plan',
  agent: {
    name: 'impact-planner',
    prompt: {
      role: 'research impact specialist',
      task: 'Develop impact and dissemination plan',
      context: args,
      instructions: [
        'Articulate broader impacts',
        'Develop dissemination strategy',
        'Plan scholarly outputs',
        'Plan public engagement',
        'Address digital dissemination',
        'Plan student/trainee involvement',
        'Describe community benefits',
        'Develop sustainability plan'
      ],
      outputFormat: 'JSON with plan, impacts, dissemination, sustainability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'impacts', 'artifacts'],
      properties: {
        plan: { type: 'string' },
        impacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              beneficiaries: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dissemination: {
          type: 'object',
          properties: {
            scholarly: { type: 'array', items: { type: 'string' } },
            public: { type: 'array', items: { type: 'string' } },
            digital: { type: 'array', items: { type: 'string' } }
          }
        },
        sustainability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact', 'dissemination', 'broader-impacts']
}));

// Task 7: Proposal Package Generation
export const proposalPackageTask = defineTask('proposal-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate proposal package',
  agent: {
    name: 'proposal-packager',
    prompt: {
      role: 'grant proposal packaging specialist',
      task: 'Compile complete proposal package',
      context: args,
      instructions: [
        'Compile all proposal components',
        'Verify format compliance',
        'Create table of contents',
        'Verify page limits',
        'Complete submission checklist',
        'Prepare cover sheet/forms',
        'Create submission-ready package',
        'Document submission requirements'
      ],
      outputFormat: 'JSON with packagePath, components, checklist, verification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'components', 'checklist', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              pages: { type: 'number' }
            }
          }
        },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        verification: {
          type: 'object',
          properties: {
            formatCompliant: { type: 'boolean' },
            pageLimits: { type: 'boolean' },
            complete: { type: 'boolean' }
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
  labels: ['agent', 'proposal', 'package', 'submission']
}));
