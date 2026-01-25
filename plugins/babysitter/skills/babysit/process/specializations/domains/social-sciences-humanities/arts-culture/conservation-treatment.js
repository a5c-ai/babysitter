/**
 * @process arts-culture/conservation-treatment
 * @description Protocol for assessing artwork condition, developing treatment proposals, executing interventions, and documenting conservation activities with ethical decision-making frameworks
 * @inputs { objectTitle: string, objectType: string, ownerInfo: object, condition: object, treatmentGoals: array }
 * @outputs { success: boolean, conditionAssessment: object, treatmentProposal: object, treatmentDocumentation: object, artifacts: array }
 * @recommendedSkills SK-AC-006 (conservation-assessment), SK-AC-003 (collection-documentation)
 * @recommendedAgents AG-AC-004 (conservator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    objectTitle,
    objectType = 'painting',
    ownerInfo = {},
    condition = {},
    treatmentGoals = [],
    outputDir = 'conservation-treatment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Initial Examination
  ctx.log('info', 'Conducting initial examination');
  const initialExamination = await ctx.task(initialExaminationTask, {
    objectTitle,
    objectType,
    condition,
    outputDir
  });

  if (!initialExamination.success) {
    return {
      success: false,
      error: 'Initial examination failed',
      details: initialExamination,
      metadata: { processId: 'arts-culture/conservation-treatment', timestamp: startTime }
    };
  }

  artifacts.push(...initialExamination.artifacts);

  // Task 2: Condition Assessment
  ctx.log('info', 'Conducting detailed condition assessment');
  const conditionAssessment = await ctx.task(conditionAssessmentTask, {
    objectTitle,
    objectType,
    initialExamination: initialExamination.findings,
    outputDir
  });

  artifacts.push(...conditionAssessment.artifacts);

  // Task 3: Technical Analysis
  ctx.log('info', 'Conducting technical analysis');
  const technicalAnalysis = await ctx.task(technicalAnalysisTask, {
    objectTitle,
    objectType,
    conditionAssessment: conditionAssessment.assessment,
    outputDir
  });

  artifacts.push(...technicalAnalysis.artifacts);

  // Task 4: Ethical Decision Framework
  ctx.log('info', 'Applying ethical decision framework');
  const ethicalDecision = await ctx.task(ethicalDecisionTask, {
    objectTitle,
    objectType,
    conditionAssessment: conditionAssessment.assessment,
    treatmentGoals,
    ownerInfo,
    outputDir
  });

  artifacts.push(...ethicalDecision.artifacts);

  // Task 5: Treatment Proposal Development
  ctx.log('info', 'Developing treatment proposal');
  const treatmentProposal = await ctx.task(treatmentProposalTask, {
    objectTitle,
    objectType,
    conditionAssessment: conditionAssessment.assessment,
    technicalAnalysis: technicalAnalysis.analysis,
    ethicalDecision: ethicalDecision.framework,
    treatmentGoals,
    outputDir
  });

  artifacts.push(...treatmentProposal.artifacts);

  // Breakpoint: Review treatment proposal
  await ctx.breakpoint({
    question: `Treatment proposal for "${objectTitle}" complete. ${treatmentProposal.interventions.length} interventions proposed. Review and approve treatment approach?`,
    title: 'Conservation Treatment Proposal Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        objectTitle,
        objectType,
        conditionRating: conditionAssessment.assessment.overallCondition,
        interventionCount: treatmentProposal.interventions.length,
        estimatedTime: treatmentProposal.timeEstimate
      }
    }
  });

  // Task 6: Treatment Implementation Plan
  ctx.log('info', 'Creating treatment implementation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    objectTitle,
    treatmentProposal: treatmentProposal.proposal,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Task 7: Treatment Execution Documentation
  ctx.log('info', 'Preparing treatment execution documentation');
  const executionDocumentation = await ctx.task(executionDocumentationTask, {
    objectTitle,
    objectType,
    treatmentProposal: treatmentProposal.proposal,
    implementationPlan: implementationPlan.plan,
    outputDir
  });

  artifacts.push(...executionDocumentation.artifacts);

  // Task 8: Quality Control and Assessment
  ctx.log('info', 'Creating quality control procedures');
  const qualityControl = await ctx.task(qualityControlTask, {
    objectTitle,
    treatmentProposal: treatmentProposal.proposal,
    outputDir
  });

  artifacts.push(...qualityControl.artifacts);

  // Task 9: Final Documentation Package
  ctx.log('info', 'Generating final documentation package');
  const finalDocumentation = await ctx.task(finalDocumentationTask, {
    objectTitle,
    objectType,
    ownerInfo,
    initialExamination,
    conditionAssessment,
    technicalAnalysis,
    treatmentProposal,
    executionDocumentation,
    qualityControl,
    outputDir
  });

  artifacts.push(...finalDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    conditionAssessment: {
      examination: initialExamination.findings,
      assessment: conditionAssessment.assessment,
      technicalAnalysis: technicalAnalysis.analysis
    },
    treatmentProposal: {
      proposal: treatmentProposal.proposal,
      interventions: treatmentProposal.interventions,
      ethics: ethicalDecision.framework,
      timeEstimate: treatmentProposal.timeEstimate
    },
    implementation: {
      plan: implementationPlan.plan,
      documentation: executionDocumentation.templates
    },
    treatmentDocumentation: {
      qualityControl: qualityControl.procedures,
      finalReport: finalDocumentation.report
    },
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/conservation-treatment',
      timestamp: startTime,
      objectTitle
    }
  };
}

// Task 1: Initial Examination
export const initialExaminationTask = defineTask('initial-examination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct initial examination',
  agent: {
    name: 'conservator',
    prompt: {
      role: 'objects conservator',
      task: 'Conduct initial examination of artwork or cultural object',
      context: args,
      instructions: [
        'Document object identification and provenance',
        'Conduct visual examination under normal light',
        'Examine under raking and transmitted light',
        'Document initial condition observations',
        'Identify materials and techniques visible',
        'Note previous treatments or alterations',
        'Photograph overall and detail views',
        'Document handling and support needs'
      ],
      outputFormat: 'JSON with success, findings, observations, images, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'object',
          properties: {
            identification: { type: 'object' },
            visualExam: { type: 'object' },
            observations: { type: 'array' },
            previousTreatments: { type: 'array' }
          }
        },
        observations: { type: 'array' },
        images: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'examination', 'initial']
}));

// Task 2: Condition Assessment
export const conditionAssessmentTask = defineTask('condition-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct condition assessment',
  agent: {
    name: 'condition-specialist',
    prompt: {
      role: 'conservation condition specialist',
      task: 'Conduct detailed condition assessment following AIC standards',
      context: args,
      instructions: [
        'Document structural condition issues',
        'Assess surface condition and stability',
        'Evaluate paint layer or surface treatment',
        'Document accretions and foreign material',
        'Assess previous restoration condition',
        'Map condition issues on diagram',
        'Rate overall condition and stability',
        'Prioritize treatment needs'
      ],
      outputFormat: 'JSON with assessment, conditionMap, priorities, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            structural: { type: 'object' },
            surface: { type: 'object' },
            overallCondition: { type: 'string' },
            stability: { type: 'string' }
          }
        },
        conditionMap: { type: 'object' },
        priorities: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'condition', 'assessment']
}));

// Task 3: Technical Analysis
export const technicalAnalysisTask = defineTask('technical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct technical analysis',
  agent: {
    name: 'technical-analyst',
    prompt: {
      role: 'conservation scientist',
      task: 'Plan and interpret technical analysis for conservation',
      context: args,
      instructions: [
        'Recommend appropriate analytical techniques',
        'Plan UV fluorescence examination',
        'Recommend IR reflectography if appropriate',
        'Plan X-radiography if needed',
        'Recommend material sampling and analysis',
        'Interpret analytical results',
        'Correlate findings with visual examination',
        'Document analytical methodology'
      ],
      outputFormat: 'JSON with analysis, techniques, findings, interpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            techniques: { type: 'array' },
            findings: { type: 'object' },
            materials: { type: 'object' }
          }
        },
        techniques: { type: 'array' },
        findings: { type: 'object' },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'technical', 'analysis']
}));

// Task 4: Ethical Decision Framework
export const ethicalDecisionTask = defineTask('ethical-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply ethical decision framework',
  agent: {
    name: 'ethics-specialist',
    prompt: {
      role: 'conservation ethics specialist',
      task: 'Apply ethical decision-making framework to treatment planning',
      context: args,
      instructions: [
        'Review AIC Code of Ethics and Guidelines',
        'Assess significance and use requirements',
        'Evaluate reversibility considerations',
        'Consider minimal intervention principles',
        'Assess stakeholder perspectives',
        'Document ethical considerations',
        'Weigh treatment options ethically',
        'Recommend ethical approach'
      ],
      outputFormat: 'JSON with framework, considerations, recommendations, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            principles: { type: 'array' },
            considerations: { type: 'array' },
            decisionMatrix: { type: 'object' }
          }
        },
        considerations: { type: 'array' },
        recommendations: { type: 'array' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'ethics', 'decision-making']
}));

// Task 5: Treatment Proposal
export const treatmentProposalTask = defineTask('treatment-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop treatment proposal',
  agent: {
    name: 'treatment-specialist',
    prompt: {
      role: 'conservation treatment specialist',
      task: 'Develop comprehensive treatment proposal',
      context: args,
      instructions: [
        'Define treatment objectives and scope',
        'Describe proposed interventions',
        'Specify materials and methods',
        'Address risks and alternatives',
        'Estimate time and resources',
        'Define expected outcomes',
        'Include testing protocols',
        'Provide cost estimate if required'
      ],
      outputFormat: 'JSON with proposal, interventions, materials, timeEstimate, costs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proposal', 'interventions', 'artifacts'],
      properties: {
        proposal: {
          type: 'object',
          properties: {
            objectives: { type: 'array' },
            scope: { type: 'string' },
            approach: { type: 'string' }
          }
        },
        interventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              intervention: { type: 'string' },
              materials: { type: 'array' },
              rationale: { type: 'string' }
            }
          }
        },
        materials: { type: 'array' },
        timeEstimate: { type: 'string' },
        costs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'treatment', 'proposal']
}));

// Task 6: Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'conservation project planner',
      task: 'Create detailed treatment implementation plan',
      context: args,
      instructions: [
        'Create step-by-step treatment sequence',
        'Schedule treatment phases',
        'Plan material preparation',
        'Define equipment and workspace needs',
        'Plan documentation milestones',
        'Identify decision points and reviews',
        'Create safety protocols',
        'Plan client communication points'
      ],
      outputFormat: 'JSON with plan, sequence, schedule, equipment, safety, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            sequence: { type: 'array' },
            phases: { type: 'array' },
            decisionPoints: { type: 'array' }
          }
        },
        schedule: { type: 'object' },
        equipment: { type: 'array' },
        safety: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'implementation', 'planning']
}));

// Task 7: Execution Documentation
export const executionDocumentationTask = defineTask('execution-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare execution documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'conservation documentation specialist',
      task: 'Prepare treatment execution documentation templates',
      context: args,
      instructions: [
        'Create treatment log template',
        'Design progress photography protocol',
        'Create material usage documentation',
        'Design testing results documentation',
        'Create time tracking template',
        'Plan mid-treatment reporting',
        'Design deviation documentation',
        'Create sample retention protocol'
      ],
      outputFormat: 'JSON with templates, protocols, tracking, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: {
          type: 'object',
          properties: {
            treatmentLog: { type: 'object' },
            photography: { type: 'object' },
            materials: { type: 'object' }
          }
        },
        protocols: { type: 'array' },
        tracking: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'documentation', 'execution']
}));

// Task 8: Quality Control
export const qualityControlTask = defineTask('quality-control', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create quality control procedures',
  agent: {
    name: 'quality-specialist',
    prompt: {
      role: 'conservation quality specialist',
      task: 'Create quality control and assessment procedures',
      context: args,
      instructions: [
        'Define quality criteria for each intervention',
        'Create inspection checkpoints',
        'Design reversibility testing protocols',
        'Create aesthetic assessment criteria',
        'Plan peer review process',
        'Design client approval process',
        'Create final inspection checklist',
        'Document acceptance criteria'
      ],
      outputFormat: 'JSON with procedures, criteria, checkpoints, assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'artifacts'],
      properties: {
        procedures: {
          type: 'object',
          properties: {
            checkpoints: { type: 'array' },
            criteria: { type: 'object' },
            testing: { type: 'array' }
          }
        },
        criteria: { type: 'object' },
        checkpoints: { type: 'array' },
        assessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'quality', 'control']
}));

// Task 9: Final Documentation
export const finalDocumentationTask = defineTask('final-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final documentation',
  agent: {
    name: 'final-documentation-specialist',
    prompt: {
      role: 'conservation documentation specialist',
      task: 'Generate comprehensive final treatment documentation',
      context: args,
      instructions: [
        'Compile treatment report',
        'Include before/after photography',
        'Document all materials and methods used',
        'Include analytical results',
        'Document care recommendations',
        'Create exhibition/display guidelines',
        'Generate archival documentation package',
        'Prepare client deliverables'
      ],
      outputFormat: 'JSON with report, photography, recommendations, archive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            treatment: { type: 'object' },
            materials: { type: 'array' },
            recommendations: { type: 'array' }
          }
        },
        photography: { type: 'array' },
        recommendations: { type: 'object' },
        archive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'documentation', 'final']
}));
