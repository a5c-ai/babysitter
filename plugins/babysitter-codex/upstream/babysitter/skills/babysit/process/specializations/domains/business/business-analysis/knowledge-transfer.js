/**
 * @process ba-knowledge-transfer
 * @description Comprehensive knowledge transfer process for consulting engagements including
 * documentation handoff, capability building, and ensuring client self-sufficiency.
 * @inputs {
 *   engagementContext: { clientName: string, projectName: string, scope: string },
 *   deliverables: object[],
 *   clientTeam: { members: object[], skillLevels: object },
 *   knowledgeAreas: { technical: string[], process: string[], domain: string[] },
 *   timeline: { startDate: string, endDate: string },
 *   supportModel: { duration: string, channels: string[] }
 * }
 * @outputs {
 *   knowledgeTransferPlan: object,
 *   documentationPackage: object,
 *   trainingMaterials: object[],
 *   capabilityAssessment: object,
 *   supportPlaybook: object,
 *   transitionChecklist: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const knowledgeInventoryTask = defineTask('knowledge-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Knowledge Inventory',
  agent: {
    name: 'knowledge-inventory-specialist',
    prompt: {
      role: 'Knowledge Management Specialist',
      task: 'Create comprehensive inventory of knowledge assets to be transferred',
      context: args,
      instructions: [
        'Catalog all deliverables and documentation',
        'Identify tacit knowledge requiring transfer',
        'Map knowledge to client team members',
        'Assess knowledge complexity levels',
        'Identify dependencies between knowledge areas',
        'Prioritize knowledge transfer order',
        'Identify gaps in documentation',
        'Create knowledge asset registry'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        knowledgeInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              knowledgeId: { type: 'string' },
              category: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['explicit', 'tacit', 'embedded'] },
              complexity: { type: 'string' },
              currentOwner: { type: 'string' },
              targetRecipient: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              transferMethod: { type: 'string' }
            }
          }
        },
        documentationGaps: { type: 'array', items: { type: 'object' } },
        transferPriority: { type: 'array', items: { type: 'string' } },
        knowledgeMap: { type: 'object' }
      },
      required: ['knowledgeInventory', 'transferPriority']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const recipientAssessmentTask = defineTask('recipient-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Knowledge Recipients',
  agent: {
    name: 'capability-assessor',
    prompt: {
      role: 'Learning and Development Specialist',
      task: 'Assess client team readiness and design personalized learning paths',
      context: args,
      instructions: [
        'Assess current skill levels of client team',
        'Identify learning styles and preferences',
        'Map skills to knowledge requirements',
        'Identify skill gaps requiring training',
        'Design personalized learning paths',
        'Recommend learning resources',
        'Plan for different learning paces',
        'Create competency benchmarks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        recipientAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recipientId: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              currentSkills: { type: 'array', items: { type: 'object' } },
              skillGaps: { type: 'array', items: { type: 'object' } },
              learningStyle: { type: 'string' },
              availableTime: { type: 'string' },
              learningPath: { type: 'object' }
            }
          }
        },
        competencyBenchmarks: { type: 'object' },
        overallReadiness: { type: 'string' }
      },
      required: ['recipientAssessments', 'competencyBenchmarks']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const transferPlanTask = defineTask('transfer-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Knowledge Transfer Plan',
  agent: {
    name: 'transfer-planner',
    prompt: {
      role: 'Knowledge Transfer Program Manager',
      task: 'Create comprehensive knowledge transfer plan with schedule and methods',
      context: args,
      instructions: [
        'Design knowledge transfer schedule',
        'Select appropriate transfer methods',
        'Plan formal training sessions',
        'Schedule shadowing and mentoring',
        'Plan hands-on practice sessions',
        'Define success criteria for each transfer',
        'Build in validation checkpoints',
        'Plan for contingencies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        transferPlan: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  activities: { type: 'array', items: { type: 'object' } },
                  knowledgeAreas: { type: 'array', items: { type: 'string' } },
                  participants: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            schedule: { type: 'object' },
            milestones: { type: 'array', items: { type: 'object' } }
          }
        },
        transferMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              applicableTo: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'object' } },
        riskMitigation: { type: 'object' }
      },
      required: ['transferPlan', 'transferMethods', 'successCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const documentationPackageTask = defineTask('documentation-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Documentation Package',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Create comprehensive documentation package for knowledge transfer',
      context: args,
      instructions: [
        'Organize all project documentation',
        'Create user guides and manuals',
        'Document processes and procedures',
        'Create quick reference guides',
        'Document troubleshooting guides',
        'Create FAQ documents',
        'Organize technical specifications',
        'Create documentation index'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        documentationPackage: {
          type: 'object',
          properties: {
            index: { type: 'object' },
            userGuides: { type: 'array', items: { type: 'object' } },
            processDocuments: { type: 'array', items: { type: 'object' } },
            technicalSpecs: { type: 'array', items: { type: 'object' } },
            quickReferenceGuides: { type: 'array', items: { type: 'object' } },
            troubleshootingGuides: { type: 'array', items: { type: 'object' } },
            faqs: { type: 'array', items: { type: 'object' } }
          }
        },
        documentationMap: { type: 'object' },
        maintenanceGuide: { type: 'object' }
      },
      required: ['documentationPackage']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const trainingMaterialsTask = defineTask('training-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Training Materials',
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Instructional Designer',
      task: 'Create comprehensive training materials for knowledge transfer',
      context: args,
      instructions: [
        'Design training curriculum',
        'Create presentation materials',
        'Develop hands-on exercises',
        'Create assessment quizzes',
        'Design case studies and scenarios',
        'Create video/recording scripts',
        'Develop job aids and checklists',
        'Create certification criteria'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        trainingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleId: { type: 'string' },
              moduleName: { type: 'string' },
              learningObjectives: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              content: { type: 'object' },
              exercises: { type: 'array', items: { type: 'object' } },
              assessment: { type: 'object' }
            }
          }
        },
        curriculum: { type: 'object' },
        assessmentCriteria: { type: 'object' },
        certificationRequirements: { type: 'object' }
      },
      required: ['trainingMaterials', 'curriculum']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const transferExecutionTask = defineTask('transfer-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Knowledge Transfer Sessions',
  agent: {
    name: 'transfer-executor',
    prompt: {
      role: 'Knowledge Transfer Facilitator',
      task: 'Plan and guide execution of knowledge transfer sessions',
      context: args,
      instructions: [
        'Prepare session agendas',
        'Define facilitation approach',
        'Plan demonstrations and walkthroughs',
        'Design practice activities',
        'Plan Q&A sessions',
        'Create feedback collection mechanism',
        'Document lessons learned',
        'Track completion and competency'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sessionPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              topic: { type: 'string' },
              agenda: { type: 'array', items: { type: 'object' } },
              facilitationNotes: { type: 'string' },
              materials: { type: 'array', items: { type: 'string' } },
              practiceActivities: { type: 'array', items: { type: 'object' } },
              competencyCheck: { type: 'object' }
            }
          }
        },
        progressTracker: { type: 'object' },
        feedbackMechanism: { type: 'object' }
      },
      required: ['sessionPlans', 'progressTracker']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const competencyValidationTask = defineTask('competency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Competency Transfer',
  agent: {
    name: 'competency-validator',
    prompt: {
      role: 'Capability Assessment Specialist',
      task: 'Validate knowledge transfer effectiveness and client competency',
      context: args,
      instructions: [
        'Design competency assessments',
        'Create practical evaluation scenarios',
        'Assess knowledge retention',
        'Validate hands-on capability',
        'Identify remaining gaps',
        'Recommend additional support',
        'Document competency levels achieved',
        'Create readiness certification'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        competencyAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recipientId: { type: 'string' },
              assessments: { type: 'array', items: { type: 'object' } },
              overallScore: { type: 'number' },
              competencyLevel: { type: 'string' },
              gaps: { type: 'array', items: { type: 'object' } },
              recommendations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallReadiness: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            confidence: { type: 'string' },
            risksIdentified: { type: 'array', items: { type: 'object' } }
          }
        },
        certification: { type: 'object' }
      },
      required: ['competencyAssessments', 'overallReadiness']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const supportPlaybookTask = defineTask('support-playbook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Support Playbook',
  agent: {
    name: 'support-playbook-creator',
    prompt: {
      role: 'Post-Engagement Support Specialist',
      task: 'Create comprehensive support playbook for post-transfer period',
      context: args,
      instructions: [
        'Define support model and channels',
        'Create escalation procedures',
        'Document common issues and resolutions',
        'Create support request templates',
        'Define SLAs for support',
        'Plan for hypercare period',
        'Create self-service resources',
        'Plan for support transition'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        supportPlaybook: {
          type: 'object',
          properties: {
            supportModel: { type: 'object' },
            channels: { type: 'array', items: { type: 'object' } },
            escalationPath: { type: 'array', items: { type: 'object' } },
            slas: { type: 'object' },
            hypercarePlan: { type: 'object' },
            selfServiceResources: { type: 'array', items: { type: 'object' } },
            commonIssues: { type: 'array', items: { type: 'object' } }
          }
        },
        transitionPlan: { type: 'object' },
        contactDirectory: { type: 'object' }
      },
      required: ['supportPlaybook']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const transitionChecklistTask = defineTask('transition-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Transition Checklist',
  agent: {
    name: 'transition-checklist-creator',
    prompt: {
      role: 'Transition Manager',
      task: 'Create comprehensive transition checklist for engagement closure',
      context: args,
      instructions: [
        'Create documentation handoff checklist',
        'Define system access transfer checklist',
        'Create knowledge validation checklist',
        'Define sign-off requirements',
        'Create outstanding items tracker',
        'Define closure criteria',
        'Plan final walkthrough',
        'Create lessons learned capture'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        transitionChecklist: {
          type: 'object',
          properties: {
            documentation: { type: 'array', items: { type: 'object' } },
            systemAccess: { type: 'array', items: { type: 'object' } },
            knowledgeTransfer: { type: 'array', items: { type: 'object' } },
            signOffs: { type: 'array', items: { type: 'object' } },
            outstandingItems: { type: 'array', items: { type: 'object' } }
          }
        },
        closureCriteria: { type: 'array', items: { type: 'object' } },
        lessonsLearned: { type: 'object' },
        finalSignOff: { type: 'object' }
      },
      required: ['transitionChecklist', 'closureCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Knowledge Transfer process');

  const artifacts = {
    knowledgeInventory: null,
    recipientAssessment: null,
    transferPlan: null,
    documentationPackage: null,
    trainingMaterials: null,
    transferExecution: null,
    competencyValidation: null,
    supportPlaybook: null,
    transitionChecklist: null
  };

  // Phase 1: Knowledge Inventory
  ctx.log('Phase 1: Creating knowledge inventory');
  const inventoryResult = await ctx.task(knowledgeInventoryTask, {
    engagementContext: inputs.engagementContext,
    deliverables: inputs.deliverables,
    knowledgeAreas: inputs.knowledgeAreas
  });
  artifacts.knowledgeInventory = inventoryResult;

  // Phase 2: Recipient Assessment
  ctx.log('Phase 2: Assessing knowledge recipients');
  const recipientResult = await ctx.task(recipientAssessmentTask, {
    clientTeam: inputs.clientTeam,
    knowledgeInventory: artifacts.knowledgeInventory,
    knowledgeAreas: inputs.knowledgeAreas
  });
  artifacts.recipientAssessment = recipientResult;

  // Phase 3: Transfer Plan Development
  ctx.log('Phase 3: Developing knowledge transfer plan');
  const planResult = await ctx.task(transferPlanTask, {
    knowledgeInventory: artifacts.knowledgeInventory,
    recipientAssessment: artifacts.recipientAssessment,
    timeline: inputs.timeline
  });
  artifacts.transferPlan = planResult;

  // Breakpoint for plan approval
  await ctx.breakpoint('transfer-plan-approval', {
    question: 'Review the knowledge transfer plan. Is the approach appropriate for the client team?',
    artifacts: {
      knowledgeInventory: artifacts.knowledgeInventory,
      recipientAssessment: artifacts.recipientAssessment,
      transferPlan: artifacts.transferPlan
    }
  });

  // Phase 4: Documentation Package
  ctx.log('Phase 4: Creating documentation package');
  const docResult = await ctx.task(documentationPackageTask, {
    deliverables: inputs.deliverables,
    knowledgeInventory: artifacts.knowledgeInventory,
    engagementContext: inputs.engagementContext
  });
  artifacts.documentationPackage = docResult;

  // Phase 5: Training Materials
  ctx.log('Phase 5: Developing training materials');
  const trainingResult = await ctx.task(trainingMaterialsTask, {
    knowledgeInventory: artifacts.knowledgeInventory,
    recipientAssessment: artifacts.recipientAssessment,
    transferPlan: artifacts.transferPlan
  });
  artifacts.trainingMaterials = trainingResult;

  // Phase 6: Transfer Execution
  ctx.log('Phase 6: Planning transfer execution');
  const executionResult = await ctx.task(transferExecutionTask, {
    transferPlan: artifacts.transferPlan,
    trainingMaterials: artifacts.trainingMaterials,
    documentationPackage: artifacts.documentationPackage
  });
  artifacts.transferExecution = executionResult;

  // Phase 7: Competency Validation
  ctx.log('Phase 7: Validating competency transfer');
  const validationResult = await ctx.task(competencyValidationTask, {
    recipientAssessment: artifacts.recipientAssessment,
    transferPlan: artifacts.transferPlan,
    trainingMaterials: artifacts.trainingMaterials
  });
  artifacts.competencyValidation = validationResult;

  // Phase 8: Support Playbook
  ctx.log('Phase 8: Creating support playbook');
  const supportResult = await ctx.task(supportPlaybookTask, {
    competencyValidation: artifacts.competencyValidation,
    supportModel: inputs.supportModel,
    documentationPackage: artifacts.documentationPackage
  });
  artifacts.supportPlaybook = supportResult;

  // Phase 9: Transition Checklist
  ctx.log('Phase 9: Creating transition checklist');
  const checklistResult = await ctx.task(transitionChecklistTask, {
    knowledgeInventory: artifacts.knowledgeInventory,
    competencyValidation: artifacts.competencyValidation,
    supportPlaybook: artifacts.supportPlaybook,
    engagementContext: inputs.engagementContext
  });
  artifacts.transitionChecklist = checklistResult;

  ctx.log('Knowledge Transfer process completed');

  return {
    success: true,
    knowledgeTransferPlan: artifacts.transferPlan,
    documentationPackage: artifacts.documentationPackage.documentationPackage,
    trainingMaterials: artifacts.trainingMaterials.trainingMaterials,
    capabilityAssessment: artifacts.competencyValidation,
    supportPlaybook: artifacts.supportPlaybook.supportPlaybook,
    transitionChecklist: artifacts.transitionChecklist.transitionChecklist,
    artifacts
  };
}
