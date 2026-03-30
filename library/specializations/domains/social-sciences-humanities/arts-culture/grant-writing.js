/**
 * @process arts-culture/grant-writing
 * @description Structured approach to developing funding proposals for foundations, government agencies, and corporations including prospect research, narrative development, budgeting, and submission management
 * @inputs { projectTitle: string, fundingAmount: number, funderType: string, deadline: string, projectDescription: string }
 * @outputs { success: boolean, proposal: object, budget: object, supportingDocs: array, artifacts: array }
 * @recommendedSkills SK-AC-002 (grant-proposal-writing), SK-AC-010 (cultural-policy-analysis)
 * @recommendedAgents AG-AC-003 (development-officer-agent), AG-AC-002 (arts-administrator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectTitle,
    fundingAmount,
    funderType = 'foundation',
    deadline,
    projectDescription,
    organizationName = '',
    outputDir = 'grant-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Funder Research and Prospect Identification
  ctx.log('info', 'Starting grant writing: Funder research');
  const funderResearch = await ctx.task(funderResearchTask, {
    projectTitle,
    fundingAmount,
    funderType,
    projectDescription,
    outputDir
  });

  if (!funderResearch.success) {
    return {
      success: false,
      error: 'Funder research failed',
      details: funderResearch,
      metadata: { processId: 'arts-culture/grant-writing', timestamp: startTime }
    };
  }

  artifacts.push(...funderResearch.artifacts);

  // Task 2: Project Narrative Development
  ctx.log('info', 'Developing project narrative');
  const narrativeDevelopment = await ctx.task(narrativeDevelopmentTask, {
    projectTitle,
    projectDescription,
    funderPriorities: funderResearch.priorities,
    organizationName,
    outputDir
  });

  artifacts.push(...narrativeDevelopment.artifacts);

  // Task 3: Budget Development
  ctx.log('info', 'Developing project budget');
  const budgetDevelopment = await ctx.task(budgetDevelopmentTask, {
    projectTitle,
    fundingAmount,
    projectDescription,
    narrativeDevelopment,
    outputDir
  });

  artifacts.push(...budgetDevelopment.artifacts);

  // Task 4: Evaluation Plan
  ctx.log('info', 'Developing evaluation plan');
  const evaluationPlan = await ctx.task(evaluationPlanTask, {
    projectTitle,
    projectDescription,
    narrativeDevelopment,
    outputDir
  });

  artifacts.push(...evaluationPlan.artifacts);

  // Task 5: Supporting Documentation
  ctx.log('info', 'Preparing supporting documentation');
  const supportingDocs = await ctx.task(supportingDocsTask, {
    projectTitle,
    organizationName,
    narrativeDevelopment,
    budgetDevelopment,
    outputDir
  });

  artifacts.push(...supportingDocs.artifacts);

  // Task 6: Proposal Assembly
  ctx.log('info', 'Assembling proposal package');
  const proposalAssembly = await ctx.task(proposalAssemblyTask, {
    projectTitle,
    funderResearch,
    narrativeDevelopment,
    budgetDevelopment,
    evaluationPlan,
    supportingDocs,
    deadline,
    outputDir
  });

  artifacts.push(...proposalAssembly.artifacts);

  // Breakpoint: Review proposal
  await ctx.breakpoint({
    question: `Grant proposal for "${projectTitle}" complete. Requesting $${fundingAmount}. Deadline: ${deadline}. Review and finalize?`,
    title: 'Grant Proposal Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectTitle,
        fundingAmount,
        funderType,
        deadline,
        matchingFunders: funderResearch.matchingFunders.length
      }
    }
  });

  // Task 7: Submission Preparation
  ctx.log('info', 'Preparing for submission');
  const submissionPrep = await ctx.task(submissionPrepTask, {
    proposalAssembly,
    deadline,
    funderRequirements: funderResearch.requirements,
    outputDir
  });

  artifacts.push(...submissionPrep.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    proposal: proposalAssembly.proposal,
    budget: budgetDevelopment.budget,
    supportingDocs: supportingDocs.documents,
    submissionPackage: submissionPrep.package,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/grant-writing',
      timestamp: startTime,
      deadline,
      outputDir
    }
  };
}

// Task 1: Funder Research
export const funderResearchTask = defineTask('funder-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research potential funders',
  agent: {
    name: 'development-researcher',
    prompt: {
      role: 'development officer',
      task: 'Research and identify matching funders for the project',
      context: args,
      instructions: [
        'Research foundations, government agencies, corporations',
        'Identify funders with matching priorities',
        'Review funding guidelines and requirements',
        'Note application deadlines and cycles',
        'Analyze past grantees and award amounts',
        'Identify any existing relationships',
        'Assess likelihood of success',
        'Create funder prospect list'
      ],
      outputFormat: 'JSON with success, matchingFunders, priorities, requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'matchingFunders', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        matchingFunders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              grantRange: { type: 'string' },
              priorities: { type: 'array' },
              deadline: { type: 'string' }
            }
          }
        },
        priorities: { type: 'array' },
        requirements: { type: 'object' },
        prospectList: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'development', 'research', 'fundraising']
}));

// Task 2: Narrative Development
export const narrativeDevelopmentTask = defineTask('narrative-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop project narrative',
  agent: {
    name: 'grant-writer',
    prompt: {
      role: 'grant writer',
      task: 'Develop compelling project narrative and case for support',
      context: args,
      instructions: [
        'Write executive summary',
        'Develop statement of need',
        'Describe project goals and objectives',
        'Detail methodology and activities',
        'Explain organizational capacity',
        'Describe target population/audience',
        'Articulate expected outcomes and impact',
        'Align narrative with funder priorities'
      ],
      outputFormat: 'JSON with narrative, sections, wordCount, keyMessages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'artifacts'],
      properties: {
        narrative: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            statementOfNeed: { type: 'string' },
            goalsObjectives: { type: 'string' },
            methodology: { type: 'string' },
            organizationalCapacity: { type: 'string' },
            expectedOutcomes: { type: 'string' }
          }
        },
        sections: { type: 'array' },
        wordCount: { type: 'number' },
        keyMessages: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'writing', 'narrative', 'grants']
}));

// Task 3: Budget Development
export const budgetDevelopmentTask = defineTask('budget-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop project budget',
  agent: {
    name: 'budget-specialist',
    prompt: {
      role: 'financial manager',
      task: 'Develop detailed and justified project budget',
      context: args,
      instructions: [
        'Create line-item budget',
        'Include personnel costs',
        'Add supplies and materials',
        'Include travel and transportation',
        'Add contracted services',
        'Include indirect costs',
        'Develop budget justification/narrative',
        'Identify matching funds if required'
      ],
      outputFormat: 'JSON with budget, lineItems, justification, totalCost, matchingFunds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['budget', 'artifacts'],
      properties: {
        budget: {
          type: 'object',
          properties: {
            personnel: { type: 'number' },
            supplies: { type: 'number' },
            travel: { type: 'number' },
            contractual: { type: 'number' },
            indirect: { type: 'number' },
            total: { type: 'number' }
          }
        },
        lineItems: { type: 'array' },
        justification: { type: 'string' },
        totalCost: { type: 'number' },
        matchingFunds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'budget', 'financial', 'grants']
}));

// Task 4: Evaluation Plan
export const evaluationPlanTask = defineTask('evaluation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop evaluation plan',
  agent: {
    name: 'evaluation-specialist',
    prompt: {
      role: 'program evaluator',
      task: 'Develop comprehensive project evaluation plan',
      context: args,
      instructions: [
        'Define evaluation questions',
        'Identify key performance indicators',
        'Develop logic model/theory of change',
        'Plan data collection methods',
        'Establish baseline measurements',
        'Create evaluation timeline',
        'Plan for reporting and dissemination',
        'Address sustainability considerations'
      ],
      outputFormat: 'JSON with evaluationPlan, indicators, logicModel, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluationPlan', 'artifacts'],
      properties: {
        evaluationPlan: {
          type: 'object',
          properties: {
            questions: { type: 'array' },
            methods: { type: 'array' },
            timeline: { type: 'object' }
          }
        },
        indicators: { type: 'array' },
        logicModel: { type: 'string' },
        dataCollection: { type: 'array' },
        sustainabilityPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'planning', 'grants']
}));

// Task 5: Supporting Documentation
export const supportingDocsTask = defineTask('supporting-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare supporting documentation',
  agent: {
    name: 'documentation-coordinator',
    prompt: {
      role: 'development coordinator',
      task: 'Prepare required supporting documentation',
      context: args,
      instructions: [
        'Compile organizational documents',
        'Gather board list and bios',
        'Collect financial statements',
        'Prepare 501(c)(3) determination letter',
        'Compile letters of support',
        'Gather staff resumes',
        'Prepare work samples if required',
        'Organize appendices'
      ],
      outputFormat: 'JSON with documents, checklist, pendingItems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'artifacts'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              status: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        checklist: { type: 'array' },
        pendingItems: { type: 'array' },
        lettersOfSupport: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'supporting-materials', 'grants']
}));

// Task 6: Proposal Assembly
export const proposalAssemblyTask = defineTask('proposal-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble proposal package',
  agent: {
    name: 'proposal-coordinator',
    prompt: {
      role: 'grants manager',
      task: 'Assemble complete proposal package',
      context: args,
      instructions: [
        'Review funder format requirements',
        'Assemble narrative sections',
        'Format budget and justification',
        'Include evaluation plan',
        'Organize attachments and appendices',
        'Create table of contents',
        'Review for completeness',
        'Proofread entire proposal'
      ],
      outputFormat: 'JSON with proposal, sections, attachments, completenessCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proposal', 'artifacts'],
      properties: {
        proposal: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            totalPages: { type: 'number' },
            sections: { type: 'array' },
            path: { type: 'string' }
          }
        },
        sections: { type: 'array' },
        attachments: { type: 'array' },
        completenessCheck: { type: 'object' },
        proofreadNotes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assembly', 'proposal', 'grants']
}));

// Task 7: Submission Preparation
export const submissionPrepTask = defineTask('submission-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for submission',
  agent: {
    name: 'submissions-coordinator',
    prompt: {
      role: 'grants administrator',
      task: 'Prepare proposal for final submission',
      context: args,
      instructions: [
        'Verify all funder requirements met',
        'Check page limits and formatting',
        'Verify required signatures',
        'Test online portal submission',
        'Prepare cover letter',
        'Create submission checklist',
        'Plan submission timeline',
        'Document submission confirmation'
      ],
      outputFormat: 'JSON with package, checklist, coverLetter, submissionPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: {
          type: 'object',
          properties: {
            complete: { type: 'boolean' },
            format: { type: 'string' },
            submissionMethod: { type: 'string' }
          }
        },
        checklist: { type: 'array' },
        coverLetter: { type: 'string' },
        submissionPlan: { type: 'object' },
        confirmationProcess: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'submission', 'finalization', 'grants']
}));
