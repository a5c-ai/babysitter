/**
 * @process specializations/domains/business/supply-chain/contract-management
 * @description Contract Negotiation and Management - Develop negotiation strategies, conduct supplier negotiations,
 * draft contracts, and manage contract lifecycle including renewals and amendments.
 * @inputs { supplier?: string, contractType?: string, terms?: object, currentContract?: object }
 * @outputs { success: boolean, contract: object, negotiationOutcome: object, lifecycle: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/contract-management', {
 *   supplier: 'Acme Corp',
 *   contractType: 'Master Services Agreement',
 *   terms: { duration: '3-years', value: 5000000 },
 *   currentContract: { id: 'CNT-001', expirationDate: '2024-12-31' }
 * });
 *
 * @references
 * - Vantage Partners Negotiation: https://www.vantagepartners.com/
 * - Contract Management Best Practices: https://www.icertis.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    supplier = '',
    contractType = 'Master Agreement',
    terms = {},
    currentContract = null,
    negotiationPriorities = [],
    stakeholders = [],
    outputDir = 'contract-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Contract Management Process for: ${supplier}`);

  // ============================================================================
  // PHASE 1: CONTRACT STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Developing contract strategy');

  const contractStrategy = await ctx.task(contractStrategyTask, {
    supplier,
    contractType,
    terms,
    currentContract,
    negotiationPriorities,
    outputDir
  });

  artifacts.push(...contractStrategy.artifacts);

  // ============================================================================
  // PHASE 2: NEGOTIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Planning negotiation approach');

  const negotiationPlan = await ctx.task(negotiationPlanTask, {
    supplier,
    contractStrategy,
    negotiationPriorities,
    outputDir
  });

  artifacts.push(...negotiationPlan.artifacts);

  // Breakpoint: Review negotiation strategy
  await ctx.breakpoint({
    question: `Negotiation strategy ready for ${supplier}. Key priorities: ${negotiationPlan.keyPriorities.join(', ')}. BATNA defined. Review strategy before negotiation?`,
    title: 'Negotiation Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        supplier,
        keyPriorities: negotiationPlan.keyPriorities,
        targetOutcome: negotiationPlan.targetOutcome,
        batna: negotiationPlan.batna
      }
    }
  });

  // ============================================================================
  // PHASE 3: CONTRACT DRAFTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Drafting contract');

  const contractDraft = await ctx.task(contractDraftingTask, {
    supplier,
    contractType,
    contractStrategy,
    terms,
    outputDir
  });

  artifacts.push(...contractDraft.artifacts);

  // ============================================================================
  // PHASE 4: NEGOTIATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Executing negotiation');

  const negotiationExecution = await ctx.task(negotiationExecutionTask, {
    supplier,
    contractDraft,
    negotiationPlan,
    outputDir
  });

  artifacts.push(...negotiationExecution.artifacts);

  // ============================================================================
  // PHASE 5: CONTRACT FINALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Finalizing contract');

  const contractFinalization = await ctx.task(contractFinalizationTask, {
    supplier,
    contractDraft,
    negotiationExecution,
    stakeholders,
    outputDir
  });

  artifacts.push(...contractFinalization.artifacts);

  // Breakpoint: Review final contract
  await ctx.breakpoint({
    question: `Contract finalized with ${supplier}. Value: $${contractFinalization.finalValue}. Duration: ${contractFinalization.duration}. Approve for execution?`,
    title: 'Contract Approval Review',
    context: {
      runId: ctx.runId,
      files: contractFinalization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        finalValue: contractFinalization.finalValue,
        duration: contractFinalization.duration,
        keyTerms: contractFinalization.keyTerms
      }
    }
  });

  // ============================================================================
  // PHASE 6: CONTRACT EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing contract');

  const contractExecution = await ctx.task(contractExecutionTask, {
    supplier,
    contractFinalization,
    outputDir
  });

  artifacts.push(...contractExecution.artifacts);

  // ============================================================================
  // PHASE 7: LIFECYCLE MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up lifecycle management');

  const lifecycleSetup = await ctx.task(lifecycleManagementTask, {
    supplier,
    contractExecution,
    outputDir
  });

  artifacts.push(...lifecycleSetup.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contract: {
      contractId: contractExecution.contractId,
      supplier,
      contractType,
      value: contractFinalization.finalValue,
      duration: contractFinalization.duration,
      effectiveDate: contractExecution.effectiveDate,
      expirationDate: contractExecution.expirationDate
    },
    negotiationOutcome: {
      valueAchieved: negotiationExecution.valueAchieved,
      concessionsMade: negotiationExecution.concessionsMade,
      concessionsGained: negotiationExecution.concessionsGained,
      savingsRealized: negotiationExecution.savingsRealized
    },
    lifecycle: {
      renewalDate: lifecycleSetup.renewalDate,
      reviewSchedule: lifecycleSetup.reviewSchedule,
      keyMilestones: lifecycleSetup.keyMilestones,
      obligations: lifecycleSetup.obligations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/contract-management',
      timestamp: startTime,
      supplier,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contractStrategyTask = defineTask('contract-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Contract Strategy Development',
  agent: {
    name: 'contract-strategist',
    prompt: {
      role: 'Contract Strategy Manager',
      task: 'Develop contract strategy and objectives',
      context: args,
      instructions: [
        '1. Define contract objectives and success criteria',
        '2. Analyze current contract (if renewal)',
        '3. Identify key terms and conditions to address',
        '4. Define risk allocation strategy',
        '5. Establish pricing and payment terms strategy',
        '6. Set performance and SLA requirements',
        '7. Define intellectual property approach',
        '8. Document contract strategy'
      ],
      outputFormat: 'JSON with contract strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'keyTerms', 'artifacts'],
      properties: {
        objectives: { type: 'array' },
        keyTerms: { type: 'object' },
        riskAllocation: { type: 'object' },
        pricingStrategy: { type: 'object' },
        slaRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'strategy']
}));

export const negotiationPlanTask = defineTask('negotiation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Negotiation Planning',
  agent: {
    name: 'negotiation-planner',
    prompt: {
      role: 'Negotiation Planning Specialist',
      task: 'Develop comprehensive negotiation plan',
      context: args,
      instructions: [
        '1. Define BATNA (Best Alternative)',
        '2. Establish walk-away points',
        '3. Prioritize negotiation items',
        '4. Identify value levers and trade-offs',
        '5. Research supplier negotiation position',
        '6. Plan negotiation tactics',
        '7. Prepare negotiation team',
        '8. Create negotiation playbook'
      ],
      outputFormat: 'JSON with negotiation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['keyPriorities', 'batna', 'targetOutcome', 'artifacts'],
      properties: {
        keyPriorities: { type: 'array' },
        batna: { type: 'object' },
        targetOutcome: { type: 'object' },
        walkAwayPoints: { type: 'object' },
        valueLevers: { type: 'array' },
        tactics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'negotiation']
}));

export const contractDraftingTask = defineTask('contract-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Contract Drafting',
  agent: {
    name: 'contract-drafter',
    prompt: {
      role: 'Contract Drafting Specialist',
      task: 'Draft contract based on strategy and terms',
      context: args,
      instructions: [
        '1. Select appropriate contract template',
        '2. Draft scope of work/services',
        '3. Include pricing and payment terms',
        '4. Draft SLAs and performance metrics',
        '5. Include risk mitigation clauses',
        '6. Add termination and renewal provisions',
        '7. Include compliance requirements',
        '8. Review and finalize draft'
      ],
      outputFormat: 'JSON with contract draft'
    },
    outputSchema: {
      type: 'object',
      required: ['draftContract', 'keyProvisions', 'artifacts'],
      properties: {
        draftContract: { type: 'object' },
        keyProvisions: { type: 'array' },
        scopeOfWork: { type: 'object' },
        pricingTerms: { type: 'object' },
        slaTerms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'drafting']
}));

export const negotiationExecutionTask = defineTask('negotiation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Negotiation Execution',
  agent: {
    name: 'negotiator',
    prompt: {
      role: 'Senior Negotiator',
      task: 'Execute negotiation and track outcomes',
      context: args,
      instructions: [
        '1. Conduct negotiation sessions',
        '2. Track positions and concessions',
        '3. Manage trade-offs and value exchanges',
        '4. Handle objections and impasses',
        '5. Document agreed terms',
        '6. Escalate issues as needed',
        '7. Reach agreement on key terms',
        '8. Document negotiation outcomes'
      ],
      outputFormat: 'JSON with negotiation outcomes'
    },
    outputSchema: {
      type: 'object',
      required: ['valueAchieved', 'concessionsMade', 'artifacts'],
      properties: {
        valueAchieved: { type: 'object' },
        concessionsMade: { type: 'array' },
        concessionsGained: { type: 'array' },
        savingsRealized: { type: 'number' },
        agreedTerms: { type: 'object' },
        openIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'negotiation']
}));

export const contractFinalizationTask = defineTask('contract-finalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Contract Finalization',
  agent: {
    name: 'contract-finalizer',
    prompt: {
      role: 'Contract Finalization Manager',
      task: 'Finalize contract based on negotiation outcomes',
      context: args,
      instructions: [
        '1. Incorporate negotiated terms into contract',
        '2. Conduct legal review',
        '3. Address remaining open items',
        '4. Finalize pricing schedules',
        '5. Complete exhibits and attachments',
        '6. Obtain internal approvals',
        '7. Prepare signature package',
        '8. Document final contract terms'
      ],
      outputFormat: 'JSON with finalized contract'
    },
    outputSchema: {
      type: 'object',
      required: ['finalValue', 'duration', 'keyTerms', 'artifacts'],
      properties: {
        finalValue: { type: 'number' },
        duration: { type: 'string' },
        keyTerms: { type: 'object' },
        approvals: { type: 'array' },
        signaturePackage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'finalization']
}));

export const contractExecutionTask = defineTask('contract-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Contract Execution',
  agent: {
    name: 'contract-executor',
    prompt: {
      role: 'Contract Execution Coordinator',
      task: 'Execute contract and complete signing process',
      context: args,
      instructions: [
        '1. Obtain final signatures',
        '2. Assign contract ID',
        '3. Set effective and expiration dates',
        '4. Store executed contract securely',
        '5. Notify relevant stakeholders',
        '6. Set up contract in systems',
        '7. Communicate to supplier',
        '8. Document execution details'
      ],
      outputFormat: 'JSON with contract execution details'
    },
    outputSchema: {
      type: 'object',
      required: ['contractId', 'effectiveDate', 'expirationDate', 'artifacts'],
      properties: {
        contractId: { type: 'string' },
        effectiveDate: { type: 'string' },
        expirationDate: { type: 'string' },
        signatures: { type: 'array' },
        storageLocation: { type: 'string' },
        notifications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'execution']
}));

export const lifecycleManagementTask = defineTask('lifecycle-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Lifecycle Management Setup',
  agent: {
    name: 'lifecycle-manager',
    prompt: {
      role: 'Contract Lifecycle Manager',
      task: 'Set up contract lifecycle management and tracking',
      context: args,
      instructions: [
        '1. Set renewal notification dates',
        '2. Create contract review schedule',
        '3. Identify key milestones and deadlines',
        '4. Document contractual obligations',
        '5. Set up performance tracking',
        '6. Configure compliance monitoring',
        '7. Create amendment tracking process',
        '8. Document lifecycle management plan'
      ],
      outputFormat: 'JSON with lifecycle management setup'
    },
    outputSchema: {
      type: 'object',
      required: ['renewalDate', 'reviewSchedule', 'keyMilestones', 'artifacts'],
      properties: {
        renewalDate: { type: 'string' },
        reviewSchedule: { type: 'array' },
        keyMilestones: { type: 'array' },
        obligations: { type: 'array' },
        performanceTracking: { type: 'object' },
        complianceMonitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'contract-management', 'lifecycle']
}));
