/**
 * @process specializations/embedded-systems/functional-safety-certification
 * @description Functional Safety Certification - Preparing embedded systems for safety certifications like IEC 61508,
 * ISO 26262 (automotive), DO-178C (aerospace), and IEC 62304 (medical), including hazard analysis, safety requirements,
 * and documentation.
 * @inputs { projectName: string, safetyStandard: string, targetSil?: string, outputDir?: string }
 * @outputs { success: boolean, safetyCase: object, hazardAnalysis: object, certificationStatus: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/functional-safety-certification', {
 *   projectName: 'BrakeController',
 *   safetyStandard: 'ISO26262',
 *   targetSil: 'ASIL-D'
 * });
 *
 * @references
 * - IEC 61508: https://www.iec.ch/functionalsafety
 * - ISO 26262: https://www.iso.org/standard/68383.html
 * - Functional Safety: https://www.embedded.com/functional-safety-in-embedded-systems/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    safetyStandard = 'IEC61508',
    targetSil = 'SIL-2',
    systemDescription = null,
    existingHazards = [],
    outputDir = 'safety-certification-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Functional Safety Certification: ${projectName}`);
  ctx.log('info', `Standard: ${safetyStandard}, Target: ${targetSil}`);

  // ============================================================================
  // PHASE 1: SAFETY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Safety Planning');

  const safetyPlanning = await ctx.task(safetyPlanningTask, {
    projectName,
    safetyStandard,
    targetSil,
    systemDescription,
    outputDir
  });

  artifacts.push(...safetyPlanning.artifacts);

  // ============================================================================
  // PHASE 2: HAZARD ANALYSIS AND RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Hazard Analysis and Risk Assessment');

  const hazardAnalysis = await ctx.task(hazardAnalysisTask, {
    projectName,
    safetyStandard,
    existingHazards,
    safetyPlanning,
    outputDir
  });

  artifacts.push(...hazardAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Hazard analysis identified ${hazardAnalysis.hazards.length} hazards. ${hazardAnalysis.criticalHazards} are critical. Review before proceeding?`,
    title: 'Hazard Analysis Review',
    context: {
      runId: ctx.runId,
      hazards: hazardAnalysis.hazards,
      files: hazardAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: SAFETY REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Deriving Safety Requirements');

  const safetyRequirements = await ctx.task(safetyRequirementsTask, {
    projectName,
    safetyStandard,
    targetSil,
    hazardAnalysis,
    outputDir
  });

  artifacts.push(...safetyRequirements.artifacts);

  // ============================================================================
  // PHASE 4: SAFETY ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Safety Architecture');

  const safetyArchitecture = await ctx.task(safetyArchitectureTask, {
    projectName,
    safetyStandard,
    targetSil,
    safetyRequirements,
    outputDir
  });

  artifacts.push(...safetyArchitecture.artifacts);

  // ============================================================================
  // PHASE 5: SAFETY MECHANISMS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Safety Mechanisms');

  const safetyMechanisms = await ctx.task(safetyMechanismsTask, {
    projectName,
    safetyArchitecture,
    targetSil,
    outputDir
  });

  artifacts.push(...safetyMechanisms.artifacts);

  // ============================================================================
  // PHASE 6: VERIFICATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Safety Verification and Validation');

  const safetyVerification = await ctx.task(safetyVerificationTask, {
    projectName,
    safetyStandard,
    targetSil,
    safetyRequirements,
    safetyMechanisms,
    outputDir
  });

  artifacts.push(...safetyVerification.artifacts);

  // ============================================================================
  // PHASE 7: SAFETY CASE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Building Safety Case');

  const safetyCase = await ctx.task(safetyCaseTask, {
    projectName,
    safetyStandard,
    targetSil,
    hazardAnalysis,
    safetyRequirements,
    safetyArchitecture,
    safetyMechanisms,
    safetyVerification,
    outputDir
  });

  artifacts.push(...safetyCase.artifacts);

  // ============================================================================
  // PHASE 8: CERTIFICATION PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 8: Preparing Certification Package');

  const certificationPackage = await ctx.task(certificationPackageTask, {
    projectName,
    safetyStandard,
    targetSil,
    safetyCase,
    safetyVerification,
    outputDir
  });

  artifacts.push(...certificationPackage.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Functional Safety Certification Package Complete for ${projectName}. Certification readiness: ${certificationPackage.readinessLevel}. Review?`,
    title: 'Safety Certification Complete',
    context: {
      runId: ctx.runId,
      summary: {
        hazardsIdentified: hazardAnalysis.hazards.length,
        safetyRequirements: safetyRequirements.requirements.length,
        safetyMechanisms: safetyMechanisms.mechanisms.length,
        readinessLevel: certificationPackage.readinessLevel
      },
      files: [
        { path: safetyCase.casePath, format: 'markdown', label: 'Safety Case' },
        { path: certificationPackage.packagePath, format: 'zip', label: 'Certification Package' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: certificationPackage.readinessLevel !== 'not-ready',
    projectName,
    safetyCase: {
      standard: safetyStandard,
      targetSil,
      casePath: safetyCase.casePath,
      arguments: safetyCase.arguments
    },
    hazardAnalysis: {
      hazards: hazardAnalysis.hazards,
      criticalHazards: hazardAnalysis.criticalHazards,
      riskMatrix: hazardAnalysis.riskMatrix
    },
    safetyRequirements: safetyRequirements.requirements,
    safetyMechanisms: safetyMechanisms.mechanisms,
    certificationStatus: certificationPackage.readinessLevel,
    packagePath: certificationPackage.packagePath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/functional-safety-certification',
      timestamp: startTime,
      projectName,
      safetyStandard,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const safetyPlanningTask = defineTask('safety-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Safety Planning - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Create safety plan',
      context: args,
      instructions: [
        '1. Define safety scope',
        '2. Identify safety lifecycle',
        '3. Define roles and responsibilities',
        '4. Plan safety activities',
        '5. Define safety milestones',
        '6. Plan verification activities',
        '7. Plan validation activities',
        '8. Define tool qualification',
        '9. Plan documentation',
        '10. Create safety plan document'
      ],
      outputFormat: 'JSON with safety plan'
    },
    outputSchema: {
      type: 'object',
      required: ['safetyPlan', 'lifecycle', 'artifacts'],
      properties: {
        safetyPlan: { type: 'object' },
        lifecycle: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        toolQualification: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'planning']
}));

export const hazardAnalysisTask = defineTask('hazard-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Hazard Analysis - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Perform hazard analysis',
      context: args,
      instructions: [
        '1. Identify system hazards',
        '2. Perform HAZOP analysis',
        '3. Perform FMEA/FMECA',
        '4. Assess risk levels',
        '5. Determine SIL/ASIL',
        '6. Create risk matrix',
        '7. Identify critical hazards',
        '8. Define safety goals',
        '9. Document hazard log',
        '10. Create HARA report'
      ],
      outputFormat: 'JSON with hazard analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['hazards', 'criticalHazards', 'riskMatrix', 'artifacts'],
      properties: {
        hazards: { type: 'array', items: { type: 'object' } },
        criticalHazards: { type: 'number' },
        riskMatrix: { type: 'object' },
        safetyGoals: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'hazard-analysis']
}));

export const safetyRequirementsTask = defineTask('safety-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Safety Requirements - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Derive safety requirements',
      context: args,
      instructions: [
        '1. Derive from safety goals',
        '2. Define functional safety req',
        '3. Define technical safety req',
        '4. Allocate to components',
        '5. Define safe states',
        '6. Define fault tolerances',
        '7. Define timing constraints',
        '8. Set diagnostic coverage',
        '9. Trace to hazards',
        '10. Document requirements'
      ],
      outputFormat: 'JSON with safety requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'traceability', 'artifacts'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        traceability: { type: 'object' },
        safeStates: { type: 'array', items: { type: 'object' } },
        diagnosticCoverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'requirements']
}));

export const safetyArchitectureTask = defineTask('safety-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Safety Architecture - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Design safety architecture',
      context: args,
      instructions: [
        '1. Design safety partitions',
        '2. Define independence',
        '3. Design redundancy',
        '4. Plan diversity',
        '5. Design monitoring',
        '6. Plan fault detection',
        '7. Design safe state entry',
        '8. Calculate metrics',
        '9. Verify architecture',
        '10. Document architecture'
      ],
      outputFormat: 'JSON with safety architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'safetyMetrics', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        safetyMetrics: { type: 'object' },
        redundancy: { type: 'object' },
        partitioning: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'architecture']
}));

export const safetyMechanismsTask = defineTask('safety-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Safety Mechanisms - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Design safety mechanisms',
      context: args,
      instructions: [
        '1. Design watchdog',
        '2. Implement diagnostics',
        '3. Design plausibility checks',
        '4. Implement CRC/checksums',
        '5. Design memory protection',
        '6. Implement flow monitoring',
        '7. Design voter logic',
        '8. Implement safe shutdown',
        '9. Calculate diagnostic coverage',
        '10. Document mechanisms'
      ],
      outputFormat: 'JSON with safety mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'diagnosticCoverage', 'artifacts'],
      properties: {
        mechanisms: { type: 'array', items: { type: 'object' } },
        diagnosticCoverage: { type: 'object' },
        watchdogConfig: { type: 'object' },
        safeShutdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'mechanisms']
}));

export const safetyVerificationTask = defineTask('safety-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Safety Verification - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Verify safety implementation',
      context: args,
      instructions: [
        '1. Verify requirements',
        '2. Run safety tests',
        '3. Test fault injection',
        '4. Verify safe states',
        '5. Test diagnostics',
        '6. Verify coverage',
        '7. Run stress tests',
        '8. Verify timing',
        '9. Validate metrics',
        '10. Document results'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationResults', 'coverageAchieved', 'artifacts'],
      properties: {
        verificationResults: { type: 'array', items: { type: 'object' } },
        coverageAchieved: { type: 'object' },
        testResults: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'verification']
}));

export const safetyCaseTask = defineTask('safety-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Safety Case - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Build safety case',
      context: args,
      instructions: [
        '1. Define safety claims',
        '2. Build argument structure',
        '3. Link evidence',
        '4. Use GSN notation',
        '5. Address all hazards',
        '6. Show compliance',
        '7. Document assumptions',
        '8. Address gaps',
        '9. Create safety case report',
        '10. Prepare for review'
      ],
      outputFormat: 'JSON with safety case'
    },
    outputSchema: {
      type: 'object',
      required: ['casePath', 'arguments', 'evidence', 'artifacts'],
      properties: {
        casePath: { type: 'string' },
        arguments: { type: 'array', items: { type: 'object' } },
        evidence: { type: 'array', items: { type: 'object' } },
        gsnDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'safety-case']
}));

export const certificationPackageTask = defineTask('certification-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Certification Package - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Functional Safety Engineer',
      task: 'Prepare certification package',
      context: args,
      instructions: [
        '1. Compile all documents',
        '2. Create document index',
        '3. Verify completeness',
        '4. Check traceability',
        '5. Prepare assessment checklist',
        '6. Document tool qualification',
        '7. Include test evidence',
        '8. Add review records',
        '9. Assess readiness',
        '10. Package for submission'
      ],
      outputFormat: 'JSON with certification package'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'readinessLevel', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        readinessLevel: { type: 'string' },
        documentIndex: { type: 'array', items: { type: 'object' } },
        completenessCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'safety', 'certification']
}));
