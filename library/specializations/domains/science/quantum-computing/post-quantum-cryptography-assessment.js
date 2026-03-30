/**
 * @process Post-Quantum Cryptography Assessment
 * @id QC-SEC-001
 * @description Assess and implement post-quantum cryptographic algorithms to ensure security
 * against quantum attacks, including migration planning from vulnerable algorithms.
 * @category Quantum Computing - Cryptography and Security
 * @priority P1 - High
 * @inputs {{ organization: object, systems?: array }}
 * @outputs {{ success: boolean, vulnerabilityAssessment: object, migrationPlan: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('post-quantum-cryptography-assessment', {
 *   organization: { name: 'Acme Corp', industry: 'finance' },
 *   systems: ['payment-gateway', 'authentication-service', 'data-storage']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    systems = [],
    includeImplementation = true,
    timelineYears = 5,
    outputDir = 'pqc-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Post-Quantum Cryptography Assessment for ${organization.name}`);
  ctx.log('info', `Systems to assess: ${systems.length || 'all'}`);

  // ============================================================================
  // PHASE 1: CRYPTOGRAPHIC INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Cryptographic Inventory');

  const inventoryResult = await ctx.task(cryptographicInventoryTask, {
    organization,
    systems
  });

  artifacts.push(...(inventoryResult.artifacts || []));

  await ctx.breakpoint({
    question: `Cryptographic inventory complete. Algorithms found: ${inventoryResult.algorithmCount}, Vulnerable: ${inventoryResult.vulnerableCount}. Proceed with vulnerability assessment?`,
    title: 'Cryptographic Inventory Review',
    context: {
      runId: ctx.runId,
      inventory: inventoryResult,
      files: (inventoryResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: QUANTUM VULNERABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Quantum Vulnerability Assessment');

  const vulnerabilityResult = await ctx.task(quantumVulnerabilityAssessmentTask, {
    inventory: inventoryResult,
    organization
  });

  artifacts.push(...(vulnerabilityResult.artifacts || []));

  ctx.log('info', `Vulnerability assessment complete. High risk: ${vulnerabilityResult.highRiskCount}, Medium risk: ${vulnerabilityResult.mediumRiskCount}`);

  // ============================================================================
  // PHASE 3: NIST PQC CANDIDATE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 3: NIST PQC Candidate Evaluation');

  const pqcEvaluationResult = await ctx.task(nistPqcCandidateEvaluationTask, {
    vulnerabilities: vulnerabilityResult,
    organization,
    useCases: inventoryResult.useCases
  });

  artifacts.push(...(pqcEvaluationResult.artifacts || []));

  await ctx.breakpoint({
    question: `PQC evaluation complete. Recommended algorithms: ${pqcEvaluationResult.recommendations.join(', ')}. Review recommendations?`,
    title: 'PQC Candidate Evaluation Review',
    context: {
      runId: ctx.runId,
      evaluation: pqcEvaluationResult,
      files: (pqcEvaluationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: MIGRATION STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Migration Strategy Design');

  const migrationStrategyResult = await ctx.task(migrationStrategyDesignTask, {
    inventory: inventoryResult,
    vulnerabilities: vulnerabilityResult,
    pqcRecommendations: pqcEvaluationResult,
    timelineYears
  });

  artifacts.push(...(migrationStrategyResult.artifacts || []));

  // ============================================================================
  // PHASE 5: HYBRID CRYPTOGRAPHY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Hybrid Cryptography Planning');

  const hybridCryptoResult = await ctx.task(hybridCryptographyPlanningTask, {
    migrationStrategy: migrationStrategyResult,
    pqcRecommendations: pqcEvaluationResult
  });

  artifacts.push(...(hybridCryptoResult.artifacts || []));

  // ============================================================================
  // PHASE 6: IMPLEMENTATION GUIDELINES
  // ============================================================================

  let implementationResult = null;
  if (includeImplementation) {
    ctx.log('info', 'Phase 6: Implementation Guidelines');

    implementationResult = await ctx.task(pqcImplementationGuidelinesTask, {
      pqcRecommendations: pqcEvaluationResult,
      migrationStrategy: migrationStrategyResult,
      hybridPlan: hybridCryptoResult
    });

    artifacts.push(...(implementationResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 7: TESTING AND VALIDATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing and Validation Plan');

  const testingResult = await ctx.task(pqcTestingValidationPlanTask, {
    pqcRecommendations: pqcEvaluationResult,
    implementationGuidelines: implementationResult
  });

  artifacts.push(...(testingResult.artifacts || []));

  await ctx.breakpoint({
    question: `Testing plan created. Test categories: ${testingResult.testCategories.length}. Review testing approach?`,
    title: 'Testing Plan Review',
    context: {
      runId: ctx.runId,
      testing: testingResult,
      files: (testingResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: SECURITY VALIDATION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Security Validation Report');

  const securityReportResult = await ctx.task(securityValidationReportTask, {
    organization,
    inventoryResult,
    vulnerabilityResult,
    pqcEvaluationResult,
    migrationStrategyResult,
    hybridCryptoResult,
    implementationResult,
    testingResult,
    outputDir
  });

  artifacts.push(...(securityReportResult.artifacts || []));

  await ctx.breakpoint({
    question: `PQC assessment complete for ${organization.name}. Vulnerable algorithms: ${vulnerabilityResult.vulnerableCount}, Migration timeline: ${timelineYears} years. Approve assessment?`,
    title: 'PQC Assessment Complete',
    context: {
      runId: ctx.runId,
      summary: {
        organization: organization.name,
        vulnerableAlgorithms: vulnerabilityResult.vulnerableCount,
        migrationTimeline: timelineYears,
        recommendedPQC: pqcEvaluationResult.recommendations
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    organization: organization.name,
    vulnerabilityAssessment: {
      totalAlgorithms: inventoryResult.algorithmCount,
      vulnerableAlgorithms: vulnerabilityResult.vulnerableCount,
      highRisk: vulnerabilityResult.highRiskCount,
      mediumRisk: vulnerabilityResult.mediumRiskCount,
      lowRisk: vulnerabilityResult.lowRiskCount,
      vulnerabilityDetails: vulnerabilityResult.details
    },
    migrationPlan: {
      strategy: migrationStrategyResult.strategy,
      phases: migrationStrategyResult.phases,
      timeline: migrationStrategyResult.timeline,
      prioritizedSystems: migrationStrategyResult.prioritizedSystems
    },
    pqcRecommendations: {
      algorithms: pqcEvaluationResult.recommendations,
      rationale: pqcEvaluationResult.rationale,
      hybridApproach: hybridCryptoResult.approach
    },
    implementation: implementationResult ? {
      guidelines: implementationResult.guidelines,
      codeExamples: implementationResult.codeExamples,
      libraries: implementationResult.recommendedLibraries
    } : null,
    testing: {
      plan: testingResult.testPlan,
      categories: testingResult.testCategories
    },
    reportPath: securityReportResult.reportPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-SEC-001',
      processName: 'Post-Quantum Cryptography Assessment',
      category: 'quantum-computing',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const cryptographicInventoryTask = defineTask('pqc-crypto-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cryptographic Inventory',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Cryptographic Audit Specialist',
      task: 'Inventory all cryptographic usage in the organization',
      context: args,
      instructions: [
        '1. Identify all systems using cryptography',
        '2. Catalog symmetric encryption algorithms',
        '3. Catalog asymmetric encryption algorithms',
        '4. Catalog digital signature algorithms',
        '5. Catalog key exchange protocols',
        '6. Catalog hash functions',
        '7. Identify key sizes and parameters',
        '8. Map algorithms to use cases',
        '9. Identify dependencies and libraries',
        '10. Document inventory findings'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithmCount', 'vulnerableCount', 'algorithms'],
      properties: {
        algorithmCount: { type: 'number' },
        vulnerableCount: { type: 'number' },
        algorithms: { type: 'array' },
        useCases: { type: 'array' },
        dependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'inventory']
}));

export const quantumVulnerabilityAssessmentTask = defineTask('pqc-vulnerability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Vulnerability Assessment',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Quantum Security Specialist',
      task: 'Assess quantum vulnerability of cryptographic algorithms',
      context: args,
      instructions: [
        '1. Assess RSA vulnerability to Shor\'s algorithm',
        '2. Assess ECC vulnerability to Shor\'s algorithm',
        '3. Assess DH/ECDH vulnerability',
        '4. Assess DSA/ECDSA vulnerability',
        '5. Assess symmetric algorithm security (Grover)',
        '6. Assess hash function security',
        '7. Calculate risk scores',
        '8. Prioritize by impact',
        '9. Estimate time to quantum threat',
        '10. Document vulnerability assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerableCount', 'highRiskCount', 'mediumRiskCount', 'lowRiskCount'],
      properties: {
        vulnerableCount: { type: 'number' },
        highRiskCount: { type: 'number' },
        mediumRiskCount: { type: 'number' },
        lowRiskCount: { type: 'number' },
        details: { type: 'array' },
        riskMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'vulnerability']
}));

export const nistPqcCandidateEvaluationTask = defineTask('pqc-nist-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'NIST PQC Candidate Evaluation',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Post-Quantum Cryptography Specialist',
      task: 'Evaluate NIST PQC candidates for organization needs',
      context: args,
      instructions: [
        '1. Review NIST PQC standardization status',
        '2. Evaluate CRYSTALS-Kyber for key encapsulation',
        '3. Evaluate CRYSTALS-Dilithium for signatures',
        '4. Evaluate FALCON for signatures',
        '5. Evaluate SPHINCS+ for hash-based signatures',
        '6. Assess performance characteristics',
        '7. Assess key and signature sizes',
        '8. Evaluate implementation maturity',
        '9. Match to use cases',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'rationale'],
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'object' },
        evaluationMatrix: { type: 'object' },
        performanceComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'pqc']
}));

export const migrationStrategyDesignTask = defineTask('pqc-migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Migration Strategy Design',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Cryptographic Migration Specialist',
      task: 'Design migration strategy from vulnerable to PQC algorithms',
      context: args,
      instructions: [
        '1. Prioritize systems by risk',
        '2. Design phased migration approach',
        '3. Plan hybrid transition period',
        '4. Identify dependencies',
        '5. Plan testing phases',
        '6. Design rollback procedures',
        '7. Estimate resource requirements',
        '8. Create timeline',
        '9. Identify risks and mitigations',
        '10. Document migration strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'phases', 'timeline'],
      properties: {
        strategy: { type: 'object' },
        phases: { type: 'array' },
        timeline: { type: 'object' },
        prioritizedSystems: { type: 'array' },
        resourceEstimates: { type: 'object' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'migration']
}));

export const hybridCryptographyPlanningTask = defineTask('pqc-hybrid-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hybrid Cryptography Planning',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Hybrid Cryptography Specialist',
      task: 'Plan hybrid classical-PQC cryptography approach',
      context: args,
      instructions: [
        '1. Design hybrid key exchange',
        '2. Design hybrid signatures',
        '3. Plan key derivation functions',
        '4. Design protocol integration',
        '5. Plan backward compatibility',
        '6. Design failure modes',
        '7. Plan performance optimization',
        '8. Design testing approach',
        '9. Document hybrid approach',
        '10. Create implementation guide'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approach'],
      properties: {
        approach: { type: 'object' },
        hybridSchemes: { type: 'array' },
        protocolIntegration: { type: 'object' },
        compatibilityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'hybrid']
}));

export const pqcImplementationGuidelinesTask = defineTask('pqc-implementation-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PQC Implementation Guidelines',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Cryptographic Implementation Specialist',
      task: 'Create PQC implementation guidelines',
      context: args,
      instructions: [
        '1. Document algorithm implementations',
        '2. Provide code examples',
        '3. Recommend libraries',
        '4. Document parameter selection',
        '5. Provide security considerations',
        '6. Document common pitfalls',
        '7. Provide performance guidelines',
        '8. Document testing requirements',
        '9. Provide integration guides',
        '10. Create checklist'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'recommendedLibraries'],
      properties: {
        guidelines: { type: 'array' },
        codeExamples: { type: 'object' },
        recommendedLibraries: { type: 'array' },
        securityConsiderations: { type: 'array' },
        checklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'implementation']
}));

export const pqcTestingValidationPlanTask = defineTask('pqc-testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PQC Testing and Validation Plan',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Cryptographic Testing Specialist',
      task: 'Create testing and validation plan for PQC implementation',
      context: args,
      instructions: [
        '1. Design unit tests',
        '2. Design integration tests',
        '3. Design interoperability tests',
        '4. Design performance tests',
        '5. Design security tests',
        '6. Design regression tests',
        '7. Plan known-answer tests',
        '8. Plan fuzzing tests',
        '9. Document test procedures',
        '10. Create test automation plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'testCategories'],
      properties: {
        testPlan: { type: 'object' },
        testCategories: { type: 'array' },
        testCases: { type: 'array' },
        automationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'testing']
}));

export const securityValidationReportTask = defineTask('pqc-security-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security Validation Report',
  agent: {
    name: 'pqc-analyst',
    skills: ['pqc-evaluator', 'resource-estimator'],
    prompt: {
      role: 'Security Report Specialist',
      task: 'Generate comprehensive PQC security validation report',
      context: args,
      instructions: [
        '1. Summarize assessment findings',
        '2. Document vulnerabilities',
        '3. Present recommendations',
        '4. Include migration plan',
        '5. Document implementation guidelines',
        '6. Include testing plan',
        '7. Add executive summary',
        '8. Include compliance mapping',
        '9. Add appendices',
        '10. Generate final report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        complianceMapping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'security', 'reporting']
}));
