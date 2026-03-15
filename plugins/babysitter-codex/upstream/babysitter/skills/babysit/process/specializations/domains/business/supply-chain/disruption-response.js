/**
 * @process specializations/domains/business/supply-chain/disruption-response
 * @description Supply Chain Disruption Response - Execute rapid response protocols for supply disruptions
 * including impact assessment, mitigation activation, stakeholder communication, and recovery tracking.
 * @inputs { disruptionType?: string, affectedSuppliers?: array, severity?: string, description?: string }
 * @outputs { success: boolean, impactAssessment: object, mitigationActions: array, recoveryStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/disruption-response', {
 *   disruptionType: 'supplier-failure',
 *   affectedSuppliers: ['Supplier A'],
 *   severity: 'critical',
 *   description: 'Major supplier facility fire causing production stoppage'
 * });
 *
 * @references
 * - The Resilient Enterprise: https://mitpress.mit.edu/9780262693493/the-resilient-enterprise/
 * - Supply Chain Disruption Response: https://www.mckinsey.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    disruptionType = 'unknown',
    affectedSuppliers = [],
    severity = 'high',
    description = '',
    affectedCategories = [],
    estimatedDuration = 'unknown',
    outputDir = 'disruption-response-output'
  } = inputs;

  const startTime = ctx.now();
  const disruptionId = `DIS-${Date.now()}`;
  const artifacts = [];

  ctx.log('info', `Starting Supply Chain Disruption Response - ${disruptionId}`);
  ctx.log('info', `Severity: ${severity}, Type: ${disruptionType}`);

  // ============================================================================
  // PHASE 1: SITUATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing disruption situation');

  const situationAssessment = await ctx.task(situationAssessmentTask, {
    disruptionId,
    disruptionType,
    affectedSuppliers,
    severity,
    description,
    affectedCategories,
    outputDir
  });

  artifacts.push(...situationAssessment.artifacts);

  // ============================================================================
  // PHASE 2: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing business impact');

  const impactAssessment = await ctx.task(disruptionImpactTask, {
    disruptionId,
    situationAssessment,
    affectedSuppliers,
    affectedCategories,
    estimatedDuration,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // Breakpoint: Review impact assessment
  await ctx.breakpoint({
    question: `Impact assessment complete. Revenue at risk: $${impactAssessment.revenueAtRisk}. Production impact: ${impactAssessment.productionImpact}. Review before activating mitigation?`,
    title: 'Disruption Impact Assessment',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        disruptionId,
        severity,
        revenueAtRisk: impactAssessment.revenueAtRisk,
        productionImpact: impactAssessment.productionImpact,
        customersAffected: impactAssessment.customersAffected
      }
    }
  });

  // ============================================================================
  // PHASE 3: RESPONSE TEAM ACTIVATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Activating response team');

  const teamActivation = await ctx.task(responseTeamActivationTask, {
    disruptionId,
    severity,
    impactAssessment,
    outputDir
  });

  artifacts.push(...teamActivation.artifacts);

  // ============================================================================
  // PHASE 4: MITIGATION ACTIVATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Activating mitigation measures');

  const mitigationActivation = await ctx.task(mitigationActivationTask, {
    disruptionId,
    situationAssessment,
    impactAssessment,
    affectedSuppliers,
    affectedCategories,
    outputDir
  });

  artifacts.push(...mitigationActivation.artifacts);

  // ============================================================================
  // PHASE 5: STAKEHOLDER COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Communicating with stakeholders');

  const stakeholderCommunication = await ctx.task(stakeholderCommunicationTask, {
    disruptionId,
    severity,
    situationAssessment,
    impactAssessment,
    mitigationActivation,
    outputDir
  });

  artifacts.push(...stakeholderCommunication.artifacts);

  // ============================================================================
  // PHASE 6: SUPPLY CONTINUITY ACTIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing supply continuity actions');

  const continuitActions = await ctx.task(supplyContinuityTask, {
    disruptionId,
    mitigationActivation,
    impactAssessment,
    affectedSuppliers,
    affectedCategories,
    outputDir
  });

  artifacts.push(...continuitActions.artifacts);

  // ============================================================================
  // PHASE 7: RECOVERY TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up recovery tracking');

  const recoveryTracking = await ctx.task(recoveryTrackingTask, {
    disruptionId,
    mitigationActivation,
    continuitActions,
    outputDir
  });

  artifacts.push(...recoveryTracking.artifacts);

  // ============================================================================
  // PHASE 8: LESSONS LEARNED
  // ============================================================================

  ctx.log('info', 'Phase 8: Documenting lessons learned');

  const lessonsLearned = await ctx.task(lessonsLearnedTask, {
    disruptionId,
    disruptionType,
    situationAssessment,
    impactAssessment,
    mitigationActivation,
    recoveryTracking,
    outputDir
  });

  artifacts.push(...lessonsLearned.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Disruption response complete for ${disruptionId}. Recovery status: ${recoveryTracking.status}. ${mitigationActivation.actionsExecuted} mitigation actions executed. Close disruption response?`,
    title: 'Disruption Response Summary',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        disruptionId,
        severity,
        recoveryStatus: recoveryTracking.status,
        actionsExecuted: mitigationActivation.actionsExecuted,
        lessonsLearned: lessonsLearned.keyLessons
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    disruptionId,
    situationSummary: {
      type: disruptionType,
      severity,
      affectedSuppliers,
      affectedCategories,
      confirmedScope: situationAssessment.confirmedScope
    },
    impactAssessment: {
      revenueAtRisk: impactAssessment.revenueAtRisk,
      productionImpact: impactAssessment.productionImpact,
      customersAffected: impactAssessment.customersAffected,
      supplyGap: impactAssessment.supplyGap
    },
    mitigationActions: mitigationActivation.actions,
    recoveryStatus: {
      status: recoveryTracking.status,
      estimatedRecovery: recoveryTracking.estimatedRecovery,
      milestones: recoveryTracking.milestones
    },
    communications: stakeholderCommunication.communicationsSent,
    lessonsLearned: lessonsLearned.keyLessons,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/disruption-response',
      timestamp: startTime,
      disruptionId,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const situationAssessmentTask = defineTask('situation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Situation Assessment',
  agent: {
    name: 'situation-assessor',
    prompt: {
      role: 'Disruption Situation Analyst',
      task: 'Assess the disruption situation',
      context: args,
      instructions: [
        '1. Confirm disruption facts',
        '2. Identify root cause',
        '3. Determine affected scope',
        '4. Assess current supplier status',
        '5. Estimate disruption duration',
        '6. Identify cascading impacts',
        '7. Classify severity level',
        '8. Document situation assessment'
      ],
      outputFormat: 'JSON with situation assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['confirmedScope', 'rootCause', 'estimatedDuration', 'artifacts'],
      properties: {
        confirmedScope: { type: 'object' },
        rootCause: { type: 'string' },
        estimatedDuration: { type: 'string' },
        supplierStatus: { type: 'object' },
        cascadingImpacts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'assessment']
}));

export const disruptionImpactTask = defineTask('disruption-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Business Impact Assessment',
  agent: {
    name: 'impact-assessor',
    prompt: {
      role: 'Business Impact Analyst',
      task: 'Assess business impact of disruption',
      context: args,
      instructions: [
        '1. Calculate revenue at risk',
        '2. Assess production impact',
        '3. Identify affected customers',
        '4. Calculate supply gap',
        '5. Estimate inventory coverage',
        '6. Assess contractual penalties',
        '7. Evaluate reputation impact',
        '8. Document impact assessment'
      ],
      outputFormat: 'JSON with impact assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['revenueAtRisk', 'productionImpact', 'customersAffected', 'supplyGap', 'artifacts'],
      properties: {
        revenueAtRisk: { type: 'number' },
        productionImpact: { type: 'string' },
        customersAffected: { type: 'number' },
        supplyGap: { type: 'object' },
        inventoryCoverage: { type: 'string' },
        contractualRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'impact']
}));

export const responseTeamActivationTask = defineTask('response-team-activation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Response Team Activation',
  agent: {
    name: 'team-coordinator',
    prompt: {
      role: 'Response Team Coordinator',
      task: 'Activate disruption response team',
      context: args,
      instructions: [
        '1. Activate response team',
        '2. Assign response leader',
        '3. Establish war room',
        '4. Set up communication channels',
        '5. Define roles and responsibilities',
        '6. Schedule status meetings',
        '7. Notify stakeholders',
        '8. Document team activation'
      ],
      outputFormat: 'JSON with team activation'
    },
    outputSchema: {
      type: 'object',
      required: ['teamActivated', 'responseLeader', 'artifacts'],
      properties: {
        teamActivated: { type: 'boolean' },
        responseLeader: { type: 'string' },
        warRoomUrl: { type: 'string' },
        teamMembers: { type: 'array' },
        meetingSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'team']
}));

export const mitigationActivationTask = defineTask('mitigation-activation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Mitigation Activation',
  agent: {
    name: 'mitigation-coordinator',
    prompt: {
      role: 'Mitigation Coordinator',
      task: 'Activate mitigation measures',
      context: args,
      instructions: [
        '1. Activate contingency plans',
        '2. Deploy buffer stock',
        '3. Contact alternative suppliers',
        '4. Expedite existing orders',
        '5. Adjust production schedules',
        '6. Reallocate inventory',
        '7. Track mitigation actions',
        '8. Document mitigation status'
      ],
      outputFormat: 'JSON with mitigation actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'actionsExecuted', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        actionsExecuted: { type: 'number' },
        contingencyActivated: { type: 'array' },
        alternativeSuppliersContacted: { type: 'array' },
        inventoryReallocated: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'mitigation']
}));

export const stakeholderCommunicationTask = defineTask('stakeholder-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Stakeholder Communication',
  agent: {
    name: 'communication-coordinator',
    prompt: {
      role: 'Crisis Communication Coordinator',
      task: 'Communicate with stakeholders about disruption',
      context: args,
      instructions: [
        '1. Notify executive leadership',
        '2. Communicate with affected customers',
        '3. Inform sales and customer service',
        '4. Communicate with operations',
        '5. Update supplier on expectations',
        '6. Provide regular status updates',
        '7. Manage external communications',
        '8. Document communications'
      ],
      outputFormat: 'JSON with communication status'
    },
    outputSchema: {
      type: 'object',
      required: ['communicationsSent', 'stakeholdersNotified', 'artifacts'],
      properties: {
        communicationsSent: { type: 'number' },
        stakeholdersNotified: { type: 'array' },
        customerCommunications: { type: 'array' },
        internalUpdates: { type: 'array' },
        nextUpdateScheduled: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'communication']
}));

export const supplyContinuityTask = defineTask('supply-continuity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Supply Continuity Actions',
  agent: {
    name: 'continuity-coordinator',
    prompt: {
      role: 'Supply Continuity Coordinator',
      task: 'Execute supply continuity actions',
      context: args,
      instructions: [
        '1. Execute alternative sourcing',
        '2. Expedite supplier recovery',
        '3. Manage allocation decisions',
        '4. Coordinate logistics changes',
        '5. Manage quality approvals',
        '6. Track supply recovery',
        '7. Monitor customer commitments',
        '8. Document continuity actions'
      ],
      outputFormat: 'JSON with continuity actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actionsExecuted', 'supplySecured', 'artifacts'],
      properties: {
        actionsExecuted: { type: 'array' },
        supplySecured: { type: 'number' },
        allocationDecisions: { type: 'array' },
        qualityApprovals: { type: 'array' },
        recoveryProgress: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'continuity']
}));

export const recoveryTrackingTask = defineTask('recovery-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Recovery Tracking',
  agent: {
    name: 'recovery-tracker',
    prompt: {
      role: 'Recovery Tracking Specialist',
      task: 'Track disruption recovery progress',
      context: args,
      instructions: [
        '1. Define recovery milestones',
        '2. Track supplier recovery status',
        '3. Monitor supply restoration',
        '4. Track customer impact resolution',
        '5. Update recovery estimates',
        '6. Document recovery progress',
        '7. Identify residual risks',
        '8. Prepare closure criteria'
      ],
      outputFormat: 'JSON with recovery tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'estimatedRecovery', 'milestones', 'artifacts'],
      properties: {
        status: { type: 'string' },
        estimatedRecovery: { type: 'string' },
        milestones: { type: 'array' },
        supplierRecoveryStatus: { type: 'object' },
        residualRisks: { type: 'array' },
        closureCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'recovery']
}));

export const lessonsLearnedTask = defineTask('lessons-learned', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Lessons Learned',
  agent: {
    name: 'lessons-analyst',
    prompt: {
      role: 'Lessons Learned Analyst',
      task: 'Document lessons learned from disruption',
      context: args,
      instructions: [
        '1. Analyze response effectiveness',
        '2. Identify what worked well',
        '3. Identify improvement opportunities',
        '4. Update contingency plans',
        '5. Recommend process changes',
        '6. Update risk assessments',
        '7. Create action items',
        '8. Document lessons learned'
      ],
      outputFormat: 'JSON with lessons learned'
    },
    outputSchema: {
      type: 'object',
      required: ['keyLessons', 'improvements', 'artifacts'],
      properties: {
        keyLessons: { type: 'array' },
        whatWorkedWell: { type: 'array' },
        improvements: { type: 'array' },
        planUpdates: { type: 'array' },
        processChanges: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'disruption-response', 'lessons-learned']
}));
