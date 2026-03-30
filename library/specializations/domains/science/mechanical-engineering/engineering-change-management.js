/**
 * @process engineering-change-management
 * @description Engineering change management - ECR/ECO workflow, impact analysis, and implementation tracking
 * @inputs {object} inputs
 * @inputs {string} inputs.changeId - Change request identification
 * @inputs {object} inputs.changeRequest - ECR details including proposed change
 * @inputs {object} inputs.affectedItems - Items affected by the change
 * @inputs {string} inputs.priority - Change priority (emergency, urgent, normal)
 * @inputs {string} inputs.originator - Change originator information
 * @outputs {object} changePackage - Complete ECO package with approvals and implementation plan
 * @example
 * const result = await process({
 *   changeId: 'ECR-2024-001',
 *   changeRequest: { type: 'design', description: 'Increase wall thickness...', reason: 'stress margin' },
 *   affectedItems: { parts: ['P001', 'P002'], drawings: ['DWG-001'] },
 *   priority: 'normal',
 *   originator: { name: 'John Smith', dept: 'Engineering' }
 * });
 * @references ISO 10007, CMMI Configuration Management, MIL-HDBK-61
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: Change Request Documentation
  const changeDocumentation = await ctx.task(changeDocumentationTask, {
    changeId: inputs.changeId,
    changeRequest: inputs.changeRequest,
    originator: inputs.originator,
    priority: inputs.priority
  });
  artifacts.push({ phase: 'change-documentation', data: changeDocumentation });

  // Phase 2: Technical Impact Analysis
  const technicalImpact = await ctx.task(technicalImpactTask, {
    changeRequest: inputs.changeRequest,
    affectedItems: inputs.affectedItems
  });
  artifacts.push({ phase: 'technical-impact', data: technicalImpact });

  // Phase 3: Configuration Item Impact Assessment
  const configurationImpact = await ctx.task(configurationImpactTask, {
    affectedItems: inputs.affectedItems,
    changeRequest: inputs.changeRequest
  });
  artifacts.push({ phase: 'configuration-impact', data: configurationImpact });

  // Breakpoint: Impact Assessment Review
  await ctx.breakpoint('impact-review', {
    question: 'Review technical and configuration impact. Proceed with detailed analysis?',
    context: {
      technicalRisk: technicalImpact.riskLevel,
      affectedItemCount: configurationImpact.totalAffected,
      estimatedEffort: technicalImpact.effortEstimate
    }
  });

  // Phase 4: Cost and Schedule Impact
  const costScheduleImpact = await ctx.task(costScheduleTask, {
    technicalImpact: technicalImpact,
    configurationImpact: configurationImpact,
    priority: inputs.priority
  });
  artifacts.push({ phase: 'cost-schedule', data: costScheduleImpact });

  // Phase 5: Interchangeability and Retrofit Analysis
  const interchangeability = await ctx.task(interchangeabilityTask, {
    changeRequest: inputs.changeRequest,
    affectedItems: inputs.affectedItems,
    technicalImpact: technicalImpact
  });
  artifacts.push({ phase: 'interchangeability', data: interchangeability });

  // Phase 6: Verification Requirements
  const verificationRequirements = await ctx.task(verificationTask, {
    changeRequest: inputs.changeRequest,
    technicalImpact: technicalImpact
  });
  artifacts.push({ phase: 'verification', data: verificationRequirements });

  // Phase 7: ECO Preparation
  const ecoPreparation = await ctx.task(ecoPreparationTask, {
    changeId: inputs.changeId,
    changeDocumentation: changeDocumentation,
    technicalImpact: technicalImpact,
    configurationImpact: configurationImpact,
    costScheduleImpact: costScheduleImpact,
    interchangeability: interchangeability,
    verificationRequirements: verificationRequirements
  });
  artifacts.push({ phase: 'eco-preparation', data: ecoPreparation });

  // Phase 8: Change Control Board Review
  const ccbReview = await ctx.task(ccbReviewTask, {
    ecoPackage: ecoPreparation,
    priority: inputs.priority
  });
  artifacts.push({ phase: 'ccb-review', data: ccbReview });

  // Breakpoint: CCB Approval
  await ctx.breakpoint('ccb-approval', {
    question: 'CCB review complete. Approve ECO for implementation?',
    context: {
      ecoNumber: ecoPreparation.ecoNumber,
      totalCost: costScheduleImpact.totalCost,
      scheduleImpact: costScheduleImpact.scheduleImpact,
      recommendation: ccbReview.recommendation
    }
  });

  // Phase 9: Implementation Planning
  const implementationPlan = await ctx.task(implementationPlanTask, {
    ecoPackage: ecoPreparation,
    affectedItems: inputs.affectedItems,
    priority: inputs.priority
  });
  artifacts.push({ phase: 'implementation-plan', data: implementationPlan });

  // Phase 10: Change Package Release
  const changePackageRelease = await ctx.task(changePackageReleaseTask, {
    changeId: inputs.changeId,
    ecoPreparation: ecoPreparation,
    implementationPlan: implementationPlan,
    ccbApproval: ccbReview
  });
  artifacts.push({ phase: 'package-release', data: changePackageRelease });

  // Final Breakpoint: Implementation Initiation
  await ctx.breakpoint('implementation-start', {
    question: 'Approve change package release and initiate implementation?',
    context: {
      ecoNumber: ecoPreparation.ecoNumber,
      effectiveDate: implementationPlan.effectiveDate,
      implementationPhases: implementationPlan.phases.length
    }
  });

  return {
    success: true,
    results: {
      changeId: inputs.changeId,
      ecoNumber: ecoPreparation.ecoNumber,
      ecoPackage: ecoPreparation,
      impactAnalysis: {
        technical: technicalImpact,
        configuration: configurationImpact,
        costSchedule: costScheduleImpact
      },
      interchangeability: interchangeability,
      verificationPlan: verificationRequirements,
      implementationPlan: implementationPlan,
      ccbDecision: ccbReview
    },
    artifacts,
    metadata: {
      ecoNumber: ecoPreparation.ecoNumber,
      affectedItems: configurationImpact.totalAffected,
      totalCost: costScheduleImpact.totalCost,
      scheduleImpact: costScheduleImpact.scheduleImpact
    }
  };
}

const changeDocumentationTask = defineTask('change-documentation', (args) => ({
  kind: 'agent',
  title: 'Change Request Documentation',
  agent: {
    name: 'configuration-analyst',
    prompt: {
      role: 'Configuration Management Analyst',
      task: 'Document and classify the engineering change request',
      context: args,
      instructions: [
        'Assign ECR tracking number',
        'Document detailed description of proposed change',
        'Classify change type (design, process, material, software)',
        'Document change justification and benefits',
        'Identify change origin (corrective, preventive, improvement)',
        'Document safety/regulatory implications',
        'Identify related changes or dependencies',
        'Set initial priority and classification'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ecrNumber', 'classification', 'description', 'justification'],
      properties: {
        ecrNumber: { type: 'string' },
        classification: { type: 'object' },
        description: { type: 'string' },
        justification: { type: 'string' },
        relatedChanges: { type: 'array', items: { type: 'string' } },
        safetyImpact: { type: 'object' }
      }
    }
  }
}));

const technicalImpactTask = defineTask('technical-impact', (args) => ({
  kind: 'agent',
  title: 'Technical Impact Analysis',
  agent: {
    name: 'design-engineer',
    prompt: {
      role: 'Design Engineer',
      task: 'Analyze technical impact of proposed change',
      context: args,
      instructions: [
        'Identify all technical areas affected',
        'Assess impact on performance requirements',
        'Evaluate structural/stress implications',
        'Assess impact on interfaces',
        'Identify required analysis updates',
        'Assess impact on test programs',
        'Evaluate reliability/safety implications',
        'Estimate engineering effort required'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['affectedAreas', 'riskLevel', 'analysisRequired', 'effortEstimate'],
      properties: {
        affectedAreas: { type: 'array', items: { type: 'object' } },
        riskLevel: { type: 'string' },
        performanceImpact: { type: 'object' },
        interfaceImpact: { type: 'array', items: { type: 'object' } },
        analysisRequired: { type: 'array', items: { type: 'string' } },
        effortEstimate: { type: 'object' }
      }
    }
  }
}));

const configurationImpactTask = defineTask('configuration-impact', (args) => ({
  kind: 'agent',
  title: 'Configuration Item Impact Assessment',
  agent: {
    name: 'configuration-manager',
    prompt: {
      role: 'Configuration Manager',
      task: 'Identify all configuration items affected by change',
      context: args,
      instructions: [
        'Identify all affected part numbers',
        'Determine drawing revision requirements',
        'Identify affected specifications and procedures',
        'Assess BOM and indentured list changes',
        'Identify software/firmware impacts',
        'Determine serial number effectivity',
        'Identify tooling and GSE impacts',
        'Document complete where-used analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['affectedParts', 'affectedDrawings', 'totalAffected'],
      properties: {
        affectedParts: { type: 'array', items: { type: 'object' } },
        affectedDrawings: { type: 'array', items: { type: 'object' } },
        affectedSpecs: { type: 'array', items: { type: 'object' } },
        bomChanges: { type: 'array', items: { type: 'object' } },
        totalAffected: { type: 'number' },
        whereUsed: { type: 'object' }
      }
    }
  }
}));

const costScheduleTask = defineTask('cost-schedule', (args) => ({
  kind: 'agent',
  title: 'Cost and Schedule Impact Analysis',
  agent: {
    name: 'program-analyst',
    prompt: {
      role: 'Program Analyst',
      task: 'Estimate cost and schedule impacts of change',
      context: args,
      instructions: [
        'Estimate engineering labor costs',
        'Calculate manufacturing change costs',
        'Estimate tooling modification costs',
        'Calculate material cost delta',
        'Assess test program cost impact',
        'Estimate documentation update costs',
        'Calculate total implementation cost',
        'Assess schedule impact to milestones'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['costBreakdown', 'totalCost', 'scheduleImpact'],
      properties: {
        costBreakdown: { type: 'object' },
        totalCost: { type: 'number' },
        recurringVsNonrecurring: { type: 'object' },
        scheduleImpact: { type: 'object' },
        milestoneImpacts: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const interchangeabilityTask = defineTask('interchangeability', (args) => ({
  kind: 'agent',
  title: 'Interchangeability and Retrofit Analysis',
  agent: {
    name: 'sustainment-engineer',
    prompt: {
      role: 'Sustainment Engineer',
      task: 'Analyze interchangeability and retrofit requirements',
      context: args,
      instructions: [
        'Determine form/fit/function interchangeability',
        'Assess backward compatibility',
        'Identify retrofit requirements for fielded units',
        'Evaluate spare parts impact',
        'Assess maintenance procedure changes',
        'Determine training requirements',
        'Evaluate support equipment impact',
        'Define field implementation approach'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['interchangeabilityCode', 'retrofitRequired', 'sparePartsImpact'],
      properties: {
        interchangeabilityCode: { type: 'string' },
        retrofitRequired: { type: 'boolean' },
        retrofitPlan: { type: 'object' },
        sparePartsImpact: { type: 'object' },
        maintenanceChanges: { type: 'array', items: { type: 'object' } },
        trainingRequired: { type: 'boolean' }
      }
    }
  }
}));

const verificationTask = defineTask('verification-requirements', (args) => ({
  kind: 'agent',
  title: 'Verification Requirements Definition',
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification Engineer',
      task: 'Define verification requirements for the change',
      context: args,
      instructions: [
        'Identify affected verification requirements',
        'Determine retest/reanalysis needs',
        'Define acceptance criteria for change',
        'Identify required inspections',
        'Determine qualification test requirements',
        'Assess need for delta qualification',
        'Define first article requirements',
        'Plan verification evidence collection'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationPlan', 'retestRequired', 'acceptanceCriteria'],
      properties: {
        verificationPlan: { type: 'array', items: { type: 'object' } },
        retestRequired: { type: 'array', items: { type: 'string' } },
        reanalysisRequired: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'object' } },
        firstArticleRequired: { type: 'boolean' }
      }
    }
  }
}));

const ecoPreparationTask = defineTask('eco-preparation', (args) => ({
  kind: 'agent',
  title: 'ECO Package Preparation',
  agent: {
    name: 'configuration-analyst',
    prompt: {
      role: 'Configuration Management Analyst',
      task: 'Prepare complete ECO package for CCB review',
      context: args,
      instructions: [
        'Assign ECO number',
        'Compile all impact analyses',
        'Document before/after conditions',
        'Prepare redlined drawings or documents',
        'Document affected item list',
        'Include cost and schedule summary',
        'Prepare CCB presentation',
        'Complete ECO form per company procedure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ecoNumber', 'ecoForm', 'attachments'],
      properties: {
        ecoNumber: { type: 'string' },
        ecoForm: { type: 'object' },
        attachments: { type: 'array', items: { type: 'object' } },
        redlines: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  }
}));

const ccbReviewTask = defineTask('ccb-review', (args) => ({
  kind: 'agent',
  title: 'Change Control Board Review',
  agent: {
    name: 'ccb-secretary',
    prompt: {
      role: 'CCB Secretary',
      task: 'Facilitate CCB review and document decision',
      context: args,
      instructions: [
        'Present change to CCB members',
        'Document board member comments',
        'Capture any additional conditions',
        'Record board vote/decision',
        'Document approval signatures',
        'Identify any additional requirements',
        'Record dissenting opinions if any',
        'Formulate board recommendation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['decision', 'recommendation', 'conditions'],
      properties: {
        decision: { type: 'string' },
        recommendation: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        comments: { type: 'array', items: { type: 'object' } },
        signatures: { type: 'array', items: { type: 'object' } },
        dissent: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const implementationPlanTask = defineTask('implementation-plan', (args) => ({
  kind: 'agent',
  title: 'Implementation Planning',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Change Implementation Planner',
      task: 'Develop detailed implementation plan',
      context: args,
      instructions: [
        'Define effectivity (serial number, date, lot)',
        'Sequence implementation activities',
        'Identify work-off of affected inventory',
        'Plan documentation updates',
        'Schedule required verifications',
        'Plan supplier notifications',
        'Define cut-in point in production',
        'Establish completion criteria and tracking'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['effectiveDate', 'phases', 'milestones'],
      properties: {
        effectiveDate: { type: 'string' },
        effectivity: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        inventoryWorkoff: { type: 'object' },
        supplierNotifications: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const changePackageReleaseTask = defineTask('package-release', (args) => ({
  kind: 'agent',
  title: 'Change Package Release',
  agent: {
    name: 'release-coordinator',
    prompt: {
      role: 'Release Coordinator',
      task: 'Release approved change package for implementation',
      context: args,
      instructions: [
        'Verify all approvals obtained',
        'Release updated drawings and documents',
        'Update configuration records',
        'Distribute change notices',
        'Update BOM in ERP system',
        'Notify affected organizations',
        'Initiate implementation tracking',
        'Archive ECO package'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['releaseDate', 'releasedDocuments', 'distribution'],
      properties: {
        releaseDate: { type: 'string' },
        releasedDocuments: { type: 'array', items: { type: 'object' } },
        distribution: { type: 'array', items: { type: 'string' } },
        configurationUpdate: { type: 'object' },
        trackingId: { type: 'string' }
      }
    }
  }
}));

export default { process };
