/**
 * @process design-review-process
 * @description Formal design review process - PDR, CDR, and technical review facilitation
 * @inputs {object} inputs
 * @inputs {string} inputs.projectId - Project identification
 * @inputs {string} inputs.reviewType - Type of review (PDR, CDR, TRR, PRR, etc.)
 * @inputs {object} inputs.designPackage - Design documentation for review
 * @inputs {object} inputs.entryCriteria - Review entrance criteria
 * @inputs {array} inputs.reviewBoard - Review board members and roles
 * @outputs {object} reviewPackage - Complete review documentation with findings and actions
 * @example
 * const result = await process({
 *   projectId: 'DR-2024-001',
 *   reviewType: 'CDR',
 *   designPackage: { specs: [...], drawings: [...], analysis: [...] },
 *   entryCriteria: { completeness: 95, risksAddressed: true },
 *   reviewBoard: [{ name: 'John Smith', role: 'Chair' }, ...]
 * });
 * @references NASA NPR 7123.1, MIL-STD-1521, SAE AS6500
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: Review Planning and Entrance Criteria Check
  const reviewPlanning = await ctx.task(reviewPlanningTask, {
    projectId: inputs.projectId,
    reviewType: inputs.reviewType,
    entryCriteria: inputs.entryCriteria,
    reviewBoard: inputs.reviewBoard
  });
  artifacts.push({ phase: 'review-planning', data: reviewPlanning });

  // Phase 2: Design Package Completeness Assessment
  const completenessAssessment = await ctx.task(completenessTask, {
    designPackage: inputs.designPackage,
    reviewType: inputs.reviewType,
    entryCriteria: inputs.entryCriteria
  });
  artifacts.push({ phase: 'completeness', data: completenessAssessment });

  // Breakpoint: Entrance Criteria Gate
  await ctx.breakpoint('entrance-criteria', {
    question: 'Entrance criteria assessment complete. Proceed with formal review?',
    context: {
      completenessScore: completenessAssessment.completenessScore,
      criteriaStatus: completenessAssessment.criteriaStatus,
      gaps: completenessAssessment.gaps
    }
  });

  // Phase 3: Technical Review Package Preparation
  const reviewPackagePrep = await ctx.task(reviewPackagePrepTask, {
    designPackage: inputs.designPackage,
    reviewType: inputs.reviewType,
    agenda: reviewPlanning.agenda
  });
  artifacts.push({ phase: 'package-prep', data: reviewPackagePrep });

  // Phase 4: Pre-Review Analysis
  const preReviewAnalysis = await ctx.task(preReviewAnalysisTask, {
    designPackage: inputs.designPackage,
    reviewType: inputs.reviewType
  });
  artifacts.push({ phase: 'pre-review-analysis', data: preReviewAnalysis });

  // Phase 5: Requirements Verification Status
  const requirementsStatus = await ctx.task(requirementsStatusTask, {
    designPackage: inputs.designPackage,
    reviewType: inputs.reviewType
  });
  artifacts.push({ phase: 'requirements-status', data: requirementsStatus });

  // Phase 6: Risk and Issue Assessment
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    designPackage: inputs.designPackage,
    preReviewAnalysis: preReviewAnalysis
  });
  artifacts.push({ phase: 'risk-assessment', data: riskAssessment });

  // Phase 7: Review Board Findings Compilation
  const reviewFindings = await ctx.task(reviewFindingsTask, {
    preReviewAnalysis: preReviewAnalysis,
    requirementsStatus: requirementsStatus,
    riskAssessment: riskAssessment,
    reviewBoard: inputs.reviewBoard
  });
  artifacts.push({ phase: 'review-findings', data: reviewFindings });

  // Breakpoint: Review Findings Discussion
  await ctx.breakpoint('findings-review', {
    question: 'Review technical findings with board. Any additional concerns?',
    context: {
      totalFindings: reviewFindings.totalFindings,
      criticalFindings: reviewFindings.criticalCount,
      majorFindings: reviewFindings.majorCount
    }
  });

  // Phase 8: Action Item Definition
  const actionItems = await ctx.task(actionItemsTask, {
    reviewFindings: reviewFindings,
    projectId: inputs.projectId
  });
  artifacts.push({ phase: 'action-items', data: actionItems });

  // Phase 9: Exit Criteria Assessment
  const exitAssessment = await ctx.task(exitAssessmentTask, {
    reviewType: inputs.reviewType,
    reviewFindings: reviewFindings,
    requirementsStatus: requirementsStatus,
    actionItems: actionItems
  });
  artifacts.push({ phase: 'exit-assessment', data: exitAssessment });

  // Phase 10: Review Documentation and Minutes
  const reviewDocumentation = await ctx.task(reviewDocumentationTask, {
    projectId: inputs.projectId,
    reviewType: inputs.reviewType,
    reviewFindings: reviewFindings,
    actionItems: actionItems,
    exitAssessment: exitAssessment,
    reviewBoard: inputs.reviewBoard
  });
  artifacts.push({ phase: 'documentation', data: reviewDocumentation });

  // Final Breakpoint: Review Board Decision
  await ctx.breakpoint('board-decision', {
    question: 'Review board decision: Approve, Conditionally Approve, or Disapprove?',
    context: {
      recommendation: exitAssessment.recommendation,
      openActions: actionItems.openCount,
      criticalFindings: reviewFindings.criticalCount
    }
  });

  return {
    success: true,
    results: {
      projectId: inputs.projectId,
      reviewType: inputs.reviewType,
      reviewMinutes: reviewDocumentation.minutes,
      findings: reviewFindings,
      actionItems: actionItems,
      exitAssessment: exitAssessment,
      boardDecision: exitAssessment.recommendation
    },
    artifacts,
    metadata: {
      totalFindings: reviewFindings.totalFindings,
      openActionItems: actionItems.openCount,
      recommendedDecision: exitAssessment.recommendation
    }
  };
}

const reviewPlanningTask = defineTask('review-planning', (args) => ({
  kind: 'agent',
  title: 'Review Planning and Entrance Criteria',
  agent: {
    name: 'review-coordinator',
    prompt: {
      role: 'Design Review Coordinator',
      task: 'Plan design review and verify entrance criteria',
      context: args,
      instructions: [
        'Define review objectives based on review type',
        'Develop review agenda with time allocations',
        'Assign presentation responsibilities',
        'Define review board roles and expectations',
        'Identify required entrance criteria',
        'Schedule pre-board package distribution',
        'Plan logistics (venue, equipment, recordings)',
        'Define exit criteria for this review type'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'objectives', 'exitCriteria'],
      properties: {
        agenda: { type: 'array', items: { type: 'object' } },
        objectives: { type: 'array', items: { type: 'string' } },
        entranceCriteria: { type: 'array', items: { type: 'object' } },
        exitCriteria: { type: 'array', items: { type: 'object' } },
        logistics: { type: 'object' }
      }
    }
  }
}));

const completenessTask = defineTask('completeness-assessment', (args) => ({
  kind: 'agent',
  title: 'Design Package Completeness Assessment',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Design Quality Engineer',
      task: 'Assess completeness of design package against criteria',
      context: args,
      instructions: [
        'Review design package against required content checklist',
        'Verify all required documents are present',
        'Check document revision status and approvals',
        'Assess analysis completeness for review stage',
        'Verify requirements traceability documentation',
        'Check for open work items affecting review',
        'Identify any gaps requiring resolution',
        'Score overall completeness'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['completenessScore', 'criteriaStatus', 'gaps'],
      properties: {
        completenessScore: { type: 'number' },
        criteriaStatus: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } },
        documentStatus: { type: 'array', items: { type: 'object' } },
        readinessRecommendation: { type: 'string' }
      }
    }
  }
}));

const reviewPackagePrepTask = defineTask('package-prep', (args) => ({
  kind: 'agent',
  title: 'Review Package Preparation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Prepare formal review presentation package',
      context: args,
      instructions: [
        'Compile executive summary presentation',
        'Organize design documentation per agenda topics',
        'Prepare requirements compliance matrix',
        'Compile analysis summary charts',
        'Prepare risk and issue summary',
        'Organize supporting data appendices',
        'Create review board read-ahead package',
        'Prepare presentation materials'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['presentations', 'readAhead', 'appendices'],
      properties: {
        presentations: { type: 'array', items: { type: 'object' } },
        readAhead: { type: 'object' },
        appendices: { type: 'array', items: { type: 'object' } },
        executiveSummary: { type: 'object' }
      }
    }
  }
}));

const preReviewAnalysisTask = defineTask('pre-review-analysis', (args) => ({
  kind: 'agent',
  title: 'Pre-Review Technical Analysis',
  agent: {
    name: 'chief-engineer',
    prompt: {
      role: 'Chief Engineer',
      task: 'Conduct independent pre-review technical assessment',
      context: args,
      instructions: [
        'Review design approach and trade studies',
        'Assess technical maturity for review stage',
        'Evaluate analysis completeness and validity',
        'Review interface definitions and control',
        'Assess design margins and sensitivities',
        'Identify potential technical issues',
        'Review heritage and lessons learned application',
        'Prepare technical assessment summary'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['technicalAssessment', 'maturityScore', 'concerns'],
      properties: {
        technicalAssessment: { type: 'object' },
        maturityScore: { type: 'number' },
        concerns: { type: 'array', items: { type: 'object' } },
        margins: { type: 'array', items: { type: 'object' } },
        heritage: { type: 'object' }
      }
    }
  }
}));

const requirementsStatusTask = defineTask('requirements-status', (args) => ({
  kind: 'agent',
  title: 'Requirements Verification Status',
  agent: {
    name: 'systems-engineer',
    prompt: {
      role: 'Systems Engineer',
      task: 'Assess requirements verification and compliance status',
      context: args,
      instructions: [
        'Review requirements verification matrix status',
        'Assess compliance status for each requirement',
        'Identify requirements at risk',
        'Review verification method assignments',
        'Assess derived requirements completeness',
        'Review requirements changes since last review',
        'Identify verification plan gaps',
        'Summarize requirements status by category'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationStatus', 'complianceMatrix', 'atRiskRequirements'],
      properties: {
        verificationStatus: { type: 'object' },
        complianceMatrix: { type: 'array', items: { type: 'object' } },
        atRiskRequirements: { type: 'array', items: { type: 'object' } },
        changes: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  }
}));

const riskAssessmentTask = defineTask('risk-assessment', (args) => ({
  kind: 'agent',
  title: 'Risk and Issue Assessment',
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'Risk Manager',
      task: 'Assess technical and programmatic risks',
      context: args,
      instructions: [
        'Review risk register status',
        'Assess new risks identified during review prep',
        'Evaluate risk mitigation effectiveness',
        'Identify risks requiring board attention',
        'Review issues and problem reports',
        'Assess schedule and cost risks',
        'Evaluate supply chain risks',
        'Summarize risk posture for board'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['riskStatus', 'topRisks', 'newRisks'],
      properties: {
        riskStatus: { type: 'object' },
        topRisks: { type: 'array', items: { type: 'object' } },
        newRisks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } },
        mitigationStatus: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const reviewFindingsTask = defineTask('review-findings', (args) => ({
  kind: 'agent',
  title: 'Review Board Findings Compilation',
  agent: {
    name: 'review-secretary',
    prompt: {
      role: 'Review Board Secretary',
      task: 'Compile and categorize all review findings',
      context: args,
      instructions: [
        'Document all technical findings from board',
        'Categorize findings by severity (critical, major, minor)',
        'Assign finding numbers and tracking IDs',
        'Link findings to specific design elements',
        'Document board member attribution',
        'Identify findings requiring immediate action',
        'Group related findings for efficient resolution',
        'Summarize findings by design area'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'totalFindings', 'criticalCount', 'majorCount'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        totalFindings: { type: 'number' },
        criticalCount: { type: 'number' },
        majorCount: { type: 'number' },
        minorCount: { type: 'number' },
        byDesignArea: { type: 'object' }
      }
    }
  }
}));

const actionItemsTask = defineTask('action-items', (args) => ({
  kind: 'agent',
  title: 'Action Item Definition',
  agent: {
    name: 'action-coordinator',
    prompt: {
      role: 'Action Item Coordinator',
      task: 'Define and assign action items from findings',
      context: args,
      instructions: [
        'Create action items for each finding',
        'Define clear completion criteria',
        'Assign responsible parties',
        'Set due dates based on severity',
        'Identify dependencies between actions',
        'Define verification methods for closure',
        'Categorize actions by type',
        'Establish tracking mechanism'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'openCount', 'assignments'],
      properties: {
        actionItems: { type: 'array', items: { type: 'object' } },
        openCount: { type: 'number' },
        assignments: { type: 'array', items: { type: 'object' } },
        dueDates: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const exitAssessmentTask = defineTask('exit-assessment', (args) => ({
  kind: 'agent',
  title: 'Exit Criteria Assessment',
  agent: {
    name: 'review-chair',
    prompt: {
      role: 'Review Board Chair',
      task: 'Assess exit criteria and formulate recommendation',
      context: args,
      instructions: [
        'Evaluate each exit criterion',
        'Assess impact of open findings on criteria',
        'Determine if conditional approval is warranted',
        'Identify conditions for conditional approval',
        'Consider action item closure plan',
        'Formulate board recommendation',
        'Document rationale for recommendation',
        'Identify follow-up review requirements if any'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['criteriaStatus', 'recommendation', 'conditions'],
      properties: {
        criteriaStatus: { type: 'array', items: { type: 'object' } },
        recommendation: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        followUpRequired: { type: 'boolean' }
      }
    }
  }
}));

const reviewDocumentationTask = defineTask('review-documentation', (args) => ({
  kind: 'agent',
  title: 'Review Documentation and Minutes',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Compile formal review documentation package',
      context: args,
      instructions: [
        'Prepare formal review minutes',
        'Document attendance and roles',
        'Compile complete findings list with dispositions',
        'Document action items with assignments',
        'Record board decision and conditions',
        'Prepare signature approval pages',
        'Compile supporting documentation',
        'Archive review package per requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['minutes', 'attendance', 'approvals'],
      properties: {
        minutes: { type: 'object' },
        attendance: { type: 'array', items: { type: 'object' } },
        approvals: { type: 'array', items: { type: 'object' } },
        archives: { type: 'array', items: { type: 'string' } },
        distributionList: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

export default { process };
