/**
 * @process specializations/domains/business/supply-chain/supplier-onboarding
 * @description Supplier Onboarding and Qualification - Execute supplier onboarding process including
 * documentation collection, capability assessment, compliance verification, and system setup.
 * @inputs { supplierName?: string, category?: string, contactInfo?: object, qualificationRequirements?: object }
 * @outputs { success: boolean, supplierProfile: object, qualificationStatus: string, systemSetup: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/supplier-onboarding', {
 *   supplierName: 'New Supplier Inc',
 *   category: 'Direct Materials',
 *   contactInfo: { email: 'contact@supplier.com' },
 *   qualificationRequirements: { certifications: ['ISO 9001'], creditCheck: true }
 * });
 *
 * @references
 * - JAGGAER Supplier Onboarding: https://www.jaggaer.com/
 * - Supplier Qualification Best Practices: https://www.gep.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    supplierName = '',
    category = '',
    contactInfo = {},
    qualificationRequirements = {},
    riskTolerance = 'medium',
    outputDir = 'supplier-onboarding-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Supplier Onboarding for: ${supplierName}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting supplier documentation');

  const documentCollection = await ctx.task(documentCollectionTask, {
    supplierName,
    category,
    contactInfo,
    qualificationRequirements,
    outputDir
  });

  artifacts.push(...documentCollection.artifacts);

  // ============================================================================
  // PHASE 2: COMPANY VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Verifying company information');

  const companyVerification = await ctx.task(companyVerificationTask, {
    supplierName,
    documentCollection,
    outputDir
  });

  artifacts.push(...companyVerification.artifacts);

  // ============================================================================
  // PHASE 3: FINANCIAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing financial health');

  const financialAssessment = await ctx.task(financialAssessmentTask, {
    supplierName,
    documentCollection,
    riskTolerance,
    outputDir
  });

  artifacts.push(...financialAssessment.artifacts);

  // ============================================================================
  // PHASE 4: COMPLIANCE VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Verifying compliance');

  const complianceVerification = await ctx.task(complianceVerificationTask, {
    supplierName,
    category,
    documentCollection,
    qualificationRequirements,
    outputDir
  });

  artifacts.push(...complianceVerification.artifacts);

  // Breakpoint: Review verification results
  await ctx.breakpoint({
    question: `Verification complete for ${supplierName}. Financial: ${financialAssessment.rating}, Compliance: ${complianceVerification.status}. Review before capability assessment?`,
    title: 'Supplier Verification Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        financialRating: financialAssessment.rating,
        complianceStatus: complianceVerification.status,
        companyVerified: companyVerification.verified
      }
    }
  });

  // ============================================================================
  // PHASE 5: CAPABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing supplier capabilities');

  const capabilityAssessment = await ctx.task(onboardingCapabilityTask, {
    supplierName,
    category,
    documentCollection,
    qualificationRequirements,
    outputDir
  });

  artifacts.push(...capabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 6: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Conducting risk assessment');

  const riskAssessment = await ctx.task(onboardingRiskAssessmentTask, {
    supplierName,
    companyVerification,
    financialAssessment,
    complianceVerification,
    capabilityAssessment,
    riskTolerance,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 7: QUALIFICATION DECISION
  // ============================================================================

  ctx.log('info', 'Phase 7: Making qualification decision');

  const qualificationDecision = await ctx.task(onboardingQualificationTask, {
    supplierName,
    companyVerification,
    financialAssessment,
    complianceVerification,
    capabilityAssessment,
    riskAssessment,
    qualificationRequirements,
    outputDir
  });

  artifacts.push(...qualificationDecision.artifacts);

  // ============================================================================
  // PHASE 8: SYSTEM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up supplier in systems');

  const systemSetup = await ctx.task(systemSetupTask, {
    supplierName,
    category,
    contactInfo,
    qualificationDecision,
    outputDir
  });

  artifacts.push(...systemSetup.artifacts);

  // ============================================================================
  // PHASE 9: ONBOARDING COMPLETION
  // ============================================================================

  ctx.log('info', 'Phase 9: Completing onboarding');

  const onboardingCompletion = await ctx.task(onboardingCompletionTask, {
    supplierName,
    systemSetup,
    qualificationDecision,
    contactInfo,
    outputDir
  });

  artifacts.push(...onboardingCompletion.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    supplierProfile: {
      supplierName,
      category,
      supplierNumber: systemSetup.supplierNumber,
      contactInfo,
      qualificationDate: qualificationDecision.qualificationDate
    },
    qualificationStatus: qualificationDecision.status,
    verificationResults: {
      companyVerified: companyVerification.verified,
      financialRating: financialAssessment.rating,
      complianceStatus: complianceVerification.status,
      capabilityScore: capabilityAssessment.score
    },
    riskProfile: riskAssessment.riskProfile,
    systemSetup: {
      supplierNumber: systemSetup.supplierNumber,
      erpSetup: systemSetup.erpSetup,
      portalAccess: systemSetup.portalAccess
    },
    nextSteps: onboardingCompletion.nextSteps,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/supplier-onboarding',
      timestamp: startTime,
      supplierName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const documentCollectionTask = defineTask('document-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Documentation Collection',
  agent: {
    name: 'document-collector',
    prompt: {
      role: 'Supplier Documentation Coordinator',
      task: 'Collect required supplier documentation',
      context: args,
      instructions: [
        '1. Create document checklist',
        '2. Request W-9/W-8 tax documents',
        '3. Request company registration documents',
        '4. Request insurance certificates',
        '5. Request quality certifications',
        '6. Request bank account information',
        '7. Track document receipt status',
        '8. Validate document completeness'
      ],
      outputFormat: 'JSON with document collection status'
    },
    outputSchema: {
      type: 'object',
      required: ['documentsReceived', 'documentsRequired', 'artifacts'],
      properties: {
        documentsReceived: { type: 'array' },
        documentsRequired: { type: 'array' },
        documentsMissing: { type: 'array' },
        completionRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'documentation']
}));

export const companyVerificationTask = defineTask('company-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Company Verification',
  agent: {
    name: 'verification-specialist',
    prompt: {
      role: 'Company Verification Specialist',
      task: 'Verify supplier company information',
      context: args,
      instructions: [
        '1. Verify company registration',
        '2. Verify business address',
        '3. Verify tax identification',
        '4. Check for sanctions/debarment',
        '5. Verify insurance coverage',
        '6. Verify key contacts',
        '7. Check business references',
        '8. Document verification results'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'verificationDetails', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        verificationDetails: { type: 'object' },
        registrationVerified: { type: 'boolean' },
        taxIdVerified: { type: 'boolean' },
        sanctionsCheck: { type: 'string' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'verification']
}));

export const financialAssessmentTask = defineTask('financial-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Financial Assessment',
  agent: {
    name: 'financial-assessor',
    prompt: {
      role: 'Financial Assessment Specialist',
      task: 'Assess supplier financial health',
      context: args,
      instructions: [
        '1. Run credit check',
        '2. Review financial statements',
        '3. Analyze key financial ratios',
        '4. Assess payment history',
        '5. Evaluate business stability',
        '6. Check for bankruptcy/liens',
        '7. Assign financial rating',
        '8. Document assessment'
      ],
      outputFormat: 'JSON with financial assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['rating', 'creditScore', 'artifacts'],
      properties: {
        rating: { type: 'string' },
        creditScore: { type: 'number' },
        financialRatios: { type: 'object' },
        stability: { type: 'string' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'financial']
}));

export const complianceVerificationTask = defineTask('compliance-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Compliance Verification',
  agent: {
    name: 'compliance-verifier',
    prompt: {
      role: 'Compliance Verification Specialist',
      task: 'Verify supplier compliance status',
      context: args,
      instructions: [
        '1. Verify required certifications',
        '2. Check regulatory compliance',
        '3. Verify environmental compliance',
        '4. Check labor practices compliance',
        '5. Verify industry-specific requirements',
        '6. Check data security compliance',
        '7. Verify export control status',
        '8. Document compliance status'
      ],
      outputFormat: 'JSON with compliance verification'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'certifications', 'artifacts'],
      properties: {
        status: { type: 'string' },
        certifications: { type: 'array' },
        regulatoryCompliance: { type: 'object' },
        gaps: { type: 'array' },
        expirationDates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'compliance']
}));

export const onboardingCapabilityTask = defineTask('onboarding-capability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Capability Assessment',
  agent: {
    name: 'capability-assessor',
    prompt: {
      role: 'Capability Assessment Specialist',
      task: 'Assess supplier capabilities for category',
      context: args,
      instructions: [
        '1. Evaluate technical capabilities',
        '2. Assess production/service capacity',
        '3. Evaluate quality capabilities',
        '4. Assess technology capabilities',
        '5. Evaluate geographic coverage',
        '6. Assess scalability',
        '7. Calculate capability score',
        '8. Document capability assessment'
      ],
      outputFormat: 'JSON with capability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'capabilities', 'artifacts'],
      properties: {
        score: { type: 'number' },
        capabilities: { type: 'object' },
        strengths: { type: 'array' },
        gaps: { type: 'array' },
        capacity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'capability']
}));

export const onboardingRiskAssessmentTask = defineTask('onboarding-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Risk Assessment',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'Supplier Risk Assessor',
      task: 'Assess overall supplier risk',
      context: args,
      instructions: [
        '1. Compile all assessment results',
        '2. Evaluate financial risk',
        '3. Evaluate operational risk',
        '4. Evaluate compliance risk',
        '5. Evaluate geopolitical risk',
        '6. Calculate overall risk score',
        '7. Determine risk profile',
        '8. Recommend risk mitigation'
      ],
      outputFormat: 'JSON with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['riskProfile', 'riskScore', 'artifacts'],
      properties: {
        riskProfile: { type: 'string' },
        riskScore: { type: 'number' },
        riskFactors: { type: 'object' },
        mitigationActions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'risk']
}));

export const onboardingQualificationTask = defineTask('onboarding-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Qualification Decision',
  agent: {
    name: 'qualification-decider',
    prompt: {
      role: 'Supplier Qualification Manager',
      task: 'Make supplier qualification decision',
      context: args,
      instructions: [
        '1. Review all assessment results',
        '2. Check against qualification criteria',
        '3. Determine qualification status',
        '4. Set conditions if conditional approval',
        '5. Define approved categories',
        '6. Set spend limits if needed',
        '7. Determine requalification date',
        '8. Document qualification decision'
      ],
      outputFormat: 'JSON with qualification decision'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'qualificationDate', 'artifacts'],
      properties: {
        status: { type: 'string' },
        qualificationDate: { type: 'string' },
        conditions: { type: 'array' },
        approvedCategories: { type: 'array' },
        spendLimits: { type: 'object' },
        requalificationDate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'qualification']
}));

export const systemSetupTask = defineTask('system-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: System Setup',
  agent: {
    name: 'system-admin',
    prompt: {
      role: 'Supplier System Administrator',
      task: 'Set up supplier in company systems',
      context: args,
      instructions: [
        '1. Create supplier master record in ERP',
        '2. Assign supplier number',
        '3. Set up payment terms',
        '4. Configure purchasing info',
        '5. Set up supplier portal access',
        '6. Configure EDI/integrations',
        '7. Set up workflow approvals',
        '8. Document system setup'
      ],
      outputFormat: 'JSON with system setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['supplierNumber', 'erpSetup', 'portalAccess', 'artifacts'],
      properties: {
        supplierNumber: { type: 'string' },
        erpSetup: { type: 'object' },
        portalAccess: { type: 'object' },
        paymentTerms: { type: 'object' },
        integrations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'system-setup']
}));

export const onboardingCompletionTask = defineTask('onboarding-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Onboarding Completion',
  agent: {
    name: 'onboarding-coordinator',
    prompt: {
      role: 'Onboarding Coordinator',
      task: 'Complete supplier onboarding process',
      context: args,
      instructions: [
        '1. Send welcome communication',
        '2. Provide supplier handbook',
        '3. Schedule kickoff meeting',
        '4. Introduce key contacts',
        '5. Share performance expectations',
        '6. Provide portal training',
        '7. Define next steps',
        '8. Document onboarding completion'
      ],
      outputFormat: 'JSON with onboarding completion'
    },
    outputSchema: {
      type: 'object',
      required: ['completionDate', 'nextSteps', 'artifacts'],
      properties: {
        completionDate: { type: 'string' },
        welcomeSent: { type: 'boolean' },
        kickoffScheduled: { type: 'boolean' },
        contactsIntroduced: { type: 'array' },
        nextSteps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'onboarding', 'completion']
}));
